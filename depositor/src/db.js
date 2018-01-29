//postgresql API
var assert = require('better-assert');
var async = require('async');
var pg = require('pg');

var databaseUrl = process.env.DATABASE_URL;
assert(databaseUrl);

console.log('DATABASE_URL: ', databaseUrl);

pg.types.setTypeParser(20, function(val) { // parse int8 as an integer
    return val === null ? null : parseInt(val);
});


function refreshView() {

    query('REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard;', function(err) {
        if (err) {
            console.error('[INTERNAL_ERROR] unable to refresh leaderboard got: ', err);
        } else {
            console.log('leaderboard refreshed');
        }

        setTimeout(refreshView, 10 * 60 * 1000);
    });

}
setTimeout(refreshView, 1000); // schedule it so it comes after all the addresses are generated


// callback is called with (err, client, done)
function connect(callback) {
    return pg.connect(databaseUrl, callback);
}

function query(query, params, callback) {
    //thrid parameter is optional
    if (typeof params == 'function') {
        callback = params;
        params = [];
    }

    connect(function(err, client, done) {
        if (err) return callback(err);
        client.query(query, params, function(err, result) {
            done();
            if (err) {
                return callback(err);
            }
            callback(null, result);
        });
    });
}

// runner takes (client, callback)

// callback should be called with (err, data)
// client should not be used to commit, rollback or start a new transaction


// callback takes (err, data)

function getClient(runner, callback) {
    connect(function (err, client, done) {
        if (err) return callback(err);

        function rollback(err) {
            client.query('ROLLBACK', done);
            callback(err);
        }

        client.query('BEGIN', function (err) {
            if (err)
                return rollback(err);

            runner(client, function(err, data) {
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

// callback is called with (err, client, done)
exports.getClient = function(callback) {
    var client = new pg.Client(databaseUrl);

    client.connect(function(err) {
        if (err) return callback(err);

        callback(null, client);
    });
};


exports.getLastBlock = function(callback) {
    query('SELECT * FROM blocks ORDER BY height DESC LIMIT 1', function(err, results) {
        if (err) return callback(err);

        if (results.rows.length === 0)
            return callback(null, { height: 0, hash: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f' }); // genesis block


        assert(results.rows.length === 1);
        callback(null, results.rows[0]);
    });
};

exports.getBlock = function(height, callback) {
    query('SELECT * FROM blocks WHERE height = $1', [height], function(err, results) {
        if (err) return callback(err);

        if (results.rows.length === 0)
            return callback(new Error('Could not find block ' + height));


        assert(results.rows.length === 1);
        callback(null, results.rows[0]);
    });
};

exports.insertBlock = function(height, hash, callback) {
    query('INSERT INTO blocks(height, hash) VALUES($1, $2)', [height, hash], callback);
};


//notifier is called with the row (bv_moneypots joined bv_user)



exports.addDeposit = function(userId, txid, amount, callback) {

    console.log('Trying to add deposit: ', userId, txid, amount);


    assert(typeof amount === 'number');
   // Amount is in bitcoins...
    amount = Math.round(amount * 1e8);


    getClient(function(client, callback) {
        async.parallel([
            function(callback) {
                 client.query('INSERT INTO fundings(user_id, amount, bitcoin_deposit_txid, description) ' +
                    "VALUES($1, $2, $3, 'Bitcoin Deposit')",
                [userId, amount, txid], callback);
             },
            function(callback) {
             client.query("UPDATE users SET balance_satoshis = balance_satoshis + $1 WHERE id = $2",
                [amount, userId], callback);
        }], callback);
    }, function(err) {
        if (err) {
            if (err.code == '23505') {  // constraint violation
                console.log('Warning deposit constraint violation for (', userId, ',', txid, ')');
                return callback(null);
            }
            console.log('[INTERNAL_ERROR] could not save: (', userId, ',', txid, ') got err: ', err);
            return callback(err);
        }

        callback(null);
    });
};
