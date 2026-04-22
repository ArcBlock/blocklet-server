const {
  WELLKNOWN_SERVICE_PATH_PREFIX,
  FEDERATED,
  PASSPORT_STATUS,
  USER_PROFILE_SYNC_FIELDS,
} = require('@abtnode/constant');
const { signV2 } = require('@arcblock/jwt');
const isNil = require('lodash/isNil');
const pick = require('lodash/pick');
const remove = require('lodash/remove');
const pLimit = require('p-limit');
const pMap = require('p-map');

const { LOGIN_PROVIDER, SIG_VERSION, USER_SESSION_STATUS } = require('@blocklet/constant');
const { getAvatarByUrl, extractUserAvatar } = require('@abtnode/util/lib/user');
const { getApplicationInfo, messages } = require('@abtnode/auth/lib/auth');
const {
  callFederated,
  generateSiteInfo,
  getFederatedSiteEnv,
  safeGetFederated,
} = require('@abtnode/auth/lib/util/federated');
const { fromAppDid } = require('@arcblock/did-ext');

const logger = require('../libs/logger')('blocklet-services:federated');
const initJwt = require('../libs/jwt');
const { createTokenFn, getDidConnectVersion } = require('../util');
const ensureBlocklet = require('../middlewares/ensure-blocklet');
const {
  getUserAvatarUrl,
  getFederatedMaster,
  getUserWithinFederated,
  getTrustedDomains,
} = require('../util/federated');
const { declareAccount, migrateAccount } = require('../services/oauth/client');
const { checkFederatedCall } = require('../middlewares/check-federated');

const PREFIX = WELLKNOWN_SERVICE_PATH_PREFIX;
const prefixApi = `${PREFIX}/api/federated`;

function getAuditLogActorByFederatedSite(blocklet) {
  return {
    did: blocklet.appPid,
    fullName: blocklet.appName,
    role: 'blocklet',
  };
}

async function syncSwitchProfile(user, { node, teamDid, dataDir, fields = USER_PROFILE_SYNC_FIELDS }) {
  const tempUser = pick(user, fields);

  // 处理 avatar
  if (tempUser.avatar) {
    try {
      tempUser.avatar = await getAvatarByUrl(tempUser.avatar);
      tempUser.avatar = await extractUserAvatar(tempUser.avatar, { dataDir });
    } catch (err) {
      logger.error('Failed to convert user avatar', { error: err });
    }
  }

  await node.updateUser({
    teamDid,
    user: tempUser,
  });
}

/**
 * 处理站点群中某一站点推送的同步 connectAccount 的请求
 */
async function syncConnectAccount(user, { node, teamDid, dataDir, blocklet, verifySite }) {
  const tempUser = pick(user, [
    'did',
    'pk',
    'avatar',
    'fullName',
    'email',
    'phone',
    'url',
    'connectedAccount',
    'sourceAppPid',
    'inviter',
    'emailVerified',
    'phoneVerified',
  ]);
  const masterSite = getFederatedMaster(blocklet);

  // 处理 avatar
  if (tempUser.avatar) {
    try {
      tempUser.avatar = await getAvatarByUrl(tempUser.avatar);
      tempUser.avatar = await extractUserAvatar(tempUser.avatar, { dataDir });
    } catch (err) {
      logger.error('Failed to convert user avatar', { error: err });
    }
  }

  // NOTICE: 如果当前站点不是 master，就需要考虑该 member 需要向 master 请求同步一次指定账户，因为指定账户可能存在于站点群，而不存在于当前站点中的情况
  if (masterSite.appPid !== teamDid) {
    // If user exist on master, it won't be add createdByAppPid field, it's reasonable
    await getUserWithinFederated(
      {
        sourceAppPid: tempUser.sourceAppPid,
        teamDid,
        userDid: tempUser.did,
        userPk: tempUser.pk,
      },
      { blocklet, node }
    );
  }

  tempUser.createdByAppPid = verifySite.appPid;

  await node.loginUser({
    teamDid,
    user: tempUser,
    notify: false,
  });
}

async function syncDisconnectAccount(user, { node, teamDid, blocklet }) {
  const { disconnectedAccount, sourceAppPid, did, pk } = user;
  const masterSite = getFederatedMaster(blocklet);
  if (masterSite.appPid !== teamDid) {
    await getUserWithinFederated(
      {
        sourceAppPid,
        teamDid,
        userDid: did,
        userPk: pk,
      },
      { blocklet, node }
    );
  }

  await node.disconnectUserAccount({
    teamDid,
    connectedAccount: disconnectedAccount,
  });
}

function syncUserProfile(user, { node, teamDid, dataDir }) {
  return syncSwitchProfile(user, { node, teamDid, dataDir, fields: USER_PROFILE_SYNC_FIELDS });
}

function banUser(user, { node, teamDid }) {
  logger.info('SyncFederated: ban user', { userDid: user.did, teamDid });
  return node.updateUserApproval({
    teamDid,
    user: { did: user.did, approved: false },
    options: {
      includeFederated: false,
    },
  });
}

function unbanUser(user, { node, teamDid }) {
  logger.info('SyncFederated: unban user', { userDid: user.did, teamDid });
  return node.updateUserApproval({
    teamDid,
    user: { did: user.did, approved: true },
    options: {
      includeFederated: false,
    },
  });
}

/**
 * member 站点向 master 站点请求拉取一个用户信息
 */

const syncUserFnMaps = {
  // 用户更换 profile 通知
  switchProfile: syncSwitchProfile,
  // 用户绑定第三方登录
  connectAccount: syncConnectAccount,
  // 用户解绑第三方登录
  disconnectAccount: syncDisconnectAccount,
  // 用户同步 profile
  syncProfile: syncUserProfile,
  ban: banUser,
  unban: unbanUser,
};

module.exports = {
  init(server, node, options) {
    // =============================== 以下为公开的接口 ===============================

    // 获取当前站点所有可信的域名
    server.get(`${prefixApi}/getTrustedDomains`, ensureBlocklet(), async (req, res) => {
      const { blocklet } = req;
      const result = await getTrustedDomains({ node, req, blocklet });
      res.json(result);
    });

    server.get(`${prefixApi}/env`, ensureBlocklet(), (req, res) => {
      const { blocklet } = req;
      const masterSite = getFederatedMaster(blocklet);
      const result = {
        sigVersion: SIG_VERSION.DEFAULT,
        masterAppUrl: masterSite?.appUrl,
      };
      res.json(result);
    });

    // step 1 申请加入(member 向 master 申请)
    // member 发起（master 不能发起），master 处理该路由
    server.post(`${prefixApi}/join`, ensureBlocklet(), async (req, res) => {
      const { blocklet } = req;
      const { site } = req.body;
      const teamDid = blocklet.appPid;

      const federated = safeGetFederated(blocklet, { isMaster: true });
      const exists = federated.sites.find((x) => x.appPid === site.appPid);
      // 1. 检查当前站点群的数据中是否有目标站点
      if (exists) {
        logger.error("already in a federated site group, don't need join again", {
          teamDid,
          site,
        });
        res.status(401).send("already in a federated site group, don't need join again");
        return;
      }

      // 1. 检查目标站点自身是否已加入其他的站点群
      const siteEnv = await getFederatedSiteEnv({
        site: {
          appUrl: site.appUrl,
        },
      });
      if (!siteEnv) {
        logger.error('Failed to get federated site env', {
          site,
        });
        res.status(500).send("Can't get federated site env, please try again later");
        return;
      }
      if (siteEnv?.masterAppUrl) {
        logger.error('Already in a federated site group, please quit federated site group first', {
          siteEnv,
          site,
        });
        res.status(401).send('Already in a federated site group, please quit federated site group first');
        return;
      }

      // 当前站点未形成站点群，需要先生成 master 的相关信息
      if (federated.sites.length === 0) {
        const nodeInfo = await req.getNodeInfo();
        const domainAliases = await node.getBlockletDomainAliases({ blocklet, nodeInfo });
        const masterSite = await generateSiteInfo({ blocklet, domainAliases, nodeInfo });
        federated.sites = [masterSite];
      }

      if (site) {
        federated.sites.push({
          ...site,
          appliedAt: new Date(),
          status: 'pending',
          isMaster: false,
        });
      }
      // member 申请后，将 member 展示在列表中
      // 更新的是自己，此时还不用通知其他的子成员站点
      const newBlockletState = await node.setFederated({
        did: teamDid,
        config: federated,
      });

      await node.createAuditLog(
        {
          action: 'requestJoinFederated',
          args: { teamDid, memberSite: site },
          context: {
            user: getAuditLogActorByFederatedSite(site),
          },
          result: newBlockletState,
        },
        node
      );

      // 将新增的数据返回给 member，只返回 master 和申请成员，待审核通过后，才能获取所有的成员站点信息
      const result = federated.sites.filter((x) => [teamDid, site.appPid].includes(x.appPid));
      res.json({
        sites: result,
      });
    });

    // =============================== 以下为需要鉴权的接口 ===============================

    // ------------------------------- 以下为仅 member 可以发起的请求 -------------------------------

    // member 向 master 请求退出统一登录，然后 master 把情况同步给所有成员站点
    // member 发起（master 不能发起），master 处理该路由 (member -> master)
    server.post(
      `${prefixApi}/quit`,
      ensureBlocklet(),
      checkFederatedCall({ mode: 'memberToMaster', allowStatus: ['approved', 'rejected', 'pending'] }),
      async (req, res) => {
        const { blocklet, verifySite } = req;
        const teamDid = blocklet.appPid;

        const federated = safeGetFederated(blocklet, { isMaster: true });
        const [removedSite] = remove(federated.sites, (item) => item.appPid === verifySite.appPid);

        const { permanentWallet } = await req.getBlockletInfo();
        const limitSync = pLimit(FEDERATED.SYNC_LIMIT);

        const waitingList = federated.sites
          // 排除 master 和请求退出的 member
          .filter((item) => ![teamDid, verifySite.appPid].includes(item.appPid))
          .map((item) => {
            return limitSync(async () => {
              // NOTICE: 即使通知其他 member 失败了，也不影响来源 member 退出统一登录
              try {
                await callFederated({
                  action: 'sync',
                  site: item,
                  data: { sites: [{ action: 'delete', appPid: verifySite.appPid }] },
                  permanentWallet,
                });
              } catch (error) {
                logger.error('Failed to sync federated member', {
                  error,
                  did: blocklet.appDid,
                  action: 'quit',
                  siteItem: item,
                });
              }
            });
          });
        await Promise.all(waitingList);

        const newState = await node.setFederated({
          did: teamDid,
          config: federated,
        });

        await node.createAuditLog(
          {
            action: 'quitFederated',
            args: { memberSite: removedSite, teamDid },
            context: {
              user: getAuditLogActorByFederatedSite(removedSite),
            },
            result: newState,
          },
          node
        );

        res.status(204).send();
      }
    );

    // member 向 master 申请第三方账号的 migrate
    // member 发起（master 不能发起），master 处理该路由 (member -> master)
    server.post(
      `${prefixApi}/migrateAccount`,
      ensureBlocklet(),
      checkFederatedCall({ mode: 'memberToMaster' }),
      async (req, res) => {
        try {
          const { blocklet, verifySite, verifyData } = req;
          const { did: teamDid, wallet: blockletWallet } = await req.getBlockletInfo();
          const { fromUserDid, toUserDid, toUserPk } = verifyData;
          const oauthUser = await node.getUser({ teamDid, user: { did: fromUserDid } });
          const connectedAccounts = oauthUser?.connectedAccounts || [];
          const sourceProvider = oauthUser?.sourceProvider;
          const oauthAccount = connectedAccounts.find((item) => item.provider === sourceProvider);
          const userWallet = fromAppDid(oauthAccount.id, blockletWallet.secretKey);

          const bindUser = {
            did: toUserDid,
            pk: toUserPk,
          };
          await declareAccount({ wallet: userWallet, blocklet });
          await migrateAccount({ wallet: userWallet, blocklet, user: bindUser });
          await node.createAuditLog(
            {
              action: 'migrateFederatedAccount',
              args: { fromUserDid, toUserDid, callerSite: verifySite, teamDid },
              context: {
                user: getAuditLogActorByFederatedSite(verifySite),
              },
            },
            node
          );
          res.status(204).send();
        } catch (error) {
          logger.error('Failed to migrate federated account', { error });
          res.status(500).send(error.message);
        }
      }
    );

    // member 向 master 索取 delegation 和 roles 列表
    // member 发起（master 不能发起），master 处理该路由 (member -> master)
    server.post(
      `${prefixApi}/getMasterAuthorization`,
      ensureBlocklet(),
      checkFederatedCall({ mode: 'memberToMaster' }),
      async (req, res) => {
        const { blocklet, verifySite } = req;
        const teamDid = blocklet.appPid;
        const { permanentWallet } = await req.getBlockletInfo();
        const delegation = await signV2(permanentWallet.address, permanentWallet.secretKey, {
          // HACK: 钱包签名使用的始终是最新的，这里的 dalegation 也保持 agentDid 就是当前应用最新的 did(appId)
          agentDid: `did:abt:${verifySite.appId}`,
          permissions: [
            {
              role: 'DIDConnectAgent',
              claims: [
                'authPrincipal',
                'profile',
                'signature',
                'prepareTx',
                'agreement',
                'verifiableCredential',
                'asset',
                'assetOrVC',
                'keyPair',
                // 'encryptionKey',  // 备份还原应用时使用
              ],
            },
          ],
          exp: Math.floor(new Date().getTime() / 1000) + 86400 * 365 * 100, // valid for 100 year
        });
        const roleList = await node.getRoles({ teamDid });
        const roles = roleList.map((item) => pick(item, ['name', 'title', 'description']));
        res.json({ delegation, roles });
      }
    );

    server.post(
      `${prefixApi}/pullFederatedSites`,
      ensureBlocklet(),
      checkFederatedCall({ mode: 'memberToMaster' }),
      (req, res) => {
        const { blocklet } = req;
        const federated = safeGetFederated(blocklet, { isMaster: true });
        const result = federated.sites.filter((x) => !['pending'].includes(x.status));
        res.json(result);
      }
    );

    server.post(
      `${prefixApi}/pullAccount`,
      ensureBlocklet(),
      checkFederatedCall({ mode: 'memberToMaster' }),
      async (req, res) => {
        const { blocklet, verifyData } = req;
        const { users } = verifyData;
        const result = await pMap(
          users,
          async (user) => {
            const teamDid = blocklet.appPid;
            const currentUser = await node.getUser({
              teamDid,
              user: {
                did: user.did,
              },
              options: {
                enableConnectedAccount: true,
              },
            });

            if (!currentUser) return null;

            const syncUser = pick(currentUser, [
              'did',
              'pk',
              'fullName',
              'email',
              'phone',
              'url',
              'remark',
              'sourceProvider',
              'locale',
              'approved',
              'extra',
              'sourceAppPid',
              'inviter',
              'emailVerified',
              'phoneVerified',
              'createdByAppPid',
            ]);
            syncUser.avatar = getUserAvatarUrl(currentUser.avatar, blocklet);
            syncUser.email = syncUser.email || '';
            syncUser.connectedAccounts = currentUser.connectedAccounts.map((x) => {
              const connectAccount = pick(x, ['did', 'pk', 'provider', 'id', 'userInfo']);
              if (!connectAccount.id) {
                delete connectAccount.id;
              }
              return connectAccount;
            });
            return syncUser;
          },
          { concurrency: FEDERATED.SYNC_LIMIT }
        );

        res.json(result);
      }
    );

    // ------------------------------- 以下为仅 master 可以发起的请求 -------------------------------

    // master 通知 member 当前统一登录要解散
    // master 发起（member 不能发起），member 处理该路由 (master -> member)
    server.post(
      `${prefixApi}/disband`,
      ensureBlocklet(),
      checkFederatedCall({ mode: 'masterToMember' }),
      async (req, res) => {
        const { blocklet, verifySite } = req;
        const teamDid = blocklet.appPid;

        const newState = await node.setFederated({
          did: teamDid,
          config: null,
        });
        await node.createAuditLog(
          {
            action: 'disbandFederated',
            args: { blocklet, masterSite: verifySite, teamDid },
            context: {
              user: getAuditLogActorByFederatedSite(verifySite),
            },
            result: newState,
          },
          node
        );
        res.status(204).send();
      }
    );

    // step 2 审批(master 申批 member)
    // core/state/lib/blocklet/manager/disk.js -> auditFederatedLogin
    // audit-res 接受 master 的处理结果同步
    // master 发起（member 不能发起），member 处理该路由 (master -> member)
    server.post(
      `${prefixApi}/audit-res`,
      ensureBlocklet(),
      checkFederatedCall({
        mode: 'masterToMember',
      }),
      async (req, res) => {
        const { blocklet, verifySite, verifyData } = req;
        const { status } = verifyData;
        const teamDid = blocklet.appPid;
        if (['approved', 'revoked'].includes(status)) {
          await node.syncMasterAuthorization({ did: teamDid });
          await node.syncFederatedConfig({ did: teamDid });
        } else if (status === 'rejected') {
          const federated = safeGetFederated(blocklet);
          const selfSite = federated.sites?.find((x) => x.appPid === teamDid);
          if (selfSite) {
            selfSite.status = 'rejected';
            await node.setFederated({
              did: teamDid,
              config: federated,
            });
          }
        }

        await node.createAuditLog(
          {
            action: 'auditFederated',
            args: { masterSite: verifySite, status, teamDid },
            context: {
              user: getAuditLogActorByFederatedSite(verifySite),
            },
            result: blocklet,
          },
          node
        );
        res.status(204).send();
      }
    );

    // 用于在 master 站点登录页面获取 member 登录的 token
    // master 发起（member 不能发起），member 处理该路由 (master -> member)
    server.post(
      `${prefixApi}/loginByMaster`,
      ensureBlocklet(),
      checkFederatedCall({ mode: 'masterToMember' }),
      async (req, res) => {
        const { blocklet, verifySite, verifyData } = req;
        const { passport, user, walletOS, provider } = verifyData;
        const { createSessionToken } = initJwt(node, Object.assign({}, options));
        const createToken = createTokenFn(createSessionToken);
        const { secret } = await req.getBlockletInfo();
        const teamDid = blocklet.appPid;

        const sessionConfig = blocklet.settings?.session || {};
        const prevUser = await getUserWithinFederated(
          {
            teamDid,
            sourceAppPid: verifySite.appPid,
            userDid: user.did,
            userPk: user.pk,
          },
          {
            node,
            blocklet,
          }
        );
        if (prevUser?.approved === false) {
          res.status(401).json({ error: messages.notAllowedAppUser[req.blockletLocale] });
          return;
        }
        // HACK: member 调用 master 时，将 passport 的 role 还原为 master 中原有的 role
        const targetPassport = passport?.id
          ? (prevUser?.passports || []).find((item) => item.id === passport.id)
          : null;
        if (targetPassport?.status === PASSPORT_STATUS.EXPIRED) {
          res.status(401).json({ error: messages.passportExpired[req.blockletLocale] });
          return;
        }
        if (targetPassport?.status === PASSPORT_STATUS.REVOKED) {
          res.status(401).json({
            error: messages.passportRevoked[req.blockletLocale](targetPassport.title, targetPassport.issuer?.name),
          });
          return;
        }

        // HACK: 用户在 master 中存在时，不更新任何用户信息；不存在时，将新增一个用户
        const filterUserInfo = prevUser ? {} : user;
        if (filterUserInfo.avatar) {
          let avatar = await getAvatarByUrl(filterUserInfo.avatar);
          const nodeInfo = await req.getNodeInfo();

          const { dataDir } = await getApplicationInfo({ node, nodeInfo, teamDid });
          avatar = await extractUserAvatar(avatar, { dataDir });
          filterUserInfo.avatar = avatar;
        }
        const realDid = prevUser?.did || user.did;
        const realPk = prevUser?.pk || user.pk;
        const newUser = await node.loginUser({
          teamDid,
          user: {
            ...filterUserInfo,
            did: realDid,
            pk: realPk,
            passport: targetPassport,
            sourceAppPid: verifySite.appPid,
            connectedAccount: {
              provider: provider || LOGIN_PROVIDER.WALLET,
              did: user.did,
              pk: user.pk,
            },
          },
        });

        const { sessionToken, refreshToken } = createToken(
          user.did,
          {
            secret,
            passport: targetPassport,
            role: targetPassport?.role || 'guest',
            fullName: newUser.fullName,
            provider: provider || LOGIN_PROVIDER.WALLET,
            walletOS,
            sourceAppPid: verifySite.appPid,
            emailVerified: newUser.emailVerified,
            phoneVerified: newUser.phoneVerified,
          },
          {
            ...sessionConfig,
            didConnectVersion: getDidConnectVersion(req),
          }
        );

        await node.createAuditLog(
          {
            action: 'loginByMaster',
            args: { masterSite: verifySite, teamDid },
            context: {
              user: newUser,
            },
            result: blocklet,
          },
          node
        );

        res.json({ sessionToken, refreshToken });
      }
    );

    // ------------------------------- 以下为站点群内可以互相发起的请求 -------------------------------

    // step 3 同步站点群信息(master 向 member 广播站点群信息，广播请求在 manager/disk.js 文件中 class FederatedBlockletManager 发起 )
    // 站点群互相可以任意获取
    server.post(`${prefixApi}/sync`, ensureBlocklet(), checkFederatedCall(), async (req, res) => {
      const { blocklet, verifySite, verifyData } = req;
      const teamDid = blocklet.appPid;
      const { users = null, sites = null, userSessions = null } = verifyData;
      const resultData = {
        users: [],
        sites: [],
        userSessions: [],
      };

      // sites 支持增量更新
      if (!isNil(sites)) {
        const limitSync = pLimit(FEDERATED.SYNC_LIMIT);
        const pendingSiteList = [];
        const federated = safeGetFederated(blocklet);
        for (const site of sites) {
          const { action, ...siteItem } = site;
          const findIndex = federated.sites.findIndex((x) => x.appPid === siteItem.appPid);
          const isMyself = siteItem.appPid === teamDid;
          if (action === 'update') {
            if (findIndex > -1) {
              Object.assign(federated.sites[findIndex], siteItem);
            }
          } else if (action === 'upsert') {
            if (findIndex > -1) {
              Object.assign(federated.sites[findIndex], siteItem);
            } else {
              federated.sites.push(siteItem);
            }
            // 不允许增加自己，也不允许删除自己
          } else if (!isMyself) {
            if (action === 'add') {
              if (findIndex === -1) {
                federated.sites.push(siteItem);
              }
            } else if (action === 'delete') {
              if (findIndex > -1) {
                federated.sites.splice(findIndex, 1);
              }
            }
          }
        }
        pendingSiteList.push(
          limitSync(async () => {
            try {
              await node.setFederated({
                did: teamDid,
                config: federated,
              });
            } catch (error) {
              logger.error('failed to update federated sites', {
                error,
                teamDid,
                sites,
              });
            }
          })
        );
        const resList = await Promise.all(pendingSiteList);
        resultData.sites = resList;
      }

      // users 支持增量更新
      if (!isNil(users)) {
        if (Array.isArray(users)) {
          const limitSync = pLimit(FEDERATED.SYNC_LIMIT);
          const pendingUserList = [];
          const nodeInfo = await req.getNodeInfo();
          const { dataDir } = await getApplicationInfo({ node, nodeInfo, teamDid });
          for (const user of users) {
            pendingUserList.push(
              limitSync(async () => {
                try {
                  const result = await syncUserFnMaps[user.action]?.(
                    {
                      ...user,
                      sourceAppPid: user.sourceAppPid === teamDid ? null : user.sourceAppPid,
                    },
                    { node, teamDid, dataDir, blocklet, verifySite }
                  );
                  return result;
                } catch (error) {
                  logger.error('failed to update federated users', {
                    error,
                    user,
                  });
                }

                return null;
              })
            );
          }
          const resList = await Promise.all(pendingUserList);
          resultData.users = resList;
        }
      }

      // userSessions 支持增量更新
      if (!isNil(userSessions)) {
        if (Array.isArray(userSessions)) {
          const pendingUserSessionList = [];
          const limitSync = pLimit(FEDERATED.SYNC_LIMIT);
          for (const userSession of userSessions) {
            const { action, ...userSessionItem } = userSession;
            pendingUserSessionList.push(
              limitSync(async () => {
                try {
                  if (action === 'login') {
                    const result = await node.upsertUserSession(
                      {
                        ...userSessionItem,
                        teamDid,
                        status: USER_SESSION_STATUS.ONLINE,
                        createdByAppPid: verifySite.appPid,
                      },
                      // 统一登录站点接收的会话变更，不发送通知
                      { skipNotification: true }
                    );
                    return result;
                  }
                  if (action === 'logout') {
                    const result = await node.logoutUser({
                      ...userSessionItem,
                      teamDid,
                    });
                    return result;
                  }
                } catch (error) {
                  logger.error('failed to update federated userSession', {
                    error,
                    action,
                    userSessionItem,
                    teamDid,
                  });
                }
                return null;
              })
            );
          }
          const resList = await Promise.all(pendingUserSessionList);
          resultData.userSessions = resList;
        }
      }

      logger.debug('Sync federated:', {
        users,
        sites,
        userSessions,
        teamDid,
        verifySite,
      });

      res.json(resultData);
    });

    // 获取指定 passportId 的内容
    // 站点群互相可以任意获取
    server.post(`${prefixApi}/getPassport`, ensureBlocklet(), checkFederatedCall(), async (req, res) => {
      const { blocklet, verifyData } = req;
      const teamDid = blocklet.appPid;
      const { passportId } = verifyData;
      const result = await node.getPassportById({ teamDid, passportId });
      res.json(result);
    });

    server.post(`${prefixApi}/getConfig`, ensureBlocklet(), checkFederatedCall(), async (req, res) => {
      const { blocklet } = req;
      const nodeInfo = await node.getNodeInfo();
      const domainAliases = await node.getBlockletDomainAliases({ blocklet, nodeInfo });

      const siteInfo = await generateSiteInfo({ nodeInfo, blocklet, domainAliases });
      res.json(siteInfo);
    });

    // 用于 member 向 master 获取指定 sub 用户的共公开钱包信息
    server.post(`${prefixApi}/getUser`, ensureBlocklet(), checkFederatedCall(), async (req, res) => {
      const { verifyData } = req;
      const { userSub } = verifyData;
      if (!userSub) {
        res.status(400).json({ error: 'missing userSub' });
        return;
      }
      const { wallet: blockletWallet } = await req.getBlockletInfo();
      const userWallet = fromAppDid(userSub, blockletWallet.secretKey);
      res.json({
        wallet: pick(userWallet, ['type', 'publicKey', 'address']),
      });
    });
  },
};
