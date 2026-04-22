const { EventEmitter } = require('events');
const { createSequelize, getConnectModels, setupModels, doSchemaMigration } = require('@abtnode/models');

const ConnectionState = require('./state');

class SequelizeStorage extends EventEmitter {
  constructor(options = {}) {
    if (!options.dbPath) {
      throw new Error('SequelizeStorage requires dbPath to be set');
    }

    const model = options.v2 ? 'ConnectionV2' : 'Connection';
    const primaryKey = options.v2 ? 'sessionId' : 'token';

    super(options);

    const sequelize = createSequelize(options.dbPath);
    const models = getConnectModels();

    setupModels(models, sequelize);

    this.state = new ConnectionState(models[model], { ...options, primaryKey });
    this.primaryKey = primaryKey;

    doSchemaMigration(options.dbPath, 'connect')
      .then(() => {
        if (typeof options.onload === 'function') {
          options.onload();
        }
      })
      .catch((err) => {
        console.error(`Connection storage schema migration failed: ${options.dbPath}`, err);
        if (typeof options.onload === 'function') {
          options.onload();
        }
      });
  }

  async read(token) {
    const data = await this.state.read(token);
    return data;
  }

  async create(token, status = 'created') {
    const doc = await this.state.start(token, status);
    this.emit('create', doc);
    return doc;
  }

  async update(token, updates) {
    const doc = await this.state.update(token, updates);
    this.emit('update', doc);
    return doc;
  }

  async delete(token) {
    const num = await this.state.remove({ [this.primaryKey]: token });
    this.emit('destroy', token);
    return num;
  }

  async exist(token, did) {
    const data = await this.state.count({ [this.primaryKey]: token, did });
    return data;
  }

  async clear() {
    const data = await this.state.reset();
    return data;
  }
}

module.exports = SequelizeStorage;
