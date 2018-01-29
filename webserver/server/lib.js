var assert = require('better-assert');
var bitcoinjs = require('bitcoinjs-lib');
var crypto = require('crypto');
var config = require('../config/config');

var encKey = config.ENC_KEY;

exports.encrypt = function (text) {
    var cipher = crypto.createCipher('aes-256-cbc', encKey);
    var crypted = cipher.update(text,'utf8','hex');
    crypted += cipher.final('hex');
    return crypted;
};

exports.randomHex = function(bytes) {
    var buff;

    try {
        buff = crypto.randomBytes(bytes);
    } catch (ex) {
        console.log('Caught exception when trying to generate hex: ', ex);
        buff = crypto.pseudoRandomBytes(bytes);
    }

    return buff.toString('hex');
};

exports.sha = function(str) {
    var shasum = crypto.createHash('sha256');
    shasum.update(str);
    return shasum.digest('hex');
};

exports.isInvalidUsername = function(input) {
    if (typeof input !== 'string') return 'NOT_STRING';
    if (input.length === 0) return 'NOT_PROVIDED';
    if (input.length < 3) return 'TOO_SHORT';
    if (input.length > 50) return 'TOO_LONG';
    if (!/^[a-z0-9_\-]*$/i.test(input)) return 'INVALID_CHARS';
    if (input === '__proto__') return 'INVALID_CHARS';
    return false;
};

exports.isInvalidPassword = function(password) {
    if (typeof password !== 'string') return 'NOT_STRING';
    if (password.length === 0) return 'NOT_PROVIDED';
    if (password.length < 7) return 'TOO_SHORT';
    if (password.length > 200) return 'TOO_LONG';
    return false;
};

exports.isInvalidEmail = function(email) {
    if (typeof email !== 'string') return 'NOT_STRING';
    if (email.length > 100) return 'TOO_LONG';
    if (email.indexOf('@') === -1) return 'NO_@'; // no @ sign
    if (!/^[-0-9a-zA-Z.+_]+@[-0-9a-zA-Z.+_]+\.[a-zA-Z]{2,4}$/i.test(email)) return 'NOT_A_VALID_EMAIL'; // contains whitespace
    return false;
};

exports.isUUIDv4 = function(uuid) {
    return (typeof uuid === 'string') && uuid.match(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
};

exports.isEligibleForGiveAway = function(lastGiveAway) {
    if (!lastGiveAway)
        return true;

    var created = new Date(lastGiveAway);
    var timeElapsed = (new Date().getTime() - created.getTime()) / 60000; //minutes elapsed since last giveaway

    if (timeElapsed > 60)
        return true;

    return Math.round(60 - timeElapsed);
};

var derivedPubKey = config.BIP32_DERIVED;
if (!derivedPubKey)
    throw new Error('Must set env var BIP32_DERIVED_KEY');


var hdNode = bitcoinjs.HDNode.fromBase58(derivedPubKey);

exports.deriveAddress = function(index) {
    return hdNode.derive(index).pubKey.getAddress().toString();
};

exports.formatSatoshis = function(n, decimals) {
    if (typeof decimals === 'undefined')
        decimals = 2;

    return (n/100).toFixed(decimals).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
};

exports.isInt = function isInteger (nVal) {
    return typeof nVal === "number" && isFinite(nVal) && nVal > -9007199254740992 && nVal < 9007199254740992 && Math.floor(nVal) === nVal;
};

exports.hasOwnProperty = function(obj, propName) {
    return Object.prototype.hasOwnProperty.call(obj, propName);
};

exports.getOwnProperty = function(obj, propName) {
    return Object.prototype.hasOwnProperty.call(obj, propName) ? obj[propName] : undefined;
};

exports.parseTimeString = function(str) {
    var reg   = /^\s*([1-9]\d*)([dhms])\s*$/;
    var match = str.match(reg);

    if (!match)
        return null;

    var num = parseInt(match[1]);
    switch (match[2]) {
    case 'd': num *= 24;
    case 'h': num *= 60;
    case 'm': num *= 60;
    case 's': num *= 1000;
    }

    assert(num > 0);
    return num;
};

exports.printTimeString = function(ms) {
    var days = Math.ceil(ms / (24*60*60*1000));
    if (days >= 3) return '' + days + 'd';

    var hours = Math.ceil(ms / (60*60*1000));
    if (hours >= 3) return '' + hours + 'h';

    var minutes = Math.ceil(ms / (60*1000));
    if (minutes >= 3) return '' + minutes + 'm';

    var seconds = Math.ceil(ms / 1000);
    return '' + seconds + 's';
};

var secret = config.SIGNING_SECRET;

exports.sign = function(str){
    return crypto
        .createHmac('sha256', secret)
        .update(str)
        .digest('base64');
};

exports.validateSignature = function(str, sig){
    return exports.sign(str) == sig;
};

exports.removeNullsAndTrim = function(str) {
    if(typeof str === 'string')
        return str.replace(/\0/g, '').trim();
    else
        return str;
};
