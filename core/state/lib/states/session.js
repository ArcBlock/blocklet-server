const { getRandomBytes } = require('@ocap/mcrypto');
const omit = require('lodash/omit');
const { CustomError } = require('@blocklet/error');
const BaseState = require('./base');

/**
 * This db is used to save session data generated in a http session. the session is NOT user auth session.
 * @extends BaseState<import('@abtnode/models').SessionState>
 */
class SessionState extends BaseState {
  /**
   * type is used to group sessions
   * key is used to identify sessions
   */
  async start({ type, key, ...data }) {
    const challenge = getRandomBytes(24, 'hex');
    const doc = await this.insert({ type, key, challenge, __data: data });
    return this._format(doc);
  }

  async update(id, updates) {
    const doc = await this.findByIdOrChallenge(id);
    if (!doc) {
      throw new CustomError(404, `Session does not exist: ${id}`);
    }

    await super.update({ id: doc.id }, { __data: { ...doc.__data, ...updates } });
    return this._format(doc, updates);
  }

  async read(id) {
    const doc = await this.findByIdOrChallenge(id);
    return this._format(doc);
  }

  async end(id) {
    const doc = await this.findByIdOrChallenge(id);
    if (!doc) {
      throw new CustomError(404, `Session does not exist: ${id}`);
    }

    await this.remove({ id });
    return this._format(doc);
  }

  async find(...args) {
    const docs = await super.find(...args);
    return docs.map(this._format);
  }

  findByIdOrChallenge(id) {
    return this.findOne({ $or: [{ id }, { challenge: id }] });
  }

  _format(doc, extra = {}) {
    return doc ? omit({ ...doc, ...doc.__data, ...extra }, ['__data']) : doc;
  }
}

module.exports = SessionState;
