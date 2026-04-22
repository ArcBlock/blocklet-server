const { CustomError } = require('@blocklet/error');
const { SERVER_ROLES } = require('@abtnode/constant');
const { Sequelize, Op } = require('sequelize');
const pick = require('lodash/pick');
const logger = require('@abtnode/logger')('@abtnode/core:states:orgs');
const { PASSPORT_STATUS } = require('@abtnode/constant');

const BaseState = require('./base');
const { formatPaging, isAdminUser, isAdmingPath, isOrgOwner } = require('../util/org');

const ACTIVE_STATUS = 'active';
class OrgState extends BaseState {
  constructor(baseDir, config = {}, models) {
    super(baseDir, { filename: 'orgs.db', ...config });
    this.userOrgs = new BaseState(models.UserOrg, config);
    this.user = new BaseState(models.User, config);
    this.session = new BaseState(models.Session, config);
    this.passport = new BaseState(models.Passport, config);
    this.orgResource = new BaseState(models.OrgResource, config);
  }

  async create(payload, context) {
    const { user } = context || {};
    // 非 SDK 环境，只能创建自己的 org
    if (user.role !== SERVER_ROLES.BLOCKLET_SDK && payload.ownerDid && payload.ownerDid !== user.did) {
      throw new CustomError(403, 'You cannot create org for other users');
    }

    const orgData = {
      ...payload,
      ownerDid: payload.ownerDid || context.user.did,
    };

    if (!orgData.ownerDid) {
      throw new CustomError(400, 'Owner did is required');
    }

    const doc = await this.insert(orgData);

    // 创建成功后默认要向组织添加创建者
    await this.userOrgs.insert({ orgId: doc.id, userDid: orgData.ownerDid, status: ACTIVE_STATUS });

    return doc;
  }

  async updateOrg({ org }, context) {
    const result = await this.findOne({ where: { id: org.id } });
    const { user } = context || {};
    // dashboard 或者非 org owner 无法更新 org
    if (isAdmingPath(context) || !isOrgOwner(user, result)) {
      throw new CustomError(403, "You cannot edit other user's org");
    }
    const [affectedRows, docs] = await this.update({ id: result.id }, { $set: org }, { returnUpdatedDocs: true });
    if (affectedRows !== 1) {
      throw new CustomError(500, 'Update org failed, please try again later');
    }
    return docs[0];
  }

  async deleteOrg({ id }, context) {
    const result = await this.findOne({ where: { id } });
    const { user } = context || {};
    // dashboard 或者非 org owner 无法更新 org
    if (isAdmingPath(context) || !isOrgOwner(user, result)) {
      throw new CustomError(403, "You cannot delete other user's org");
    }
    return this.remove({ id });
  }

  /**
   * 用户是否存在组织中
   */
  async canAccessOrg({ userDid, orgId }) {
    const result = await this.userOrgs.findOne({ where: { userDid, orgId } });
    return result && result.status === ACTIVE_STATUS;
  }

  async get({ id }, context) {
    const result = await this.getOrg(id);
    if (!result) {
      throw new CustomError(404, 'Org not found', { id });
    }
    const { user } = context || {};
    const userInOrg = await this.canAccessOrg({ userDid: user.did, orgId: id });
    const isAdmin = (isAdmingPath(context) && isAdminUser(user)) || user.role === SERVER_ROLES.BLOCKLET_SDK;
    if (!isAdmin && !isOrgOwner(user, result) && !userInOrg) {
      throw new CustomError(403, "You cannot access other user's org");
    }

    return result;
  }

  async list(payload = {}, context) {
    const paging = formatPaging(payload.paging);
    const { user } = context || {};
    if (!user) {
      throw new CustomError(403, 'You are not logged in');
    }

    // 非 SDK 环境，只能查询自己的 org
    if (user.role !== SERVER_ROLES.BLOCKLET_SDK && payload.userDid && payload.userDid !== user.did) {
      throw new CustomError(403, "You cannot access other user's org");
    }

    const where = {};
    const replacements = {};

    const orgConditions = [];
    const likeOp = this.model.sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;

    Object.keys(payload.org || {}).forEach((key) => {
      if (key !== 'id' && Object.prototype.hasOwnProperty.call(payload.org, key) && !!payload.org[key]) {
        // 使用 LIKE 模糊查询
        orgConditions.push({ [key]: { [likeOp]: `%${payload.org[key]}%` } });
      }
    });

    const isAdmin = isAdminUser(user) && isAdmingPath(context);

    // 如果是在 dashboard 查询，忽略 type 参数
    if (isAdmin) {
      payload.type = '';
    }

    const queryUserDid = payload.userDid || user.did;

    // 根据不同的 type 构建查询条件，同时合并 org 条件
    if (payload.type === 'owned') {
      where.ownerDid = queryUserDid;
      // 添加 org 条件作为 AND 条件
      if (orgConditions.length > 0) {
        where[Op.or] = orgConditions;
      }
    } else if (payload.type === 'joined') {
      where.id = {
        [Op.in]: Sequelize.literal(
          '(SELECT DISTINCT "orgId" FROM user_orgs WHERE "userDid" = :userDid and status = :status)'
        ),
      };
      where.ownerDid = {
        [Op.ne]: queryUserDid,
      };
      replacements.userDid = queryUserDid;
      replacements.status = ACTIVE_STATUS;
      // 添加 org 条件作为 AND 条件
      if (orgConditions.length > 0) {
        where[Op.or] = orgConditions;
      }
    } else if (!isAdmin && !payload.type) {
      // 查询所有的（包括我创建的和我加入的）
      const typeConditions = [
        { ownerDid: queryUserDid },
        {
          id: {
            [Op.in]: Sequelize.literal(
              '(SELECT DISTINCT "orgId" FROM user_orgs WHERE "userDid" = :userDid and status = :status)'
            ),
          },
        },
      ];

      if (orgConditions.length > 0) {
        where[Op.and] = [{ [Op.or]: typeConditions }, { [Op.or]: orgConditions }];
      } else {
        where[Op.or] = typeConditions;
      }
      replacements.userDid = queryUserDid;
      replacements.status = ACTIVE_STATUS;
    } else if (orgConditions.length > 0) {
      where[Op.or] = orgConditions;
    }

    // @FIXME: LiuShuang 这里没必要返回 owner 的信息, 可以直接通过 ownerDid 查询 owner 的信息
    const result = await this.paginate({ where, replacements }, { updatedAt: -1 }, paging);
    const { includeMembers = true, includePassports = true } = payload.options || {};
    if (includeMembers) {
      // 查询每个 org 中的用户信息, 在org 列表页没必要查询全部
      const orgMembers = await Promise.all(
        result.list.map((org) => this.getOrgMembers({ orgId: org.id, paging: { page: 1, pageSize: 5 } }, context))
      );

      result.list.forEach((org, index) => {
        const item = orgMembers[index];
        org.members = item.users;
        org.membersCount = item.paging.total;
      });
    }

    // 查询用户的 passport
    let passports = [];
    if (['joined', 'all'].includes(payload.type) && includePassports) {
      passports = await this.passport.find({
        where: { userDid: queryUserDid },
      });
    }

    return {
      orgs: result.list,
      passports,
      paging: result.paging,
    };
  }

  getOrg(id) {
    return this.findOne({ where: { id } });
  }

  async orgIsExist(id) {
    try {
      const doc = await this.getOrg(id);
      return !!doc;
    } catch (err) {
      logger.error('Org not found', { err, id });
      return false;
    }
  }

  async getUser(did) {
    const attributes = ['did'];
    let user = await this.user.findOne({ where: { did }, attributes });
    if (!user) {
      const connectedAccount = await this.connectedAccount.findOne({ did });
      if (connectedAccount) {
        user = await this.user.findOne({ where: { did: connectedAccount.userDid }, attributes });
      }
    }
    return user;
  }

  /**
   * 获取用户创建的 org 数量
   * @param {*} userDid
   * @returns
   */
  async getOrgCountByUser(userDid) {
    const count = await this.count({ where: { ownerDid: userDid } });
    return count;
  }

  /**
   * 获取一个 org 下的成员数量
   * @param {*} userDid
   * @returns
   */
  async getOrgMemberCount(orgId) {
    const count = await this.userOrgs.count({ where: { orgId } });
    return count;
  }

  async userIsExist(userDid) {
    try {
      const doc = await this.getUser(userDid);
      return !!doc;
    } catch (err) {
      logger.error('User not found', { err, userDid });
      return false;
    }
  }

  // org members
  async addOrgMember({ orgId, userDid, status }) {
    const [orgIsExist, userIsExist] = await Promise.all([this.orgIsExist(orgId), this.userIsExist(userDid)]);
    if (!orgIsExist) {
      throw new CustomError(404, 'Org not found', { orgId });
    }

    if (!userIsExist) {
      throw new CustomError(404, 'User not found', { userDid });
    }

    const userOrg = await this.userOrgs.findOne({ where: { orgId, userDid } });
    if (userOrg) {
      throw new CustomError(400, 'User already in the org, cannot add again', { orgId, userDid });
    }

    return this.userOrgs.insert({ orgId, userDid, status: status || ACTIVE_STATUS });
  }

  async removeOrgMember({ orgId, userDid }, context) {
    const [org, userIsExist] = await Promise.all([this.getOrg(orgId), this.userIsExist(userDid)]);
    if (!org || !userIsExist) {
      throw new CustomError(404, 'Org or user not found', { orgId, userDid });
    }

    const { user } = context || {};
    if (isAdmingPath(context) || !isOrgOwner(user, org)) {
      throw new CustomError(403, "You cannot remove members from other users' org");
    }

    if (org.ownerDid === userDid) {
      throw new CustomError(400, 'Owner cannot be removed from the org', { orgId, userDid });
    }

    const userOrg = await this.userOrgs.findOne({ where: { orgId, userDid } });
    if (!userOrg) {
      throw new CustomError(400, 'User not in the org, cannot remove', { orgId, userDid });
    }

    return this.userOrgs.remove({ orgId, userDid });
  }

  async getOrgMembers({ orgId, paging, options = {} }, context) {
    const { includePassport = false } = options || {};
    const org = await this.getOrg(orgId);
    if (!org) {
      throw new CustomError(404, 'Org not found', { orgId });
    }

    const { user } = context || {};
    const userInOrg = await this.canAccessOrg({ userDid: user.did, orgId });
    const isAdmin = (isAdmingPath(context) && isAdminUser(user)) || user.role === SERVER_ROLES.BLOCKLET_SDK;
    if (!isAdmin && !isOrgOwner(user, org) && !userInOrg) {
      throw new CustomError(403, "You cannot access other user's org");
    }

    const newPaging = formatPaging(paging);

    const include = [
      {
        model: this.user.model,
        as: 'user',
        attributes: ['did', 'avatar', 'fullName'],
      },
    ];

    const doc = await this.userOrgs.paginate({ where: { orgId }, include }, { updatedAt: -1 }, newPaging);

    if (includePassport) {
      // 获取每个用户的 passport
      const passports = await Promise.all(
        doc.list.map((item) => this.passport.find({ where: { userDid: item.userDid, status: PASSPORT_STATUS.VALID } }))
      );

      doc.list.forEach((item, index) => {
        if (item.user) {
          item.user.passports = passports[index];
        }
      });
    }

    return {
      users: doc.list,
      paging: doc.paging,
    };
  }

  async updateOrgMember({ orgId, userDid, status = ACTIVE_STATUS }) {
    const [orgIsExist, userIsExist] = await Promise.all([this.orgIsExist(orgId), this.userIsExist(userDid)]);
    if (!orgIsExist) {
      throw new CustomError(404, 'Org not found', { orgId });
    }
    if (!userIsExist) {
      throw new CustomError(404, 'User not found', { userDid });
    }
    const userOrg = await this.userOrgs.findOne({ where: { orgId, userDid } });
    if (!userOrg || status === userOrg.status) {
      throw new CustomError(400, 'User not in the org, cannot update', { orgId, userDid });
    }
    return this.userOrgs.update({ orgId, userDid }, { $set: { status: status || ACTIVE_STATUS } });
  }

  /**
   * 移除正在邀请的用户
   * @param {string} userDid - 用户DID：这里表示是的在邀请链接中的用户列表移除用户ID
   * @param {string} orgId - 组织ID
   * @returns {Promise}
   */
  async removeInvitation({ userDid, orgId }) {
    if (!orgId) {
      throw new CustomError(400, 'orgId is required');
    }

    try {
      // 查找包含该orgId的邀请记录
      const invitations = await this.session.find({
        where: {
          '__data.orgId': orgId,
          type: 'invite',
        },
      });

      if (!invitations || invitations.length === 0) {
        logger.info('No invitations found for org', { orgId, userDid });
        return;
      }

      // 如果没有传入 userDid，删除所有相关邀请
      if (!userDid) {
        logger.info('Removing all invitations for org', { orgId, count: invitations.length });

        const removePromises = invitations.map((invitation) => this.session.remove({ id: invitation.id }));

        await Promise.all(removePromises);
        logger.info('Successfully removed all invitations for org', { orgId });
        return;
      }

      // 如果有 userDid，按原逻辑处理：从邀请中移除特定用户
      const invitation = invitations.find((item) => {
        return item?.__data?.inviteUserDids?.length > 0 && item.__data.inviteUserDids.includes(userDid);
      });

      if (!invitation) {
        throw new CustomError(404, 'Invitation not found for user', { userDid, orgId });
      }

      const otherUsers = invitation.__data.inviteUserDids.filter((item) => item !== userDid);

      if (otherUsers.length > 0) {
        // 还有其他用户，只移除当前用户
        await this.session.update(invitation.id, {
          __data: {
            ...invitation.__data,
            inviteUserDids: otherUsers,
          },
        });
        logger.info('Removed user from invitation', { userDid, orgId, remainingUsers: otherUsers.length });
      } else {
        // 没有其他用户了，删除整个邀请
        await this.session.remove({ id: invitation.id });
        logger.info('Removed entire invitation (no remaining users)', { userDid, orgId, invitationId: invitation.id });
      }
    } catch (error) {
      logger.error('Remove invitation failed', { error, userDid, orgId });
      throw error;
    }
  }

  /**
   * 获取一个 org 下可邀请的用户列表
   */
  async getOrgInvitableUsers({ id, query = {}, paging = { page: 1, pageSize: 10 } }, context) {
    const org = await this.getOrg(id);
    if (!org) {
      throw new CustomError(404, 'Org not found', { id });
    }
    const { user } = context || {};
    // dashboard 或者非 org owner 无法获取可邀请的用户列表
    if (isAdmingPath(context) || !isOrgOwner(user, org)) {
      throw new CustomError(403, "You cannot access other user's org");
    }
    const { search } = query || {};

    const newPaging = formatPaging(paging);

    const where = { approved: true };

    if (search) {
      if (search.length > 50) {
        throw new CustomError(400, 'the length of search text should not more than 50');
      } else {
        const likeOp = this.model.sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
        where[Op.or] = [
          { did: { [likeOp]: `%${search}%` } },
          { fullName: { [likeOp]: `%${search}%` } },
          { email: { [likeOp]: `%${search}%` } },
        ];
      }
    }

    const members = await this.userOrgs.find({ where: { orgId: id } });
    const memberDids = members.map((item) => item.userDid);

    if (memberDids.length) {
      where.did = {
        [Op.notIn]: memberDids,
      };
    }

    const result = await this.user.paginate(
      {
        where,
        attributes: ['did', 'avatar', 'fullName', 'email'],
      },
      { updatedAt: -1 },
      newPaging
    );

    return {
      users: result.list.map((d) => pick(d, ['did', 'avatar', 'fullName'])),
      paging: result.paging,
    };
  }

  /**
   * 检测 resource 是否已经与 org 绑定
   * @param {*} param0
   * @returns
   */
  async getOrgResource({ orgId, resourceId }, context) {
    const org = await this.getOrg(orgId);
    if (!org) {
      throw new CustomError(400, 'Org not found');
    }

    const { user } = context || {};
    const userInOrg = await this.canAccessOrg({ userDid: user.did, orgId });
    const isAdmin = (isAdmingPath(context) && isAdminUser(user)) || user.role === SERVER_ROLES.BLOCKLET_SDK;
    if (!isAdmin && !isOrgOwner(user, org) && !userInOrg) {
      throw new CustomError(403, "You cannot access resources under other users' org");
    }

    const where = { orgId };
    if (resourceId) {
      where.resourceId = resourceId;
    }
    return this.orgResource.find({ where });
  }

  /**
   * 添加组织资源
   */
  async addOrgResource({ orgId, resourceIds = [], type, metadata = {} }, context) {
    const org = await this.getOrg(orgId);
    if (!org) {
      throw new CustomError(404, 'Org not found', { orgId });
    }
    const { user } = context || {};
    // dashboard 或者非 org owner 无法向 org 中添加资源
    // blocklet-sdk 可以添加资源
    if (user.role !== SERVER_ROLES.BLOCKLET_SDK && (isAdmingPath(context) || !isOrgOwner(user, org))) {
      throw new CustomError(403, "You cannot add resources to other users' org");
    }

    const success = [];
    const failed = [];

    for (const resourceId of resourceIds) {
      try {
        // 检查资源是否已经存在
        // eslint-disable-next-line no-await-in-loop
        const resources = await this.getOrgResource({ orgId, resourceId }, context);

        if (resources.length > 0) {
          logger.warn('Resource already exists in org', { orgId, resourceId });
          failed.push(resourceId);
          continue;
        }

        const instance = {
          orgId,
          resourceId,
          type,
          metadata,
        };
        // eslint-disable-next-line no-await-in-loop
        await this.orgResource.insert(instance);
        success.push(resourceId);
      } catch (error) {
        logger.error('Failed to add resource to the org', { error, orgId, resourceId });
        failed.push(resourceId);
      }
    }
    return {
      success,
      failed,
    };
  }

  /**
   * 将资源从 org 中移除
   */
  async removeOrgResource({ orgId, resourceIds = [] }, context) {
    const org = await this.getOrg(orgId);
    if (!org) {
      throw new CustomError(404, 'Org not found', { orgId });
    }
    const { user } = context || {};
    // dashboard 或者非 org owner 无法向 org 中添加资源
    // blocklet-sdk 可以移除资源
    if (user.role !== SERVER_ROLES.BLOCKLET_SDK && (isAdmingPath(context) || !isOrgOwner(user, org))) {
      throw new CustomError(403, "You cannot remove resources from other users' org");
    }
    return this.orgResource.remove({ where: { orgId, resourceId: { [Op.in]: resourceIds } } });
  }

  /**
   * 迁移资源到新的 org
   */
  async migrateOrgResource({ from, to, resourceIds = [] }, context) {
    // 资源与 org 的关系时多对多： 一个资源可以属于多个 org, 一个 org 可以有多个资源
    // 如果没有 from，无法确定从哪里迁出
    if (!from || !to) {
      throw new CustomError(400, 'Both from and to parameters are required', { from, to });
    }
    const org = await this.getOrg(to);
    if (!org) {
      throw new CustomError(404, 'Org not found', { to });
    }

    const { user } = context || {};
    // dashboard 或者非 org owner 无法迁移资源
    // blocklet-sdk 可以迁移资源
    if (user.role !== SERVER_ROLES.BLOCKLET_SDK && (isAdmingPath(context) || !isOrgOwner(user, org))) {
      throw new CustomError(403, "You cannot migrate resources to other users' org");
    }

    if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
      return { success: [], failed: [] };
    }

    const success = [];
    const failed = [];

    for (const resourceId of resourceIds) {
      try {
        // 如果资源已经绑定到源组织，更新到目标组织
        // eslint-disable-next-line no-await-in-loop
        const resources = await this.getOrgResource({ orgId: from, resourceId }, context);

        if (resources.length > 0) {
          // eslint-disable-next-line no-await-in-loop
          await this.orgResource.update(
            { orgId: from, resourceId },
            {
              $set: {
                orgId: to,
              },
            }
          );
        } else {
          // 如果完全没有绑定，创建新的绑定
          // eslint-disable-next-line no-await-in-loop
          await this.orgResource.insert({
            orgId: to,
            resourceId,
          });
        }

        success.push(resourceId);
      } catch (error) {
        logger.error('Failed to migrate resource to org', { error, from, to, resourceId });
        failed.push(resourceId);
      }
    }

    return {
      success,
      failed,
    };
  }

  revokeUserPassportsByRoles({ roles = [], userDid = '' }) {
    if (roles.length === 0) {
      return [];
    }
    const names = new Set(roles.map((x) => x.name));
    const where = { name: { [Op.in]: Array.from(names) } };
    if (userDid) {
      where.userDid = userDid;
    }
    return this.passport.update({ where }, { $set: { status: PASSPORT_STATUS.REVOKED } });
  }

  /**
   * 移除组织相关的数据
   */
  async removeOrgRelatedData({ roles = [], orgId, userDid = '' }) {
    try {
      const result = await Promise.allSettled([
        this.revokeUserPassportsByRoles({ roles, userDid }),
        this.removeInvitation({ orgId, userDid }),
      ]);
      return result;
    } catch (error) {
      logger.error('Failed to remove org related data', { error, roles, orgId });
      throw error;
    }
  }
}

module.exports = OrgState;
