var async = require('async');
var db = require('./server/database');
var lib = require('./server/lib');
var _ = require('lodash');

var offset = 1e6;

var games = 1e6;  // You might want to make this 10M for a prod setting..
var game = games;
var serverSeed = 'DO NOT USE THIS SEED';

function loop(cb) {
    var parallel = Math.min(game, 1000);

    var inserts = _.range(parallel).map(function() {

        return function(cb) {
            serverSeed = lib.genGameHash(serverSeed);
            game--;

            db.query('INSERT INTO game_hashes(game_id, hash) VALUES($1, $2)', [offset + game, serverSeed], cb);
        };
    });

    async.parallel(inserts, function(err) {
        if (err) throw err;

        // Clear the current line and move to the beginning.
        var pct = 100 * (games - game) / games;
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(
            "Processed: " + (games - game) + ' / ' + games +
                ' (' + pct.toFixed(2)  + '%)');

        if (game > 0)
            loop(cb);
        else {
            console.log(' Done');
            cb();
        }
    });
}


loop(function() {

    console.log('Finished with serverseed: ', serverSeed);

});