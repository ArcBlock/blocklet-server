/* eslint-disable no-underscore-dangle */
const EventEmitter = require('eventemitter3');
const ABTNodeClient = require('./base');

class BrowserABTNodeClient extends ABTNodeClient {
  _getSocketOptions() {
    return {};
  }

  _getEventImplementation() {
    return EventEmitter;
  }
}

module.exports = BrowserABTNodeClient;
