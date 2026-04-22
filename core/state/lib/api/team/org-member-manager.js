const { joinURL } = require('ufo');
const logger = require('@abtnode/logger')('@abtnode/core:api:team:org-member');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { CustomError } = require('@blocklet/error');
const { sendToUser } = require('@blocklet/sdk/lib/util/send-notification');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const { getWalletDid } = require('@blocklet/meta/lib/did-utils');
const { Joi } = require('@arcblock/validator');
const { getEmailServiceProvider } = require('@abtnode/auth/lib/email');

const { getOrgInviteLink, isOrgOwner, isAdmingPath } = require('../../util/org');
const { getBlocklet } = require('../../util/blocklet');

/**
 * Add org member
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.orgId - Org ID
 * @param {string} params.userDid - User DID
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function addOrgMember(api, { teamDid, orgId, userDid }, context) {
  try {
    const state = await api.getOrgState(teamDid);
    return state.addOrgMember({ orgId, userDid }, context);
  } catch (err) {
    logger.error('Add member to org failed', { err, teamDid, orgId, userDid });
    throw err;
  }
}

/**
 * Update org member
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.orgId - Org ID
 * @param {string} params.userDid - User DID
 * @param {string} params.status - Status
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function updateOrgMember(api, { teamDid, orgId, userDid, status }, context) {
  try {
    const state = await api.getOrgState(teamDid);
    return state.updateOrgMember({ orgId, userDid, status }, context);
  } catch (err) {
    logger.error('Update member in org failed', { err, teamDid, orgId, userDid, status });
    throw err;
  }
}

/**
 * Send invitation notification
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @returns {Promise<void>}
 */
async function sendInvitationNotification(
  api,
  { teamDid, invitor, org, role, successUserDids, inviteLink, email, inviteType, blocklet }
) {
  try {
    const userInfo = await api.getUser({
      teamDid,
      user: { did: invitor.did },
      options: { enableConnectedAccount: true },
    });

    // 检测是否开启了 email 服务
    const provider = getEmailServiceProvider(blocklet);

    const translate = {
      en: {
        title: 'Inviting you to join the organization',
        description: `<${userInfo.fullName}(did:abt:${userInfo.did})> invites you to join the ${org.name} organization, role is ${role}.<br/>After accepting, you will be able to access the resources and collaboration content of the organization.<br/><br/>Please click the button below to handle the invitation.<br/><br/>If you don't want to join, you can ignore this notification.`,
        accept: 'Accept',
      },
      zh: {
        title: '邀请您加入组织',
        description: `<${userInfo.fullName}(did:abt:${userInfo.did})> 邀请您加入 ${org.name} 组织，角色为 ${role}。<br/>接受后，你将能够访问该组织的资源和协作内容。<br/><br/>请点击下方按钮处理邀请。<br/><br/>如果你不想加入，可以忽略此通知。`,
        accept: '接受',
      },
    };
    const content = translate[userInfo.locale || 'en'] || translate.en;

    const message = {
      title: content.title,
      body: content.description,
      actions: [
        {
          name: content.accept,
          title: content.accept,
          link: inviteLink,
        },
      ],
    };

    if (inviteType === 'internal') {
      await api.createNotification({
        teamDid,
        receiver: successUserDids,
        entityId: teamDid,
        source: 'system',
        severity: 'info',
        ...message,
      });
      logger.info('Invite notification sent successfully', {
        teamDid,
        orgId: org.id,
        sentToUsers: successUserDids,
        sentCount: successUserDids.length,
      });
    } else if (inviteType === 'external' && provider && email) {
      // 当 service 开启 email 服务时才会发送邮件通知
      const emailInputSchema = Joi.string().email().required();
      const { error } = emailInputSchema.validate(email);
      if (error) {
        throw new CustomError(400, error.message);
      }
      const nodeInfo = await api.node.read();
      const blockletInfo = getBlockletInfo(blocklet, nodeInfo.sk);
      const sender = {
        appDid: blockletInfo.wallet.address,
        appSk: blockletInfo.wallet.secretKey,
      };

      await sendToUser(email, message, sender, undefined, 'send-to-mail');
      logger.info('Send invitation notification to email completed', {
        teamDid,
        orgId: org.id,
        email,
      });
    }
  } catch (notificationErr) {
    // 通知发送失败不影响邀请的成功，只记录警告
    logger.warn('Failed to send invitation notification, but invitations were created successfully', {
      notificationErr,
      teamDid,
      orgId: org.id,
      successUserDids,
    });
  }
}

/**
 * Get federated master blocklet info
 * @param {Object} params
 * @param {Object} params.blocklet - Blocklet
 * @returns {Object|undefined}
 */
function getFederatedMasterBlockletInfo({ blocklet }) {
  const sites = blocklet.settings?.federated?.sites || [];
  const federatedMaster = sites.find((item) => item.isMaster !== false);
  const federatedCurrent = sites.find((item) => item.appId === blocklet.appDid);
  const isFederated = !!federatedMaster || !!federatedCurrent;
  if (!isFederated) {
    return undefined;
  }

  const formatBlockletInfo = (federateBlocklet) => ({
    appId: federateBlocklet?.appId,
    appName: federateBlocklet?.appName,
    appDescription: federateBlocklet?.appDescription,
    appLogo: federateBlocklet?.appLogo,
    appPid: federateBlocklet?.appPid,
    appUrl: federateBlocklet?.appUrl,
    version: federateBlocklet?.version,
    sourceAppPid: federateBlocklet?.appPid,
    provider: 'wallet',
  });

  const blocklets = [];
  if (federatedCurrent?.status === 'approved') {
    blocklets.push(formatBlockletInfo(federatedMaster));
  }
  if (federatedCurrent) {
    blocklets.push({
      ...formatBlockletInfo(federatedCurrent),
      sourceAppPid: null,
    });
  } else {
    const blockletInfo = getBlockletInfo(blocklet, undefined, { returnWallet: false });
    blocklets.push({
      ...formatBlockletInfo(blockletInfo),
      appPid: blocklet?.appPid,
      appLogo: joinURL(blockletInfo.appUrl, WELLKNOWN_SERVICE_PATH_PREFIX, '/blocklet/logo'),
      sourceAppPid: null,
    });
  }

  return blocklets[0];
}

/**
 * Get org (internal helper - imported from org-query-manager to avoid circular dependency)
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.id - Org ID
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function _getOrg(api, { teamDid, id }, context) {
  const state = await api.getOrgState(teamDid);
  return state.get({ id }, context);
}

/**
 * Invite members to org
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.orgId - Org ID
 * @param {Array} params.userDids - User DIDs
 * @param {string} params.role - Role
 * @param {string} params.inviteType - Invite type
 * @param {string} params.email - Email
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function inviteMembersToOrg(api, { teamDid, orgId, userDids, role, inviteType = 'internal', email }, context) {
  try {
    const state = await api.getOrgState(teamDid);
    const { user } = context || {};
    if (!user) {
      throw new CustomError(400, 'User is required');
    }
    const org = await _getOrg(api, { teamDid, id: orgId }, context);
    if (!org) {
      throw new CustomError(400, 'Org not found');
    }

    // dashboard 或者非 org owner 无法邀请成员
    if (isAdmingPath(context) || !isOrgOwner(user, org)) {
      throw new CustomError(403, "You cannot invite members to other users' org");
    }

    if (inviteType === 'internal' && userDids.length === 0) {
      throw new CustomError(400, 'You must invite at least one user');
    }

    // Step 1: 批量添加成员到组织 - 记录添加成功和添加失败的用户 DID
    const successUserDids = [];
    const failedUserDids = [];
    const skipInviteUserDids = [];

    // 内部邀请
    if (inviteType === 'internal') {
      for (const userDid of userDids) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const currentUser = await api.getUser({
            teamDid,
            user: { did: userDid },
          });
          const walletDid = getWalletDid(currentUser);
          // 如果当前用户不是钱包用户，则跳过邀请 (参考颁发通行证逻辑)
          const skipInvite = walletDid !== userDid;
          if (skipInvite) {
            skipInviteUserDids.push(userDid);
          }
          const status = skipInvite ? 'active' : 'inviting';
          // eslint-disable-next-line no-await-in-loop
          await state.addOrgMember({ orgId, userDid, status }, context);
          successUserDids.push(userDid);
        } catch (addErr) {
          failedUserDids.push(userDid);
          logger.warn('Failed to add user to org', { userDid, orgId, error: addErr.message });
        }
      }

      logger.info('Batch add members to org completed', {
        teamDid,
        orgId,
        totalUsers: userDids.length,
        successCount: successUserDids.length,
        failedCount: failedUserDids.length,
      });

      // 如果没有成功添加的用户，直接返回结果
      if (successUserDids.length === 0) {
        logger.warn('No users were successfully added to org', { teamDid, orgId, failedUserDids });
        throw new CustomError(500, 'No users were successfully added to org');
      }
    }

    // 要排除 OAuth 用户
    const inviteUserDids = successUserDids.filter((did) => !skipInviteUserDids.includes(did));

    if (skipInviteUserDids.length > 0) {
      logger.info('OAuth users were successfully added to org', { teamDid, orgId, skipInviteUserDids });
      // 向 OAuth 用户颁发通行证
      for (const userDid of skipInviteUserDids) {
        // eslint-disable-next-line no-await-in-loop
        await api.issuePassportToUser({
          teamDid,
          userDid,
          role,
          notification: {},
        });
      }
    }

    // 如果没有其他用户，那么直接返回即可
    if (inviteType === 'internal' && inviteUserDids.length === 0) {
      return {
        successDids: successUserDids,
        failedDids: failedUserDids,
      };
    }

    // Previous Step 2: 要判断站点是否是站点群内，如果是站点群中，需要使用 master 的 appPid 作为 sourceAppPid 创建邀请链接

    const blocklet = await getBlocklet({ did: teamDid, states: api.states, dataDirs: api.dataDirs });
    const masterBlockletInfo = getFederatedMasterBlockletInfo({ blocklet });

    // Step 2: 创建邀请链接，只创建添加成功的用户邀请链接

    const inviteInfo = await api.createMemberInvitation(
      {
        teamDid,
        role,
        expireTime: api.memberInvitationExpireTime,
        orgId,
        inviteUserDids: inviteType === 'internal' ? inviteUserDids : [],
        sourceAppPid: masterBlockletInfo?.appPid,
      },
      context
    );

    const inviteLink = getOrgInviteLink(inviteInfo, blocklet);

    logger.info('Invite link created for successful users', {
      teamDid,
      orgId,
      inviteId: inviteInfo.inviteId,
      userCount: successUserDids.length,
    });

    // Step 3: 发送邀请通知，只发送添加成功的用户邀请通知

    sendInvitationNotification(api, {
      teamDid,
      invitor: user,
      org,
      role,
      successUserDids,
      email,
      inviteType,
      inviteLink,
      blocklet,
    });

    // 返回成功和失败的用户列表
    return {
      successDids: successUserDids,
      failedDids: failedUserDids,
      inviteLink,
    };
  } catch (err) {
    logger.error('Invite users to org failed', { err, teamDid, orgId, userDids, role });
    throw err;
  }
}

/**
 * Remove org member
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.orgId - Org ID
 * @param {string} params.userDid - User DID
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function removeOrgMember(api, { teamDid, orgId, userDid }, context) {
  try {
    const state = await api.getOrgState(teamDid);
    const roles = await api.getRoles({ teamDid, orgId });
    const result = await state.removeOrgMember({ orgId, userDid }, context);
    try {
      await state.removeOrgRelatedData({ roles, orgId, userDid });
    } catch (err) {
      logger.error('Failed to remove user related passports', { err, teamDid, roles, userDid });
    }
    return result;
  } catch (err) {
    logger.error('Remove member from org failed', { err, teamDid, orgId, userDid });
    throw err;
  }
}

module.exports = {
  addOrgMember,
  updateOrgMember,
  sendInvitationNotification,
  getFederatedMasterBlockletInfo,
  inviteMembersToOrg,
  removeOrgMember,
};
