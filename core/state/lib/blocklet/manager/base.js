/* eslint-disable no-unused-vars */
const { EventEmitter } = require('events');
const logger = require('@abtnode/logger')('@abtnode/core:manager');

class BaseBlockletManager extends EventEmitter {
  constructor() {
    super();

    this.setMaxListeners(100);
  }

  install() {
    throw new Error('Install must be implemented in sub class');
  }

  start() {
    throw new Error('Install must be implemented in sub class');
  }

  stop() {
    throw new Error('Stop must be implemented in sub class');
  }

  restart() {
    throw new Error('Restart must be implemented in sub class');
  }

  reload() {
    throw new Error('Reload must be implemented in sub class');
  }

  delete() {
    throw new Error('Delete must be implemented in sub class');
  }

  detail() {
    throw new Error('Detail must be implemented in sub class');
  }

  list() {
    throw new Error('List must be implemented in sub class');
  }

  config() {
    throw new Error('Config must be implemented in sub class');
  }
}

module.exports = BaseBlockletManager;
