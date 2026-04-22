const { joinURL } = require('ufo');
const logger = require('@abtnode/logger')('@abtnode/core:api:team:user-auth');
const { ROLES } = require('@abtnode/constant');
const { TeamEvents } = require('@blocklet/constant');

/**
 * Send new member notification
 * @param {Object} api - TeamAPI instance
 * @param {Object} user - User
 * @param {Object} nodeInfo - Node info
 * @returns {Promise<void>}
 */
async function sendNewMemberNotification(api, user, nodeInfo) {
  if (nodeInfo.nodeOwner && user.did !== nodeInfo.nodeOwner.did) {
    const actionPath = '/team/members';
    const action = process.env.NODE_ENV === 'production' ? joinURL(nodeInfo.routing.adminPath, actionPath) : actionPath;
    await api.teamManager.createNotification({
      title: 'New member join',
      description: `User with Name (${user.fullName}) and DID (${user.did}) has joined this server`,
      entityType: 'node',
      action,
      entityId: user.did,
      severity: 'success',
    });
  }
}

/**
 * Login user
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.user - User
 * @param {boolean} params.notify - Send notification
 * @param {boolean} params.force - Force login
 * @returns {Promise<Object>}
 */
async function loginUser(api, { teamDid, user: _user, notify = true, force = false }) {
  const state = await api.getUserState(teamDid);
  const nodeInfo = await api.node.read();

  const user = {
    // default createdByAppPid is current blocklet teamDid, unless userData has createdByAppPid
    createdByAppPid: teamDid,
    ..._user,
  };

  if (user.role === ROLES.OWNER) {
    if (teamDid !== nodeInfo.did && !force) {
      throw new Error('Cannot add user of owner role');
    }
    if (await state.count({ role: ROLES.OWNER })) {
      throw new Error('The owner already exists');
    }
  }

  const { _action, ...doc } = await state.loginUser(user);
  if (_action === 'update') {
    logger.info('user updated successfully', { teamDid, userDid: user.did });
    api.emit(TeamEvents.userUpdated, { teamDid, user: doc });
  } else if (_action === 'add') {
    api.createDefaultOrgForUser({ teamDid, user });

    if (teamDid === nodeInfo.did && nodeInfo.nodeOwner && user.did !== nodeInfo.nodeOwner.did && notify) {
      await sendNewMemberNotification(api, user, nodeInfo);
    }

    logger.info('user added successfully', { teamDid, userDid: user.did, userPk: user.pk, userName: user.fullName });
    api.emit(TeamEvents.userAdded, { teamDid, user: doc });
  }
  return doc;
}

/**
 * Disconnect user account
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.connectedAccount - Connected account
 * @returns {Promise<Object>}
 */
async function disconnectUserAccount(api, { teamDid, connectedAccount }) {
  const state = await api.getUserState(teamDid);
  const result = await state.disconnectUserAccount(connectedAccount);

  logger.info('user disconnect account successfully', {
    teamDid,
    connectedAccountDid: connectedAccount.did,
    connectedAccountPk: connectedAccount.pk,
    connectedAccountProvider: connectedAccount.provider,
  });
  return result;
}

/**
 * Add user
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.user - User
 * @param {boolean} params.force - Force add
 * @returns {Promise<Object>}
 */
async function addUser(api, { teamDid, user, force = false }) {
  const state = await api.getUserState(teamDid);

  if (user.role === ROLES.OWNER) {
    const nodeInfo = await api.node.read();

    if (teamDid !== nodeInfo.did && !force) {
      throw new Error('Cannot add user of owner role');
    }

    if (await state.count({ role: ROLES.OWNER })) {
      throw new Error('The owner already exists');
    }
  }

  const doc = await state.addUser(user);

  logger.info('user added successfully', { teamDid, userDid: user.did, userPk: user.pk, userName: user.fullName });

  const nodeInfo = await api.node.read();
  if (teamDid === nodeInfo.did && nodeInfo.nodeOwner && user.did !== nodeInfo.nodeOwner.did) {
    await sendNewMemberNotification(api, user, nodeInfo);
  }

  api.emit(TeamEvents.userAdded, { teamDid, user: doc });

  return doc;
}

module.exports = {
  sendNewMemberNotification,
  loginUser,
  disconnectUserAccount,
  addUser,
};
