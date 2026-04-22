const debug = require('debug')(require('../package.json').name);

module.exports = {
  error: debug,
  warn: debug,
  info: debug,
  debug,
  verbose: debug,
  silly: debug,
};
