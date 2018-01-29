var assert = require('assert');
var uuid = require('uuid');

var async = require('async');
var lib = require('./lib');
var pg = require('pg');
var config = require('./config');

if (!config.DATABASE_URL)
    throw new Error('must set DATABASE_URL environment var');

console.log('DATABASE_URL: ', config.DATABASE_URL);

// Increase the client pool size. At the moment the most concurrent
// queries are performed when auto-bettors join a newly created
// game. (A game is ended in a single transaction). With an average
// of 25-35 players per game, an increase to 20 seems reasonable to
// ensure that most queries are submitted after around 1 round-trip
// waiting time or less.
pg.defaults.poolSize = 20;

// The default timeout is 30s, or the time from 1.00x to 6.04x.
// Considering that most of the action happens during the beginning
// of the game, this causes most clients to disconnect every ~7-9
// games only to be reconnected when lots of bets come in again during
// the next game. Bump the timeout to 2 min (or 1339.43x) to smooth
// this out.
pg.defaults.poolIdleTimeout = 120000;

pg.types.setTypeParser(20, function(val) { // parse int8 as an integer
    return val === null ? null : parseInt(val);
});

pg.types.setTypeParser(1700, function(val) { // parse numeric as a float
    return val === null ? null : parseFloat(val);
});

// callback is called with (err, client, done)
function connect(callback) {
    return pg.connect(config.DATABASE_URL, callback);
}

function query(query, params, callback) {
    //third parameter is optional
    if (typeof params == 'function') {
        callback = params;
        params = [];
    }

    doIt();
    function doIt() {
        connect(function(err, client, done) {
            if (err) return callback(err);
            client.query(query, params, function(err, result) {
                done();
                if (err) {
                    if (err.code === '40P01') {
                        console.log('Warning: Retrying deadlocked transaction: ', query, params);
                        return doIt();
                    }
                    return callback(err);
                }

                callback(null, result);
            });
        });
    }
}

function getClient(runner, callback) {
    doIt();

    function doIt() {
        connect(function (err, client, done) {
            if (err) return callback(err);

            function rollback(err) {
                client.query('ROLLBACK', done);

                if (err.code === '40P01') {
                    console.log('Warning: Retrying deadlocked transaction..');
                    return doIt();
                }

                callback(err);
            }

            client.query('BEGIN', function (err) {
                if (err)
                    return rollback(err);

                runner(client, function (err, data) {
                    if (err)
                        return rollback(err);

                    client.query('COMMIT', function (err) {
                        if (err)
                            return rollback(err);

                        done();
                        callback(null, data);
                    });
                });
            });
        });
    }
}


exports.query = query;

pg.on('error', function(err) {
    console.error('POSTGRES EMITTED AN ERROR', err);
});

// runner takes (client, callback)

// callback should be called with (err, data)
// client should not be used to commit, rollback or start a new transaction

// callback takes (err, data)

exports.getLastGameInfo = function(callback) {
    query('SELECT MAX(id) id FROM games', function(err, results) {
        if (err) return callback(err);
        assert(results.rows.length === 1);

        var id = results.rows[0].id;

        if (!id || id < 1e6) {
            return callback(null, {
                id: 1e6 - 1,
                hash: 'c1cfa8e28fc38999eaa888487e443bad50a65e0b710f649affa6718cfbfada4d'
            });
        }

        query('SELECT hash FROM game_hashes WHERE game_id = $1', [id], function(err, results) {
            if (err) return callback(err);

            assert(results.rows.length === 1);

            callback(null, {
                id: id,
                hash: results.rows[0].hash
            });
        });
    });
};

exports.getUserByName = function(username, callback) {
    assert(username);
    query('SELECT * FROM users WHERE lower(username) = lower($1)', [username], function(err, result) {
        if (err) return callback(err);
        if (result.rows.length === 0)
            return callback('USER_DOES_NOT_EXIST');

        assert(result.rows.length === 1);
        callback(null, result.rows[0]);
    });
};

exports.validateOneTimeToken = function(token, callback) {
    assert(token);

    query('WITH t as (UPDATE sessions SET expired = now() WHERE id = $1 AND ott = TRUE RETURNING *)' +
            'SELECT * FROM users WHERE id = (SELECT user_id FROM t)',
        [token], function(err, result) {
            if (err) return callback(err);
            if (result.rowCount == 0) return callback('NOT_VALID_TOKEN');
            assert(result.rows.length === 1);
            callback(null, result.rows[0]);
        }
    );
};

exports.placeBet = function(amount, autoCashOut, userId, gameId, callback) {
    assert(typeof amount === 'number');
    assert(typeof autoCashOut === 'number');
    assert(typeof userId === 'number');
    assert(typeof gameId === 'number');
    assert(typeof callback === 'function');

    getClient(function(client, callback) {
      var tasks = [
        function(callback) {
          client.query('UPDATE users SET balance_satoshis = balance_satoshis - $1 WHERE id = $2',
            [amount, userId], callback);
        },
        function(callback) {
          client.query(
            'INSERT INTO plays(user_id, game_id, bet, auto_cash_out) VALUES($1, $2, $3, $4) RETURNING id',
            [userId, gameId, amount, autoCashOut], callback);
        }
      ];

      async.parallel(tasks, function(err, result) {
        if (err)
            return callback(err);

        var playId = result[1].rows[0].id;
        assert(typeof playId === 'number');

        callback(null, playId);
      });
    }, callback);
};


var endGameQuery =
  'WITH vals AS ( ' +
  ' SELECT ' +
  ' unnest($1::bigint[]) as user_id, ' +
  ' unnest($2::bigint[]) as play_id, ' +
  ' unnest($3::bigint[]) as bonus ' +
  '), p AS (' +
  ' UPDATE plays SET bonus = vals.bonus FROM vals WHERE id = vals.play_id RETURNING vals.user_id '+
  '), u AS (' +
  ' UPDATE users SET balance_satoshis = balance_satoshis + vals.bonus ' +
  ' FROM vals WHERE id = vals.user_id RETURNING vals.user_id ' +
  ') SELECT COUNT(*) count FROM p JOIN u ON p.user_id = u.user_id';

exports.endGame = function(gameId, bonuses, callback) {
    assert(typeof gameId === 'number');
    assert(typeof callback === 'function');


    getClient(function(client, callback) {
      client.query('UPDATE games SET ended = true WHERE id = $1', [gameId],
        function (err) {
          if (err) return callback(new Error('Could not end game, got: ' + err));


          var userIds = [];
          var playIds = [];
          var bonusesAmounts = [];

          bonuses.forEach(function (bonus) {
            assert(lib.isInt(bonus.user.id));
            userIds.push(bonus.user.id);
            assert(lib.isInt(bonus.playId));
            playIds.push(bonus.playId);
            assert(lib.isInt(bonus.amount) && bonus.amount > 0);
            bonusesAmounts.push(bonus.amount);
          });

          assert(userIds.length == playIds.length && playIds.length == bonusesAmounts.length);

          if (userIds.length === 0)
            return callback();
          
          client.query(endGameQuery, [userIds, playIds, bonusesAmounts], function(err, result) {
            if (err)
              return callback(err);

            if (result.rows[0].count !== userIds.length) {
              throw new Error('Mismatch row count: ' + result.rows[0].count + ' and ' + userIds.length);
            }

            callback();
          });

        });
    }, callback);

};

function addSatoshis(client, userId, amount, callback) {

    client.query('UPDATE users SET balance_satoshis = balance_satoshis + $1 WHERE id = $2', [amount, userId], function(err, res) {
        if (err) return callback(err);
        assert(res.rowCount === 1);
        callback(null);
    });
}


exports.cashOut = function(userId, playId, amount, callback) {
    assert(typeof userId === 'number');
    assert(typeof playId === 'number');
    assert(typeof amount === 'number');
    assert(typeof callback === 'function');

    getClient(function(client, callback) {
        addSatoshis(client, userId, amount, function(err) {
            if (err)
                return callback(err);

            client.query(
                'UPDATE plays SET cash_out = $1 WHERE id = $2 AND cash_out IS NULL',
                [amount, playId], function(err, result) {
                    if (err)
                        return callback(err);

                    if (result.rowCount !== 1) {
                        console.error('[INTERNAL_ERROR] Double cashout? ',
                            'User: ', userId, ' play: ', playId, ' amount: ', amount,
                            ' got: ', result.rowCount);

                        return callback(new Error('Double cashout'));
                    }

                    callback(null);
                }
            );
        });
    }, callback);
};

// callback called with (err, { crashPoint: , hash: })
exports.createGame = function(gameId, callback) {
    assert(typeof gameId === 'number');
    assert(typeof callback === 'function');

    query('SELECT hash FROM game_hashes WHERE game_id = $1', [gameId], function(err, results) {
        if (err) return callback(err);

        if (results.rows.length !==  1) {
            console.error('[INTERNAL_ERROR] Could not find hash for game ', gameId);
            return callback('NO_GAME_HASH');
        }

        var hash = results.rows[0].hash;
        var gameCrash = lib.crashPointFromHash(hash);
        assert(lib.isInt(gameCrash));

        query('INSERT INTO games(id, game_crash) VALUES($1, $2)',
            [gameId, gameCrash], function(err) {
                if (err) return callback(err);

                return callback(null, { crashPoint: gameCrash, hash: hash } );
            });
    });
};

exports.getBankroll = function(callback) {
    query('SELECT (' +
            '(SELECT COALESCE(SUM(amount),0) FROM fundings) - ' +
            '(SELECT COALESCE(SUM(balance_satoshis), 0) FROM users)) AS profit ',
        function(err, results) {
            if (err) return callback(err);

            assert(results.rows.length === 1);

            var profit = results.rows[0].profit - 100e8;
            assert(typeof profit === 'number');

            var min = 1e8;

            callback(null, Math.max(min, profit));
        }
    );

};

exports.getGameHistory = function(callback) {

    var sql =
        'SELECT games.id game_id, game_crash, created, ' +
        '     (SELECT hash FROM game_hashes WHERE game_id = games.id), ' +
        '     (SELECT to_json(array_agg(to_json(pv))) ' +
        '        FROM (SELECT username, bet, (100 * cash_out / bet) AS stopped_at, bonus ' +
        '              FROM plays JOIN users ON user_id = users.id WHERE game_id = games.id) pv) player_info ' +
        'FROM games ' +
        'WHERE games.ended = true ' +
        'ORDER BY games.id DESC LIMIT 10';

    query(sql, function(err, data) {
        if (err) throw err;

        data.rows.forEach(function(row) {
            // oldInfo is like: [{"username":"USER","bet":satoshis, ,..}, ..]
            var oldInfo = row.player_info || [];
            var newInfo = row.player_info = {};

            oldInfo.forEach(function(play) {
                newInfo[play.username] = {
                    bet: play.bet,
                    stopped_at: play.stopped_at,
                    bonus: play.bonus
                };
            });
        });

        callback(null, data.rows);
    });
};
