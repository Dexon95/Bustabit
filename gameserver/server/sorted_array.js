var assert = require('better-assert');
var binarySearch = require('binary-search');

// An array that can be inserted into that keeps the sorted property
// note: it's not generic, and is designed for use for the players
// so it has a hardcoded cmptr and doesn't allow dupes
function SortedArray() {
    this.arr = [];
}

function cmp(a, b) {
    var r = b.bet - a.bet;
    if (r !== 0) return r;
    return a.user.username < b.user.username ? 1 : -1;
}

// Returns the index of that it inserted into
SortedArray.prototype.insert = function(v) {
    if (this.arr.length === 0) {
        this.arr.push(v);
        return 0;
    }

    var r = ~binarySearch(this.arr, v, cmp);
    assert(r >= 0); // otherwise it means its found would have found it
    this.arr.splice(r, 0, v);

    return r;
};

SortedArray.prototype.get = function(i) {
    return this.arr[i];
};

SortedArray.prototype.getArray = function() {
    return this.arr;
};

SortedArray.prototype.clear = function() {
    this.arr = [];
};

module.exports = SortedArray;


