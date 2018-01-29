var assert = require('better-assert');
var bitcoin = require('bitcoin');


var lib = require('./lib');

var client = new bitcoin.Client({
    host: process.env.BITCOIND_HOST,
    port: process.env.BITCOIND_PORT || 8332,
    user: process.env.BITCOIND_USER,
    pass: process.env.BITCOIND_PASS,
    timeout: 240000
});

assert(client.rpc.opts.host);
assert(client.rpc.opts.user);
assert(client.rpc.opts.pass);

function doGetTransactions(txIds, callback) {
    if (txIds.length === 0)
        return callback(null, []);

    var batch = txIds.map(function(txId) {
        return {
            method: 'getrawtransaction',
            params: [txId, 1]
        };
    });

    var abort = false;
    var transactions = [];
    var count = 0;

    client.cmd(batch, function(err, transaction) {
        if (abort) return;

        if (err) {
            abort = true;
            return callback(err);
        }

        transactions.push(transaction);

        if (++count === txIds.length) {
            return callback(null, transactions);
        }

        assert(count < txIds.length);
    });
}

client.getTransactions = function(txIds, callback) {
    return lib.chunkRun(doGetTransactions, txIds, 3, 1, function(err, data) {

        if (err) {
            console.error('Error: when fetching', txIds.length, ' transactions, got error: ', err);
            return callback(err);
        }

        callback(null, data);
    });
};

client.getTransaction = function(transactionHash, callback) {
    client.getRawTransaction(transactionHash, 1, callback);
};

// returns [{address: amount}])
function transactionsAddresses(transactions) {

    return transactions.map(function(transaction) {
        var addressToAmount = {};

        transaction.vout.forEach(function (out) {
            var addresses = out.scriptPubKey.addresses;
            if (!addresses || addresses.length !== 1) {
                return;
            }

            assert(out.value >= 0);
            var oldAmount = addressToAmount[addresses[0]] || 0;
            addressToAmount[addresses[0]] = oldAmount + out.value;
        });

        return addressToAmount;
    });
}

function doGetTransactionIdsAddresses(txids, callback) {
    doGetTransactions(txids, function(err, transactions) {
        if (err) return callback(err);

        callback(null, transactionsAddresses(transactions));
    });
}

// callback(err, listOfAddressToAmount
client.getTransactionIdsAddresses = function(txIds, callback) {
    lib.chunkRun(doGetTransactionIdsAddresses, txIds, 20, 2, callback);
};

module.exports = client;