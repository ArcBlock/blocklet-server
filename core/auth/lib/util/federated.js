const {
  WELLKNOWN_SERVICE_PATH_PREFIX,
  USER_AVATAR_URL_PREFIX,
  USER_AVATAR_PATH_PREFIX,
  FEDERATED,
  SITE_SYNC_FIELDS,
  USER_PROFILE_SYNC_FIELDS,
} = require('@abtnode/constant');
const { Joi } = require('@arcblock/validator');
const pRetry = require('p-retry');
const { joinURL } = require('ufo');
const { normalizePathPrefix } = require('@blocklet/meta/lib/normalize-path-prefix');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const { getSignData } = require('@blocklet/sdk/lib/util/verify-sign');
const cloneDeep = require('@abtnode/util/lib/deep-clone');
const defaults = require('lodash/defaults');
const pick = require('lodash/pick');
const isUndefined = require('lodash/isUndefined');
const pLimit = require('p-limit');

const request = require('./request');
const logger = require('../logger');

const federatedEnvSchema = Joi.object({
  sigVersion: Joi.string().optional().allow('').default(''),
  masterAppUrl: Joi.string().optional().allow('').default(''),
}).unknown(true);

function isMaster(site) {
  return site?.isMaster !== false;
}

function getUserAvatarUrl(avatar, blocklet) {
  let avatarUrl = avatar;
  if (avatar && avatar.startsWith(USER_AVATAR_URL_PREFIX)) {
    avatarUrl = joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, USER_AVATAR_PATH_PREFIX, avatarUrl.split('/').slice(-1)[0]);

    const appUrl = blocklet.environmentObj.BLOCKLET_APP_URL;
    avatarUrl = joinURL(appUrl, avatarUrl);
  }
  return avatarUrl;
}

function getFederatedEnabled(blocklet) {
  if (!blocklet) {
    return false;
  }
  const master = getFederatedMaster(blocklet);
  // 如果当前应用是 master，则代表未开启统一登录
  if (!master || master.appPid === blocklet.appPid) {
    return false;
  }

  const member = findFederatedSite(blocklet, blocklet.appPid);
  return member?.status === 'approved';
}

function getFederatedMaster(blocklet) {
  const { sites } = blocklet?.settings?.federated || {};
  const masterSite = (sites || []).find((item) => isMaster(item));
  return masterSite || null;
}

function getFederatedMembers(blocklet, status = 'approved') {
  const { sites } = blocklet?.settings?.federated || {};
  return (sites || []).filter((item) => {
    if (isMaster(item)) return false;
    if (status === null) return true;

    return item.status === status;
  });
}

function shouldSyncFederated(blocklet, sourceAppPid) {
  if (sourceAppPid) {
    return true;
  }

  const masterSite = getFederatedMaster(blocklet);
  return !!(masterSite && blocklet && masterSite.appPid === blocklet.appPid);
}

function findFederatedSite(blocklet, targetAppPid) {
  const { sites } = blocklet?.settings?.federated || {};
  const targetSite = (sites || []).find((item) => item.appPid === targetAppPid);
  return targetSite || null;
}

/**
 * 获取统一登录站点的环境信息
 * @param {object} options.site
 * @returns {Promise<{sigVersion: string; masterAppUrl: string} | null>}
 */
async function getFederatedSiteEnv({ site }) {
  const defaultEnv = null;
  try {
    const url = joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/api/federated/env');
    const { data: result } = await request.get(url, { baseURL: site.appUrl });
    const { value, error } = federatedEnvSchema.validate(result);
    if (error) {
      logger.error('Federated site env is invalid', {
        error,
        site,
        result,
      });
      return defaultEnv;
    }

    return value;
  } catch (error) {
    logger.error('Failed to get federated site env', {
      error,
      site,
    });
    return defaultEnv;
  }
}

function safeGetFederated(blocklet, { isMaster: _isMaster = false } = {}) {
  const defaultConfig = {
    appId: blocklet.appDid,
    appPid: blocklet.appPid,
  };
  if (_isMaster === false) {
    defaultConfig.isMaster = false;
  }
  const federated = defaults(cloneDeep(blocklet.settings.federated || {}), {
    config: defaultConfig,
    sites: [],
  });
  return federated;
}

/**
 * Calls a federated service with the specified action and data.
 *
 * @param {Object} options - The options for the federated call.
 * @param {Object} options.site - The site object containing the appUrl.
 * @param {Object} options.permanentWallet - The wallet object containing the address and secretKey.
 * @param {string} options.action - The action to be performed by the federated service.
 * @param {Object} [options.data={}] - The data to be sent with the request.
 * @returns {Promise<Object>} - The result data from the federated service.
 *
 * @throws {Error} - Throws an error if the request fails after the specified number of retries.
 */
async function callFederated({ site, permanentWallet, action, data = {}, customUrl, requestOptions = {} } = {}) {
  const url = customUrl || joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, `/api/federated/${action}`);
  let requestFn = () => {};
  const { exp, iat, sig, version } = await getSignData(
    { data, method: 'post', url },
    {
      appSk: permanentWallet.secretKey,
    }
  );
  requestFn = request.post(url, data, {
    ...requestOptions,
    baseURL: site.appUrl,
    headers: {
      'x-blocklet-sig': sig,
      'x-blocklet-sig-pk': permanentWallet.publicKey,
      'x-blocklet-sig-iat': iat,
      'x-blocklet-sig-exp': exp,
      'x-blocklet-sig-version': version,
    },
  });
  const result = await pRetry(() => requestFn, { retries: 3 });
  return result.data;
}

function generateSiteInfo({ nodeInfo, blocklet, domainAliases }) {
  const blockletInfo = getBlockletInfo(blocklet, nodeInfo.sk);
  const siteInfo = {
    appId: blocklet.appDid,
    appPid: blocklet.appPid,
    aliasDid: (blocklet.migratedFrom || []).map((x) => x.appDid),
    appName: blockletInfo.name,
    appDescription: blockletInfo.description,
    appUrl: blockletInfo.appUrl,
    aliasDomain: domainAliases.map((x) => x.value),
    appLogo:
      blocklet.environmentObj.BLOCKLET_APP_LOGO ||
      normalizePathPrefix(joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/blocklet/logo')) ||
      '/',
    appLogoRect: blocklet.environmentObj.BLOCKLET_APP_LOGO_RECT,
    did: blockletInfo.permanentWallet.address,
    pk: blockletInfo.permanentWallet.publicKey,
    serverId: nodeInfo.did,
    serverVersion: nodeInfo.version,
    version: blocklet.meta.version,
  };
  return siteInfo;
}

async function migrateFederatedAccount({ blocklet, blockletInfo, fromUserDid, toUserDid, toUserPk }) {
  const masterSite = getFederatedMaster(blocklet);
  const { permanentWallet } = blockletInfo;
  const result = await callFederated({
    action: 'migrateAccount',
    site: masterSite,
    permanentWallet,
    data: { fromUserDid, toUserDid, toUserPk },
  });
  return result;
}

/**
 * 同步统一登录站点群信息
 * 可同步的信息包括：站点成员列表（全量）、站点成员信息（增量）
 * @param {object} options
 * @param {object} options.blocklet - 当前 blocklet 数据
 * @param {object} options.data - 需要同步的数据
 * @param {Array} [options.data.users] - 需要同步的数据(用户)
 * @param {Array} [options.data.sites] - 需要同步的数据(站点)
 * @param {Array} [options.nodeInfo] - 当前 blocklet-server 的 info
 * @returns
 */
async function syncFederated({
  data = {},
  syncSites,
  allowStatus = ['approved', 'revoked'],
  userFields = USER_PROFILE_SYNC_FIELDS,
  siteFields = SITE_SYNC_FIELDS,
  nodeInfo,
  blocklet,
} = {}) {
  const federated = safeGetFederated(blocklet);

  const safeData = {};
  const { users, sites } = data;
  if (users && Array.isArray(users)) {
    safeData.users = users.map((item) => pick(item, userFields));
  }

  if (sites && Array.isArray(sites)) {
    safeData.sites = sites.map((item) => pick(item, siteFields));
  }

  const { permanentWallet } = getBlockletInfo(blocklet, nodeInfo.sk);
  const limitSync = pLimit(FEDERATED.SYNC_LIMIT);

  const waitingList = federated.sites
    .filter((item) => !item.status || allowStatus.includes(item.status))
    .filter((item) => {
      // 未指定 syncSites 向全员通知（除了自己）
      if (isUndefined(syncSites)) {
        // 排除通知自己
        return item.appPid !== blocklet.appPid;
      }
      // 如果指定了要通知的站点，则按指定的站点来过滤
      if (Array.isArray(syncSites)) {
        return syncSites.some((x) => x.appPid === item.appPid);
      }
      return false;
    })
    .map(async (item) => {
      const resultItem = await limitSync(async () => {
        try {
          // NOTICE: 即使通知某个站点失败了，也不影响其他站点接收同步结果
          const result = await callFederated({
            action: 'sync',
            permanentWallet,
            site: item,
            data: safeData,
          });
          logger.info('Sync federated sites successfully', {
            action: 'sync',
            site: item,
            data: safeData,
          });
          return result;
        } catch (error) {
          logger.error('Failed to sync federated sites', {
            error,
            action: 'sync',
            site: item,
            data: safeData,
          });
          return null;
        }
      });
      return {
        site: item,
        result: resultItem,
      };
    });
  const resultList = await Promise.all(waitingList);
  return resultList;
}

module.exports = {
  callFederated,
  syncFederated,
  getFederatedSiteEnv,
  getUserAvatarUrl,
  shouldSyncFederated,
  getFederatedEnabled,
  getFederatedMaster,
  getFederatedMembers,
  findFederatedSite,
  generateSiteInfo,
  isMaster,
  safeGetFederated,
  migrateFederatedAccount,
};
