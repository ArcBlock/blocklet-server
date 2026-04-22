const { joinURL } = require('ufo');
const isEmpty = require('lodash/isEmpty');
const logger = require('@abtnode/logger')('@abtnode/core:api:team:passport');
const {
  WELLKNOWN_SERVICE_PATH_PREFIX,
  PASSPORT_LOG_ACTION,
  PASSPORT_SOURCE,
  PASSPORT_ISSUE_ACTION,
  NOTIFICATION_SEND_CHANNEL,
  MAIN_CHAIN_ENDPOINT,
} = require('@abtnode/constant');
const { isValid: isValidDid } = require('@arcblock/did');
const { BlockletEvents, TeamEvents } = require('@blocklet/constant');
const { sendToUser } = require('@blocklet/sdk/lib/util/send-notification');
const {
  createPassportVC,
  createPassport,
  upsertToPassports,
  createUserPassport,
} = require('@abtnode/auth/lib/passport');
const { formatError } = require('@blocklet/error');
const { getPassportStatusEndpoint, getApplicationInfo } = require('@abtnode/auth/lib/auth');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const { getUserAvatarUrl, getAppAvatarUrl } = require('@abtnode/util/lib/user');
const { getChainClient } = require('@abtnode/util/lib/get-chain-client');
const { getWalletDid } = require('@blocklet/meta/lib/did-utils');
const axios = require('@abtnode/util/lib/axios');

const { validateTrustedPassportIssuers } = require('../../validators/trusted-passport');
const { validateTrustedFactories } = require('../../validators/trusted-factory');
const { getBlocklet } = require('../../util/blocklet');
const { passportDisplaySchema } = require('../../validators/util');

/**
 * Send passport VC notification to user wallet
 * @param {Object} params
 * @param {string} params.userDid - User DID
 * @param {Object} params.appWallet - App wallet
 * @param {string} params.locale - Locale
 * @param {Object} params.vc - VC
 * @param {Object} params.notification - Notification
 */
const sendPassportVcNotification = ({ userDid, appWallet: wallet, locale, vc, notification }) => {
  try {
    const receiver = userDid;
    const sender = { appDid: wallet.address, appSk: wallet.secretKey };
    const message = { ...notification };
    if (!message.title) {
      message.title = {
        en: 'Receive a Passport',
        zh: '获得通行证',
      }[locale];
    }
    if (!message.body) {
      message.body = {
        en: 'You got a passport',
        zh: '你获得了一张通行证',
      }[locale];
    }
    if (!message.attachments) {
      message.attachments = [
        {
          type: 'vc',
          data: {
            credential: vc,
            tag: vc.credentialSubject.passport.name,
          },
        },
      ];
    }

    sendToUser(receiver, message, sender, { channels: [NOTIFICATION_SEND_CHANNEL.WALLET] }).catch((error) => {
      logger.error('Failed send passport vc to wallet', { error });
    });
  } catch (error) {
    logger.error('Failed send passport vc to wallet', { error });
  }
};

/**
 * Validate passport display
 * @param {Object} role - Role
 * @param {Object} display - Display
 */
const validatePassportDisplay = async (role, display) => {
  if (role.extra?.display === 'custom') {
    if (!display) {
      throw new Error(`display is required for custom passport: ${role.name}`);
    }
    const { error, value } = passportDisplaySchema.validate(display);
    if (error) {
      throw new Error(`display invalid for custom passport: ${formatError(error)}`);
    }

    if (value.type === 'url') {
      try {
        const res = await axios.head(value.content, {
          timeout: 8000,
          maxRedirects: 8,
          validateStatus: null,
          headers: {
            Accept: 'image/avif,image/webp,image/png,image/svg+xml,image/*,*/*;q=0.8',
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', // prettier-ignore
          },
        });
        if (res.status >= 400) {
          throw new Error(`Passport display is not accessible: ${res.statusText}`);
        }
        const contentType = res.headers['content-type'];
        if (!contentType?.startsWith('image/')) {
          throw new Error(`Passport display does not return valid image: ${contentType}`);
        }
      } catch (err) {
        throw new Error(`Error validating passport display: ${err.message}`);
      }
    }
  }
};

/**
 * Issue passport to user
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.userDid - User DID
 * @param {string} params.role - Role name
 * @param {Object} params.display - Display settings
 * @param {boolean} params.notify - Notify user
 * @param {Object} params.notification - Notification
 * @param {string} params.action - Action
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function issuePassportToUser(
  api,
  { teamDid, userDid, role: roleName, display = null, notify = true, notification, action = '' },
  context = {}
) {
  try {
    // eslint-disable-next-line no-param-reassign
    notification = JSON.parse(notification);
  } catch {
    logger.error('Failed to parse notification, use notification as undefined', { notification });
  }
  const { locale = 'en' } = context;

  const userState = await api.getUserState(teamDid);
  // NOTICE: issuePassportToUser 必须传入 wallet did，无需查询 connectedAccount
  const user = await userState.getUser(userDid);

  if (!user) {
    throw new Error(`user does not exist: ${userDid}`);
  }

  if (!user.approved) {
    throw new Error(`the user is revoked: ${userDid}`);
  }

  const rbac = await api.getRBAC(teamDid);
  const role = await rbac.getRole(roleName);

  if (!role) {
    throw new Error(`passport does not exist: ${roleName}`);
  }

  await validatePassportDisplay(role, display);

  // create vc
  const nodeInfo = await api.node.read();
  const {
    wallet,
    passportColor,
    appUrl,
    name: issuerName,
  } = await getApplicationInfo({
    teamDid,
    nodeInfo,
    node: {
      dataDirs: api.dataDirs,
      getSessionSecret: api.nodeAPI?.getSessionSecret?.bind(api.nodeAPI) || (() => 'abc'),
      getBlocklet: () => getBlocklet({ did: teamDid, states: api.states, dataDirs: api.dataDirs }),
    },
  });

  const result = await createPassport({ role });
  const vc = await createPassportVC({
    issuerName,
    issuerWallet: wallet,
    issuerAvatarUrl: getAppAvatarUrl(appUrl),
    ownerDid: userDid,
    endpoint: getPassportStatusEndpoint({
      baseUrl: joinURL(appUrl, WELLKNOWN_SERVICE_PATH_PREFIX),
      userDid: user.did,
      teamDid,
    }),
    ownerProfile: {
      ...user,
      avatar: getUserAvatarUrl(appUrl, user.avatar),
    },
    preferredColor: passportColor,
    passport: result.passport,
    types: result.types,
    purpose: teamDid === nodeInfo.did || isEmpty(result.types) ? 'login' : 'verification',
    display,
  });

  // write passport to db
  const passport = createUserPassport(vc, { role: role.name, display, source: PASSPORT_SOURCE.ISSUE });

  user.passports = upsertToPassports(user.passports || [], passport);
  await api.updateUser({
    teamDid,
    user: {
      did: user.did,
      pk: user.pk,
      passports: user.passports,
    },
  });

  if (passport && api.passportAPI) {
    await api.passportAPI.createPassportLog(teamDid, {
      passportId: passport.id,
      action: PASSPORT_LOG_ACTION.ISSUE,
      operatorDid: userDid,
      metadata: {
        action: action || 'issue-passport-to-user',
      },
      operatorIp: context?.ip || '',
      operatorUa: context?.ua || '',
    });
  }

  // send vc to wallet
  if (notify) {
    sendPassportVcNotification({ userDid, appWallet: wallet, locale, vc, notification });
  }

  return user;
}

/**
 * Revoke user passport
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.userDid - User DID
 * @param {string} params.passportId - Passport ID
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function revokeUserPassport(api, { teamDid, userDid, passportId } = {}, context = {}) {
  if (!passportId) {
    throw new Error('Revoked passport should not be empty');
  }

  const state = await api.getUserState(teamDid);

  const doc = await state.revokePassportById({ did: userDid, id: passportId });

  // create passport log
  if (api.passportAPI) {
    await api.passportAPI.createPassportLog(teamDid, {
      passportId,
      action: PASSPORT_LOG_ACTION.REVOKE,
      operatorDid: userDid,
      metadata: {
        operator: await state.getUser(userDid).catch(() => null),
      },
      operatorIp: context?.ip || '',
      operatorUa: context?.ua || '',
    });
  }

  logger.info('user passport revoked successfully', { teamDid, userDid, passportId });

  api.emit(TeamEvents.userUpdated, { teamDid, user: doc });
  api.emit(TeamEvents.userPermissionUpdated, { teamDid, user: doc });

  return doc;
}

/**
 * Enable user passport
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.userDid - User DID
 * @param {string} params.passportId - Passport ID
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function enableUserPassport(api, { teamDid, userDid, passportId } = {}, context) {
  if (!passportId) {
    throw new Error('Passport should not be empty');
  }

  const state = await api.getUserState(teamDid);

  const doc = await state.enablePassportById({ did: userDid, id: passportId });

  if (api.passportAPI) {
    await api.passportAPI.createPassportLog(teamDid, {
      passportId,
      action: PASSPORT_LOG_ACTION.APPROVE,
      operatorDid: userDid,
      metadata: {
        operator: await state.getUser(userDid).catch(() => null),
      },
      operatorIp: context?.ip || '',
      operatorUa: context?.ua || '',
    });
  }

  logger.info('user passport enabled successfully', { teamDid, userDid, passportId });

  api.emit(TeamEvents.userUpdated, { teamDid, user: doc });
  api.emit(TeamEvents.userPermissionUpdated, { teamDid, user: doc });

  return doc;
}

/**
 * Remove user passport
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.passportId - Passport ID
 * @param {string} params.userDid - User DID
 * @param {string} params.teamDid - Team DID
 * @returns {Promise<Object>}
 */
async function removeUserPassport(api, { passportId, userDid, teamDid }) {
  if (!passportId) {
    throw new Error('Revoked passport should not be empty');
  }

  const state = await api.getUserState(teamDid);

  const doc = await state.removePassportById({ id: passportId });

  logger.info('user passport remove successfully', { teamDid, userDid, passportId });

  api.emit(TeamEvents.userUpdated, { teamDid, user: doc });
  api.emit(TeamEvents.userPermissionUpdated, { teamDid, user: doc });

  return doc;
}

/**
 * Create passport issuance session
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.ownerDid - Owner DID
 * @param {string} params.name - Passport name
 * @param {Object} params.display - Display settings
 * @param {number} params.passportExpireTime - Passport expire time
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function createPassportIssuance(
  api,
  { teamDid, ownerDid, name, display = null, passportExpireTime = null },
  context = {}
) {
  if (!name) {
    throw new Error('Passport cannot be empty');
  }

  if (!isValidDid(ownerDid)) {
    throw new Error(`ownerDid is invalid: ${ownerDid}`);
  }

  await api.teamManager.checkEnablePassportIssuance(teamDid);

  // passport name is same as role
  const roles = await api.getRoles({ teamDid });
  const role = roles.find((r) => r.name === name);
  if (!role) {
    throw new Error(`Passport does not exist: ${name}`);
  }
  if (role.extra?.display === 'custom') {
    if (!display) {
      throw new Error(`display is required for custom passport: ${name}`);
    }
    const { error } = passportDisplaySchema.validate(display);
    if (error) {
      throw new Error(`display invalid for custom passport: ${formatError(error)}`);
    }
  }

  await validatePassportDisplay(role, display);

  const expireDate = Date.now() + api.memberInviteExpireTime;

  const state = await api.getSessionState(teamDid);

  // 为指定用户颁发通行证，拿到的 did 是永久 did，无需查询 connectedAccount
  const currentUser = await api.getUser({ teamDid, user: { did: ownerDid } });
  const walletDid = getWalletDid(currentUser);
  const userDid = walletDid || ownerDid;
  // 这里可能是为一个不存在的用户创建一个 passport，所以需要额外判断一下
  if (currentUser) {
    // auth0 账户不需要手动领取
    if (walletDid !== ownerDid) {
      const blocklet = await getBlocklet({ did: teamDid, states: api.states, dataDirs: api.dataDirs });
      const nodeInfo = await api.node.read();
      const blockletInfo = getBlockletInfo(blocklet, nodeInfo.sk);
      const { wallet, passportColor, appUrl, name: issuerName } = blockletInfo;
      const result = await createPassport({ role });
      const vc = await createPassportVC({
        issuerName,
        issuerWallet: wallet,
        issuerAvatarUrl: getAppAvatarUrl(appUrl),
        ownerDid: userDid,
        endpoint: getPassportStatusEndpoint({
          baseUrl: joinURL(appUrl, WELLKNOWN_SERVICE_PATH_PREFIX),
          userDid: ownerDid,
          teamDid,
        }),
        ownerProfile: {
          ...currentUser,
          avatar: getUserAvatarUrl(appUrl, currentUser.avatar),
        },
        preferredColor: passportColor,
        display,
        passport: result.passport,
        types: result.types,
        purpose: teamDid === nodeInfo.did || isEmpty(result.types) ? 'login' : 'verification',
      });

      if (walletDid) {
        sendPassportVcNotification({ userDid, appWallet: wallet, locale: 'en', vc });
      }

      // write passport to db
      const passport = createUserPassport(vc, { role: role.name, display, source: PASSPORT_SOURCE.ISSUE });

      const passports = upsertToPassports(currentUser.passports || [], passport);
      await api.updateUser({
        teamDid,
        user: {
          did: currentUser.did,
          pk: currentUser.pk,
          passports,
        },
      });

      if (passport && api.passportAPI) {
        await api.passportAPI.createPassportLog(teamDid, {
          passportId: passport.id,
          action: PASSPORT_LOG_ACTION.ISSUE,
          operatorIp: context?.ip || '',
          operatorUa: context?.ua || '',
          operatorDid: ownerDid,
          metadata: {
            action: PASSPORT_ISSUE_ACTION.ISSUE_ON_AUTH0,
          },
        });
      }

      return undefined;
    }
  }
  const { id } = await state.start({
    type: 'passport-issuance',
    key: userDid,
    expireDate, // session expireDate
    name: role.name,
    title: role.title,
    ownerDid: userDid,
    teamDid,
    display,
    inviter: context?.user,
    passportExpireTime,
  });

  logger.info('Create issuing passport session', { id, passport: name, ownerDid, teamDid });

  return {
    id,
    name: role.name,
    title: role.title,
    expireDate: new Date(expireDate).toString(),
    ownerDid: userDid,
    teamDid,
    display,
  };
}

/**
 * Get passport issuances
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.ownerDid - Owner DID
 * @returns {Promise<Array>}
 */
async function getPassportIssuances(api, { teamDid, ownerDid }) {
  const state = await api.getSessionState(teamDid);

  const query = { type: 'passport-issuance' };

  if (ownerDid) {
    query.key = ownerDid;
  }

  const list = await state.find(query);

  return list.map((d) => ({
    id: d.id,
    name: d.name,
    title: d.title,
    expireDate: new Date(d.expireDate).toString(),
    ownerDid: d.ownerDid,
    teamDid: d.teamDid,
    display: d.display,
  }));
}

/**
 * Get passport issuance
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.sessionId - Session ID
 * @returns {Promise<Object>}
 */
async function getPassportIssuance(api, { teamDid, sessionId }) {
  const state = await api.getSessionState(teamDid);
  const doc = await state.read(sessionId);
  // FIXME: 指定被邀请者的邀请需要查询被邀请者的详细信息
  return doc;
}

/**
 * Process passport issuance
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.sessionId - Session ID
 * @returns {Promise<Object>}
 */
async function processPassportIssuance(api, { teamDid, sessionId }) {
  const state = await api.getSessionState(teamDid);

  const session = await state.read(sessionId);

  if (!session) {
    throw new Error(`The passport issuance session does not exist: ${sessionId}`);
  }

  const { name, ownerDid, expireDate } = session;

  if (Date.now() > expireDate) {
    logger.error('The passport issuance session has expired', { sessionId, expireAt: new Date(expireDate) });
    throw new Error(`The passport issuance session has expired: ${sessionId}`);
  }

  const roles = await api.getRoles({ teamDid });
  if (!roles.find((x) => x.name === name)) {
    throw new Error(`Passport does not exist: ${name}`);
  }

  await state.end(sessionId);

  logger.info('The passport issuance session completed successfully', { sessionId, name, ownerDid });

  return {
    name,
    ownerDid,
  };
}

/**
 * Delete passport issuance
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.sessionId - Session ID
 * @returns {Promise<boolean>}
 */
async function deletePassportIssuance(api, { teamDid, sessionId }) {
  if (!sessionId) {
    throw new Error('SessionId cannot be empty');
  }

  const state = await api.getSessionState(teamDid);
  await state.end(sessionId);

  logger.info('Delete passport issuance session', { sessionId });

  return true;
}

/**
 * Config trusted passports
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Array} params.trustedPassports - Trusted passports
 * @returns {Promise<void>}
 */
async function configTrustedPassports(api, { teamDid, trustedPassports }) {
  const value = await validateTrustedPassportIssuers(trustedPassports);
  await api.teamManager.configTrustedPassports(teamDid, value);
  if (!api.teamManager.isNodeTeam(teamDid)) {
    api.emit(BlockletEvents.updated, { meta: { did: teamDid } });
  }
}

/**
 * Config trusted factories
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Array} params.trustedFactories - Trusted factories
 * @returns {Promise<void>}
 */
async function configTrustedFactories(api, { teamDid, trustedFactories }) {
  const value = await validateTrustedFactories(trustedFactories);

  const client = getChainClient(MAIN_CHAIN_ENDPOINT);
  await Promise.all(
    value.map(async (x) => {
      const { state } = await client.getFactoryState({ address: x.factoryAddress });
      if (!state) {
        throw new Error(`NFT Collection ${x.factoryAddress} not found on ${MAIN_CHAIN_ENDPOINT}`);
      }
    })
  );

  await api.teamManager.configTrustedFactories(teamDid, value);
  if (!api.teamManager.isNodeTeam(teamDid)) {
    api.emit(BlockletEvents.updated, { meta: { did: teamDid } });
  }
}

/**
 * Config passport issuance
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {boolean} params.enable - Enable
 * @returns {Promise<void>}
 */
async function configPassportIssuance(api, { teamDid, enable }) {
  await api.teamManager.configPassportIssuance(teamDid, !!enable);

  if (!api.teamManager.isNodeTeam(teamDid)) {
    api.emit(BlockletEvents.updated, { meta: { did: teamDid } });
  }
}

module.exports = {
  sendPassportVcNotification,
  validatePassportDisplay,
  issuePassportToUser,
  revokeUserPassport,
  enableUserPassport,
  removeUserPassport,
  createPassportIssuance,
  getPassportIssuances,
  getPassportIssuance,
  processPassportIssuance,
  deletePassportIssuance,
  configTrustedPassports,
  configTrustedFactories,
  configPassportIssuance,
};
