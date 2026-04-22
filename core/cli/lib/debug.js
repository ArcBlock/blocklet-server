/* eslint-disable no-console */

const debug = require('debug');

if (process.env.FORGE_DEBUG) {
  debug.enable(process.env.FORGE_DEBUG);
}

const instance = (name) => {
  const tmp = debug(`@blocklet/cli:${name || 'info'}`);
  tmp.error = (...args) => {
    if (tmp.enabled) {
      console.error(...args);
    }
  };

  return tmp;
};

module.exports = instance;
