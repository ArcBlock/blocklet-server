const pick = require('lodash/pick');
const remove = require('lodash/remove');
const isNil = require('lodash/isNil');
const uniqBy = require('lodash/uniqBy');
const { joinURL } = require('ufo');
const pLimit = require('p-limit');
const pRetry = require('p-retry');
const pMap = require('p-map');
const logger = require('@abtnode/logger')('@abtnode/core:blocklet:manager:federated');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const { FEDERATED, USER_PROFILE_SYNC_FIELDS, WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const normalizePathPrefix = require('@abtnode/util/lib/normalize-path-prefix');
const {
  callFederated,
  syncFederated: _syncFederated,
  getFederatedMaster,
  generateSiteInfo,
  findFederatedSite,
  safeGetFederated,
  shouldSyncFederated,
  getUserAvatarUrl,
} = require('@abtnode/auth/lib/util/federated');
const { BlockletEvents, BlockletInternalEvents } = require('@blocklet/constant');

const states = require('../../../states');
const request = require('../../../util/request');

/**
 * Join federated login
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function joinFederatedLogin(manager, { appUrl, did }, context) {
  const url = new URL(appUrl);
  // master service api 的地址
  url.pathname = joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/api/federated/join');

  const blocklet = await manager.getBlocklet(did);
  const nodeInfo = await states.node.read();
  const blockletInfo = getBlockletInfo(blocklet, nodeInfo.sk);
  const domainAliases = await manager.getDomainAliases({ blocklet, nodeInfo });
  const { permanentWallet } = blockletInfo;
  const memberSite = {
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
    did: permanentWallet.address,
    pk: permanentWallet.publicKey,
    serverId: nodeInfo.did,
    serverVersion: nodeInfo.version,
    version: blockletInfo.version,
  };

  logger.info('Apply to join federated login', {
    memberSite: pick(memberSite, ['appId', 'appPid', 'appName', 'appDescription', 'appUrl']),
    masterAppUrl: appUrl,
  });

  let data;
  try {
    const result = await pRetry(
      () =>
        request.post(url.href, {
          // 初次申请时，member 不在站点群中，不需要对数据进行加密
          site: memberSite,
        }),
      { retries: 3 }
    );
    data = result.data;
  } catch (error) {
    const errorMsg = error?.response?.data;
    logger.error('Failed to join federated login', { error, errorMsg, did, url: url.href });
    throw new Error(errorMsg || 'Failed to join federated login');
  }

  await states.blockletExtras.setSettings(blocklet.appPid, {
    federated: {
      config: {
        appId: blocklet.appDid,
        appPid: blocklet.appPid,
        isMaster: false,
      },
      sites: data.sites,
    },
  });

  const newState = await manager.getBlocklet(did);
  manager.emit(BlockletInternalEvents.appSettingChanged, { appDid: did });
  manager.emit(BlockletEvents.updated, { ...newState, context });
  return newState;
}

/**
 * Quit federated login
 * member 退出统一登录站点群
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {string} params.did - blocklet pid
 * @param {string} [params.targetDid] - 要退出的目标 blocklet pid, 如果未设置，则代表退出自身
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function quitFederatedLogin(manager, { did, targetDid }, context) {
  const blocklet = await manager.getBlocklet(did);
  const masterSite = getFederatedMaster(blocklet);
  if (masterSite) {
    // master 可以指定删除一个 member
    if (masterSite.appPid === did && targetDid && targetDid !== did) {
      const memberSite = findFederatedSite(blocklet, targetDid);

      if (memberSite) {
        await manager.syncFederated({
          did,
          data: {
            sites: [
              {
                ...memberSite,
                action: 'delete',
              },
            ],
          },
        });
        try {
          const nodeInfo = await states.node.read();
          const blockletInfo = getBlockletInfo(blocklet, nodeInfo.sk);
          const { permanentWallet } = blockletInfo;
          await callFederated({
            action: 'disband',
            permanentWallet,
            site: memberSite,
            data: {},
          });
        } catch (error) {
          logger.error('Failed to disband memberSite', {
            error,
            did,
            memberSite,
          });
        }
        const federated = safeGetFederated(blocklet, { isMaster: true });
        remove(federated.sites, (item) => item.appPid === targetDid);
        await states.blockletExtras.setSettings(blocklet.appPid, { federated });
      }
    } else {
      // member 向 mater 申请退出
      const nodeInfo = await states.node.read();
      const blockletInfo = getBlockletInfo(blocklet, nodeInfo.sk);
      const { permanentWallet } = blockletInfo;
      logger.info('Quit federated login', {
        memberSite: {
          appId: blocklet.appDid,
          appPid: blocklet.appPid,
          appName: blockletInfo.name,
          appDescription: blockletInfo.description,
          appUrl: blockletInfo.appUrl,
        },
        masterAppUrl: masterSite.appUrl,
      });
      try {
        await callFederated({
          action: 'quit',
          site: masterSite,
          permanentWallet,
          data: {
            memberPid: blocklet.appPid,
          },
        });
      } catch (error) {
        logger.error('Failed to quit blocklet, will still quit federated by itself', { error, did });
      }
      await states.blockletExtras.setSettings(blocklet.appPid, {
        federated: null,
      });
    }
  } else {
    await states.blockletExtras.setSettings(blocklet.appPid, {
      federated: null,
    });
  }

  const newState = await manager.getBlocklet(did);
  manager.emit(BlockletInternalEvents.appSettingChanged, { appDid: did });
  manager.emit(BlockletEvents.updated, { ...newState, context });
  return newState;
}

/**
 * Disband federated login
 * master 解散统一登录站点群
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {string} params.did - blocklet pid
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function disbandFederatedLogin(manager, { did }, context) {
  const blocklet = await manager.getBlocklet(did);
  const federated = safeGetFederated(blocklet, { isMaster: true });
  const masterSite = getFederatedMaster(blocklet);
  // 只有 Master 可以调用这个逻辑
  if (masterSite?.appPid === did) {
    const nodeInfo = await states.node.read();
    const blockletInfo = getBlockletInfo(blocklet, nodeInfo.sk);
    const { permanentWallet } = blockletInfo;
    logger.info('Disband federated login', {
      memberSite: {
        appId: blocklet.appDid,
        appPid: blocklet.appPid,
        appName: blockletInfo.name,
        appDescription: blockletInfo.description,
        appUrl: blockletInfo.appUrl,
      },
      masterAppUrl: masterSite.appUrl,
    });
    const limitSync = pLimit(FEDERATED.SYNC_LIMIT);

    const disbandQueue = federated.sites
      .filter((item) => item.appPid !== did)
      .map((item) => {
        return limitSync(async () => {
          try {
            await callFederated({
              action: 'disband',
              permanentWallet,
              site: item,
              data: {},
            });
          } catch (error) {
            logger.error('Failed to notify member disband', {
              error,
              did,
              memberSite: item,
            });
          }
        });
      });
    await Promise.all(disbandQueue);
    await states.blockletExtras.setSettings(blocklet.appPid, {
      federated: null,
    });
  }
  const newState = await manager.getBlocklet(did);
  manager.emit(BlockletInternalEvents.appSettingChanged, { appDid: did });
  manager.emit(BlockletEvents.updated, { ...newState, context });
  return newState;
}

/**
 * Set federated config
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {string} params.did - blocklet pid
 * @param {Object} params.config - federated 配置内容
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function setFederated(manager, { did, config }, context) {
  await states.blockletExtras.setSettings(did, { federated: config });

  const newBlockletState = await manager.getBlocklet(did);
  manager.emit(BlockletInternalEvents.appSettingChanged, { appDid: did });
  manager.emit(BlockletEvents.updated, { ...newBlockletState, context });
  return newBlockletState;
}

/**
 * Audit federated login
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {string} params.did - master blocklet pid
 * @param {string} params.memberPid - member blocklet pid
 * @param {'approved'|'revoked'|'rejected'} params.status - member blocklet status
 * @returns {Promise<Object>}
 */
async function auditFederatedLogin(manager, { memberPid, did, status }) {
  const blocklet = await manager.getBlocklet(did);
  const teamDid = blocklet.appPid;

  const federated = safeGetFederated(blocklet, { isMaster: true });
  const memberSite = federated.sites.find((item) => item.appPid === memberPid);
  memberSite.status = status;
  if (isNil(federated.config.isMaster)) {
    const masterSite = federated.sites.find((item) => item.appPid === teamDid);

    masterSite.isMaster = true;
    federated.config.isMaster = true;
  }
  // 有审批操作的一方，自动成为 master
  const newState = await setFederated(manager, {
    did: teamDid,
    config: federated,
  });
  logger.info('Audit member join federated login', {
    memberSite: pick(memberSite, ['appId', 'appPid', 'appName', 'appDescription', 'appUrl']),
    status,
  });

  const nodeInfo = await states.node.read();
  const { permanentWallet } = getBlockletInfo(blocklet, nodeInfo.sk);

  if (status === 'approved') {
    // 必须先通知所有成员站点，该站点已经成功加入，后续该站点才能成功拉取所有站点的信息
    await manager.syncFederated({
      did,
      data: {
        sites: [
          {
            ...memberSite,
            action: 'upsert',
          },
        ],
      },
    });
  }

  try {
    await callFederated({
      action: 'audit-res',
      permanentWallet,
      site: memberSite,
      data: {
        masterPid: teamDid,
        status,
      },
    });
  } catch (error) {
    logger.error('Failed to post audit result to member site', { error, did });
    throw error;
  }
  return newState;
}

/**
 * Update user info and sync federated
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {string} params.teamDid - master blocklet pid
 * @param {Object} params.updated - 更新后的用户信息
 * @returns {Promise<void>}
 */
async function updateUserInfoAndSyncFederated(manager, { teamDid, updated }) {
  try {
    const { sourceAppPid } = updated;
    const blocklet = await manager.getBlocklet(teamDid);

    const masterSite = getFederatedMaster(blocklet);
    if (shouldSyncFederated(blocklet, sourceAppPid)) {
      const data = pick(updated, USER_PROFILE_SYNC_FIELDS);
      if (data.avatar) {
        data.avatar = getUserAvatarUrl(data.avatar, blocklet);
      }

      await manager.syncFederated({
        did: blocklet.appPid,
        userFields: USER_PROFILE_SYNC_FIELDS,
        data: {
          users: [
            {
              ...data,
              action: 'syncProfile',
              sourceAppPid: sourceAppPid || masterSite.appPid,
            },
          ],
        },
      });
    }
  } catch (error) {
    logger.error('Failed to update user info and sync federated', {
      teamDid,
      sourceAppPid: updated.sourceAppPid,
      userDid: updated.did,
      error,
    });
  }
}

/**
 * Update user extra
 * @param {Object} manager - BlockletManager instance
 * @param {Object} args
 * @returns {Promise<Object>}
 */
async function updateUserExtra(manager, args) {
  try {
    if (args.extra) {
      try {
        args.extra = JSON.parse(args.extra);
      } catch (err) {
        throw new Error('extra should be a valid json string');
      }
    }

    const updated = await manager.teamAPI.updateUser({
      teamDid: args.teamDid,
      user: pick(args, ['did', 'remark', 'extra']),
    });

    // 异步更新站点群其他站点的用户信息
    updateUserInfoAndSyncFederated(manager, { teamDid: args.teamDid, updated });

    return updated;
  } catch (err) {
    logger.error('Failed to update user extra', { err });
    throw err;
  }
}

/**
 * Update user info and sync
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {string} params.teamDid
 * @param {Object} params.user
 * @returns {Promise<Object>}
 */
async function updateUserInfoAndSync(manager, { teamDid, user }, { generateUserUpdateData }) {
  try {
    const existingUser = await manager.teamAPI.getUser({ teamDid, user: { did: user.did } });
    if (!existingUser) {
      throw new Error('User not found');
    }
    const updateData = generateUserUpdateData(user, existingUser);
    const updated = await manager.teamAPI.updateUser({ teamDid, user: updateData });

    // 异步更新站点群其他站点的用户信息
    updateUserInfoAndSyncFederated(manager, { teamDid, updated });

    return updated;
  } catch (err) {
    logger.error('user profile sync failed', { err });
    throw err;
  }
}

/**
 * Sync federated
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @returns {Promise<Array>}
 */
async function syncFederated(manager, { did, data, syncSites, allowStatus, userFields, siteFields } = {}) {
  if (!did) {
    logger.error('SyncFederated failed: did is required');
    return [];
  }
  const blocklet = await manager.getBlocklet(did);
  if (!blocklet) {
    logger.error(`SyncFederated failed: Blocklet not found for did: ${did}`);
    return [];
  }

  const nodeInfo = await states.node.read();
  const result = await _syncFederated({
    blocklet,
    data,
    syncSites,
    allowStatus,
    userFields,
    siteFields,
    nodeInfo,
  });
  return result;
}

/**
 * Login federated
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @returns {Promise<Object>}
 */
async function loginFederated(manager, { did, site, data }) {
  const blocklet = await manager.getBlocklet(did);
  const nodeInfo = await states.node.read();
  const { permanentWallet } = getBlockletInfo(blocklet, nodeInfo.sk);
  const result = await callFederated({
    action: 'loginByMaster',
    data,
    permanentWallet,
    site,
  });
  return result;
}

/**
 * Sync master authorization
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @returns {Promise<Object>}
 */
async function syncMasterAuthorization(manager, { did }) {
  // 1. 获取 master 的站点信息
  // 2. 向 master 请求 Authorization 数据
  // 3. 更新 delegation 和 roles 映射
  const blocklet = await manager.getBlocklet(did);
  const teamDid = blocklet.appPid;
  const masterSite = getFederatedMaster(blocklet);
  const nodeInfo = await states.node.read();
  const blockletInfo = getBlockletInfo(blocklet, nodeInfo.sk);
  const { permanentWallet } = blockletInfo;
  const result = await callFederated({
    action: 'getMasterAuthorization',
    permanentWallet,
    site: masterSite,
  });
  const { delegation, roles } = result;

  const trustedPassports = blocklet.trustedPassports || [];
  // NOTICE: 当前仅在可信列表中不包含 master 站点时执行添加操作
  const hasTrustedPassport = trustedPassports.find((item) => item.issuerDid === masterSite.appPid);
  if (!hasTrustedPassport) {
    // NOTICE: teamAPI.configTrustedPassports 和 teamManager.configTrustedPassports 传参的格式是不一样的
    await manager.teamAPI.configTrustedPassports({
      teamDid,
      trustedPassports: [
        ...trustedPassports,
        {
          issuerDid: masterSite.appPid,
          remark: 'Generated on join federated login',
          mappings: roles.map((item) => {
            return {
              from: { passport: item.name },
              to: { role: 'guest' },
            };
          }),
        },
      ],
    });
  }

  const federated = safeGetFederated(blocklet);
  federated.config.delegation = delegation;

  const newBlockletState = await setFederated(manager, {
    did: teamDid,
    config: federated,
  });

  return newBlockletState;
}

/**
 * Sync federated config
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @returns {Promise<Object>}
 */
async function syncFederatedConfig(manager, { did }) {
  const blocklet = await manager.getBlocklet(did);
  const teamDid = blocklet.appPid;
  const masterSite = getFederatedMaster(blocklet);
  const federated = safeGetFederated(blocklet);
  const nodeInfo = await states.node.read();
  const domainAliases = await manager.getDomainAliases({ blocklet, nodeInfo });
  const selfConfig = await generateSiteInfo({ nodeInfo, blocklet, domainAliases });
  const { permanentWallet } = getBlockletInfo(blocklet, nodeInfo.sk);

  const isSelfMaster = masterSite?.appPid === teamDid;

  let siteInfoList = [];
  if (isSelfMaster) {
    siteInfoList = await pMap(
      // FIXME: 需要对 sites 做一次去重处理
      uniqBy(federated.sites, 'appPid'),
      async (item) => {
        if (item.appPid === teamDid) {
          return {
            ...selfConfig,
            status: item.status,
            isMaster: isSelfMaster ? true : item.isMaster,
          };
        }

        try {
          const siteItemConfig = await callFederated({
            action: 'getConfig',
            permanentWallet,
            site: item,
            data: {},
          });
          return {
            ...siteItemConfig,
            status: item.status,
            isMaster: isSelfMaster ? false : item.isMaster,
          };
        } catch (error) {
          logger.error('Failed to get site info, use outdate site-info', {
            error,
            site: item,
          });
          return item;
        }
      },
      { concurrency: FEDERATED.SYNC_LIMIT }
    );
  } else {
    siteInfoList = await callFederated({
      action: 'pullFederatedSites',
      permanentWallet,
      site: masterSite,
      data: {},
    });
  }
  federated.sites = siteInfoList;

  const newBlockletState = await setFederated(manager, {
    did: teamDid,
    config: federated,
  });
  if (isSelfMaster) {
    await syncFederated(manager, {
      did,
      data: {
        sites: siteInfoList.filter((x) => !['pending'].includes(x.status)).map((x) => ({ ...x, action: 'upsert' })),
      },
    });
  } else {
    await syncFederated(manager, {
      did,
      data: {
        sites: [{ ...selfConfig, action: 'upsert' }],
      },
    });
  }
  return newBlockletState;
}

module.exports = {
  joinFederatedLogin,
  quitFederatedLogin,
  disbandFederatedLogin,
  setFederated,
  auditFederatedLogin,
  updateUserInfoAndSyncFederated,
  updateUserExtra,
  updateUserInfoAndSync,
  syncFederated,
  loginFederated,
  syncMasterAuthorization,
  syncFederatedConfig,
};
