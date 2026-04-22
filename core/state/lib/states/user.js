const cloneDeep = require('@abtnode/util/lib/deep-clone');
const pickBy = require('lodash/pickBy');
const get = require('lodash/get');
const pick = require('lodash/pick');
const uniq = require('lodash/uniq');
const isEqual = require('lodash/isEqual');
const { isValid, toAddress } = require('@arcblock/did');
const { PASSPORT_STATUS, USER_MAX_INVITE_DEPTH, ROLES } = require('@abtnode/constant');
const { BaseState } = require('@abtnode/models');
const { Sequelize, Op } = require('sequelize');
const { updateConnectedAccount } = require('@abtnode/util/lib/user');
const { LOGIN_PROVIDER } = require('@blocklet/constant');
const { CustomError } = require('@blocklet/error');
const { Joi } = require('@arcblock/validator');
const logger = require('@abtnode/logger')('@abtnode/core:states:user');

const { validateOwner } = require('../util');
const { loginSchema, disconnectAccountSchema } = require('../validators/user');
const ExtendBase = require('./base');
const { isInDashboard, isUserPrivacyEnabled, isAdminUser } = require('../util/verify-user-private');
const { updateWebhookFailureState } = require('../util/webhook');

const isNullOrUndefined = (x) => x === undefined || x === null;

const checkUserFollowers = (model) => {
  if (!model) {
    throw new CustomError(400, 'User follow feature is not available in this environment');
  }
};

const QUERY_CONFIGS = {
  followers: {
    table: 'user_followers',
    selectField: 'userDid',
    whereField: 'userDid',
  },
  following: {
    table: 'user_followers',
    selectField: 'followerDid',
    whereField: 'followerDid',
  },
  invitees: {
    table: 'users',
    selectField: 'inviter',
    whereField: 'inviter',
    extraCondition: '"inviter" IS NOT NULL',
  },
};

/**
 * Auth0Account
 * @typedef {Object} OAuthAccount
 * @property {'auth0'|'google'|'github'|'apple'} provider
 * @property {string} id - id from oauth
 * @property {string} did - did for oauth account
 * @property {string} pk - pk for oauth account
 * @property {string} lastLoginAt - Last login time new Date().toISOString()
 * @property {string} firstLoginAt - First login time new Date().toISOString()
 */

/**
 * WalletAccount
 * @typedef {Object} WalletAccount
 * @property {'wallet'} provider
 * @property {string} did - did for wallet account
 * @property {string} pk - pk for wallet account
 * @property {string} lastLoginAt - Last login time new Date().toISOString()
 * @property {string} firstLoginAt - First login time new Date().toISOString()
 */

/**
 * NFTAccount
 * @typedef {Object} NFTAccount
 * @property {'nft'} provider
 * @property {string} did - did for nft account
 * @property {string} owner - owner for nft account
 * @property {string} lastLoginAt - Last login time new Date().toISOString()
 * @property {string} firstLoginAt - First login time new Date().toISOString()
 */

/**
 * ConnectedAccount
 * @typedef {(OAuthAccount|WalletAccount|NFTAccount)} ConnectedAccount
 */

/**
 * @extends ExtendBase<import('@abtnode/models').UserState>
 */
class User extends ExtendBase {
  constructor(model, config, models) {
    super(model, config);

    this.models = models;
    this.passport = new BaseState(models.Passport, config);
    this.connectedAccount = new BaseState(models.ConnectedAccount, config);
    this.userSession = new BaseState(models.UserSession, config);
    this.passportLog = new BaseState(models.PassportLog, config);
    if (models.UserFollowers) {
      this.userFollowers = new BaseState(models.UserFollowers, config);
    }
  }

  // FIXME: wrap these in a transaction
  async addUser(user) {
    if (!validateOwner(user)) {
      throw new CustomError(400, 'user is invalid');
    }

    const newUser = this._normalizeUser({
      ...user,
      ...(await this._extractInviteInfo(user)),
      sourceProvider: user.sourceProvider || LOGIN_PROVIDER.WALLET,
      approved: !!user.approved,
    });

    // create user
    await this.insert(newUser);

    // create passports and connectedAccounts
    await Promise.all((get(user, 'passports') || []).map((x) => this.passport.insert({ ...x, userDid: user.did })));
    await Promise.all(
      (get(user, 'connectedAccounts') || []).map((x) => {
        // FIXME: 这里在修复完 https://github.com/blocklet/tweet-token/issues/131 之后需要去除特殊处理的逻辑
        const mergeData = { ...x, userDid: user.did };
        if (mergeData.id === null && mergeData.provider === LOGIN_PROVIDER.AUTH0) {
          mergeData.provider = LOGIN_PROVIDER.WALLET;
        }
        return this.connectedAccount.insert(mergeData);
      })
    );

    return this.getUser(user.did);
  }

  // FIXME: wrap these in a transaction
  async updateUser(did, updates) {
    const exist = await super.findOne({ did });
    if (!exist) {
      throw new CustomError(404, `user does not exist: ${did}`);
    }

    // Allow to update inviter only when inviter is not set
    const cloneData = cloneDeep(updates);
    if (exist.sourceProvider === LOGIN_PROVIDER.EMAIL) {
      // HACK: 当用户是通过邮箱注册账户时，不允许更新邮箱
      delete cloneData.email;
    }
    const pending = this._normalizeUser(cloneData);
    if (exist.inviter) {
      delete pending.inviter;
    } else {
      Object.assign(pending, await this._extractInviteInfo({ did, ...pending }));
    }

    await super.update({ did }, { $set: pending });
    await Promise.all(
      (get(cloneData, 'passports') || [])
        .filter((x) => x.id)
        .map(({ id, ...x }) => {
          // HACK: 原来是直接使用 upsert 方法，但会出现 validation error，暂时先改成有查询到旧的值，使用 update 方法
          return this.passport
            .findOne({ id })
            .then((passport) => {
              if (passport) {
                return this.passport.update({ id }, { ...x, userDid: did });
              }
              return this.passport.upsert({ id }, { ...x, userDid: did });
            })
            .catch((err) => {
              console.error(`Failed to process passport ${id}:`, err);
              throw err;
            });
        })
    );
    await Promise.all(
      (get(cloneData, 'connectedAccounts') || [])
        .filter((x) => x.did)
        .map((x) => {
          // FIXME: 这里在修复完 https://github.com/blocklet/tweet-token/issues/131 之后需要去除特殊处理的逻辑
          const mergeData = { ...x, userDid: did };
          if (mergeData.id === null && mergeData.provider === LOGIN_PROVIDER.AUTH0) {
            mergeData.provider = LOGIN_PROVIDER.WALLET;
          }
          return this.connectedAccount.upsert({ did: x.did }, mergeData);
        })
    );

    return this.getUser(did);
  }

  revokePassportById({ did, id }) {
    return this._setPassportStatusById({ did, id, status: PASSPORT_STATUS.REVOKED });
  }

  revokePassportByUserDid({ did }) {
    return this._setPassportStatusById({ did, status: PASSPORT_STATUS.REVOKED });
  }

  enablePassportById({ did, id }) {
    return this._setPassportStatusById({ did, id, status: PASSPORT_STATUS.VALID });
  }

  async removePassportById({ id }) {
    const num = await this.passport.remove({ id });
    if (num === 0) {
      throw new CustomError(404, `passport does not exist: ${id}`);
    }

    return num;
  }

  /**
   * remove a user by user's did
   * @param {object} params
   * @param {string} params.did - the did of user
   */
  async remove({ did }) {
    if (process.env.NODE_ENV !== 'test') {
      const passportIds = (await this.passport.find({ userDid: did })).map((x) => x.id);

      if (passportIds.length) {
        await this.passportLog.remove({ passportId: passportIds });
      }

      await Promise.allSettled([
        this.passport.remove({ userDid: did }),
        this.connectedAccount.remove({ userDid: did }),
        this.userSession.remove({ userDid: did }),
      ]);
    }

    const num = await super.remove({ did });
    if (num === 0) {
      throw new CustomError(404, `user does not exist: ${did}`);
    }

    return num;
  }

  /**
   * enable/disable user login
   * @param {object} params
   * @param {string} params.did user's did
   * @param {boolean} params.approved enable/disable user login
   */
  async updateApproved({ did, approved }) {
    const [num, [doc]] = await super.update({ did }, { $set: { approved } });
    if (num === 0) {
      throw new CustomError(404, `user does not exist: ${did}`);
    }

    return doc;
  }

  /**
   * update user's role
   * @param {object} params
   * @param {string} params.did user's did
   * @param {string} params.role user's role
   */
  async updateRole({ did, role }) {
    const [num, [doc]] = await super.update({ did }, { $set: { role } });
    if (num === 0) {
      throw new CustomError(404, `user does not exist: ${did}`);
    }

    return doc;
  }

  /**
   * Get blocklet service user list
   */
  async getUsers({ query, sort, paging } = {}, context = {}) {
    const where = {};
    const replacements = {};

    const {
      approved,
      role,
      search,
      tags,
      invitee,
      inviter,
      generation, // 0 - unlimited, 1 - invited by inviter, 2 - invited by another
      includeTags = false,
      includePassports = false,
      includeConnectedAccounts = false,
      includeFollowStatus = false,
      createdByAppPid,
    } = query || {};

    const { user } = context || {};

    const shouldIncludeTag = (tags && tags.length) || includeTags;

    if (isNullOrUndefined(approved) === false) {
      where.approved = approved;
    }

    if (createdByAppPid) {
      where.createdByAppPid = createdByAppPid;
    }

    if (search) {
      if (search.length > 50) {
        throw new CustomError(400, 'the length of search text should not more than 50');
      }
      if (isValid(search)) {
        where.did = toAddress(search);
      } else {
        const likeOp = this.model.sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
        where[Op.or] = [{ fullName: { [likeOp]: `%${search}%` } }, { email: { [Op.like]: `%${search}%` } }];
      }
    }

    if (inviter && invitee) {
      throw new CustomError(400, 'You can not query by inviter and invitee at the same time');
    }

    let total = 0;
    if (!where.did) {
      // handle descendant query
      if (inviter) {
        if (isValid(inviter) === false) {
          throw new CustomError(400, 'inviter did invalid');
        }
        const exist = await this.model.findByPk(toAddress(inviter), { attributes: ['did', 'generation'] });
        if (!exist) {
          throw new CustomError(404, `inviter not found: ${inviter}`);
        }
        if (!isValid(exist.did)) {
          throw new CustomError(400, 'inviter exist did invalid');
        }

        try {
          const { pageSize: size = 20, page = 1 } = paging || {};
          const pageSize = Math.min(100, size);
          const offset = (page - 1) * pageSize;
          //   LIMIT ${pageSize} OFFSET ${offset}
          const subQuery = `
WITH RECURSIVE UserTree(did,inviter,generation,createdAt) AS (
  SELECT did,inviter,generation,"createdAt" FROM users WHERE inviter='${exist.did}'
  UNION ALL
	SELECT child.did,child.inviter,child.generation,child."createdAt" FROM users AS child INNER JOIN UserTree AS parent ON (child.inviter=parent.did) ORDER BY child."createdAt" DESC
)
SELECT did,inviter,generation FROM UserTree ${generation > 0 ? `WHERE generation=${(exist.generation > 0 ? exist.generation : 0) + generation}` : ''}`.trim();
          const children = await this.query(subQuery);
          total = children.length;
          where.did = children.slice(offset, offset + pageSize).map((x) => x.did);
        } catch (err) {
          console.error('Failed to get descendants', err);
          where.did = [];
        }
      }

      // handle ancestor query
      if (invitee) {
        if (isValid(invitee) === false) {
          throw new CustomError(400, 'invitee did invalid');
        }
        const exist = await this.model.findByPk(toAddress(invitee), { attributes: ['did', 'generation'] });
        if (!exist) {
          throw new CustomError(404, `invitee not found: ${invitee}`);
        }

        if (!isValid(exist.did)) {
          throw new CustomError(400, 'invitee exist did invalid');
        }

        try {
          const subQuery = `
WITH RECURSIVE UserTree(did,inviter,generation) AS (
  SELECT did,inviter,generation FROM users WHERE did='${exist.did}'
  UNION ALL
	SELECT
    inviter,
    (SELECT inviter FROM users AS parent WHERE parent.did=child.inviter),
    (SELECT generation FROM users AS parent WHERE parent.did=child.inviter)
    FROM UserTree AS child
    WHERE inviter IS NOT NULL
)
SELECT did,inviter,generation FROM UserTree`.trim();
          const children = await this.query(subQuery);
          where.did = children.map((x) => x.did).filter((x) => x !== exist.did);
        } catch (err) {
          console.error('Failed to get ancestors', err);
          where.did = [];
        }
      }

      // handle role/status query
      if (role && role !== '$all') {
        replacements.status = PASSPORT_STATUS.VALID;
        if (role === '$none') {
          where.did = {
            [Op.notIn]: Sequelize.literal('(SELECT DISTINCT "userDid" FROM passports WHERE status = :status)'),
          };
        } else if (role === '$blocked') {
          where.approved = false;
        } else {
          replacements.role = role;
          where.did = {
            [Op.in]: Sequelize.literal(
              '(SELECT DISTINCT "userDid" FROM passports WHERE name = :role AND status = :status)'
            ),
          };
        }
      }
    }

    // 未精确指定 did 时，允许 did 的模糊搜索
    if (!where.did && search) {
      where[Op.or].push({ did: { [Op.like]: `%${toAddress(search)}%` } });
    }

    const include = [];
    if (shouldIncludeTag) {
      include.push(this.getTagInclude(tags));
    }
    if (includePassports) {
      include.push({
        model: this.models.Passport,
        as: 'passports',
      });
    }
    if (includeConnectedAccounts) {
      include.push(this.getConnectedInclude());
    }

    const dialect = this.model.sequelize.getDialect();
    const isPostgres = dialect === 'postgres';

    const sorting = [];
    const cleanedSort = pickBy(sort, (x) => !isNullOrUndefined(x));
    if (cleanedSort.lastLoginAt) {
      const direction = cleanedSort.lastLoginAt === -1 ? 'DESC' : 'ASC';
      if (isPostgres) {
        sorting.push(Sequelize.literal(`"lastLoginAt" ${direction} NULLS LAST`));
      } else {
        sorting.push(['lastLoginAt', direction]); // SQLite 等不支持 NULLS LAST 语法，DESC 默认就是 NULLS LAST
      }
    } else if (Object.keys(cleanedSort).length) {
      for (const [key, dir] of Object.entries(cleanedSort)) {
        if (key !== 'lastLoginAt') {
          sorting.push([key, dir === -1 ? 'DESC' : 'ASC']);
        }
      }
    } else {
      sorting.push(['createdAt', 'DESC']);
    }

    const result = await this.paginate({ where, include, replacements }, sorting, paging, undefined, {
      countInclude: true,
    });

    if (includeFollowStatus && user?.did) {
      result.list = await this._enrichWithFollowStatus(result.list, user.did);
    }

    return { list: result.list, paging: { ...result.paging, total: total || result.paging.total } };
  }

  // eslint-disable-next-line require-await
  async getUsersByDids({ dids, query, paging }, context = {}) {
    const {
      approved,
      includeTags = false,
      includePassports = false,
      includeConnectedAccounts = false,
      includeFollowStatus = false,
      selection = {},
      createdByAppPid,
    } = query || {};

    const { user } = context || {};

    // 如果 dids 包含 *，则查询全部
    const condition = dids.includes('*') ? {} : { did: dids };
    if (isNullOrUndefined(approved) === false) {
      condition.approved = !!approved;
    }
    if (createdByAppPid) {
      condition.createdByAppPid = createdByAppPid;
    }
    const include = [];
    if (includeTags) {
      include.push(this.getTagInclude());
    }
    if (includePassports) {
      include.push({
        model: this.models.Passport,
        as: 'passports',
      });
    }
    if (includeConnectedAccounts) {
      include.push(this.getConnectedInclude());
    }

    // 如果提供了分页参数，使用分页查询
    if (paging) {
      const sorting = [['createdAt', 'DESC']];
      selection.createdAt = 1;
      const result = await this.paginate({ where: condition, include }, sorting, paging, selection);

      if (includeFollowStatus && user?.did) {
        result.list = await this._enrichWithFollowStatus(result.list, user.did, dids);
      }

      return result;
    }

    // 否则返回所有结果
    let result = await this.find({ where: condition, include }, selection);

    if (includeFollowStatus && user?.did) {
      result = await this._enrichWithFollowStatus(result, user.did, dids);
    }

    return result;
  }

  // eslint-disable-next-line require-await
  async countByPassport({ name, status = PASSPORT_STATUS.VALID }) {
    if (name === '$none') {
      return this.count({
        where: {
          did: {
            [Op.notIn]: Sequelize.literal('(SELECT DISTINCT "userDid" FROM passports WHERE status = :status)'),
          },
        },
        replacements: { status: PASSPORT_STATUS.VALID },
      });
    }

    if (name === '$all') {
      return this.count({});
    }

    if (name === '$blocked') {
      return this.count({ approved: false });
    }

    return this.count({
      distinct: true,
      col: 'did',
      where: {
        did: {
          [Op.in]: Sequelize.literal(
            '(SELECT DISTINCT "userDid" FROM passports WHERE name = :name AND status = :status)'
          ),
        },
      },
      replacements: { name, status },
    });
  }

  async getOwnerDids() {
    const result = await this.passport.query(
      `SELECT DISTINCT "userDid", "issuanceDate" FROM passports WHERE name='${ROLES.OWNER}' AND status = '${PASSPORT_STATUS.VALID}' ORDER BY "issuanceDate" ASC LIMIT 1`
    );
    return result.map((x) => x.userDid);
  }

  /**
   * get user by did or name
   * @param {string} did user's did
   */
  async getUser(
    did,
    {
      name,
      enableConnectedAccount = false,
      includeTags = false,
      includePassports = true,
      includeConnectedAccounts = true,
      selection = {},
    } = {}
  ) {
    const where = {};
    if (did) {
      where.did = did;
    } else if (name) {
      where.name = name;
    }
    let user = await this.findOne({ where, include: includeTags ? [this.getTagInclude()] : [] }, selection);

    // search in connected accounts
    if (!user && enableConnectedAccount) {
      // connectedAccounts don't have name field, so we can only search by did
      const connectedAccount = await this.connectedAccount.findOne({ did });
      if (connectedAccount) {
        user = await this.findOne({ did: connectedAccount.userDid }, selection);
      }
    }

    if (user) {
      if (includeConnectedAccounts && includePassports) {
        const [connectedAccounts, passports] = await Promise.all([
          this.connectedAccount.find({ userDid: user.did }),
          this.passport.find({ userDid: user.did }),
        ]);
        user.connectedAccounts = connectedAccounts;
        user.passports = passports;
      } else if (includeConnectedAccounts) {
        user.connectedAccounts = await this.connectedAccount.find({ userDid: user.did });
      } else if (includePassports) {
        user.passports = await this.passport.find({ userDid: user.did });
      }
    }

    return user;
  }

  /**
   * @param {object} params
   * @param {string} params.did user did
   * @param {string} params.id passport id
   * @param {string} params.status passport status
   */
  async _setPassportStatusById({ did, id = '', status }) {
    if (id) {
      const exist = this.passport.count({ id });
      if (!exist) {
        throw new CustomError(404, `cannot find passport by id ${id}`);
      }
    }

    const [num] = await this.passport.update(id ? { id } : { userDid: did }, { $set: { status } });
    if (id && num === 0) {
      throw new CustomError(404, 'user passport does not exist');
    }

    return this.getUser(did);
  }

  /**
   * 用户登录
   * @param {Object} user
   * @param {string} user.did
   * @param {string} user.pk
   * @param {ConnectedAccount} user.connectedAccount
   * @param {string} user.fullName - user profile's name
   * @param {string} user.avatar - url of user's avatar, eg: bn://avatar/7f8848569405f8cdf8b1b2788ebf7d0f.jpg
   * @param {string} user.locale - locale
   * @param {string} user.inviter - inviter
   * @param {Object} [user.extra] - extra data of user
   * @param {string} user.lastLoginIp - lastLoginIp
   * @param {('owner'|'admin'|'member'|'guest'|string)} user.role - deprecated user's role
   */
  async loginUser(raw) {
    const { error, value: user } = loginSchema.validate(raw);
    if (error) {
      console.error(error);
      throw new CustomError(400, error.message);
    }

    let updated;

    const now = new Date().toISOString();
    const exist = await this.getUser(user.did, { enableConnectedAccount: true });

    const updates = {
      ...pick(user, [
        'fullName',
        'email',
        'phone',
        'avatar',
        'url',
        'role',
        'locale',
        'extra',
        'lastLoginIp',
        'remark',
        'inviter',
        'generation',
        'emailVerified',
        'phoneVerified',
        'sourceAppPid',
      ]),
      lastLoginAt: now,
      passports: user.passport ? [{ ...user.passport, lastLoginAt: now }] : [],
    };

    // HACK: joi 会把 null 值过滤掉，暂时手动判断 null 值
    if (raw.sourceAppPid === null) {
      updates.sourceAppPid = null;
    }

    Object.assign(updates, await this._extractInviteInfo(raw));

    if (exist) {
      // immutable fields
      delete updates.locale;
      // NOTICE: 开放允许修改 sourceAppPid 字段，来进行旧数据的修正
      // delete updates.sourceAppPid;
      delete updates.inviter;
      delete updates.generation;

      // update user, connectedAccount, passport
      updates.connectedAccounts = updateConnectedAccount(exist.connectedAccounts, user.connectedAccount);
      updated = await this.updateUser(exist.did, updates);
    } else {
      // create user, connectedAccount, passport
      updates.did = user.did;
      updates.pk = user.pk;
      updates.firstLoginAt = now;
      updates.approved = true;
      updates.connectedAccounts = updateConnectedAccount([], user.connectedAccount);
      updates.sourceProvider = updates.connectedAccounts[0].provider;
      // only set createdByAppPid when create user
      updates.createdByAppPid = raw.createdByAppPid;
      updated = await this.addUser(updates);
    }

    return { ...updated, _action: exist ? 'update' : 'add' };
  }

  async _extractInviteInfo(raw) {
    const info = {};

    if (raw.inviter) {
      // sybil-attack
      if (isValid(raw.inviter)) {
        const inviterId = toAddress(raw.inviter);
        const inviter = await this.model.findByPk(inviterId, { attributes: ['did', 'generation'] });
        if (inviter) {
          // circle preventing
          const { list: ancestors } = await this.getUsers({ query: { invitee: inviterId } });
          const hasCircle = ancestors.some((x) => x.did === raw.did);
          if (hasCircle) {
            logger.warn('Set inviter result in cycle is not allowed', raw);
            info.inviter = null;
          } else {
            info.inviter = inviterId;
            info.generation = inviter.generation + 1;
          }
        } else {
          logger.warn('Set inviter to non-exist user is not allowed', raw);
        }
      } else {
        logger.warn('Set inviter to invalid did is not allowed', raw);
        info.inviter = null;
      }

      // anti-land-attack
      if (info.inviter === raw.did) {
        logger.warn('Set inviter to self is not allowed', raw);
        info.inviter = null;
      }
    }
    if (!info.inviter) {
      info.generation = 0;
    }
    if (info.generation > USER_MAX_INVITE_DEPTH) {
      throw new CustomError(400, 'You have exceeded max user invite chain length');
    }

    return info;
  }

  async disconnectUserAccount(raw) {
    const { error, value: connectedAccount } = disconnectAccountSchema.validate(raw);
    if (error) {
      throw new CustomError(400, error);
    }
    const result = await this.connectedAccount.remove(connectedAccount);
    return result;
  }

  // eslint-disable-next-line require-await
  async getUserByDid(did, attributes = []) {
    const defaultAttribute = {
      did: 1,
      pk: 1,
      fullName: 1,
      email: 1,
      role: 1,
      approved: 1,
      inviter: 1,
      generation: 1,
      emailVerified: 1,
      phoneVerified: 1,
    };
    const selectAttributes = attributes.length
      ? attributes.reduce((acc, attr) => ({ ...acc, [attr]: 1 }), {})
      : defaultAttribute;
    return this.findOne({ did }, selectAttributes);
  }

  async isUserValid(did) {
    const count = await super.count({ did, approved: true });
    return count > 0;
  }

  async isConnectedAccount(did) {
    const count = await this.connectedAccount.count({ did });
    return count > 0;
  }

  async isPassportValid(passportId) {
    const count = await this.passport.count({ id: passportId, status: PASSPORT_STATUS.VALID });
    return count > 0;
  }

  async updateTags(did, tags) {
    const user = await this.getUserByDid(did);
    if (user) {
      const instance = this.build(user);
      await instance.setTags(uniq(tags));
      return this.getUser(did, { includeTags: true });
    }

    return null;
  }

  getTagInclude(tags = []) {
    const result = {
      model: this.models.Tag,
      as: 'tags',
      through: {
        attributes: [],
      },
    };

    if (tags.length) {
      result.where = { id: { [Op.in]: tags.filter(Boolean) } };
    }

    return result;
  }

  getConnectedInclude() {
    return {
      model: this.models.ConnectedAccount,
      as: 'connectedAccounts',
      required: false,
    };
  }

  getConnectedAccount(id) {
    return this.connectedAccount.findOne({ $or: [{ did: id }, { id }] });
  }

  async getPassportById(passportId) {
    const passport = await this.passport.findOne({ id: passportId });
    return passport;
  }

  async isEmailUsed(email, verified = false, sourceProvider = '') {
    const condition = this._normalizeUser({ email });
    if (verified) {
      condition.emailVerified = true;
    }
    if (Object.values(LOGIN_PROVIDER).includes(sourceProvider)) {
      condition.sourceProvider = sourceProvider;
    }
    const doc = await this.findOne(condition);
    return email && !!doc;
  }

  async isPhoneUsed(phone, verified = false) {
    const condition = this._normalizeUser({ phone });
    if (verified) {
      condition.phoneVerified = true;
    }
    const doc = await this.findOne(condition);
    return phone && !!doc;
  }

  async isSubjectIssued(userDid, subject, status = PASSPORT_STATUS.VALID) {
    const passport = await this.passport.findOne({ userDid, name: String(subject).trim().toLowerCase(), status });
    return !!passport;
  }

  _normalizeUser(user) {
    if (user.email) {
      user.email = String(user.email).trim().toLowerCase();
    }
    if (user.phone) {
      user.phone = String(user.phone).trim().toLowerCase().replace(/\s+/g, '').replace(/[()-]/g, '');
    }
    if (user.metadata?.phone?.phoneNumber) {
      user.metadata.phone.phoneNumber = String(user.metadata.phone.phoneNumber)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[()-]/g, '');
    }
    return user;
  }

  /**
   * 查询一个 Role 下的所有用户
   * @returns
   */
  async getUsersByRoles({ roles = [], includeConnectedAccounts = false, selection = {} }) {
    if (!roles.length) {
      return [];
    }
    const replacements = {
      status: PASSPORT_STATUS.VALID,
      roles,
    };
    const condition = {
      approved: true,
      did: {
        [Op.in]: Sequelize.literal(
          '(SELECT DISTINCT "userDid" FROM passports WHERE name IN (:roles) AND status = :status)'
        ),
      },
    };
    const include = [];
    if (includeConnectedAccounts) {
      include.push(this.getConnectedInclude());
    }
    const result = await this.find({ where: condition, replacements, include }, selection);
    return result;
  }

  /**
   * 验证用户是否存在
   * @private
   */
  async _validateUsersExist(dids) {
    // 验证 did 是否合法
    dids.forEach((did) => {
      const { error } = Joi.DID().validate(did);
      if (error) {
        throw new CustomError(400, JSON.stringify({ code: 'INVALID_USER', message: `Invalid did: ${did}` }));
      }
    });

    const users = await Promise.all(dids.map((did) => this.getUserByDid(did)));
    dids.forEach((did, index) => {
      if (!users[index]) {
        throw new CustomError(400, JSON.stringify({ code: 'USER_NOT_FOUND', message: `User does not exist: ${did}` }));
      }
    });
  }

  /**
   * 为用户列表添加关注状态
   * @private
   * @param {Array} users - 用户列表
   * @param {string} currentUserDid - 当前用户的 DID
   * @param {Array} userDids - 用户DID列表，如果未提供则从 users 中提取
   * @returns {Promise<Array>} - 添加了 isFollowing 字段的用户列表
   */
  async _enrichWithFollowStatus(users, currentUserDid, userDids = null) {
    if (!currentUserDid || !users || users.length === 0) {
      return users;
    }

    const targetDids = userDids || users.map((item) => item.did);
    const followerMap = await this.isFollowing(currentUserDid, targetDids);

    return users.map((item) => ({
      ...item,
      isFollowing: followerMap[item.did],
    }));
  }

  /**
   * 关注用户
   * @param {string} followerDid - 关注者的 DID
   * @param {string} userDid - 被关注用户的 DID
   */
  async followUser(followerDid, userDid) {
    checkUserFollowers(this.userFollowers);

    if (followerDid === userDid) {
      throw new CustomError(400, JSON.stringify({ code: 'SELF_FOLLOW', message: 'Cannot follow yourself' }));
    }

    // 检查两个用户是否存在 + 检查是否已经关注（并行执行）
    const [, existingFollow] = await Promise.all([
      this._validateUsersExist([followerDid, userDid]),
      this.userFollowers.findOne({ userDid, followerDid }),
    ]);

    if (existingFollow) {
      throw new CustomError(400, JSON.stringify({ code: 'ALREADY_FOLLOWING', message: 'Already following this user' }));
    }

    // 创建关注关系
    return this.userFollowers.insert({
      userDid,
      followerDid,
    });
  }

  /**
   * 取消关注用户
   * @param {string} followerDid - 关注者的 DID
   * @param {string} userDid - 被关注用户的 DID
   */
  unfollowUser(followerDid, userDid) {
    checkUserFollowers(this.userFollowers);

    // 删除关注关系
    return this.userFollowers.remove({
      userDid,
      followerDid,
    });
  }

  /**
   * 通用的关注关系查询函数
   * @param {string} targetDid - 目标用户DID
   * @param {string} type - 查询类型 'followers' 或 'following'
   * @param {object} options - 选项
   * @param {object} options.paging - 分页参数
   * @param {object} options.sort - 排序参数
   * @param {boolean} options.includeUserInfo - 是否包含用户详细信息，默认true
   * @param {boolean} options.includeFollowStatus - 是否包含当前用户的关注状态，默认 true
   * @param {object} context - 上下文，包含当前用户信息
   * @private
   */
  async _getFollowRelations(
    targetDid,
    type,
    { paging, sort, includeUserInfo = true, includeFollowStatus = true } = {},
    context = {}
  ) {
    checkUserFollowers(this.userFollowers);

    const { user: contextUser } = context;

    const contextUserDid = contextUser?.userInfo?.did || contextUser?.did;

    await this._validateUsersExist([targetDid]);

    const isFollowers = type === 'followers';
    const where = isFollowers ? { userDid: targetDid } : { followerDid: targetDid };

    const order = sort?.createdAt === -1 ? 'DESC' : 'ASC';
    const sorting = [['createdAt', sort?.createdAt ? order : 'DESC']];
    const result = await this.userFollowers.paginate({ where }, sorting, paging);

    // 准备用户信息映射
    let userMap = new Map();
    if (includeUserInfo && this.models.User) {
      const userDids = [...new Set(result.list.map((follow) => (isFollowers ? follow.followerDid : follow.userDid)))];
      const users = await this.find({
        where: { did: { [Op.in]: userDids } },
        attributes: ['did', 'fullName', 'avatar'],
      });
      userMap = new Map(users.map((user) => [user.did, user]));
    }

    // 准备关注状态映射
    let followingStatusMap = {};
    if (includeFollowStatus && contextUserDid) {
      if (contextUserDid !== targetDid) {
        // 查询当前用户对列表中所有用户的关注状态
        const targetUserDids = result.list.map((follow) => (isFollowers ? follow.followerDid : follow.userDid));
        followingStatusMap = await this.isFollowing(contextUser.did, targetUserDids);
      } else if (isFollowers && targetDid) {
        // 查询目标用户对所有粉丝的关注状态
        const followerDids = result.list.map((follow) => follow.followerDid);
        followingStatusMap = await this.isFollowing(targetDid, followerDids);
      }
    }

    // 构建增强的列表
    const enrichedList = result.list.map((follow) => {
      const userDid = isFollowers ? follow.followerDid : follow.userDid;
      const enrichedFollow = { ...follow };

      // 添加用户信息
      if (includeUserInfo && userMap.size > 0) {
        const user = userMap.get(userDid);
        enrichedFollow.user = user ? { ...user } : null;
      }

      // 添加关注状态
      if (includeFollowStatus && contextUserDid) {
        if (contextUserDid !== targetDid) {
          // 如果查看的是别人的关注列表，需要添加是否已关注的信息
          enrichedFollow.isFollowing = followingStatusMap[userDid] || false;
        } else if (isFollowers) {
          // 如果是查询粉丝，需要添加是否已关注的信息
          enrichedFollow.isFollowing = followingStatusMap[follow.followerDid] || false;
        } else {
          // 查看自己的关注列表，默认都是已关注状态
          enrichedFollow.isFollowing = true;
        }
      }

      return enrichedFollow;
    });

    result.list = enrichedList;

    // 如果不需要用户信息且不需要关注状态，只返回用户DID
    if (!includeUserInfo && !includeFollowStatus) {
      result.list = result.list.map((follow) => (isFollowers ? follow.followerDid : follow.userDid));
    }

    return result;
  }

  /**
   * 获取用户的粉丝列表（谁关注了这个用户）
   */
  getFollowers(userDid, options = {}, context = {}) {
    return this._getFollowRelations(userDid, 'followers', options, context);
  }

  /**
   * 获取用户关注的人列表（这个用户关注了谁）
   */
  getFollowing(followerDid, options = {}, context = {}) {
    return this._getFollowRelations(followerDid, 'following', options, context);
  }

  /**
   * 批量检查用户A是否关注了多个用户
   * @param {string} followerDid - 关注者的 DID
   * @param {string[]} userDids - 被关注用户的 DID 数组
   * @returns {Promise<{[userDid: string]: boolean}>} - 返回一个对象，键为用户DID，值为是否关注的布尔值
   */
  async isFollowing(followerDid, userDids) {
    if (!this.userFollowers || !followerDid || !Array.isArray(userDids) || userDids.length === 0) {
      return userDids.reduce((acc, userDid) => ({ ...acc, [userDid]: false }), {});
    }

    try {
      // 一次性查询所有关注关系
      const follows = await this.userFollowers.find({
        followerDid,
        userDid: { [Op.in]: userDids },
      });
      // 构建已关注用户的 Set，提高查找效率
      const followingSet = new Set(follows.map((follow) => follow.userDid));

      // 构建结果对象
      const result = {};
      userDids.forEach((userDid) => {
        result[userDid] = followingSet.has(userDid);
      });

      return result;
    } catch (error) {
      logger.error('Failed to check multiple following status:', error);
      // 出错时返回全部为 false 的结果
      return userDids.reduce((acc, userDid) => ({ ...acc, [userDid]: false }), {});
    }
  }

  /**
   * 通用的计数查询方法
   * @param {Object} config - 查询配置
   * @param {string} config.table - 表名
   * @param {string} config.selectField - 选择的字段名
   * @param {string} config.whereField - WHERE 条件字段名
   * @param {string} [config.extraCondition] - 额外的 WHERE 条件
   * @param {Array} userDids - 用户 DID 数组
   * @returns {Promise} 查询结果
   */
  getCountByQuery(config, userDids) {
    const { table, selectField, whereField, extraCondition = '' } = config;
    const whereClause = extraCondition
      ? `"${whereField}" IN (:userDids) AND ${extraCondition}`
      : `"${whereField}" IN (:userDids)`;

    const query = `
      SELECT "${selectField}", COUNT(*) as count
      FROM ${table}
      WHERE ${whereClause}
      GROUP BY "${selectField}"
    `;

    return this.model.sequelize.query(query, {
      replacements: { userDids },
      type: Sequelize.QueryTypes.SELECT,
    });
  }

  /**
   * 根据 options 配置构建用户统计对象
   * @param {Object} options - 配置选项
   * @param {boolean} options.includeFollowers - 是否启用粉丝统计
   * @param {boolean} options.includeFollowing - 是否启用关注统计
   * @param {boolean} options.includeInvitees - 是否启用邀请统计
   * @param {Object} [dataMaps] - 数据映射对象
   * @param {Map} [dataMaps.followersMap] - 粉丝数据映射
   * @param {Map} [dataMaps.followingMap] - 关注数据映射
   * @param {Map} [dataMaps.inviteesMap] - 邀请数据映射
   * @param {string} userDid - 用户 DID
   * @returns {Object} 用户统计对象
   */
  buildUserStats(options, dataMaps = {}, userDid) {
    const { includeFollowers = true, includeFollowing = true, includeInvitees = false } = options || {};

    const { followersMap, followingMap, inviteesMap } = dataMaps;

    const userStats = {};

    if (includeFollowers) {
      userStats.followers = followersMap ? followersMap.get(userDid) || 0 : 0;
    }

    if (includeFollowing) {
      userStats.following = followingMap ? followingMap.get(userDid) || 0 : 0;
    }

    if (includeInvitees) {
      userStats.invitees = inviteesMap ? inviteesMap.get(userDid) || 0 : 0;
    }

    return userStats;
  }

  /**
   * 批量获取多个用户的关注统计信息
   * @param {string[]} userDids - 用户的 DID 数组
   * @returns {Promise<{[userDid: string]: {followers: number, following: number}}>} - 返回对象，键为用户DID，值为统计信息
   */
  async getFollowStats({ userDids = [], teamDid, prefix, options = {} }, context = {}) {
    const { includeFollowers = true, includeFollowing = true, includeInvitees = false } = options || {};
    if (!this.userFollowers || !Array.isArray(userDids) || userDids.length === 0) {
      return userDids.reduce((acc, userDid) => {
        const userStats = this.buildUserStats(options);
        return { ...acc, [userDid]: userStats };
      }, {});
    }

    try {
      const { user: contextUser } = context;
      const contextUserDid = contextUser?.userInfo?.did || contextUser?.did;

      const privacyMap = new Map();
      const queryInviteesMap = new Map();
      if (!(isInDashboard(teamDid, prefix, context) && isAdminUser(context))) {
        // 批量获取用户隐私设置
        const usersInfo = await this.find({ did: { $in: userDids } }, { did: 1, extra: 1 });

        usersInfo.forEach((userInfo) => {
          const isPrivate = isUserPrivacyEnabled(userInfo);
          privacyMap.set(userInfo.did, isPrivate);
          queryInviteesMap.set(userInfo.did, includeInvitees ? userInfo.did === contextUserDid : false);
        });
      }

      // 根据 options 配置决定执行哪些查询，提高性能
      const queries = [];
      const queryKeys = [];

      // 根据 options 配置构建查询映射
      const queryMap = {
        followers: includeFollowers,
        following: includeFollowing,
        invitees: includeInvitees,
      };

      Object.entries(queryMap).forEach(([queryType, enabled]) => {
        if (enabled) {
          queries.push(this.getCountByQuery(QUERY_CONFIGS[queryType], userDids));
          queryKeys.push(queryType);
        }
      });

      const queryResults = queries.length > 0 ? await Promise.all(queries) : [];

      // 根据执行的查询构建对应的 Map
      const followersMap = new Map();
      const followingMap = new Map();
      const inviteesMap = new Map();

      // 使用动态映射处理查询结果
      const resultMaps = {
        followers: followersMap,
        following: followingMap,
        invitees: inviteesMap,
      };

      queryResults.forEach((results, index) => {
        const queryType = queryKeys[index];
        const config = QUERY_CONFIGS[queryType];
        const targetMap = resultMaps[queryType];

        if (config && targetMap) {
          results.forEach((row) => {
            const key = row[config.selectField];
            targetMap.set(key, Number(row.count));
          });
        }
      });

      // 使用 Object.fromEntries 优化结果对象构建，并进行隐私判断
      const result = Object.fromEntries(
        userDids.map((userDid) => {
          const isPrivate = privacyMap.get(userDid) || false;
          const isOwner = contextUserDid === userDid;
          const isQueryInvitees = queryInviteesMap.get(userDid) ?? includeInvitees;

          // 根据隐私设置和 options 配置返回对应的字段
          const dataMaps = isPrivate && !isOwner ? {} : { followersMap, followingMap, inviteesMap };
          const userStats = this.buildUserStats({ ...options, includeInvitees: isQueryInvitees }, dataMaps, userDid);

          return [userDid, userStats];
        })
      );

      return result;
    } catch (error) {
      logger.error('Failed to get multiple follow stats:', { error });
      // 出错时根据 options 配置返回对应字段为 0 的结果
      return userDids.reduce((acc, userDid) => {
        const userStats = this.buildUserStats(options);
        return { ...acc, [userDid]: userStats };
      }, {});
    }
  }

  /**
   * 获取用户的受邀者列表
   * @param {string} userDid - 用户的 DID
   * @param {object} options - 选项
   * @param {object} options.paging - 分页参数
   * @param {object} options.sort - 排序参数
   * @param {boolean} options.includeFollowStatus - 是否包含当前用户的关注状态，默认 true
   * @param {object} context - 上下文，包含当前用户信息
   * @private
   */
  async getInvitees(userDid, options = {}, context = {}) {
    try {
      const { paging, sort, includeFollowStatus = true } = options;
      const { user: contextUser } = context;

      const contextUserDid = contextUser?.userInfo?.did || contextUser?.did;

      // 验证邀请者用户是否存在
      await this._validateUsersExist([userDid]);

      // 查询被邀请的用户列表
      const where = { inviter: userDid };

      // 设置排序
      const order = sort?.createdAt === -1 ? 'DESC' : 'ASC';
      const sorting = [['createdAt', sort?.createdAt ? order : 'DESC']];

      // 分页查询
      const result = await this.paginate(
        { where, attributes: ['did', 'fullName', 'avatar', 'createdAt', 'inviter'] },
        sorting,
        paging
      );

      // 准备关注状态映射
      let followingStatusMap = {};
      if (includeFollowStatus && contextUserDid && this.userFollowers) {
        const inviteeDids = result.list.map((user) => user.did);
        if (inviteeDids.length > 0) {
          followingStatusMap = await this.isFollowing(contextUserDid, inviteeDids);
        }
      }

      // 构建增强的列表
      const enrichedList = result.list.map((user) => {
        const enrichedUser = { ...user };

        // 添加关注状态
        if (includeFollowStatus && contextUserDid && contextUserDid !== user.did) {
          enrichedUser.isFollowing = followingStatusMap[user.did] || false;
        }

        return enrichedUser;
      });

      result.users = enrichedList;

      return result;
    } catch (error) {
      logger.error('Failed to get invitees:', error);
      throw error;
    }
  }

  async updateWebhook(userDid, webhook, createNotification = () => {}) {
    const user = await this.getUser(userDid);
    if (!user) {
      throw new CustomError(404, `User with did ${userDid} not found`);
    }
    if (!webhook || !webhook.url) {
      throw new CustomError(400, 'Invalid webhook');
    }

    if (
      webhook.consecutiveFailures !== undefined &&
      (!Number.isInteger(webhook.consecutiveFailures) || webhook.consecutiveFailures < 0)
    ) {
      throw new CustomError(400, 'consecutiveFailures must be a non-negative integer.');
    }
    const existWebhooks = user.extra?.webhooks ?? [];

    let hasChanged = false;
    const updatedWebhooks = existWebhooks.map((existing) => {
      if (existing.url === webhook.url) {
        const merged = { ...existing };
        // 使用抽离的核心逻辑更新失败状态
        updateWebhookFailureState(merged, webhook, createNotification);
        // Check if this specific webhook has changed
        if (!isEqual(existing, merged)) {
          hasChanged = true;
          return merged;
        }
        return existing;
      }
      return existing;
    });

    // Skip update if webhook data hasn't changed
    if (!hasChanged) {
      return user;
    }

    const [updatedRows, [updatedUser]] = await this.update({ did: userDid }, { extra: { webhooks: updatedWebhooks } });
    if (updatedRows === 1) {
      return updatedUser;
    }
    return user;
  }
}

module.exports = User;
