const semver = require('semver');
const parser = require('ua-parser-js');
const packageJson = require('../../package.json');

const { memoizeAsync } = require('./index');

const parseWalletUA = (userAgent) => {
  const ua = (userAgent || '').toString().toLowerCase();
  let os = '';
  let version = '';
  if (ua.indexOf('android') > -1) {
    os = 'android';
  } else if (ua.indexOf('darwin') > -1) {
    os = 'ios';
  } else if (ua.indexOf('arcwallet') === 0) {
    os = 'web';
  }

  const match = ua.split(/\s+/).find((x) => x.startsWith('arcwallet'));
  if (match) {
    const tmp = match.split('/');
    if (tmp.length > 1 && semver.coerce(tmp[1])) {
      version = semver.coerce(tmp[1]).version;
    }
  }

  return { os, version };
};

const parse = memoizeAsync((ua) => {
  let result = parser(ua);
  if (result.browser.name) {
    return result;
  }

  result = parseWalletUA(ua);
  if (result.version) {
    return {
      browser: {
        name: `DID Wallet ${result.os.toUpperCase()}`,
        version: result.version,
      },
    };
  }

  return {
    browser: {
      name: 'CLI',
      version: packageJson.version,
    },
  };
});

module.exports = { parse };
