/* eslint-disable function-paren-newline */
/* eslint-disable no-underscore-dangle */
/* eslint-disable consistent-return */
const logger = require('@abtnode/logger')('@abtnode/core:states:blocklet-extras');
const camelCase = require('lodash/camelCase');
const get = require('lodash/get');
const { CustomError } = require('@blocklet/error');
const security = require('@abtnode/util/lib/security');
const cloneDeep = require('@abtnode/util/lib/deep-clone');

const BaseState = require('./base');

const { mergeConfigs, parseConfigs, encryptConfigs } = require('../blocklet/extras');
const { validateAddMeta } = require('../validators/blocklet-extra');

// settings 中需要加密的字段路径
const SETTINGS_SECURE_FIELDS = ['notification.email.password'];

// 加密数据的前缀标记，用于识别数据是否已加密
const ENCRYPTED_PREFIX = 'ENC:';

const noop = (k) => (v) => v[k];

/**
 * @extends BaseState<import('@abtnode/models').BlockletExtraState>
 */
class BlockletExtrasState extends BaseState {
  constructor(...args) {
    super(...args);

    this.extras = [
      // environment
      {
        name: 'configs',
        beforeSet: mergeConfigs,
        afterGet: parseConfigs,
      },

      // setting
      {
        name: 'settings',
        beforeSet: ({ old, cur, did, dek }) => {
          const merged = { ...old, ...cur };
          Object.keys(merged).forEach((key) => {
            if (merged[key] === undefined || merged[key] === null) {
              delete merged[key];
            }
          });

          // 对敏感字段进行加密
          const enableSecurity = dek && did;
          if (enableSecurity) {
            SETTINGS_SECURE_FIELDS.forEach((fieldPath) => {
              const value = get(merged, fieldPath);
              // 只加密 cur 中传入的新值，避免重复加密已存储的旧值
              const newValue = get(cur, fieldPath);
              if (newValue !== undefined && value) {
                const keys = fieldPath.split('.');
                let target = merged;
                for (let i = 0; i < keys.length - 1; i++) {
                  target = target[keys[i]];
                }
                // 添加前缀标记，用于识别已加密的数据
                const encrypted = ENCRYPTED_PREFIX + security.encrypt(String(value), did, dek);
                target[keys[keys.length - 1]] = encrypted;
              }
            });
          }

          return merged;
        },
        afterGet: ({ data, did, dek }) => {
          if (!data) {
            return data;
          }

          // 对敏感字段进行解密
          const enableSecurity = dek && did;
          if (enableSecurity) {
            const result = cloneDeep(data);
            SETTINGS_SECURE_FIELDS.forEach((fieldPath) => {
              const value = get(result, fieldPath);
              // 只有带有加密前缀的数据才需要解密，未加密的历史数据保持原值
              if (value && typeof value === 'string' && value.startsWith(ENCRYPTED_PREFIX)) {
                try {
                  const keys = fieldPath.split('.');
                  let target = result;
                  for (let i = 0; i < keys.length - 1; i++) {
                    target = target[keys[i]];
                  }
                  // 去掉前缀后解密
                  const encryptedValue = value.slice(ENCRYPTED_PREFIX.length);
                  target[keys[keys.length - 1]] = security.decrypt(encryptedValue, did, dek);
                } catch {
                  // 解密失败，保持原值（去掉前缀）
                  logger.warn('Failed to decrypt settings field', { fieldPath });
                }
              }
            });
            return result;
          }

          return data;
        },
      },
    ];

    this.childExtras = this.extras.filter((x) => ['configs'].includes(x.name));

    this.generateExtraFns();
  }

  /**
   * @description
   * @param {string} did
   * @return {Promise<number>}
   * @memberof BlockletExtrasState
   */
  delete(did) {
    return this.remove({ did });
  }

  generateExtraFns() {
    const methods = ['get', 'set', 'del', 'list'];
    methods.forEach((method) => {
      this.extras.forEach((extra) => {
        const fn = camelCase(`${method} ${extra.name}`); // getConfigs, getRules
        this[fn] = this.generateFn(method, extra);
      });
    });
  }

  // generate functions

  generateFn(method, extra) {
    if (method === 'get') {
      return this.generateGetFn(extra);
    }

    if (method === 'set') {
      return this.generateSetFn(extra);
    }

    if (method === 'del') {
      return this.generateDelFn(extra);
    }

    if (method === 'list') {
      return this.generateListFn(extra);
    }
  }

  getExtraByDid(did, { selection = {} } = {}) {
    return this.findOne({ did }, selection);
  }

  /**
   * 从文档中提取指定字段的数据
   * @private
   */
  _extractFromDoc(doc, dids, extra) {
    // eslint-disable-next-line no-param-reassign
    dids = [].concat(dids);
    const [rootDid, ...childDids] = dids;
    const { dek } = this.config;
    const { name, afterGet = noop('data') } = extra;

    // 遍历 children 查找目标组件
    let item = doc;
    const didsToTraverse = [...childDids];
    while (item && didsToTraverse.length) {
      const did = didsToTraverse.shift();
      item = (item.children || []).find((x) => x.did === did);
    }

    return afterGet({ data: item ? item[name] : null, did: rootDid, dek });
  }

  generateGetFn(extra) {
    return async (dids, path, defaultValue) => {
      const [rootDid] = [].concat(dids);
      const doc = await this.findOne({ did: rootDid });
      const data = this._extractFromDoc(doc, dids, extra);
      if (!path) {
        return data;
      }
      return get(data, path, defaultValue);
    };
  }

  /**
   * 从已查询的文档中获取指定类型的数据，避免重复查询数据库
   * @param {object} doc - 已查询的 blockletExtras 文档
   * @param {string|string[]} dids - did 数组，第一个是 rootDid，后续是 childDids
   * @param {string} type - 数据类型，如 'configs' 或 'settings'
   * @returns {any} 对应类型的数据
   */
  getFromDoc({ doc = null, dids = [], name = '' }) {
    if (!doc || !name || !dids.length) {
      return null;
    }

    const extra = this.extras.find((x) => x.name === name);
    return this._extractFromDoc(doc, dids, extra);
  }

  // CAUTION: setConfig() 方法中非必要 **不要** 传入 [{ name: xxx }], 要传入 [{ key: xxx }]. 前者会导致某些配置被自动删掉
  generateSetFn(extra) {
    return async (dids, data) => {
      // eslint-disable-next-line no-param-reassign
      dids = [].concat(dids);
      const [rootDid, ...childDids] = dids;
      const { dek } = this.config;
      const { name, beforeSet = noop('cur') } = extra;
      const exist = await this.findOne({ did: rootDid });

      const item = exist || { did: rootDid };
      let component = item;
      while (childDids.length) {
        const did = childDids.shift();
        component.children = component.children || [];
        let child = component.children.find((x) => x.did === did);
        if (!child) {
          child = { did };
          component.children.push(child);
        }
        component = child;
      }

      const old = component[name];
      const newData = beforeSet({ old, cur: data, did: rootDid, dek });
      component[name] = newData;

      if (!exist) {
        await this.insert(item);
        logger.info('create extra success', { name, dids });
      } else {
        await this.updateByDid(item.did, item);
        logger.info('update extra success', { name, dids });
      }

      // re get data because should return decrypted secure value
      const getFn = this[camelCase(`get ${extra.name}`)].bind(this);
      return getFn(dids);
    };
  }

  generateDelFn(extra) {
    return async (dids) => {
      // eslint-disable-next-line no-param-reassign
      dids = [].concat(dids);
      const [rootDid, ...childDids] = dids;
      const { name } = extra;
      const item = await this.findOne({ did: rootDid });

      if (!item) {
        return null;
      }

      let component = item;
      while (component && childDids.length) {
        const did = childDids.shift();
        component = (component.children || []).find((x) => x.did === did);
      }

      if (!component) {
        return null;
      }

      const updated = component[name];
      component[name] = null;

      await this.updateByDid(item.did, item);

      return updated;
    };
  }

  generateListFn(extra) {
    return async () => {
      const { dek } = this.config;
      const { name, afterGet = noop('data') } = extra;
      const docs = await this.find({});
      const list = docs
        .filter((x) => x[name])
        .map((x) => ({
          did: x.did,
          [name]: afterGet({ data: x[name], did: x.did, dek }),
        }));
      return list;
    };
  }

  async addMeta({ did, meta, controller } = {}) {
    const entity = { did, meta };
    if (controller) {
      entity.controller = controller;
    }

    await validateAddMeta(entity);

    return super.upsert({ did }, { $set: entity });
  }

  getMeta(did) {
    return this.getExtraByDid(did, { selection: { did: 1, controller: 1, meta: 1 } });
  }

  async isLauncherSessionConsumed(sessionId) {
    const count = await super.count({ 'controller.sessionId': sessionId });
    return count > 0;
  }

  async isLauncherNftConsumed(nftId) {
    const count = await super.count({ 'controller.nftId': nftId });
    return count > 0;
  }

  encryptSecurityData({ data, _rootDid } = {}) {
    if (!data) {
      return data;
    }

    const { dek } = this.config;

    if (!dek) {
      return data;
    }

    const did = _rootDid || data.did;

    if (!did) {
      throw new CustomError(400, 'data.did does not exist');
    }

    encryptConfigs({ data: data.configs, did, dek });

    if (Array.isArray(data.children)) {
      for (const child of data.children) {
        this.encryptSecurityData({ data: child, _rootDid: did });
      }
    }

    return data;
  }

  updateByDid(did, updates) {
    return super.update({ did }, { $set: updates });
  }

  getWafDisabledBlocklets() {
    return super.find({ where: { 'settings.gateway.wafPolicy.enabled': false } }, { did: 1 });
  }

  async getNoIndexOverrides() {
    const docs = await super.find({}, { did: 1, configs: 1 });
    const overrides = {};
    for (const doc of docs) {
      const config = (doc.configs || []).find((c) => c.key === 'APP_NO_INDEX');
      if (config && config.value !== undefined && config.value !== '') {
        overrides[doc.did] = !['false', '0'].includes(String(config.value).toLowerCase());
      }
    }
    return overrides;
  }
}

module.exports = BlockletExtrasState;
