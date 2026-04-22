const BaseState = require('./base');

/**
 * This db is used to save arbitrary cached data.
 * @extends BaseState<import('@abtnode/models').CacheState>
 */
class CacheState extends BaseState {
  async set(key, value) {
    const doc = await this.upsert({ key }, { value });
    return doc.value;
  }

  async get(key) {
    const doc = await this.findOne({ key });
    return doc && doc.value;
  }

  delete(key) {
    return this.remove({ key });
  }
}

module.exports = CacheState;
