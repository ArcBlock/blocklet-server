const { Op } = require('sequelize');
const dayjs = require('@abtnode/util/lib/dayjs');
const logger = require('@abtnode/logger')('@abtnode/core:state:blacklist');

const BaseState = require('./base');

/**
 * This db is used to save blacklist data.
 * @extends BaseState<import('@abtnode/models').BlacklistState>
 */
class BlacklistState extends BaseState {
  findActiveByScope(scope) {
    const now = dayjs().unix();
    return this.find({ where: { scope, expiresAt: { [Op.gt]: now } } });
  }

  removeExpiredByScope(scope) {
    const now = dayjs().unix();
    return this.remove({ where: { scope, expiresAt: { [Op.lte]: now } } });
  }

  removeByScope(scope) {
    return this.remove({ where: { scope } });
  }

  async addItem(scope, key, expiresAt) {
    const now = dayjs().unix();
    if (expiresAt < now) {
      return false;
    }

    const exist = await this.findOne({ where: { scope, key } });
    if (exist) {
      if (exist.expiresAt >= now) {
        logger.debug('reuse existing item', { exist, scope, key, expiresAt });
        return false;
      }

      // if the item is expired, remove it
      logger.debug('remove expired item on add', { exist });
      await this.remove({ where: { scope, key } });
    }

    logger.debug('add new item', { scope, key, expiresAt });
    await this.insert({ scope, key, expiresAt });
    return true;
  }
}

module.exports = BlacklistState;
