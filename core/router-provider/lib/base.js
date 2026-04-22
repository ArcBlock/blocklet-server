const os = require('os');

class BaseProvider {
  constructor(name) {
    this.name = name;
  }

  initialize() {
    throw new Error('initialize method is not implemented');
  }

  start() {
    throw new Error('start method is not implemented');
  }

  restart() {
    throw new Error('restart method is not implemented');
  }

  reload() {
    throw new Error('reload method is not implemented');
  }

  update() {
    throw new Error('update method is not implemented');
  }

  stop() {
    throw new Error('stop method is not implemented');
  }

  validateConfig() {
    throw new Error('validateConfig method is not implemented');
  }

  rotateLogs() {
    throw new Error('rotateLogs method is not implemented');
  }

  getLogFilesForToday() {
    throw new Error('getLogFilesForToday method is not implemented');
  }

  // eslint-disable-next-line no-unused-vars
  searchCache(pattern, group) {
    throw new Error('searchCache method is not implemented');
  }

  // eslint-disable-next-line no-unused-vars
  clearCache(group) {
    throw new Error('clearCache method is not implemented');
  }

  getWorkerProcess(max = +process.env.ABT_NODE_MAX_CLUSTER_SIZE) {
    if (this.isTest) {
      return 1;
    }

    if (process.env.NODE_ENV === 'production') {
      return Math.min(os.cpus().length, max);
    }

    return 1;
  }
}

module.exports = BaseProvider;
