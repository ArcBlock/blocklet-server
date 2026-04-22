const logger = require('@abtnode/logger')('@abtnode/core:api:team:org-crud');
const { CustomError } = require('@blocklet/error');
const md5 = require('@abtnode/util/lib/md5');
const { sanitizeTag } = require('@abtnode/util/lib/sanitize');
const path = require('path');
const fs = require('fs-extra');

const { createOrgValidators } = require('../../util/org');
const { createOrgInputSchema, updateOrgInputSchema } = require('../../validators/org');
const { getBlocklet } = require('../../util/blocklet');

/**
 * Issue org owner passport
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.org - Org
 * @returns {Promise<void>}
 */
async function issueOrgOwnerPassport(api, { teamDid, org }) {
  try {
    // 创建 org 的 owner passport, 并赋值给 owner
    const roleName = md5(`${org.id}-owner`); // 避免 name 重复
    await api.createRole({ teamDid, name: roleName, title: org.name, description: 'Owner', orgId: org.id });
    await api.issuePassportToUser({
      teamDid,
      userDid: org.ownerDid,
      role: roleName,
      notification: {},
    });
  } catch (err) {
    logger.error('Failed to create passport to org owner', { err, teamDid, org });
  }
}

/**
 * Create org
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {boolean} params.deferPassport - Defer passport
 * @param {boolean} params.throwOnValidationError - Throw on validation error
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function createOrg(api, { teamDid, deferPassport = false, throwOnValidationError = true, ...rest }, context) {
  try {
    // 1. 对输入进行转义
    const sanitizedOrg = {
      ...rest,
      description: sanitizeTag(rest.description || ''),
      name: sanitizeTag(rest.name || ''),
    };

    const { error } = createOrgInputSchema.validate(sanitizedOrg);
    if (error) {
      throw new CustomError(400, error.message);
    }

    const state = await api.getOrgState(teamDid);
    const blocklet = await getBlocklet({
      did: teamDid,
      states: api.states,
      dataDirs: api.dataDirs,
      useCache: true,
    });
    const checkedUserDid = rest.ownerDid || context.user.did || '';
    const orgCount = await state.getOrgCountByUser(checkedUserDid);

    const { veriftMaxOrgPerUser } = createOrgValidators(blocklet);

    try {
      veriftMaxOrgPerUser(orgCount); // 验证用户创建的 org 数量是否超过最大限制, 内部已经验证 org 是否开启
    } catch (_error) {
      if (throwOnValidationError) {
        throw _error;
      }
      logger.warn('Failed to validate org creation', { error: _error, teamDid, orgCount });
      return undefined;
    }

    const result = await state.create({ ...sanitizedOrg }, context);

    // 创建 org 的 owner passport, 并赋值给 owner
    if (!deferPassport) {
      await issueOrgOwnerPassport(api, { teamDid, org: result });
    } else {
      const jobId = md5(`${teamDid}-${result.id}-${checkedUserDid}`);
      api.passportIssueQueue.push(
        {
          action: 'issueOrgOwnerPassport',
          entity: 'blocklet',
          entityId: teamDid,
          params: {
            teamDid,
            org: result,
          },
        },
        jobId,
        true
      );
    }

    return result;
  } catch (err) {
    logger.error('Failed to create org', err, {
      teamDid,
      name: rest.name,
      userDid: rest.ownerDid || context.user.did || '',
    });
    throw err;
  }
}

/**
 * Create default org for user
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.user - User
 * @returns {Promise<void>}
 */
async function createDefaultOrgForUser(api, { teamDid, user }) {
  try {
    // 创建失败不要影响主流程
    await createOrg(
      api,
      {
        teamDid,
        name: user.fullName,
        description: `this is a default org for ${user.fullName}`,
        throwOnValidationError: false,
      },
      { user }
    );
  } catch (err) {
    logger.error('Failed to create default org for user', { err, teamDid, user });
  }
}

/**
 * Update org
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.org - Org
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function updateOrg(api, { teamDid, org }, context) {
  try {
    const sanitizedOrg = {
      ...org,
      description: sanitizeTag(org.description),
      name: sanitizeTag(org.name),
    };

    const { error } = updateOrgInputSchema.validate(sanitizedOrg);
    if (error) {
      throw new CustomError(400, error.message);
    }

    const state = await api.getOrgState(teamDid);

    // 获取旧的 org 数据，用于比对 avatar 是否发生变化
    const oldOrg = await state.getOrg(org.id);

    const result = await state.updateOrg({ org: sanitizedOrg }, context);

    // 如果 avatar 发生变化，删除旧的 avatar 文件（不影响主流程）
    try {
      if (oldOrg?.avatar && result.avatar && oldOrg.avatar !== result.avatar) {
        const blocklet = await getBlocklet({
          did: teamDid,
          states: api.states,
          dataDirs: api.dataDirs,
          useCache: true,
        });

        const oldAvatarPath = path.resolve(blocklet.env.dataDir, 'orgs', oldOrg.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          await fs.remove(oldAvatarPath);
          logger.info('Successfully removed old org avatar', { teamDid, orgId: result.id, oldAvatar: oldOrg.avatar });
        }
      }
    } catch (err) {
      logger.error('remove org avatar file', { err, teamDid, orgId: result.id, avatar: result.avatar });
    }

    return result;
  } catch (err) {
    logger.error('Failed to update org', { err, teamDid });
    throw err;
  }
}

/**
 * Delete org
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.id - Org ID
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function deleteOrg(api, { teamDid, id }, context) {
  try {
    const state = await api.getOrgState(teamDid);
    // 要同时删除与 org 相关的 passport 和 邀请链接
    const roles = await api.getRoles({ teamDid, orgId: id });
    const result = await state.deleteOrg({ id }, context);
    try {
      await state.removeOrgRelatedData({ roles, orgId: id });
    } catch (err) {
      logger.error('Failed to remove org related data', { err, teamDid, roles, id });
    }
    return result;
  } catch (err) {
    logger.error('Failed to delete org', { err, teamDid, id });
    throw err;
  }
}

module.exports = {
  issueOrgOwnerPassport,
  createOrg,
  createDefaultOrgForUser,
  updateOrg,
  deleteOrg,
};
