var assert = require('better-assert');
var async = require('async');
var bc = require('./src/bitcoin_client');
var db = require('./src/db');
var lib = require('./src/lib');
var fs = require('fs')


var client;

// Mapping of deposit_address -> user_id
var depositAddresses = JSON.parse(fs.readFileSync('.addresses.json', 'utf8'));
assert(depositAddresses);


startBlockLoop();

function processTransactionIds(txids, callback) {

    bc.getTransactionIdsAddresses(txids, function(err, addressToAmountLists) {
        if (err) return callback(err);

        assert(txids.length === addressToAmountLists.length);

        var tasks = [];

        addressToAmountLists.forEach(function(addressToAmount, i) {

            var txid = txids[i];
            assert(txid);

            var usersToAmounts = {};

            Object.keys(addressToAmount).forEach(function(address) {

                var userId = depositAddresses[address];
                if (userId) {
                    usersToAmounts[userId] = addressToAmount[address];
                }
            });


            if (Object.keys(usersToAmounts).length > 0) {
                console.log('Transactions: ', txid, ' matches: ', usersToAmounts);

                Object.keys(usersToAmounts).forEach(function(userId) {
                    tasks.push(function(callback) {
                        db.addDeposit(userId, txid, usersToAmounts[userId], callback);
                    });
                });


            }
        });

        async.parallelLimit(tasks, 3, callback);
    });
}



// Handling the block...


/// block chain loop

var lastBlockCount;
var lastBlockHash;

function startBlockLoop() {
    // initialize...
    db.getLastBlock(function (err, block) {
        if (err)
            throw new Error('Unable to get initial last block: ', err);

        lastBlockCount = block.height;
        lastBlockHash = block.hash;

        console.log('Initialized on block: ', lastBlockCount, ' with hash: ', lastBlockHash);

        blockLoop();
    });
}

function scheduleBlockLoop() {
    setTimeout(blockLoop, 20000);
}

function blockLoop() {
    bc.getBlockCount(function(err, num) {
        if (err) {
            console.error('Unable to get block count');
            return scheduleBlockLoop();
        }

        if (num === lastBlockCount) {
            console.log('Block chain still ', num, ' length. No need to do anything');
            return scheduleBlockLoop();
        }

        bc.getBlockHash(lastBlockCount, function(err, hash) {
            if (err) {
                console.error('Could not get block hash, error: ' + err);
                return scheduleBlockLoop();
            }

            if (lastBlockHash !== hash) {
                // There was a block-chain reshuffle. So let's just jump back a block
                db.getBlock(lastBlockCount - 1, function(err, block) {
                    if (err) {
                        console.error('ERROR: Unable jump back ', err);
                        return scheduleBlockLoop();
                    }

                    --lastBlockCount;
                    lastBlockHash = block.hash;
                    blockLoop();
                });
                return;
            }

            bc.getBlockHash(lastBlockCount+1, function(err, hash) {
                if (err) {
                    console.error('Unable to get block hash: ', lastBlockCount+1);
                    return scheduleBlockLoop();
                }

                processBlock(hash, function(err) {
                    if (err) {
                        console.error('Unable to process block: ', hash, ' because: ', err);
                        return scheduleBlockLoop();
                    }

                    ++lastBlockCount;
                    lastBlockHash = hash;


                    db.insertBlock(lastBlockCount, lastBlockHash, function(err) {
                       if (err)
                          console.error('Danger, unable to save results in database...');

                        // All good! Loop immediately!
                        blockLoop();
                    });
                });
            });

        });
    });
}

function processBlock(hash, callback) {
    console.log('Processing block: ', hash);

    var start = new Date();

    bc.getBlock(hash, function(err, blockInfo) {
        if (err) {
            console.error('Unable to get block info for: ', hash, ' got error: ', err);
            return callback(err);
        }

        var transactionsIds = blockInfo.tx;


        processTransactionIds(transactionsIds, function(err) {
            if (err)
                console.log('Unable to process block (in ',  (new Date() - start ) / 1000, ' seconds)');
            else
                console.log('Processed ', transactionsIds.length, ' transactions in ', (new Date() - start ) / 1000, ' seconds');

            callback(err)
        });
    });

}



