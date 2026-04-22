const { EventEmitter } = require('events');
const get = require('lodash/get');
const Pm2Events = require('@arcblock/pm2-events');
const logger = require('@abtnode/logger')('@abtnode/core:pm2-events');

/**
 * Attention: 依赖的 pm2-events 包在文档中说监听的事件可能不太精确，不过测试下来满足我们的需求；
 * 但是还是要留意一下作者的提醒，如果有什么问题可以作为参考: https://www.npmjs.com/package/pm2-events#other
 */

const expectedPm2Home = process.env.PM2_HOME;

class BlockletPm2Events extends EventEmitter {
  constructor() {
    super();

    this.paused = true;

    this.pm2Events = new Pm2Events();
    this.pm2Events
      .on((name, details) => {
        if (this.paused) {
          return;
        }

        const actualPm2Home = get(details, 'process.PM2_HOME', '');
        if (actualPm2Home !== expectedPm2Home) {
          return;
        }
        const { BLOCKLET_DID: blockletDid, BLOCKLET_COMPONENT_DID: componentDid } = details.process || {};
        logger.debug('listen pm2 event', { name, blockletDid, componentDid });
        if (blockletDid) {
          this.emit(name, { blockletDid, componentDid });
        }
      })
      .error((error) => {
        logger.error('listen pm2 event error', { error });
      });
  }

  resume() {
    this.paused = false;
  }

  pause() {
    this.paused = true;
  }
}

module.exports = new BlockletPm2Events();
