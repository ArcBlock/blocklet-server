const createLogger = require('@abtnode/logger');

const packageName = require('../../package.json').name;

module.exports = (label = packageName) => {
  return createLogger(label, {
    logDir: process.env.ABT_NODE_LOG_DIR,
    filename: 'service',
  });
};

module.exports.setupAccessLogger = createLogger.setupAccessLogger;

module.exports.getAccessLogStream = () =>
  createLogger.getAccessLogStream(process.env.ABT_NODE_LOG_DIR, 'service.access.log');
