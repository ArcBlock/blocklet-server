/* eslint-disable no-await-in-loop */
const {
  WELLKNOWN_SERVICE_PATH_PREFIX,
  PASSPORT_LOG_ACTION,
  PASSPORT_STATUS,
  SESSION_TTL,
  FEDERATED,
} = require('@abtnode/constant');
const { LOGIN_PROVIDER, USER_SESSION_STATUS } = require('@blocklet/constant');
const pick = require('lodash/pick');
const defaults = require('lodash/defaults');
const cloneDeep = require('@abtnode/util/lib/deep-clone');
const omit = require('lodash/omit');
const pLimit = require('p-limit');
const { getSourceProvider } = require('@blocklet/meta/lib/did-utils');
const getRequestIP = require('@abtnode/util/lib/get-request-ip');
const {
  getFederatedMembers,
  getFederatedMaster,
  findFederatedSite,
  getFederatedEnabled,
} = require('@abtnode/auth/lib/util/federated');
const { messages } = require('@abtnode/auth/lib/auth');
const { Joi } = require('@arcblock/validator');
const { getDeviceData } = require('@abtnode/util/lib/device');
const cors = require('cors');
const getOrigin = require('@abtnode/util/lib/get-origin');
const { CustomError } = require('@blocklet/error');
const { getAccessWallet } = require('@abtnode/util/lib/blocklet');
const { sign } = require('@blocklet/sdk/lib/util/csrf');
const { api } = require('../libs/api');

const logger = require('../libs/logger')('blocklet-services:user-session');
const ensureBlocklet = require('../middlewares/ensure-blocklet');
const { getUserAvatarUrl, getTrustedDomains } = require('../util/federated');
const initJwt = require('../libs/jwt');
const { createTokenFn, getDidConnectVersion } = require('../util');
const checkUser = require('../middlewares/check-user');

const prefix = `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/user-session`;
const limit = pLimit(FEDERATED.SYNC_LIMIT);

const userInfoBlackList = ['extra.walletDeviceId', 'extra.walletDeviceMessageToken', 'extra.device'];

async function getPassport(passportId, { node, teamDid }) {
  const passport = await node.getPassportById({ teamDid, passportId });
  return passport;
}

function getUserSessionStatus(userSession, { blocklet }) {
  const sessionTtl = blocklet.settings?.session?.ttl || SESSION_TTL;
  // 修正当前 session 的 status，如果超出时间了，则应该显示为过期
  if (Date.now() - new Date(userSession.updatedAt).getTime() > sessionTtl * 1000) {
    return USER_SESSION_STATUS.EXPIRED;
  }
  return userSession.status;
}

async function patchUserSessionData(userSession, { blocklet, teamDid, node }) {
  // 修正 avatar 地址，从 bn:// 转换为 http
  if (userSession.user?.avatar) {
    userSession.user.avatar = getUserAvatarUrl(userSession.user.avatar, blocklet);
  }

  const federated = defaults(cloneDeep(blocklet.settings.federated || {}), {
    config: {
      appId: blocklet.appDid,
      appPid: teamDid,
    },
    sites: [],
  });
  const site = federated.sites.find((siteItem) => siteItem.appPid === userSession.appPid);
  // 获取 appName，展示在前端
  if (site) {
    userSession.appName = site.appName;
  }

  // 通过 userSession 信息判断 passport 对应的 role（针对 appPid 做转换）
  let passport;
  if (userSession.passportId) {
    passport = await getPassport(userSession?.passportId, { node, teamDid });
  } else {
    passport = {
      role: userSession.user.role,
      name: userSession.user.role,
      title: userSession.user.role,
    };
  }
  const roles = await node.getRoles({ teamDid });
  const findPassport = roles.find((x) => x.name === passport?.role);
  userSession.user.role = findPassport?.name || passport?.role || 'guest';
  userSession.user.roleTitle = findPassport?.title || passport?.title || 'guest';
}

const loginSessionSchema = Joi.object({
  // uuid 版本需要保持跟数据库 model 定义一致
  id: Joi.string().uuid({ version: 'uuidv4' }).required(),
  userDid: Joi.DID().required(),
  appPid: Joi.DID().required(),
  passportId: Joi.string().allow('', null).optional(),
}).unknown(true);

const myLoginSessionsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).default(10),
  status: Joi.string().optional().default(USER_SESSION_STATUS.ONLINE),
}).unknown(true);

const checkLoginUserSession = (userSession, { req }) => {
  const requestIp = getRequestIP(req);
  const currentUserAgent = req.get('user-agent');
  if (userSession.ua !== currentUserAgent) {
    return false;
  }
  // NOTICE: 如果是 ArcSphere 或者 Wallet 客户端，则跳过 IP 检查
  if (currentUserAgent) {
    const DID_WALLET_TAG = 'ABTWallet';
    const ARC_SPHERE_TAG = 'ArcSphere';
    if (currentUserAgent.indexOf(DID_WALLET_TAG) > -1 || currentUserAgent.indexOf(ARC_SPHERE_TAG) > -1) {
      return true;
    }
  }
  return userSession.lastLoginIp === requestIp;
};

module.exports = {
  // eslint-disable-next-line no-unused-vars
  init(app, node, options) {
    const ensureCors = cors(async (req, callback) => {
      const origin = req.get('origin');
      if (!origin) {
        callback(null, { origin: true });
      } else {
        const domains = await getTrustedDomains({ node, req, blocklet: req.blocklet });
        const { hostname } = new URL(origin);
        if (domains.includes(hostname)) {
          callback(null, { origin: true });
        } else {
          callback(new CustomError(403, 'Not allowed by CORS'));
        }
      }
    });
    app.options(`${prefix}/login`, ensureBlocklet({ useCache: true }), ensureCors);
    /**
     * NOTE: 保留 /login 路由，该功能不是针对于某一个实体来操作的，需要更明确表达意图
     * @route /.well-known/service/api/user-session/login
     *
     */
    app.post(`${prefix}/login`, ensureBlocklet({ useCache: true }), ensureCors, async (req, res) => {
      const { blocklet } = req;
      const loginUserSession = req.body;

      const { value: validUserSession, error } = loginSessionSchema.validate(loginUserSession);

      if (error) {
        logger.error('Failed to login by user-session', {
          error,
          loginUserSession,
        });
        res.status(400).json({ error });
        return;
      }

      const teamDid = blocklet.appPid;
      const validSession = await node.getUserSession({
        teamDid,
        id: validUserSession.id,
      });

      if (validSession) {
        const user = await node.getUser({ teamDid, user: { did: validUserSession.userDid } });
        if (!user.approved) {
          res.status(401).json(messages.notAllowedAppUser[req.blockletLocale]);
          return;
        }
        const sourceProvider = getSourceProvider(user);

        const provider = sourceProvider || LOGIN_PROVIDER.WALLET;

        const masterSite = getFederatedMaster(blocklet);
        const memberSiteList = getFederatedMembers(blocklet);
        const memberSite = memberSiteList.find((item) => item.appPid === validUserSession.appPid);
        const postUser = pick(user, ['did', 'pk', 'fullName', 'locale', 'inviter', 'generation']);
        postUser.lastLoginAt = getRequestIP(req);

        if (user.email) {
          postUser.email = user.email;
        }
        if (user.avatar) {
          postUser.avatar = getUserAvatarUrl(user.avatar, blocklet);
        }

        let result = {};

        const walletOS = validSession?.extra?.walletOS || 'web';

        const isFederatedLogin = memberSite && masterSite.appPid === teamDid;
        if (isFederatedLogin) {
          try {
            result = await node.loginFederated({
              did: teamDid,
              data: {
                user: postUser,
                passport: validUserSession.passportId ? { id: validUserSession.passportId } : undefined,
                walletOS,
                provider,
              },
              site: memberSite,
            });
          } catch (err) {
            logger.error('Failed to login federated', { error: err, memberSite });
            if (err.response) {
              const { status, data } = err.response;
              res.status(status).json(data);
              return;
            }
            throw err;
          }
        } else {
          const { createSessionToken } = initJwt(node, options);
          const createToken = createTokenFn(createSessionToken);
          const { secret } = await req.getBlockletInfo();
          const sessionConfig = blocklet.settings?.session || {};
          const targetPassport = validUserSession.passportId
            ? (user?.passports || []).find((item) => item.id === validUserSession.passportId)
            : null;
          if (targetPassport?.status === PASSPORT_STATUS.EXPIRED) {
            res.status(401).json({ error: messages.passportExpired[req.blockletLocale] });
            return;
          }
          if (targetPassport?.status === PASSPORT_STATUS.REVOKED) {
            res.status(401).json({
              error: messages.passportRevoked[req.blockletLocale](targetPassport.title, targetPassport.issuer.name),
            });
            return;
          }
          const loggedInUser = await node.loginUser({
            teamDid,
            user: {
              did: postUser.did,
              pk: postUser.pk,
              passport: targetPassport,
              connectedAccount: {
                provider,
                did: user.did,
                pk: user.pk,
              },
            },
          });

          if (targetPassport) {
            await node.createPassportLog(
              teamDid,
              {
                passportId: targetPassport.id,
                action: PASSPORT_LOG_ACTION.LOGIN,
                operatorDid: loggedInUser.did,
                metadata: {
                  action: 'login',
                },
              },
              req
            );
          }
          const role = targetPassport?.role || 'guest';
          result = createToken(
            user.did,
            {
              secret,
              passport: targetPassport,
              role,
              fullName: loggedInUser.fullName,
              provider,
              walletOS,
              emailVerified: !!user?.emailVerified,
              phoneVerified: !!user?.phoneVerified,
            },
            {
              ...sessionConfig,
              didConnectVersion: getDidConnectVersion(req),
            }
          );
        }

        const lastLoginIp = getRequestIP(req);
        const ua = req.get('user-agent');
        const deviceData = getDeviceData({ req });

        const userSessionDoc = await node.upsertUserSession({
          id: validUserSession.id,
          teamDid,
          userDid: validUserSession.userDid,
          visitorId: validSession.visitorId,
          appPid: validUserSession.appPid,
          passportId: validUserSession.passportId,
          status: USER_SESSION_STATUS.ONLINE,
          ua: null,
          lastLoginIp,
          extra: {
            walletOS,
            device: deviceData,
          },
          locale: req.blockletLocale,
          origin: await getOrigin({ req }),
        });

        if (isFederatedLogin) {
          await node.syncUserSession({
            teamDid,
            userDid: validUserSession.userDid,
            visitorId: userSessionDoc.visitorId,
            passportId: validUserSession.passportId,
            targetAppPid: validUserSession.appPid,
            ua,
            lastLoginIp,
            extra: {
              walletOS,
              device: deviceData,
            },
          });
        }

        logger.info('quick-login with', {
          teamDid,
          visitorId: userSessionDoc.visitorId,
          // 记录日志应该使用原始的值
          userDid: loginUserSession.userDid,
          appPid: loginUserSession.appPid,
          passportId: loginUserSession.passportId,
          extra: {
            walletOS,
          },
        });

        // 生成 csrf token
        const nodeInfo = await req.getNodeInfo();
        const accessWallet = getAccessWallet({
          blockletAppDid: memberSite?.did || blocklet.appDid || blocklet.meta.did,
          serverSecretKey: nodeInfo.sk,
        });
        const csrfToken = await sign(accessWallet.secretKey, result.sessionToken);

        res.json({ ...result, visitorId: userSessionDoc.visitorId, csrfToken });
      } else {
        logger.warn('failed to quick-login with', {
          teamDid,
          id: loginUserSession.id,
          userDid: loginUserSession.userDid,
          appPid: loginUserSession.appPid,
          passportId: loginUserSession.passportId,
        });
        res.status(401).json({ error: 'session expired' });
      }
    });

    app.get(`${prefix}/myself`, ensureBlocklet({ useCache: true }), checkUser, async (req, res) => {
      const { blocklet } = req;
      const { value: validParams, error } = myLoginSessionsSchema.validate(req.query);
      if (error) {
        res.status(400).json({ error });
        return;
      }
      const { page = 1, pageSize = 10, status } = validParams;
      const teamDid = blocklet.appPid;
      const userDid = req.user.did;
      // 用户管理自己所有的登录会话，不限制 visitorId
      const { list: userSessions, paging } = await node.getUserSessions({
        teamDid,
        query: {
          appPid: teamDid, // 不需要向主站查询 member 的会话列表，所以固定为 teamDid 即可
          userDid,
          status,
        },
        paging: {
          page,
          pageSize,
        },
      });

      const list = userSessions
        .filter((x) => getUserSessionStatus(x, { blocklet }) === status)
        .map((x) => omit(x, userInfoBlackList));
      res.json({
        list,
        paging,
      });
    });

    /**
     * 获取指定用户的所有登录会话
     * 使用的场景：
     * 1. 用户在未登录状态下，查询当前设备符合快捷登录的会话，实现快速登录
     * 2. 用户在登录状态下，查询当前设备可以使用快捷登录切换的账号
     */
    app.options(prefix, ensureBlocklet({ useCache: true }), ensureCors);
    app.get(`${prefix}`, ensureBlocklet({ useCache: true }), ensureCors, async (req, res) => {
      const { blocklet } = req;
      const teamDid = blocklet.appPid;

      const visitorId = req.get('x-blocklet-visitor-id');

      if (!visitorId) {
        res.json([]);
        return;
      }

      // 需要查出指定 vid 所有的登录会话，再经过条件筛选过滤掉不合适的
      const { list: currentUserSessions } = await node.getUserSessions({
        teamDid,
        query: {
          visitorId,
          includeUser: true,
        },
        paging: {
          page: 1,
          // 模拟获取所有登录会话
          pageSize: 100,
        },
      });

      const validUserSessions = currentUserSessions
        .filter((x) => {
          if (!x?.user?.approved) {
            return false;
          }
          if (!checkLoginUserSession(x, { req })) {
            return false;
          }

          if (x.appPid === teamDid) {
            return true;
          }

          const federatedSite = findFederatedSite(blocklet, x.appPid);
          if (federatedSite) {
            if (federatedSite.appPid === teamDid) {
              return true;
            }
            if (federatedSite.status === 'approved') {
              return true;
            }
          }

          return false;
        })
        .filter((x) => getUserSessionStatus(x, { blocklet }) === USER_SESSION_STATUS.ONLINE);

      let masterUserSessions = [];
      const enabledFederated = getFederatedEnabled(blocklet);
      const masterSite = getFederatedMaster(blocklet);

      if (enabledFederated && masterSite && masterSite.appPid !== teamDid) {
        const masterAppUrl = masterSite?.appUrl;
        const ua = req.get('user-agent');
        const masterResult = await api.get(prefix, {
          baseURL: masterAppUrl,
          headers: {
            // NOTICE: 必须要设置这两个参数，否则查询的结果会不正确
            'x-blocklet-visitor-id': visitorId,
            'User-Agent': ua,
          },
        });
        masterUserSessions = masterResult?.data || [];
        masterUserSessions.forEach((x) => {
          x.appUrl = masterAppUrl;
        });
      }

      const mergeUserSessions = [...validUserSessions, ...masterUserSessions];
      const pendingList = mergeUserSessions.map((item) =>
        limit(() =>
          patchUserSessionData(item, {
            blocklet,
            appPid: item.appPid,
            teamDid,
            node,
          })
        )
      );
      // 由 limit 函数控制并发数
      await Promise.all(pendingList);

      const result = mergeUserSessions.map((x) => omit(x, userInfoBlackList));

      res.json(result);
    });
  },
};
