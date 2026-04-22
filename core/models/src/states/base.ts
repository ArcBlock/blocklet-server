import { EventEmitter } from 'events';
import { ModelDefined, OrderItem, QueryTypes } from 'sequelize';
import { MakeNullishOptional } from 'sequelize/types/utils';
import cloneDeep from 'lodash.clonedeep';
import { DBCache, getAbtNodeRedisAndSQLiteUrl } from '@abtnode/db-cache';
import { Joi } from '@arcblock/validator';

import { formatConditions, formatOrder, formatSelection, formatParams } from '../util';
import { AnyObject, SelectOptions, SortOptions, UpdateOptions, ConditionOptions, PagingOptions } from '../types';

// 验证分页参数
const pagingSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).default(20),
});

// eslint-disable-next-line import/prefer-default-export
export class BaseState<T extends object> extends EventEmitter {
  model: ModelDefined<T, T>;

  jsonAttributes: string[];

  config: AnyObject;

  ready: boolean;

  readyCallbacks: Function[];

  countCaches: DBCache;

  enableCountCache: string;

  cacheGroup: string;

  constructor(model: ModelDefined<T, T>, config: AnyObject = {}) {
    super();

    this.countCaches = new DBCache(() => ({
      prefix: 'base-models',
      ttl: 1000 * 60 * 2,
      ...getAbtNodeRedisAndSQLiteUrl(),
    }));
    this.enableCountCache = '';
    this.model = model;
    this.config = Object.freeze(cloneDeep(config));

    // Just used to minic ready callbacks of @abtnode/db
    this.ready = false;
    this.readyCallbacks = [];
    setImmediate(() => {
      this.ready = true;
      if (this.readyCallbacks.length) {
        this.readyCallbacks.forEach((x) => x());
      }
    });
  }

  clearCountCache = async () => {
    await this.countCaches.del(this.enableCountCache);
  };

  find(condition: ConditionOptions<T> = {}, selection: SelectOptions<T> = {}, sort: SortOptions<T> = {}): Promise<T[]> {
    const params = formatParams({
      attributes: formatSelection(selection),
      order: formatOrder(sort),
      ...formatConditions(condition),
      nest: true,
    });
    return this.model.findAll(params).then((x) => (params.raw ? x : x.map((y) => y.toJSON())) as T[]);
  }

  findOne(
    condition: ConditionOptions<T> = {},
    selection: SelectOptions<T> = {},
    sort: SortOptions<T> = {}
  ): Promise<T> {
    const params = formatParams({
      attributes: formatSelection(selection),
      order: formatOrder(sort),
      ...formatConditions(condition),
    });
    return this.model.findOne(params).then((x) => x?.toJSON());
  }

  count(condition: ConditionOptions<T> = {}): Promise<number> {
    const params = { ...formatConditions(condition) };
    if (!this.enableCountCache) {
      return this.model.count(params);
    }
    const key = this.enableCountCache ? JSON.stringify(params) : '';

    return this.countCaches.autoCacheGroup(this.enableCountCache, key, () => {
      return this.model.count(params);
    });
  }

  async insert(doc: any): Promise<T> {
    await this.clearCountCache();
    const newDoc = await this.model.create(doc, { returning: true });
    await newDoc.save();
    return newDoc.toJSON();
  }

  async insertMany(docs: any[]): Promise<T[]> {
    await this.clearCountCache();
    const newDocs = await this.model.bulkCreate(docs, { returning: true });
    return newDocs.map((x) => x.toJSON());
  }

  async update(
    condition: string | ConditionOptions<T>,
    updates: AnyObject,
    options: UpdateOptions = {}
  ): Promise<[number, T[]]> {
    if (arguments.length < 2) {
      throw new Error('condition and update param are required to update database record');
    }

    await this.clearCountCache();

    if (typeof condition === 'string') {
      return this.updateById(condition, updates, options);
    }

    let docs = [];
    if (options.returnBeforeUpdatedDocs) {
      docs = await this.find(condition);
    }

    const [affectedRows] = await this.model.update(updates.$set || updates, {
      where: formatConditions(condition).where,
    });
    if (options.returnUpdatedDocs && !options.returnBeforeUpdatedDocs) {
      docs = await this.find(condition);
    }

    return [affectedRows, docs];
  }

  updateById(id: string, updates: AnyObject, options: UpdateOptions = {}): Promise<[number, T[]]> {
    return this.update({ id }, updates, options);
  }

  async upsert(condition: ConditionOptions<T>, updates: AnyObject): Promise<T> {
    await this.clearCountCache();
    const [instance] = await this.model.upsert(Object.assign({}, condition, updates.$set || updates));
    return instance.toJSON();
  }

  async paginate(
    condition: ConditionOptions<T>,
    sort: OrderItem[] | SortOptions<T>,
    paging: PagingOptions,
    selection: SelectOptions<T> = {},
    options: {
      countInclude?: boolean;
      findParams?: AnyObject;
      noCount?: boolean;
    } = {}
  ) {
    const { error, value } = pagingSchema.validate(paging || {});
    if (error) {
      const { path, message } = error.details[0];
      const field = path.join('.');

      throw new Error(`Invalid paging parameter '${field}': ${message}. Page and pageSize must be positive integers.`);
    }

    const { pageSize: size, page } = value;

    const pageSize = Math.min(this.config.maxPageSize || 100, size);

    const params = formatParams({
      attributes: formatSelection(selection),
      order: Array.isArray(sort) ? sort : formatOrder(sort),
      limit: pageSize,
      offset: (page - 1) * pageSize,
      ...formatConditions(condition),
      nest: true,
    });

    const countParams = {
      distinct: true,
      where: params.where,
      include: options.countInclude ? (params.include ?? []) : [],
      replacements: condition?.replacements ?? {},
    };

    const [count, rows] = await Promise.all([
      options.noCount ? 0 : this.count(countParams),
      this.model.findAll(params),
    ]);

    return {
      list: rows.map((x) => x.toJSON()),
      paging: {
        total: count,
        pageSize,
        pageCount: Math.ceil(count / pageSize),
        page,
      },
    };
  }

  async remove(condition: ConditionOptions<T>) {
    await this.clearCountCache();
    return this.model.destroy(formatConditions(condition));
  }

  max(field: keyof T, condition: ConditionOptions<T> = {}) {
    return this.model.max(field, formatConditions(condition));
  }

  min(field: keyof T, condition: ConditionOptions<T> = {}) {
    return this.model.min(field, formatConditions(condition));
  }

  sum(field: keyof T, condition: ConditionOptions<T> = {}) {
    return this.model.sum(field, formatConditions(condition));
  }

  query(query: string) {
    return this.model.sequelize.query(query, { type: QueryTypes.SELECT });
  }

  async reset() {
    await this.clearCountCache();
    return this.model.destroy({ truncate: true });
  }

  build(row: MakeNullishOptional<T>) {
    return this.model.build(row);
  }

  loadDatabase(cb?: Function) {
    if (typeof cb === 'function') {
      setImmediate(() => cb());
    }
  }

  closeDatabase(cb: Function = () => {}) {
    // @ts-ignore
    this.model.sequelize.close().then(cb).catch(cb);
  }

  compactDatafile(cb?: Function) {
    if (typeof cb === 'function') {
      setImmediate(() => cb());
    }
  }

  onReady(cb: Function) {
    if (this.ready) {
      cb();
    } else {
      this.readyCallbacks.push(cb);
    }
  }

  static renameIdFiledName(docs: any) {
    return docs;
  }
}
