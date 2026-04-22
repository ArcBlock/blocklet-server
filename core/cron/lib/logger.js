const debug = require('debug')(require('../package.json').name);

const noop = () => {};
const isTest = !!process.env.NODE_ENV && process.env.NODE_ENV.startsWith('test');

module.exports = ['error', 'warn', 'info', 'debug', 'verbose', 'silly'].reduce((acc, fn) => {
  acc[fn] = isTest ? noop : debug;
  return acc;
}, {});
