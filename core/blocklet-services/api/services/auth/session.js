const nocache = require('nocache');
const { joinURL } = require('ufo');
const { getBlockletLanguages } = require('@blocklet/env/lib/util');
const pick = require('lodash/pick');
const omit = require('lodash/omit');
const omitBy = require('lodash/omitBy');
const merge = require('lodash/merge');
const isEqual = require('lodash/isEqual');
const isUndefined = require('lodash/isUndefined');
const jwtDecode = require('jwt-decode');
const { getTokenFromReq } = require('@abtnode/util/lib/get-token-from-req');
const { verify, decode } = require('@arcblock/jwt');
const {
  WELLKNOWN_SERVICE_PATH_PREFIX,
  USER_AVATAR_URL_PREFIX,
  USER_AVATAR_PATH_PREFIX,
  PASSPORT_STATUS,
} = require('@abtnode/constant');
const { LOGIN_PROVIDER, USER_SESSION_STATUS } = require('@blocklet/constant');
const { signResponse } = require('@blocklet/meta/lib/security');
const getRequestIP = require('@abtnode/util/lib/get-request-ip');
const { getDeviceData } = require('@abtnode/util/lib/device');
const isUrl = require('is-url');
const { DBCache, getAbtNodeRedisAndSQLiteUrl } = require('@abtnode/db-cache');
const createTranslator = require('@abtnode/util/lib/translate');
const getOrigin = require('@abtnode/util/lib/get-origin');
const md5 = require('@abtnode/util/lib/md5');
const { sign } = require('@blocklet/sdk/lib/util/csrf');
const { isAllowedURL } = require('@abtnode/util/lib/ssrf-protector');

const { getAccessWallet } = require('@abtnode/util/lib/blocklet');
const dayjs = require('@abtnode/util/lib/dayjs');
const { createTokenFn, getDidConnectVersion } = require('../../util');
const checkUser = require('../../middlewares/check-user');
const cache = require('../../cache');

const translations = {
  zh: {
    userSessionLogout: '用户会话已退出',
    invalidWebhookType: '无效的 webhook 类型',
    invalidWebhookUrl: '无效的 webhook 地址',
    testWebhookMessage: '这是来自 {did} 的测试消息',
    invalidToken: '无效的 token',
    emptyRefreshToken: 'RefreshToken 不能为空',
  },
  en: {
    userSessionLogout: 'User session is logout',
    invalidWebhookType: 'Invalid webhook type',
    invalidWebhookUrl: 'Invalid webhook url',
    testWebhookMessage: 'This is a test message from user {did}',
    invalidToken: 'Invalid token',
    emptyRefreshToken: 'RefreshToken should not be empty',
  },
};

const t = createTranslator({ translations });

const signSessionResponseCache = new DBCache(() => ({
  prefix: 'services-sign-session-response',
  ttl: 1000 * 60,
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

const getUnreadNotificationCount = ({ teamDid, receiver }, node, context) => {
  if (!node || !receiver || !teamDid) {
    return 0;
  }

  return node.getNotificationsUnreadCount(
    {
      teamDid,
      receiver,
    },
    context
  );
};

const getUpdateUserSessionData = ({ req }) => {
  const result = {};
  if (req.userSession) {
    // 更新用户会话中的 ua 信息，仅当 ua 为空时
    // 这种情况对应的是这个会话刚刚登录过，还未记录 ua 信息
    if (!req.userSession.ua) {
      const lastLoginIp = getRequestIP(req);
      result.ua = req.get('user-agent');
      result.lastLoginIp = lastLoginIp;
    }
    const deviceData = omitBy(getDeviceData({ req }), isUndefined);
    if (Object.keys(deviceData).length > 0 && !isEqual(req.userSession?.extra?.device, deviceData)) {
      result.extra = {
        ...req.userSession?.extra,
        device: deviceData,
      };
    }
  }
  return result;
};

const isAistroUserAgent = (ua) => {
  return ua.toLowerCase().includes('aistro/');
};

const isBlockletSDKUserAgent = (ua) => {
  return ua.includes('BlockletSDK/');
};

module.exports = {
  init(router, node, createSessionToken, options) {
    const {
      verifySessionToken,
      middlewares: { sessionBearerToken, refreshBearerToken },
    } = options;
    const createToken = createTokenFn(createSessionToken);

    const handleSession = async (req, res) => {
      const teamDid = req.getBlockletDid();
      const { token } = req;
      const visitorId = req.get('x-blocklet-visitor-id');
      const { appPid = teamDid } = req.query;

      const blockletInfo = await req.getBlockletInfo();
      const ua = req.get('user-agent');
      if (isAistroUserAgent(ua) || isBlockletSDKUserAgent(ua)) {
        // FIXME: BlockletSDK 和 Aistro 来的请求暂时不需要检查 visitorId，需要在 aistro 适配新的逻辑
        await req.ensureUser({ token, appPid });
      } else {
        await req.ensureUser({ token, appPid, visitorId });
      }
      if (!req.user) {
        res.status(401).json({ error: 'not login' });
        return;
      }

      const [blocklet, user] = await Promise.all([
        req.getBlocklet({ useCache: true }),
        node.getUser({ teamDid, user: { did: req.user.did } }),
      ]);

      // FIXME: this code have performance issue
      if (req.user.role) {
        const rbac = await node.getRBAC(teamDid);
        const permissions = await rbac.getScope(req.user.role);
        user.role = req.user.role;
        user.permissions = permissions;
      }

      if (user.avatar && user.avatar.startsWith(USER_AVATAR_URL_PREFIX)) {
        user.avatar = `${WELLKNOWN_SERVICE_PATH_PREFIX}${USER_AVATAR_PATH_PREFIX}/${
          user.avatar.split('/').slice(-1)[0]
        }`;
        if (req.get('x-avatar-host') === '1') {
          const appUrl = blocklet.environmentObj.BLOCKLET_APP_URL;
          user.avatar = joinURL(appUrl, user.avatar);
        }
      }

      const roles = await node.getRoles({ teamDid });

      user.passports = (user.passports || [])
        .filter((x) => x.status === PASSPORT_STATUS.VALID)
        .map((x) => {
          const item = pick(x, ['id', 'name', 'title', 'role', 'scope', 'expirationDate', 'issuer', 'display']);
          const findPassport = roles.find((y) => y.name === item.role);
          item.name = findPassport?.name || item.name || 'guest';
          item.role = findPassport?.name || item.role || 'guest';
          item.title = findPassport?.title || item.title || 'guest';
          return item;
        });

      const updateUserSessionData = getUpdateUserSessionData({ req });
      if (Object.keys(updateUserSessionData).length > 0) {
        const userSession = await node.upsertUserSession({
          visitorId,
          teamDid,
          userDid: user.did,
          appPid: teamDid,
          status: req.userSession.status,
          lastLoginIp: req.userSession.lastLoginIp,
          extra: req.userSession.extra,
          ...updateUserSessionData,
          locale: req.blockletLocale,
          origin: await getOrigin({ req, blockletInfo }),
        });
        if (user?.sourceAppPid) {
          await node.syncUserSession({
            teamDid,
            userDid: userSession.userDid,
            visitorId: userSession.visitorId,
            targetAppPid: user.sourceAppPid,
            lastLoginIp: req.userSession.lastLoginIp,
            extra: req.userSession.extra,
            ...updateUserSessionData,
            locale: req.blockletLocale,
          });
        }
      }

      // @link: https://github.com/ArcBlock/blocklet-server/issues/10660
      const languages = getBlockletLanguages(blocklet.environmentObj?.BLOCKLET_APP_LANGUAGES);
      if (!user.locale || !languages.some((x) => x.code === user.locale)) {
        user.locale = languages[0].code;
      }

      const data = {
        user: omit(user, ['extra']),
        provider: req.user.provider || LOGIN_PROVIDER.WALLET,
        walletOS: req.user.walletOS,
      };

      const cacheKey = JSON.stringify(data);
      const result = await signSessionResponseCache.autoCache(cacheKey, () => {
        return signResponse(data, blockletInfo.wallet);
      });
      res.json(result);
    };

    const handleGetUnreadCount = async (req, res) => {
      const teamDid = req.getBlockletDid();
      const { token } = req;
      const { appPid = teamDid } = req.query;
      try {
        await req.ensureUser({ token, appPid });
      } catch (err) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      let unReadCount = 0;

      try {
        const { wallet } = await req.getBlockletInfo();

        if (req.user) {
          unReadCount = await getUnreadNotificationCount({ teamDid, receiver: req.user.did }, node, { user: req.user });
        }
        // FIXME: 待各应用更新完新版，移除这个签名的处理
        res.json(await signResponse({ unReadCount }, wallet));
      } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    };

    const sessionApi = `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/did/session`;
    router.get(sessionApi, nocache(), sessionBearerToken, handleSession);
    router.post(sessionApi, nocache(), sessionBearerToken, handleSession);

    router.get(
      `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/notifications/unread-count`,
      nocache(),
      sessionBearerToken,
      handleGetUnreadCount
    );

    // update user extra: settings, webhooks
    const extraApi = `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/user/extra`;
    router.get(extraApi, nocache(), sessionBearerToken, checkUser, async (req, res) => {
      const teamDid = req.getBlockletDid();
      const user = await node.getUser({ teamDid, user: { did: req.user.did } });
      res.json(user.extra || {});
    });
    router.post(extraApi, nocache(), sessionBearerToken, checkUser, async (req, res) => {
      const teamDid = req.getBlockletDid();
      const exist = await node.getUser({ teamDid, user: { did: req.user.did } });
      const preSaveData = merge({}, exist.extra || {}, req.body);
      if (req.body.webhooks) {
        preSaveData.webhooks = req.body.webhooks;
      }
      const user = await node.updateUserExtra({
        teamDid,
        did: req.user.did,
        extra: JSON.stringify(preSaveData),
      });
      res.json(user.extra);
    });
    router.put(extraApi, nocache(), sessionBearerToken, checkUser, async (req, res) => {
      if (['slack', 'api'].includes(req.body.type) === false) {
        res.status(400).send({ error: t('invalidWebhookType', req.blockletLocale) });
        return;
      }

      if (isUrl(req.body.url) === false) {
        res.status(400).send({ error: t('invalidWebhookUrl', req.blockletLocale) });
      }

      if (!(await isAllowedURL(req.body.url))) {
        res.status(400).send('Invalid parameter: internal');
        return;
      }

      await node.sendTestMessage({
        webhook: { type: req.body.type, params: [{ name: 'url', value: req.body.url }] },
        message: t('testWebhookMessage', req.blockletLocale, { did: req.user.did }),
      });

      res.json({ success: true });
    });

    router.post(`${WELLKNOWN_SERVICE_PATH_PREFIX}/api/user/notification/unsubscribe`, async (req, res) => {
      const { wallet } = await req.getBlockletInfo();
      const { token } = req.body;
      if (!(await verify(token, wallet.publicKey))) {
        res.status(403).send(t('invalidToken', req.blockletLocale));
        return;
      }

      const verifyData = decode(token);

      if (verifyData) {
        const { userDid, channel } = verifyData;
        const teamDid = req.getBlockletDid();
        const exist = await node.getUser({ teamDid, user: { did: userDid } });
        await node.updateUserExtra({
          teamDid,
          did: userDid,
          extra: JSON.stringify(
            merge({}, exist.extra || {}, {
              notifications: {
                [channel]: false,
              },
            })
          ),
        });
      }

      res.json({ success: true });
    });

    router.post(
      `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/did/refreshSession`,
      refreshBearerToken,
      /**
       * @description 刷新 session token
       * @param {import('express').Request} req
       * @param {import('express').Response} res
       * @returns {Promise<void>}
       *
       */
      async (req, res) => {
        const token = req.refreshToken;
        if (token) {
          const teamDid = req.getBlockletDid();
          const blocklet = await req.getBlocklet();
          if (blocklet.settings?.session?.enableBlacklist) {
            const cacheData = await cache.refreshToken.get(md5(token));
            if (cacheData?.block) {
              res.status(400).send(t('userSessionLogout', req.blockletLocale));
              return;
            }
          }
          const visitorId = req.get('x-blocklet-visitor-id');
          const ua = req.get('user-agent');
          // FIXME: BlockletSDK 和 Aistro 来的请求暂时不需要检查 visitorId，需要在 aistro 适配新的逻辑
          if (!(isAistroUserAgent(ua) || isBlockletSDKUserAgent(ua))) {
            if (!visitorId) {
              res.status(400).send(t('userSessionLogout', req.blockletLocale));
              return;
            }
          }
          const { appPid = teamDid } = req.query;
          // FIXME: BlockletSDK 和 Aistro 来的请求暂时不需要检查 visitorId，需要在 aistro 适配新的逻辑
          if (isAistroUserAgent(ua) || isBlockletSDKUserAgent(ua)) {
            await req.ensureUser({ token, appPid });
          } else {
            await req.ensureUser({ token, visitorId, appPid });
          }
          if (!req.user) {
            res.status(400).send(t('userSessionLogout', req.blockletLocale));
            return;
          }

          try {
            const blockletInfo = await req.getBlockletInfo();

            const refreshTokenType = 'refresh';
            const {
              did: userPid, // 从 token 拿到的 did 就是 userPid
              role,
              passport,
              provider = LOGIN_PROVIDER.WALLET,
              walletOS,
            } = await verifySessionToken(token, blockletInfo.secret, {
              checkFromDb: true,
              teamDid,
              checkToken: (_token) => {
                if (_token.tokenType !== refreshTokenType) {
                  throw new Error(`invalid token type ${_token.tokenType}`);
                }
              },
              locale: req.blockletLocale,
            });

            const user = await node.getUser({ teamDid, user: { did: userPid } });

            if (role) {
              const rbac = await node.getRBAC(teamDid);
              user.permissions = await rbac.getScope(role);
              user.role = role;
            }

            if (user.avatar && user.avatar.startsWith(USER_AVATAR_URL_PREFIX)) {
              user.avatar = `${WELLKNOWN_SERVICE_PATH_PREFIX}${USER_AVATAR_PATH_PREFIX}/${
                user.avatar.split('/').slice(-1)[0]
              }`;

              if (req.get('x-avatar-host') === '1') {
                const appUrl = blocklet.environmentObj.BLOCKLET_APP_URL;
                user.avatar = joinURL(appUrl, user.avatar);
              }
            }

            const sessionConfig = blocklet.settings?.session || {};

            const { sessionToken, refreshToken } = createToken(
              userPid,
              {
                secret: blockletInfo.secret,
                passport,
                role,
                fullName: user.fullName,
                provider,
                walletOS,
                emailVerified: !!user?.emailVerified,
                phoneVerified: !!user?.phoneVerified,
              },
              { ...sessionConfig, didConnectVersion: getDidConnectVersion(req) }
            );
            const lastLoginIp = getRequestIP(req);
            const deviceData = getDeviceData({ req });
            const userSession = await node.upsertUserSession({
              visitorId,
              teamDid,
              userDid: userPid,
              appPid: teamDid,
              status: USER_SESSION_STATUS.ONLINE,
              // refreshSession 时更新 ua 可以解决浏览器升级导致 ua 变化产生的问题
              ua,
              lastLoginIp,
              extra: {
                walletOS,
                device: deviceData,
              },
              origin: await getOrigin({ req }),
            });
            if (user?.sourceAppPid) {
              await node.syncUserSession({
                teamDid,
                userDid: userSession.userDid,
                visitorId: userSession.visitorId,
                targetAppPid: user.sourceAppPid,
                ua,
                lastLoginIp,
                extra: {
                  walletOS,
                  device: deviceData,
                },
              });
            }

            // 颁发新的 token 前，将原有的 token 和 refreshToken 拉黑
            // req.token 无法正确获得 login_token，所以需要通过 getTokenFromReq 获取
            const { token: requestSessionToken } = getTokenFromReq(req, {
              cookie: {
                key: 'login_token',
              },
              headerKey: false,
            });
            if (requestSessionToken) {
              const sessionTtl = jwtDecode(requestSessionToken).exp * 1000 - Date.now();
              if (sessionTtl > 0) {
                await cache.sessionToken.set(md5(requestSessionToken), { block: true }, { ttl: sessionTtl });
              }
            }
            if (req.refreshToken) {
              const refreshTtl = jwtDecode(req.refreshToken).exp * 1000 - Date.now();
              if (refreshTtl > 0) {
                await cache.refreshToken.set(md5(req.refreshToken), { block: true }, { ttl: refreshTtl });
              }
            }

            // 刷新 csrf token
            const nodeInfo = await req.getNodeInfo();
            const accessWallet = getAccessWallet({
              blockletAppDid: blocklet.appDid || blocklet.meta.did,
              serverSecretKey: nodeInfo.sk,
            });
            const csrfToken = await sign(accessWallet.secretKey, sessionToken);

            const expires = dayjs()
              .add(blocklet?.settings?.session?.cacheTtl || 3600, 's')
              .toDate();
            // @note: 同时设置 token
            res.cookie('x-csrf-token', csrfToken, {
              sameSite: 'strict',
              secure: true,
              expires,
            });
            res.cookie('login_token', sessionToken, {
              sameSite: 'lax',
              secure: true,
              expires,
            });

            res.json(
              await signResponse(
                {
                  user: omit(user, ['extra']),
                  nextToken: sessionToken,
                  nextRefreshToken: refreshToken,
                  provider,
                  walletOS,
                },
                blockletInfo.wallet
              )
            );
          } catch (err) {
            res.status(400).send(err.message);
          }
        } else {
          res.status(400).send(t('emptyRefreshToken', req.blockletLocale));
        }
      }
    );

    router.get(
      `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/did/csrfToken`,
      refreshBearerToken,
      /**
       * @description 刷新 session token
       * @param {import('express').Request} req
       * @param {import('express').Response} res
       * @returns {Promise<void>}
       *
       */
      async (req, res) => {
        try {
          const loginToken = req.cookies.login_token;
          if (!loginToken) {
            return res.status(400).send('login_token is required');
          }

          if (!req.cookies['x-csrf-token'] || req.cookies['x-csrf-token'] !== req.headers['x-csrf-token']) {
            console.error('x-csrf-token is required', {
              csrfTokenFromRequest: req.cookies['x-csrf-token'],
              csrfTokenFromHeader: req.headers['x-csrf-token'],
            });
            return res.status(400).send('x-csrf-token is required');
          }

          const oldCsrfToken = req.cookies['x-csrf-token'];
          const blocklet = await req.getBlocklet();
          const nodeInfo = await req.getNodeInfo();
          const accessWallet = getAccessWallet({
            blockletAppDid: blocklet.appDid || blocklet.meta.did,
            serverSecretKey: nodeInfo.sk,
          });
          const csrfToken = await sign(accessWallet.secretKey, loginToken);

          if (oldCsrfToken !== csrfToken) {
            // @note: 设置 token
            res.cookie('x-csrf-token', csrfToken, {
              sameSite: 'strict',
              secure: true,
            });
          }

          return res.json({
            loginToken,
            csrfToken,
          });
        } catch (error) {
          console.error(error);
          return res.status(400).send(error.message);
        }
      }
    );
  },
};
