import fs from 'fs-extra';

import path from 'path';
import {
  AnyObject,
  DataStore as BaseStore,
  DataStoreOptions,
  FilterQuery,
  ProjectionQuery,
  SortQuery,
} from '@nedb/core';

class Database<T = AnyObject> extends BaseStore<T> {
  constructor(name: string, options: DataStoreOptions = {}) {
    if (!process.env.BLOCKLET_DATA_DIR) {
      throw new Error('Blocklet SDK must be used in blocklet runtime');
    }
    const DB_DIR = path.join(process.env.BLOCKLET_DATA_DIR, 'db');
    fs.ensureDirSync(DB_DIR);

    const filename = options.filename || path.join(DB_DIR, `${name}.db`);
    super({
      filename,
      autoload: true,
      timestampData: true,
      onload: (err) => {
        if (err) {
          console.error(`failed to load disk database ${filename}`, err);
        }
      },
      ...options,
    });

    // @ts-ignore
    const compactInterval = typeof options.compactInterval === 'undefined' ? 60 * 60 * 1000 : +options.compactInterval;
    if (compactInterval > 0 && process.env.NODE_ENV !== 'test') {
      this.persistence.setAutoCompactionInterval(compactInterval, console.warn);
    }
  }

  async exists(query: FilterQuery<T>) {
    const doc = await this.findOne(query);
    return !!doc;
  }

  paginate({
    condition = {},
    sort = {},
    page = 1,
    size = 100,
    projection = {},
  }: {
    condition?: FilterQuery<T>;
    sort?: SortQuery<T>;
    page?: number;
    size?: number;
    projection?: ProjectionQuery<T>;
  }) {
    return this.cursor(condition)
      .sort(sort)
      .skip(Math.max(page * size - size, 0))
      .limit(Math.max(size, 1))
      .projection(projection)
      .exec();
  }
}

export { Database };
