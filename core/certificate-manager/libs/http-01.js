/**
 * base on: https://www.npmjs.com/package/acme-http-01-standalone
 */

const states = require('../states');
const logger = require('./logger');

const _memdb = {};

const create = () => {
  return {
    init() {
      return Promise.resolve(null);
    },

    set(data) {
      return Promise.resolve().then(async () => {
        const ch = data.challenge;
        const key = ch.token;
        logger.info('set key:', { key });
        await states.httpChallenge.upsert({ key }, { value: ch.keyAuthorization });
        logger.info('setted key:', { key });

        return null;
      });
    },

    get(data) {
      return Promise.resolve().then(async () => {
        const ch = data.challenge;
        const key = ch.token;
        logger.info('get key', { key });

        const challengeResult = await states.httpChallenge.findOne({ key });
        if (challengeResult) {
          logger.info('got key', { key });
          return { keyAuthorization: challengeResult.value };
        }

        logger.info('key not found', { key });
        return null;
      });
    },

    remove(data) {
      return Promise.resolve().then(async () => {
        const ch = data.challenge;
        const key = ch.token;
        logger.info('remove key', { key });
        await states.httpChallenge.remove({ key });
        logger.info('removed key', { key });

        return null;
      });
    },
  };
};

module.exports = {
  create,
  db: _memdb,
};
