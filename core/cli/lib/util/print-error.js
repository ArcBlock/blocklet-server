const { symbols } = require('../ui');
const debug = require('../debug')('util');

module.exports = function printError(...args) {
  debug(...args);
  if (args.length && args[0] instanceof Error) {
    args[0] = args[0].message;
  }

  console.error.apply(null, [symbols.error, ...args]);
};
