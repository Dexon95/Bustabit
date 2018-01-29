var debug = require('debug')('app:generate_addresses');
var lib = require('./lib');


var count = process.env.GENERATE_ADDRESSES ? parseInt(process.env.GENERATE_ADDRESSES) : 100; // how many addresses to watch

debug('Generating %n addresses', count);

console.log('{');

for (var i = 1; i <= count; ++i) {
  var address = lib.deriveAddress(i);
  console.log('"' + address + '": ' + i + (i != count ? ',' : ''));
}

console.log('}');

