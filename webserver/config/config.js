/**
 * For development you can set the variables by creating a .env file on the root
 */
var fs = require('fs');
var production = process.env.NODE_ENV === 'production';

var prodConfig;
if(production) {
  prodConfig = JSON.parse(fs.readFileSync(__dirname + '/build-config.json'));
  console.log('Build config loaded: ', prodConfig);
}

module.exports = {
  "PRODUCTION": production,
  "DATABASE_URL": process.env.DATABASE_URL || "postgres://localhost:5432/bustabitdb",
  "BIP32_DERIVED": process.env.BIP32_DERIVED_KEY,
  "AWS_SES_KEY": process.env.AWS_SES_KEY,
  "AWS_SES_SECRET": process.env.AWS_SES_SECRET,
  "CONTACT_EMAIL": process.env.CONTACT_EMAIL || "ryan@moneypot.com",
  "SITE_URL": process.env.SITE_URL || "http://localhost:3841",
  "ENC_KEY": process.env.ENC_KEY || "devkey",
  "SIGNING_SECRET": process.env.SIGNING_SECRET || "secret",
  "BANKROLL_OFFSET": parseInt(process.env.BANKROLL_OFFSET) || 0,
  "RECAPTCHA_PRIV_KEY": process.env.RECAPTCHA_PRIV_KEY || '6LeXIAoTAAAAAFGjKCoONRo8L3gD5IVG39F7d_St',
  "RECAPTCHA_SITE_KEY": process.env.RECAPTCHA_SITE_KEY || '6LeXIAoTAAAAAA2lTK931SbFIq2Cn88HFE4XxZPR',
  "BITCOIND_HOST": process.env.BITCOIND_HOST,
  "BITCOIND_PORT": process.env.BITCOIND_PORT || 8332,
  "BITCOIND_USER": process.env.BITCOIND_USER,
  "BITCOIND_PASS": process.env.BITCOIND_PASS,
  "BITCOIND_CERT": process.env.BITCOIND_CERT  || '',
  "PORT":  process.env.PORT || 3841,
  "MINING_FEE": process.env.MINING_FEE || 10000,
  "BUILD": prodConfig
};