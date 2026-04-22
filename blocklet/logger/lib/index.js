const logger = require('@abtnode/logger');

if (!process.env.BLOCKLET_LOG_DIR) {
  throw new Error('valid BLOCKLET_LOG_DIR env is required by logger');
}

/**
 * @param {string} label
 * @param {object} option
 * @param {'emerg'|'alert'|'crit'|'error'|'warning'|'notice'|'info'|'debug'} [option.level] default is info
 */
module.exports = (label, { level } = {}) => {
  const tempLevel = level || process.env.LOG_LEVEL || 'info';

  return logger(label, { logDir: process.env.BLOCKLET_LOG_DIR, filename: 'info', level: tempLevel });
};

module.exports.getAccessLogStream = () => logger.getAccessLogStream(process.env.BLOCKLET_LOG_DIR);
module.exports.setupAccessLogger = (server) => logger.setupAccessLogger(server, module.exports.getAccessLogStream());
