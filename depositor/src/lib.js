var async = require('async');
var bitcoinjs = require('bitcoinjs-lib');


function chunk(array, chunkSize) {
    return [].concat.apply([],
        array.map(function(elem,i) {
            return i%chunkSize ? [] : [array.slice(i,i+chunkSize)];
        })
    );
}

function chunkRun(func, inputs, chunkSize, parallel, callback) {
    var chunks = chunk(inputs, chunkSize);

    var todo = chunks.map(function(chunk) {
        return function(callback) {
            func(chunk, function(err, data) {
                if (err) {
                    console.log('Got ', err, ' on chunk: ', chunk);
                }

                callback(err, data);
            });
        }
    });

    async.parallelLimit(todo, parallel, function(err, results) {
        if (err) return callback(err);
        var total = [].concat.apply([], results);
        callback(null, total);
    });
}

function intersperse(arr, item) {
    var na = [];

    for (var i = 0; i < arr.length; ++i) {
        na.push(arr[i]);
        if (i < arr.length - 1)
            na.push(item);
    }

    return na;
}

function desperse(arr) {
    var na = [];

    for (var i = 0; i < arr.length ; i += 2) {
        na.push(arr[i]);
    }

    return na;
}

function chunkSlow(func, inputs, chunkSize, delay, callback) {

    function slow(callback) {
        setTimeout(function() {  callback(null); }, delay);
    }

    var chunks = chunk(inputs, chunkSize);
    var todo = chunks.map(function(chunk) {
        return function(callback) {
            func(chunk, callback);
        }
    });

    todo = intersperse(todo, slow);

    async.series(todo, function(err, res) {
        if (err)
            return callback(err);

        res = desperse(res);
        res = [].concat.apply([], res);
        callback(null, res);
    });
}

exports.chunk = chunk;
exports.chunkRun = chunkRun;
exports.chunkSlow = chunkSlow;

var derivedPubKey = process.env.BIP32_DERIVED_KEY;
if (!derivedPubKey)
    throw new Error('Must set env var BIP32_DERIVED_KEY');

var hdNode = bitcoinjs.HDNode.fromBase58(derivedPubKey);

exports.deriveAddress = function(index) {
    return hdNode.derive(index).getAddress().toString();
};

