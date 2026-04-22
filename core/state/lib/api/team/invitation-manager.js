const dayjs = require('@abtnode/util/lib/dayjs');
const logger = require('@abtnode/logger')('@abtnode/core:api:team:invitation');
const { CustomError } = require('@blocklet/error');

const { validateUserRolePassport } = require('../../util/validate-user-role-passport');

/**
 * Format transfer data
 * @param {Object} data - Transfer data
 * @returns {Object}
 */
const formatTransferData = (data) => ({
  transferId: data.id,
  remark: data.remark || '',
  expireDate: new Date(data.expireDate).toString(),
  appDid: data.appDid,
  status: data.status || '',
});

/**
 * Create member invitation
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.role - Role name
 * @param {number} params.expireTime - Expire time
 * @param {string} params.remark - Remark
 * @param {string} params.sourceAppPid - Source app PID
 * @param {Object} params.display - Display settings
 * @param {number} params.passportExpireTime - Passport expire time
 * @param {string} params.orgId - Org ID
 * @param {Array} params.inviteUserDids - Invite user DIDs
 * @param {Object} context
 * @param {Function} validatePassportDisplay - Validation function
 * @returns {Promise<Object>}
 */
async function createMemberInvitation(
  api,
  {
    teamDid,
    role: roleName,
    expireTime,
    remark,
    sourceAppPid,
    display = null,
    passportExpireTime = null,
    orgId = '',
    inviteUserDids = [],
  },
  context,
  { validatePassportDisplay }
) {
  await api.teamManager.checkEnablePassportIssuance(teamDid);

  if (expireTime && expireTime <= 0) {
    throw new Error('Expire time must be greater than 0');
  }
  if (!roleName) {
    throw new Error('Role cannot be empty');
  }

  if (passportExpireTime && dayjs(passportExpireTime).isBefore(dayjs())) {
    throw new Error('Passport expire time must be greater than current time');
  }

  const roles = await api.getRoles({ teamDid, orgId });
  const role = roles.find((r) => r.name === roleName);
  if (!role) {
    throw new Error(`Role does not exist: ${roleName}`);
  }
  await validatePassportDisplay(role, display);

  if (remark && remark.length > 50) {
    throw new Error('Remark length should NOT be more than 50 characters');
  }

  const { user } = context;
  if (!user || !user.did) {
    throw new Error('Inviter does not exist');
  }

  // 如果邀请加入组织，则不验证 role 和 passport
  if (!orgId && (user?.role || '').startsWith('blocklet-')) {
    const userInfo = await api.getUser({ teamDid, user });
    validateUserRolePassport({
      role: (user?.role || '').replace('blocklet-', ''),
      passports: userInfo?.passports || [],
    });
  }

  const expireDate = Date.now() + (expireTime || api.memberInviteExpireTime);
  const state = await api.getSessionState(teamDid);
  const { id: inviteId } = await state.start({
    type: 'invite',
    role: roleName,
    remark,
    expireDate,
    inviter: user,
    teamDid,
    orgId,
    inviteUserDids,
    sourceAppPid,
    display,
    passportExpireTime,
  });

  logger.info('Create invite member', { role: roleName, user, inviteId, display });

  return {
    inviteId,
    role: roleName,
    remark,
    expireDate: new Date(expireDate).toString(),
    inviter: user,
    teamDid,
    sourceAppPid,
    display,
  };
}

/**
 * Get invitation
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.inviteId - Invite ID
 * @returns {Promise<Object|null>}
 */
async function getInvitation(api, { teamDid, inviteId }) {
  if (!teamDid || !inviteId) {
    return null;
  }

  const state = await api.getSessionState(teamDid);
  const invitation = await state.read(inviteId);
  if (!invitation) {
    return null;
  }

  return {
    inviteId: invitation.id,
    role: invitation.role,
    remark: invitation.remark,
    expireDate: new Date(invitation.expireDate).toString(),
    inviter: invitation.inviter,
    teamDid: invitation.teamDid,
    status: invitation.status,
    receiver: invitation.receiver,
    sourceAppPid: invitation.sourceAppPid || null,
    display: invitation.display || null,
    orgId: invitation.orgId || null,
    inviteUserDids: invitation.inviteUserDids || [],
    passportExpireTime: invitation.passportExpireTime || null,
  };
}

/**
 * Get invitations
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Function} params.filter - Filter function
 * @param {string} params.orgId - Org ID
 * @param {Object} context
 * @returns {Promise<Array>}
 */
async function getInvitations(api, { teamDid, filter, orgId = '' }, context = {}) {
  const state = await api.getSessionState(teamDid);
  let invitations = [];
  if (orgId) {
    const org = await api.getOrg({ teamDid, id: orgId }, context);
    const { user } = context;
    if (!org) {
      throw new CustomError(404, `Org does not exist: ${orgId}`);
    }
    if (org.ownerDid !== user?.did) {
      throw new CustomError(403, `You are not the owner of the org: ${orgId}`);
    }
  }
  const query = { type: 'invite' };
  if (orgId) {
    query['__data.orgId'] = orgId;
  } else {
    query.$or = [{ '__data.orgId': { $exists: false } }, { '__data.orgId': '' }];
  }
  invitations = await state.find(query);

  return invitations.filter(filter || ((x) => x.status !== 'success')).map((d) => ({
    inviteId: d.id,
    role: d.role,
    remark: d.remark,
    expireDate: new Date(d.expireDate).toString(),
    inviter: d.inviter,
    teamDid: d.teamDid,
    status: d.status,
    receiver: d.receiver,
    sourceAppPid: d.sourceAppPid || null,
    display: d.display || null,
    orgId: d.orgId || null,
    inviteUserDids: d.inviteUserDids || [],
    passportExpireTime: d.passportExpireTime || null,
  }));
}

/**
 * Delete invitation
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.inviteId - Invite ID
 * @returns {Promise<boolean>}
 */
async function deleteInvitation(api, { teamDid, inviteId }) {
  if (!inviteId) {
    throw new Error('InviteId cannot be empty');
  }

  const state = await api.getSessionState(teamDid);
  await state.end(inviteId);

  logger.info('Delete invite session', { inviteId });

  return true;
}

/**
 * Check invitation
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.inviteId - Invite ID
 * @returns {Promise<Object>}
 */
async function checkInvitation(api, { teamDid, inviteId }) {
  const state = await api.getSessionState(teamDid);

  const invitation = await state.read(inviteId);

  if (!invitation) {
    throw new Error(`The invitation does not exist: ${inviteId}`);
  }

  const { role, expireDate, remark } = invitation;

  if (Date.now() > expireDate) {
    logger.error('Invite id has expired', { inviteId, expireAt: new Date(expireDate) });

    throw new Error(`The invitation has expired: ${inviteId}`);
  }

  const roles = await api.getRoles({ teamDid });
  const orgRoles = await api.getRoles({ teamDid, orgId: invitation.orgId });
  const allRoles = [...roles, ...orgRoles];
  if (!allRoles.some((r) => r.name === role)) {
    throw new Error(`Role does not exist: ${role}`);
  }

  return {
    role,
    remark,
  };
}

/**
 * Close invitation
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.inviteId - Invite ID
 * @param {string} params.status - Status
 * @param {Object} params.receiver - Receiver
 * @param {boolean} params.isOrgInvite - Is org invite
 * @param {number} params.timeout - Timeout
 * @returns {Promise<void>}
 */
async function closeInvitation(api, { teamDid, inviteId, status, receiver, isOrgInvite, timeout = 30 * 1000 }) {
  const state = await api.getSessionState(teamDid);

  const invitation = await state.read(inviteId);

  if (!invitation) {
    throw new Error(`The invitation does not exist: ${inviteId}`);
  }
  let shouldRemoveInviteSession = false;
  if (isOrgInvite && invitation?.inviteUserDids?.length > 0) {
    const unReceiverUserDids = invitation.inviteUserDids.filter((did) => did !== receiver.did);
    shouldRemoveInviteSession = unReceiverUserDids.length === 0;
    await state.update(inviteId, {
      receiver,
      inviteUserDids: unReceiverUserDids,
      ...(shouldRemoveInviteSession ? { status } : {}),
    });
  } else {
    await state.update(inviteId, { status, receiver });
    shouldRemoveInviteSession = true;
  }

  if (shouldRemoveInviteSession) {
    setTimeout(async () => {
      try {
        logger.info('Invitation session closed', { inviteId });
        await state.end(inviteId);
      } catch (error) {
        logger.error('close invitation failed', { error });
      }
    }, timeout);
  }
}

/**
 * Create transfer invitation (server owner transfer)
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.remark - Remark
 * @param {Object} context
 * @param {Object} deps - Dependencies
 * @returns {Promise<Object>}
 */
function createTransferInvitation(api, { teamDid, remark }, context = {}, deps) {
  return createMemberInvitation(
    api,
    { teamDid, expireTime: api.transferOwnerExpireTime, remark, role: 'owner' },
    context,
    deps
  );
}

/**
 * Create transfer app owner session
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.appDid - App DID
 * @param {string} params.remark - Remark
 * @returns {Promise<Object>}
 */
async function createTransferAppOwnerSession(api, { appDid, remark = '' }) {
  const expireTime = api.transferOwnerExpireTime;

  await api.teamManager.checkEnableTransferAppOwner(appDid);

  if (remark && remark.length > 50) {
    throw new Error('Remark length should NOT be more than 50 characters');
  }

  const expireDate = Date.now() + expireTime;
  const state = await api.getSessionState(appDid);
  const { id: transferId } = await state.start({
    type: 'transfer-app-owner',
    remark,
    expireDate,
    appDid,
  });

  logger.info('createTransferAppOwnerSession', { appDid, transferId });

  return {
    transferId,
    remark,
    expireDate: new Date(expireDate).toString(),
    appDid,
    status: 'created',
  };
}

/**
 * Get transfer app owner session
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.appDid - App DID
 * @param {string} params.transferId - Transfer ID
 * @returns {Promise<Object|null>}
 */
async function getTransferAppOwnerSession(api, { appDid, transferId }) {
  if (!appDid || !transferId) {
    return null;
  }

  const state = await api.getSessionState(appDid);

  const transfer = await state.read(transferId);
  if (!transfer) {
    return null;
  }

  return formatTransferData(transfer);
}

/**
 * Check transfer app owner session
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.appDid - App DID
 * @param {string} params.transferId - Transfer ID
 * @returns {Promise<Object>}
 */
async function checkTransferAppOwnerSession(api, { appDid, transferId }) {
  const state = await api.getSessionState(appDid);

  const transfer = await state.read(transferId);

  if (!transfer) {
    throw new Error(`The transfer session does not exist: ${transferId}`);
  }

  const { expireDate } = transfer;

  if (Date.now() > expireDate) {
    logger.error('Transfer session has expired', { transferId, expireAt: new Date(expireDate) });

    throw new Error(`The transfer session has expired: ${transferId}`);
  }

  return formatTransferData(transfer);
}

/**
 * Close transfer app owner session
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.appPid - App PID
 * @param {string} params.transferId - Transfer ID
 * @param {string} params.status - Status
 * @param {number} params.timeout - Timeout
 * @returns {Promise<void>}
 */
async function closeTransferAppOwnerSession(api, { appPid, transferId, status, timeout = 30 * 1000 }) {
  const state = await api.getSessionState(appPid);

  const session = await state.read(transferId);

  if (!session) {
    throw new Error(`The transfer app owner session does not exist: ${transferId}`);
  }

  await state.update(transferId, { status });

  setTimeout(async () => {
    try {
      await state.end(transferId);
      logger.info('Transfer session closed', { transferId });
    } catch (error) {
      logger.error('close transfer session failed', { transferId, error });
    }
  }, timeout);
}

module.exports = {
  formatTransferData,
  createMemberInvitation,
  getInvitation,
  getInvitations,
  deleteInvitation,
  checkInvitation,
  closeInvitation,
  createTransferInvitation,
  createTransferAppOwnerSession,
  getTransferAppOwnerSession,
  checkTransferAppOwnerSession,
  closeTransferAppOwnerSession,
};
