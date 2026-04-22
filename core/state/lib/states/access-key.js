const get = require('lodash/get');
const uniq = require('lodash/uniq');
const { Op } = require('sequelize');
const { isValid } = require('@arcblock/did');
const { fromRandom, fromPublicKey } = require('@ocap/wallet');
const { toBase58, fromBase58 } = require('@ocap/util');
const { CustomError } = require('@blocklet/error');
const logger = require('@abtnode/logger')('@abtnode/core:states:access-key');
const { SERVER_ROLES } = require('@abtnode/constant');
const BaseState = require('./base');
const { accessKeySchema, REMARK_MAX_LENGTH } = require('../validators/access-key');
const { validateOperator, getEndpoint, isUserCenterPath } = require('../util/verify-access-key-user');

const validateRemark = (remark) => {
  if (remark && remark.length > REMARK_MAX_LENGTH) {
    throw new CustomError(400, `Remark length should NOT be more than ${REMARK_MAX_LENGTH} characters`);
  }
};

const validatePassport = (passport, context) => {
  if (!passport) {
    throw new CustomError(400, 'passport should not be empty');
  }

  const { user } = context;
  logger.info('validate passport user', { userRole: user.role, passport });

  const role = (user?.role || '').replace('blocklet-', '');
  if (
    [SERVER_ROLES.OWNER, SERVER_ROLES.ADMIN, SERVER_ROLES.BLOCKLET_OWNER, SERVER_ROLES.BLOCKLET_ADMIN].includes(role)
  ) {
    return;
  }

  const roles = uniq([
    ...(user?.passports || []).filter((p) => p.status === 'valid').map((p) => p.role),
    role,
    'guest',
  ]);
  if (!roles.includes(passport)) {
    throw new CustomError(
      400,
      `You can not create access keys with passports you do not have access to: ${roles.join(',')}.`
    );
  }
};

const validateExpireAt = (expireAt) => {
  if (expireAt && expireAt < Date.now()) {
    throw new CustomError(400, 'ExpireAt should be in the future');
  }
};

const getOperator = (context) => get(context, 'user.did', '') || get(context, 'user.fullName', '');

/**
 * @extends BaseState<import('@abtnode/models').AccessKeyState>
 */
class AccessKeyState extends BaseState {
  async create(input, context, newWallet) {
    const {
      remark,
      passport,
      authType = 'signature',
      componentDid = '',
      resourceType = '',
      resourceId = '',
      createdVia = 'web',
      expireAt = null,
    } = input || {};

    validateRemark(remark);
    validatePassport(passport, context);
    validateExpireAt(expireAt);

    const wallet = newWallet || fromRandom();
    const data = {
      accessKeyId: wallet.address,
      accessKeyPublic: wallet.publicKey,
      passport,
      authType,
      componentDid,
      resourceType,
      resourceId,
      createdVia,
      expireAt,
    };

    if (remark) {
      data.remark = remark;
    }

    data.createdBy = getOperator(context);
    data.updatedBy = data.createdBy;

    await accessKeySchema.validateAsync(data, { stripUnknown: true });
    const doc = await this.insert(data);
    return {
      ...doc,
      accessKeySecret: authType === 'signature' ? toBase58(wallet.secretKey) : `blocklet-${toBase58(wallet.publicKey)}`,
    };
  }

  findPaginated({ remark: keywords, componentDid, resourceId, resourceType, paging } = {}, context) {
    validateOperator(context);
    const conditions = {
      where: {},
    };
    if (componentDid && isValid(componentDid)) {
      conditions.where.componentDid = componentDid;
    }
    if (resourceId) {
      conditions.where.resourceId = resourceId;
    }
    if (resourceType) {
      conditions.where.resourceType = resourceType;
    }
    // 模糊搜索
    if (keywords) {
      conditions.where[Op.or] = [
        { remark: { [Op.like]: `%${keywords}%` } },
        { accessKeyId: { [Op.like]: `%${keywords}%` } },
      ];
    }
    const pathname = getEndpoint(context);
    const queryCreatedById = isUserCenterPath(pathname) ? context.user.did : '';
    if (queryCreatedById) {
      conditions.where.createdBy = queryCreatedById;
    }

    return super.paginate(conditions, { createdAt: -1 }, { pageSize: 20, ...paging });
  }

  list() {
    return this.find({});
  }

  // eslint-disable-next-line no-unused-vars
  async detail({ accessKeyId } = {}, context) {
    if (!accessKeyId) {
      throw new CustomError(400, 'accessKeyId should not be empty');
    }
    const doc = await this.findOne({ accessKeyId });
    return doc;
  }

  // eslint-disable-next-line no-unused-vars
  async update(input = {}, context) {
    logger.info('update access key', input);
    const { accessKeyId, remark, passport, expireAt, authType } = input;

    validateRemark(remark);
    validateExpireAt(expireAt);

    if (!accessKeyId) {
      throw new CustomError(400, 'accessKeyId should not be empty');
    }

    const doc = await this.findOne({ accessKeyId });
    if (!doc) throw new CustomError(404, `Access Key Id ${accessKeyId} does not exist`);

    validateOperator(context, doc.createdBy);
    validatePassport(passport, context);

    if (remark !== undefined) {
      doc.remark = remark;
    }
    doc.passport = passport;
    doc.updatedBy = getOperator(context);
    doc.expireAt = expireAt === null || expireAt === undefined ? null : new Date(expireAt);

    if (authType !== undefined) {
      doc.authType = authType;
    }

    await super.update({ accessKeyId }, { $set: doc });
    return doc;
  }

  async refreshLastUsed(accessKeyId) {
    logger.debug('update lastUsed', { accessKeyId });
    if (!accessKeyId) {
      throw new CustomError(400, 'accessKeyId should not be empty');
    }
    const doc = await this.findOne({ accessKeyId });
    if (!doc) {
      throw new CustomError(404, `Access Key Id ${accessKeyId} does not exist`);
    }
    doc.lastUsedAt = new Date();
    await super.update({ accessKeyId }, { $set: doc });
    return doc;
  }

  // eslint-disable-next-line no-unused-vars
  async remove({ accessKeyId } = {}, context) {
    logger.info('remove access key', { accessKeyId });
    if (!accessKeyId) {
      throw new CustomError(400, 'accessKeyId should not be empty');
    }
    const doc = await this.findOne({ accessKeyId });
    if (!doc) {
      throw new CustomError(404, `Access Key Id ${accessKeyId} does not exist`);
    }
    validateOperator(context, doc.createdBy);
    const num = await super.remove({ accessKeyId });
    if (num <= 0) {
      throw new CustomError(404, `Access Key Id ${accessKeyId} does not exist`);
    }
  }

  async verify({ accessKeyId: keyId, resourceType, resourceId, componentDid } = {}) {
    const publicKey = fromBase58(keyId.replace('blocklet-', ''));
    if (!publicKey) {
      throw new CustomError(400, 'Invalid access key secret');
    }

    const wallet = fromPublicKey(publicKey);
    if (!wallet) {
      throw new CustomError(400, 'Invalid access key secret');
    }

    const doc = await this.findOne({ accessKeyId: wallet.address });
    if (!doc) {
      throw new CustomError(404, `Access Key Id ${wallet.address} does not exist`);
    }

    if (doc.authType !== 'simple') {
      throw new CustomError(403, 'Access key authType not simple');
    }

    if (componentDid && doc.componentDid !== componentDid) {
      throw new CustomError(403, 'access key verify failed, componentDid not match');
    }
    if (resourceType && doc.resourceType !== resourceType) {
      throw new CustomError(403, 'access key verify failed, resourceType not match');
    }
    if (resourceId && doc.resourceId !== resourceId) {
      throw new CustomError(403, 'access key verify failed, resourceId not match');
    }

    return doc;
  }
}

module.exports = AccessKeyState;
