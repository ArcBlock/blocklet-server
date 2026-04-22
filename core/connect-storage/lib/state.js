const omit = require('lodash/omit');
const pick = require('lodash/pick');
const { BaseState } = require('@abtnode/models');

/**
 * @extends BaseState<import('@abtnode/models').ConnectionState>
 */
class Connection extends BaseState {
  async start(token, status = 'created') {
    const attrs =
      status && typeof status === 'object'
        ? { [this.config.primaryKey]: token, ...status }
        : { [this.config.primaryKey]: token, status };
    const doc = await this.insert(attrs);
    return this._format(doc);
  }

  async update(token, updates) {
    const doc = await this.findOne({ [this.config.primaryKey]: token });
    if (!doc) {
      throw new Error(`Connect session does not exist: ${token}`);
    }

    const knownKeys = Object.keys(this.model.getAttributes());
    const extra = omit(updates, knownKeys);

    await super.update(
      { [this.config.primaryKey]: token },
      { ...pick(updates, knownKeys), __extra: { ...doc.__extra, ...extra } }
    );
    return this._format(doc, updates);
  }

  async read(token) {
    const doc = await this.findOne({ [this.config.primaryKey]: token });
    return this._format(doc);
  }

  _format(doc, extra = {}) {
    return doc ? omit({ ...doc, ...doc.__extra, ...extra }, ['__extra']) : doc;
  }
}

module.exports = Connection;
