const fs = require('fs');
const { EventEmitter } = require('events');
const path = require('path');
const cloneDeep = require('@abtnode/util/lib/deep-clone');

const packageName = require('../package.json').name;
const { DataStore } = require('./base');

// eslint-disable-next-line import/order
const logger = require('@abtnode/logger')(packageName);

class DB extends DataStore {
  constructor(baseDir, config) {
    const dbOptions = config.db || {};
    const filename = path.join(baseDir, config.filename);
    const compactInterval =
      typeof dbOptions.compactInterval === 'undefined' ? 60 * 60 * 1000 : +dbOptions.compactInterval;

    super({ filename, timestampData: true, ...dbOptions });

    this.filename = filename;
    this.config = Object.freeze(cloneDeep(config));

    this._patchEvents();

    this.ready = false;
    this.readyCallbacks = [];
    this.loadDatabase((err) => {
      if (err) {
        logger.error(`failed to load disk database ${this.filename}`, { error: err });
        console.error(err);
      } else {
        logger.info('loaded', { filename: this.filename });

        if (compactInterval > 0) {
          this.persistence.setAutoCompactionInterval(compactInterval, console.warn);
        }

        this.ready = true;
        if (this.readyCallbacks.length) {
          this.readyCallbacks.forEach((x) => x());
        }
      }
    });
  }

  onReady(cb) {
    if (this.ready) {
      cb();
    } else {
      this.readyCallbacks.push(cb);
    }
  }

  paginate(conditions, sort, paging) {
    const { pageSize: size = 20, page = 1 } = paging || {};
    const pageSize = Math.min(100, size);

    return new Promise((resolve, reject) => {
      this.cursor(conditions)
        .sort(sort)
        .exec((err, docs = []) => {
          if (err) {
            return reject(err);
          }

          const pageCount = Math.ceil(docs.length / pageSize);
          const total = docs.length;
          const skip = (page - 1) * pageSize;
          const list = docs.slice(skip, skip + pageSize);

          list.forEach((doc) => {
            // eslint-disable-next-line no-underscore-dangle
            doc.id = doc._id;
          });

          return resolve({
            list,
            paging: {
              total,
              pageSize,
              pageCount,
              page,
            },
          });
        });
    });
  }

  async updateById(id, updates, options = {}) {
    const [, doc] = await super.update({ _id: id }, updates, {
      multi: false,
      upsert: false,
      returnUpdatedDocs: true,
      ...options,
    });

    return doc;
  }

  update(query, updates, options = {}) {
    if (arguments.length < 2) {
      throw new Error('query and update param are required to update database record');
    }

    if (typeof query === 'string') {
      return this.updateById(query, updates, options);
    }

    return super.update(query, updates, { returnUpdatedDocs: true, ...options });
  }

  upsert(query, updates, options = {}) {
    return super.update(query, updates, { ...options, upsert: true });
  }

  remove(query, options = {}) {
    return super.remove(query, { ...options, multi: true });
  }

  reset() {
    fs.unlinkSync(this.filename);
  }

  compactDatafile() {
    this.persistence.compactDatafile((err) => {
      if (err) {
        console.error(`failed to compact datafile: ${this.filename}`, err);
      }
    });
  }

  // In case we are using the concurrent version
  _patchEvents() {
    if (typeof this.emit === 'function') {
      return;
    }

    const events = new EventEmitter();

    this.on = events.on.bind(events);
    this.once = events.once.bind(events);
    this.off = events.off.bind(events);
    this.emit = events.emit.bind(events);
  }
}

/**
 * Rename _id field name to id, this method has side effects
 * @param {object} entities
 */
const renameIdFiledName = (entities, from = '_id', to = 'id') => {
  /* eslint-disable  no-underscore-dangle, no-param-reassign */

  if (!entities) {
    return entities;
  }

  const mapEntity = (entity) => {
    if (entity[from]) {
      entity[to] = entity[from];
      delete entity[from];
    }
  };

  if (!Array.isArray(entities)) {
    mapEntity(entities);
    return entities;
  }

  entities.forEach(mapEntity);

  return entities;
};

DB.renameIdFiledName = renameIdFiledName;

module.exports = DB;
