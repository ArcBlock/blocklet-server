/* eslint-disable require-await */
const { WELLKNOWN_SERVICE_PATH_PREFIX, VERIFY_CODE_TTL, USER_AVATAR_URL_PREFIX } = require('@abtnode/constant');
const JWT = require('@arcblock/jwt');
const { render } = require('@react-email/components');
const { getApplicationInfo, handleInvitationReceive } = require('@abtnode/auth/lib/auth');
const { fromAppDid } = require('@arcblock/did-ext');
const { extractUserAvatar, getUserAvatarUrl, convertImageToBase64 } = require('@abtnode/util/lib/user');
const formatContext = require('@abtnode/util/lib/format-context');
const md5 = require('@abtnode/util/lib/md5');
const { fromBase64 } = require('@ocap/util');
const { isFromPublicKey } = require('@arcblock/did');
const { LOGIN_PROVIDER, USER_SESSION_STATUS } = require('@blocklet/constant');
const pick = require('lodash/pick');
const merge = require('lodash/merge');
const omitBy = require('lodash/omitBy');
const omit = require('lodash/omit');
const uniq = require('lodash/uniq');
const isUrl = require('is-url');
const { getLastUsedPassport } = require('@abtnode/auth/lib/passport');
const { getWallet, getWalletDid } = require('@blocklet/meta/lib/did-utils');
const { Joi } = require('@arcblock/validator');
const { parse } = require('@abtnode/core/lib/util/ua');
const getRequestIP = require('@abtnode/util/lib/get-request-ip');
const { formatError, CustomError, getStatusFromError } = require('@blocklet/error');
const { xss } = require('@blocklet/xss');
const { createRateLimiter } = require('@blocklet/rate-limit');
const { withQuery, joinURL } = require('ufo');
const cors = require('cors');
const { getDeviceData } = require('@abtnode/util/lib/device');
const { Op } = require('sequelize');
const getOrigin = require('@abtnode/util/lib/get-origin');
const { getAvatarByEmail, getAvatarByUrl } = require('@abtnode/util/lib/user');
const jwtDecode = require('jwt-decode');
const { getUserPublicInfo } = require('@abtnode/auth/lib/util/user-info');
const { isAllowedReferer, isAllowedURL } = require('@abtnode/util/lib/ssrf-protector');
const { getAccessWallet } = require('@abtnode/util/lib/blocklet');
const { sign } = require('@blocklet/sdk/lib/util/csrf');

const { createTokenFn, getDidConnectVersion } = require('../util');
const initJwt = require('../libs/jwt');
const { loginWalletSchema, loginOAuthSchema, loginUserWalletSchema, checkUserSchema } = require('../validators/login');
const verifySig = require('../middlewares/verify-sig');
const logger = require('../libs/logger')('user');
const ensureBlocklet = require('../middlewares/ensure-blocklet');
const ensureOrgEnabled = require('../middlewares/ensure-org-enabled');
const checkUser = require('../middlewares/check-user');
const { Profile } = require('../state/profile');
const { emailSchema } = require('../socket/channel/did');
const { sendEmail } = require('../libs/email');
const federatedUtil = require('../util/federated');
const userUtil = require('../util/user-util');
const { VerifyCodeBody } = require('../emails/_templates/verify-code-body');
const { checkFederatedCall } = require('../middlewares/check-federated');
const { sendToUser } = require('../libs/notification');
const { createEmailLimiter } = require('../services/kyc');
const cache = require('../cache');
const { ensureUserExists, ensureUserEnabled, t } = require('../util/check-user');
const { doLauncherLogin } = require('../middlewares/launcher-login');
const { getUTMUrl } = require('../util/utm');

const validateUser = (user) => {
  try {
    return (
      user &&
      user.did &&
      user.pk &&
      (isFromPublicKey(user.did, user.pk) || isFromPublicKey(user.did, fromBase64(user.pk)))
    );
  } catch (e) {
    return false;
  }
};

const PREFIX = WELLKNOWN_SERVICE_PATH_PREFIX;

const prefix = `${PREFIX}/user`;
const prefixApi = `${PREFIX}/api/user`;

/**
 * 组装用户 profile
 * @param {{ avatar?: string, fullName: string, email: string}} profile
 * @param {{node: any; req: any; teamDid: string; isCreate: boolean = false}} options
 * @returns {Promise<{avatar: string, fullName: string, email: string}>}
 */
async function composeProfileData({ avatar, fullName, email }, { node, req, teamDid, isCreate = false }) {
  const profile = {};
  let avatarLocal;
  if (email) {
    profile.email = email;
    // 创建模式下，需要对 avatar 和 fullName 做一个 fallback，同时对 wallet 和 oauth 用户生效
    if (isCreate) {
      if (!avatar) {
        avatarLocal = await getAvatarByEmail(email);
      }
      if (!fullName) {
        profile.fullName = userUtil.getUserNameByEmail(email);
      }
    }
  }
  if (avatar) {
    avatarLocal = avatar.startsWith('data:') ? avatar : await getAvatarByUrl(avatar);
  }
  if (avatarLocal && avatarLocal.startsWith('data:')) {
    const nodeInfo = await req.getNodeInfo();
    const { dataDir } = await getApplicationInfo({ node, nodeInfo, teamDid });
    avatarLocal = await extractUserAvatar(avatarLocal, { dataDir });
    profile.avatar = avatarLocal;
  }

  if (fullName) {
    profile.fullName = fullName;
  }
  return profile;
}

async function loginWallet(
  { did, pk, avatar, email, fullName },
  { node, req, locale, teamDid, updateInfo = true, sourceAppPid = null, inviter = null }
) {
  const provider = LOGIN_PROVIDER.WALLET;
  const { error } = loginWalletSchema.validate({
    provider,
    did,
    pk,
    avatar,
    email,
    fullName,
    inviter,
  });
  if (error) {
    throw new CustomError(400, error.message);
  }

  const currentUser = await node.getUser({
    teamDid,
    user: {
      did,
    },
    options: {
      enableConnectedAccount: true,
    },
  });

  let profile = {};
  if (currentUser) {
    if (updateInfo) {
      ensureUserEnabled(currentUser, { locale });
      profile = await composeProfileData({ avatar, email, fullName }, { node, req, teamDid });
    }
  } else {
    await userUtil.checkNeedInvite({ req, node, teamDid, locale });
    profile = await composeProfileData({ avatar, email, fullName }, { node, req, teamDid, isCreate: true });
  }

  const lastLoginIp = getRequestIP(req);
  const loginParams = {
    teamDid,
    user: {
      did: currentUser?.did || did,
      pk: currentUser?.pk || pk,
      locale,
      lastLoginIp,
      connectedAccount: { provider, did, pk },
      ...profile,
      sourceAppPid,
      inviter,
    },
  };
  if (!validateUser(loginParams.user) || !validateUser(loginParams.user.connectedAccount)) {
    throw new CustomError(400, t('userInfoError', locale));
  }
  const doc = await node.loginUser(loginParams);

  // NOTICE: 使用 provider: wallet 登录的账号，其账号是由 wallet 产生的，所以不需要到链上 declare 了
  return doc;
}

async function loginOAuth(
  { provider, id, avatar, email, fullName },
  { node, req, locale, teamDid, blockletWallet, updateInfo = true, sourceAppPid = null, inviter = null }
) {
  const { error } = loginOAuthSchema.validate({
    provider,
    id,
    avatar,
    email,
    fullName,
    inviter,
  });
  if (error) {
    throw new CustomError(400, error.message);
  }

  // FIXME: 如果有 sourceAppPid，则这里拿到的 userWallet 是不对的？
  const userWallet = fromAppDid(id, blockletWallet.secretKey);
  const userDid = userWallet.address;
  const userPk = userWallet.publicKey;
  const currentUser = await node.getUser({
    teamDid,
    user: {
      did: userDid,
    },
    options: {
      enableConnectedAccount: true,
    },
  });

  let profile = {};
  if (currentUser) {
    if (updateInfo) {
      ensureUserEnabled(currentUser, { locale });
      profile = await composeProfileData({ avatar, email, fullName }, { node, req, teamDid });
    }
  } else {
    await userUtil.checkNeedInvite({ req, node, teamDid, locale });
    profile = await composeProfileData({ avatar, email, fullName }, { node, req, teamDid, isCreate: true });
  }

  const lastLoginIp = getRequestIP(req);

  const loginParams = {
    teamDid,
    user: {
      did: currentUser?.did || userDid,
      pk: currentUser?.pk || userPk,
      locale,
      lastLoginIp,
      connectedAccount: { provider, id, did: userDid, pk: userPk },
      ...profile,
      sourceAppPid,
      inviter,
    },
  };
  if (!validateUser(loginParams.user) || !validateUser(loginParams.user.connectedAccount)) {
    throw new CustomError(400, t('userInfoError', locale));
  }
  const doc = await node.loginUser(loginParams);
  return doc;
}

async function loginSDK(req, node, options) {
  const {
    provider = LOGIN_PROVIDER.WALLET,
    did,
    pk,
    avatar,
    email,
    fullName,
    id,
    locale = 'en',
    updateInfo = true,
    sourceAppPid = null,
    inviter = null,
  } = req.body;
  // NOTICE: 先保留，需要应用端确认是否能移除
  let visitorId = req.body?.visitorId;
  if (!visitorId) {
    visitorId = req.get('x-blocklet-visitor-id');
  }
  const componentId = req.get('x-blocklet-component-id');
  if (!componentId) {
    throw new CustomError(400, t('needComponentId', locale));
  }
  const { did: teamDid, wallet: blockletWallet, secret } = await req.getBlockletInfo();
  const blocklet = await req.getBlocklet();

  let userDoc;
  if (provider === LOGIN_PROVIDER.WALLET) {
    userDoc = await loginWallet(
      { did, pk, avatar, email, fullName },
      { node, req, locale, componentId, teamDid, updateInfo, sourceAppPid, inviter }
    );
  } else {
    userDoc = await loginOAuth(
      { provider, id, avatar, email, fullName },
      { node, req, locale, componentId, teamDid, blockletWallet, updateInfo, sourceAppPid, inviter }
    );
  }

  // NOTICE: 这种方式限制登录的角色为 guest，后续需要登录其它角色可以通过传入 passportId 或者 role name 来实现
  const passport = { name: 'Guest', role: 'guest' };

  await node.createAuditLog(
    {
      action: 'login',
      args: { teamDid, userDid: userDoc.did, passport, provider },
      context: formatContext(Object.assign(req, { user: userDoc })),
      result: userDoc,
    },
    node
  );
  const { createSessionToken } = initJwt(node, Object.assign({}, options));
  const createToken = createTokenFn(createSessionToken);
  const sessionConfig = blocklet.settings?.session || {};
  const { sessionToken, refreshToken } = createToken(
    userDoc.did,
    {
      secret,
      passport,
      role: passport.role,
      fullName: userDoc.fullName,
      provider,
      walletOS: 'api',
      emailVerified: !!userDoc.emailVerified,
      phoneVerified: !!userDoc.phoneVerified,
    },
    { ...sessionConfig, didConnectVersion: getDidConnectVersion(req) }
  );
  const lastLoginIp = getRequestIP(req);
  const ua = req.get('user-agent');
  const deviceData = getDeviceData({ req });
  const userSession = await node.upsertUserSession({
    visitorId,
    teamDid,
    userDid: userDoc.did,
    appPid: teamDid,
    status: USER_SESSION_STATUS.ONLINE,
    ua: null,
    lastLoginIp,
    extra: {
      walletOS: 'api',
      device: deviceData,
    },
    locale,
    origin: await getOrigin({ req }),
  });
  await node.syncUserSession({
    teamDid,
    userDid: userSession.userDid,
    visitorId: userSession.visitorId,
    passportId: passport?.id,
    targetAppPid: sourceAppPid,
    ua,
    lastLoginIp,
    extra: {
      walletOS: 'api',
      device: deviceData,
    },
  });
  return {
    user: userDoc,
    token: sessionToken,
    refreshToken,
    visitorId: userSession?.visitorId || '',
  };
}

async function verifyUserSig({ userDid, signature, teamDid, sourceAppPid, userPk }, { node, locale, blocklet }) {
  const currentUser = await federatedUtil.getUserWithinFederated(
    { sourceAppPid, teamDid, userDid, userPk },
    { node, blocklet }
  );
  ensureUserExists(currentUser, { locale });
  ensureUserEnabled(currentUser, { locale });

  const userDidWallet = getWallet(currentUser);

  if (!userDidWallet) {
    logger.error('User did not have wallet', { userDid, sourceAppPid, teamDid });
    throw new CustomError(404, 'User not exist');
  }

  // HACK: 钱包传递的签名使用的是 didWallet 账户，但这个账户可能是 原生的 oauth 账户，所以需要找到对应的 did-wallet 账户
  const valid = await JWT.verify(signature, userDidWallet.pk);
  if (!valid) {
    throw new CustomError(401, 'Invalid signature');
  }
  return currentUser;
}

// service 中的用户接口支持从钱包直接调用，通过另一种签名方式来实现鉴权
// 使用场景，在钱包中开启和关闭通知
function checkUserSig({ node }) {
  return async (req, res, next) => {
    const teamDid = req.get('x-blocklet-did');
    const userDid = req.get('x-blocklet-sig-did');
    const userSig = req.get('x-blocklet-sig');
    if (userDid && userSig) {
      const user = await node.getUser({
        teamDid,
        user: { did: userDid },
        options: { enableConnectedAccount: true },
      });
      try {
        ensureUserExists(user);
        ensureUserEnabled(user);
      } catch (error) {
        logger.error('User is not exist or not allowed', { error });
        res.status(401).json(error.message);
        return;
      }

      const userDidWallet = getWallet(user);
      const valid = await JWT.verify(userSig, userDidWallet.pk);
      if (!valid) {
        logger.error('Verify sig failed', {
          userDid,
          walletUserDid: userDidWallet.did,
          userSig,
        });
        res.status(401).json('Verify sig failed');
        return;
      }
      const walletOS = parse(req.get('user-agent'));
      req.user = {
        did: user.did,
        provider: userDidWallet.provider,
        fullName: user.fullName,
        walletOS,
      };
      const resData = JWT.decode(userSig, true);
      // NOTICE: set decode data to req.body, it's not a good practice, but we need it in next middleware
      req.body = pick(resData, ['notifications']);
    }
    next();
  };
}

async function loginEmail(req, node, options) {
  const locale = req.blockletLocale;
  const { sourceAppPid = null, inviter = null } = req.body;

  const blocklet = await req.getBlocklet();
  const teamDid = blocklet.appPid;
  const verifyCode = await userUtil.getVerifyCodeFromReq({ logger, req });
  const verifyCodeResult = await node.consumeVerifyCode({ teamDid, code: verifyCode });

  if (!verifyCodeResult) {
    throw new CustomError(400, t('invalidVerifyCode', locale));
  }
  logger.info('Email login: consume verify code', { teamDid, code: verifyCode, result: verifyCodeResult });

  // 保持跟 oauth 账户的格式一致
  const sub = `email|${verifyCodeResult.subject}`;
  const { wallet: userWallet } = await userUtil.getUserFromSub(sub, { req });
  const userInfo = {
    email: verifyCodeResult.subject,
    provider: LOGIN_PROVIDER.EMAIL,
  };

  const userDid = userWallet.address;
  const userPk = userWallet.publicKey;

  let profile;
  let currentUser = await federatedUtil.getUserWithinFederated(
    { sourceAppPid, teamDid, userDid, userPk },
    { node, blocklet }
  );
  const connectedAccount = {
    provider: LOGIN_PROVIDER.EMAIL,
    did: userDid,
    pk: userPk,
    id: sub,
    userInfo,
  };
  const lastUsedPassport = getLastUsedPassport(currentUser?.passports, '', { useFallback: false });

  if (!currentUser && req.body.action === 'destroy-self') {
    throw new CustomError(400, t('notAllowedToDestroy', locale));
  }

  if (!currentUser) {
    await userUtil.checkNeedInvite({ req, node, teamDid, locale });
    currentUser = {
      did: userDid,
      pk: userPk,
    };
    const avatar = await userUtil.getAvatarBnByEmail(verifyCodeResult.subject, { req, node });
    profile = {
      fullName: userUtil.getUserNameByEmail(verifyCodeResult.subject),
      avatar,
      inviter,
      email: verifyCodeResult.subject,
      // email 登录默认认为邮箱已验证
      emailVerified: true,
    };
  }

  const { sessionToken, refreshToken, visitorId } = await userUtil.loginUserSession(
    {
      did: currentUser.did || userDid,
      pk: currentUser.pk,
      profile,
      passport: lastUsedPassport,
      sourceAppPid,
      connectedAccount,
      provider: LOGIN_PROVIDER.EMAIL,
    },
    { req, node, options }
  );

  // 生成 csrf token
  const nodeInfo = await req.getNodeInfo();
  const accessWallet = getAccessWallet({
    blockletAppDid: blocklet.appDid || blocklet.meta.did,
    serverSecretKey: nodeInfo.sk,
  });
  const csrfToken = await sign(accessWallet.secretKey, sessionToken);

  const result = { sessionToken, refreshToken, visitorId, csrfToken };

  if (req.body.action === 'destroy-self') {
    const parsed = JSON.parse(fromBase64(req.body.payload).toString());
    const destroySession = await node.startSession({
      data: { ...parsed, type: 'destroy', operator: currentUser.did || userDid },
    });
    result.destroySessionId = destroySession.id;
  }

  return result;
}

async function inviteEmail(req, node, options) {
  const locale = req.blockletLocale;
  const { sourceAppPid = null, inviteId, baseUrl } = req.body;

  if (!inviteId) {
    throw new CustomError(400, t('missingInviteId', locale));
  }

  const blocklet = await req.getBlocklet();
  const teamDid = blocklet.appPid;
  const verifyCode = await userUtil.getVerifyCodeFromReq({ logger, req });
  const verifyCodeResult = await node.consumeVerifyCode({ teamDid, code: verifyCode });

  if (!verifyCodeResult) {
    throw new CustomError(400, t('invalidVerifyCode', locale));
  }
  logger.info('Email invite: consume verify code', { teamDid, code: verifyCode, result: verifyCodeResult });

  // 保持跟 oauth 账户的格式一致
  const sub = `email|${verifyCodeResult.subject}`;
  const { wallet: userWallet } = await userUtil.getUserFromSub(sub, { req });
  const userInfo = {
    email: verifyCodeResult.subject,
    provider: LOGIN_PROVIDER.EMAIL,
  };

  const userDid = userWallet.address;
  const userPk = userWallet.publicKey;

  let profile;
  let currentUser = await federatedUtil.getUserWithinFederated(
    { sourceAppPid, teamDid, userDid, userPk },
    { node, blocklet }
  );
  logger.info('Email invite: get user info', { teamDid, currentUser });
  const nodeInfo = await req.getNodeInfo();
  const { name: applicationName } = await getApplicationInfo({ node, nodeInfo, teamDid });

  if (!currentUser) {
    currentUser = {
      did: userDid,
      pk: userPk,
    };

    const avatar = await userUtil.getAvatarBnByEmail(verifyCodeResult.subject, { req, node });
    profile = {
      fullName: userUtil.getUserNameByEmail(verifyCodeResult.subject),
      avatar,
      email: verifyCodeResult.subject,
      // email 登录默认认为邮箱已验证
      emailVerified: true,
    };
  }

  const statusEndpointBaseUrl = joinURL(baseUrl, WELLKNOWN_SERVICE_PATH_PREFIX);
  const endpoint = baseUrl;

  const { passport, response, role, inviteInfo, user } = await handleInvitationReceive({
    req,
    node,
    endpoint,
    inviteId,
    nodeInfo,
    profile: profile || {
      email: currentUser.email,
      fullName: currentUser.fullName,
      avatar: getUserAvatarUrl(baseUrl, currentUser.avatar),
    },
    statusEndpointBaseUrl,
    teamDid,
    userDid: userWallet.address,
    userPk: userWallet.publicKey,
    locale,
    provider: LOGIN_PROVIDER.EMAIL,
  });

  if (currentUser) {
    const walletDid = getWalletDid(currentUser);
    if (walletDid) {
      // 如果已经绑定了 wallet 账户，则将 passport 发送给 wallet 账户
      await sendToUser(
        walletDid,
        {
          title: 'Invitation accepted',
          body: `You accept an invitation to be a ${role} of ${applicationName}`,
          attachments: [
            {
              type: 'vc',
              data: {
                credential: response.data,
                tag: role,
              },
            },
          ],
        },
        { req }
      );
    }
  }
  const connectedAccount = {
    provider: LOGIN_PROVIDER.EMAIL,
    id: sub,
    did: userWallet.address,
    pk: userWallet.publicKey,
    userInfo,
  };

  if (profile) {
    profile.inviter = inviteInfo.inviter?.did;
  }

  const { sessionToken, refreshToken, visitorId } = await userUtil.loginUserSession(
    {
      did: currentUser.did,
      pk: currentUser.pk,
      profile,
      passport,
      sourceAppPid,
      connectedAccount,
      provider: LOGIN_PROVIDER.EMAIL,
    },
    { req, node, options, loggedUser: user }
  );

  return {
    sessionToken,
    refreshToken,
    visitorId,
  };
}

const checkTokenSchema = Joi.object({
  token: Joi.string().required(),
  type: Joi.string().valid('sessionToken', 'refreshToken').optional().default('sessionToken'),
});

const privacyConfigInputSchema = Joi.object({
  did: Joi.DID().optional(),
  name: Joi.string().optional(),
});

const privacyConfigSetSchema = Joi.object().pattern(
  Joi.string(),
  Joi.alternatives().try(Joi.boolean(), Joi.string().valid('all', 'private', 'follower-only'))
);

const notificationConfigSetSchema = Joi.object({
  notifications: Joi.object().pattern(Joi.string(), Joi.boolean()).optional(),
  webhooks: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().uri(),
        type: Joi.string().valid('slack', 'api'),
        enabled: Joi.boolean().optional().default(true),
        consecutiveFailures: Joi.number().optional().default(0),
      })
    )
    .optional(),
});

const webhookSetSchema = Joi.object({
  type: Joi.string().valid('slack', 'api').required(),
  url: Joi.string().uri().required(),
});

const addressSchema = Joi.object({
  country: Joi.string().trim().allow('').max(50).optional(),
  province: Joi.string().trim().allow('').max(50).optional(),
  city: Joi.string().trim().allow('').max(50).optional(),
  postalCode: Joi.string().allow('').trim().max(20).optional(),
  line1: Joi.string().allow('').trim().max(200).optional(),
  line2: Joi.string().allow('').trim().max(200).optional(),
});

const profileSetSchema = Joi.object({
  locale: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  fullName: Joi.string().optional(),
  inviter: Joi.DID().trim().empty(null),
  metadata: Joi.object({
    email: Joi.string().email().optional().label('email'),
    phone: Joi.object({
      phoneNumber: Joi.string().allow('').optional(),
      country: Joi.string().allow('').optional(),
    })
      .optional()
      .label('phone'),
    bio: Joi.string().allow('').max(200).optional().label('bio'),
    timezone: Joi.string().allow('').optional().label('timezone'),
    location: Joi.string().allow('').optional().label('location'),
    status: Joi.object({
      label: Joi.string().optional(),
      icon: Joi.string().optional(),
      value: Joi.string().optional(),
      duration: Joi.string().optional(),
      dateRange: Joi.array().items(Joi.string().required()).length(2).optional(),
    }).optional(),
    links: Joi.array()
      .max(10)
      .items(
        Joi.object({
          favicon: Joi.string().optional(),
          url: Joi.string()
            .uri({
              scheme: ['http', 'https'],
            })
            .required(),
        })
      )
      .optional()
      .label('link'),
  }).optional(),
  address: addressSchema.optional(),
  avatar: Joi.string().optional(),
  name: Joi.string().optional(),
});

const spaceGatewaySchema = Joi.object({
  did: Joi.string().required(),
  name: Joi.string().required(),
  url: Joi.string().required(),
  endpoint: Joi.string().required(),
});

const queryOrgsInputSchema = Joi.object({
  search: Joi.string().optional().allow(''),
  page: Joi.number().optional().min(1).default(1),
  pageSize: Joi.number().optional().min(1).default(20),
  type: Joi.string().valid('owned', 'joined').optional().allow('').allow(null),
});

module.exports = {
  init(server, node, options) {
    const ensureCors = cors(async (req, callback) => {
      const origin = req.get('origin');
      if (!origin) {
        callback(null, { origin: true });
      } else {
        const { hostname } = new URL(origin);
        const domains = await federatedUtil.getTrustedDomains({ node, req, blocklet: req.blocklet });
        if (domains.includes(hostname)) {
          callback(null, { origin: true });
        } else {
          callback(new CustomError(403, 'Not allowed by CORS'));
        }
      }
    });

    // 应用后端自行登录逻辑（SDK 中调用）
    server.post([`${prefix}/login`, `${prefixApi}/login`], verifySig, async (req, res) => {
      try {
        const data = await loginSDK(req, node, options);
        res.status(200).json(data);
      } catch (err) {
        logger.error('Failed login', { error: err });
        throw err;
      }
    });

    /**
     * @description 用于在 native 钱包中完成用户的自动登录
     * @summary 暂时不允许用户注册，只允许登录
     */
    server.post(`${prefixApi}/loginByWallet`, async (req, res) => {
      let inviter = req.body?.inviter;
      if (!inviter) {
        inviter = req.query?.inviter;
      }
      if (!inviter) {
        inviter = null;
      }

      const {
        userDid,
        userPk,
        signature,
        walletOS,
        challenge,
        passportId,
        sourceAppPid = null,
        locale,
        componentId,
      } = req.body;

      // NOTICE: 先保留，需要钱包端确认是否能移除
      let visitorId = req.body?.visitorId;
      if (!visitorId) {
        visitorId = req.get('x-blocklet-visitor-id');
      }
      const { error } = loginUserWalletSchema.validate({
        userDid,
        userPk,
        signature,
        walletOS,
        challenge,
        visitorId,
        passportId,
        sourceAppPid,
        locale,
        componentId,
        inviter,
      });
      if (error) {
        throw new CustomError(400, error.message);
      }
      const blocklet = await req.getBlocklet();
      const { did: teamDid, secret } = await req.getBlockletInfo();
      const currentUser = await verifyUserSig(
        { userDid, signature, teamDid, sourceAppPid, userPk },
        { node, locale, blocklet }
      );

      const { createSessionToken } = initJwt(node, options);
      const createToken = createTokenFn(createSessionToken);
      const sessionConfig = blocklet.settings?.session || {};
      const passport = getLastUsedPassport(currentUser?.passports || [], passportId);

      const lastLoginIp = getRequestIP(req);
      const loggedInUser = await node.loginUser({
        teamDid,
        user: {
          did: currentUser.did,
          pk: currentUser.pk,
          locale,
          lastLoginIp,
          sourceAppPid,
          inviter,
          connectedAccount: {
            provider: LOGIN_PROVIDER.WALLET,
            did: userDid,
            pk: userPk,
          },
        },
      });
      const role = passport?.role || 'guest';
      const { sessionToken, refreshToken } = createToken(
        loggedInUser.did,
        {
          secret,
          passport,
          role,
          fullName: loggedInUser.fullName,
          provider: 'wallet',
          walletOS,
          emailVerified: !!loggedInUser.emailVerified,
          phoneVerified: !!loggedInUser.phoneVerified,
        },
        { ...sessionConfig, didConnectVersion: getDidConnectVersion(req) }
      );
      const ua = req.get('user-agent');
      const deviceData = getDeviceData({ req });
      const userSession = await node.upsertUserSession({
        visitorId,
        teamDid,
        userDid: loggedInUser.did,
        appPid: teamDid,
        status: USER_SESSION_STATUS.ONLINE,
        ua: null,
        lastLoginIp,
        extra: {
          walletOS,
          device: deviceData,
        },
        locale,
        origin: await getOrigin({ req }),
      });
      await node.syncUserSession({
        teamDid,
        userDid: userSession.userDid,
        visitorId: userSession.visitorId,
        passportId,
        targetAppPid: sourceAppPid,
        ua,
        lastLoginIp,
        extra: {
          walletOS,
          device: deviceData,
        },
      });

      res.json({
        sessionToken,
        refreshToken,
        challenge,
        visitorId: userSession.visitorId,
      });
    });

    // Used by ArcSphere to login by launcher token
    server.post(`${prefixApi}/loginByLauncher`, async (req, res) => {
      const { token } = req.body;
      if (!token) {
        throw new CustomError(400, 'Launcher token is required');
      }

      const blocklet = await req.getBlocklet();
      if (!blocklet.controller) {
        logger.debug('Launcher login is not supported for this blocklet', { blockletDid: blocklet.appDid });
        throw new CustomError(400, 'Launcher login is not supported for this blocklet');
      }

      try {
        const result = await doLauncherLogin(req, token, blocklet, node, options);
        if (result) {
          res.json({
            sessionToken: result.sessionToken,
            refreshToken: result.refreshToken,
            visitorId: result.visitorId,
          });
        } else {
          throw new CustomError(400, 'Failed to login by launcher: not matched');
        }
      } catch (err) {
        logger.error('Failed to login by launcher', { error: err });
        throw new CustomError(500, 'Failed to login by launcher: internal error');
      }
    });

    server.post(`${prefixApi}/checkUser`, async (req, res) => {
      const { users = [], sourceAppPid } = req.body;
      const { error } = checkUserSchema.validate({
        users,
        sourceAppPid,
      });
      if (error) {
        throw new CustomError(400, error.message);
      }

      const blocklet = await req.getBlocklet();
      const { did: teamDid } = await req.getBlockletInfo();
      const pendingList = users.map(async (item) => {
        if (item?.did && item?.pk) {
          const findUser = await federatedUtil.getUserWithinFederated(
            { sourceAppPid, teamDid, userDid: item.did, userPk: item.pk },
            { node, blocklet }
          );
          const resItem = { ...item, exist: false, approved: false };
          if (findUser) {
            resItem.exist = true;
            if (findUser.approved) {
              resItem.approved = true;
            }
          }
          return resItem;
        }

        return item;
      });
      const resList = await Promise.all(pendingList);
      res.json({ users: resList });
    });

    server.post(`${prefixApi}/checkToken`, async (req, res) => {
      const { error, value } = checkTokenSchema.validate(req.body);
      if (error) {
        throw new CustomError(400, error.message);
      }
      const cacheInstance = value.type === 'sessionToken' ? cache.sessionToken : cache.refreshToken;
      const cacheData = await cacheInstance.get(md5(value.token));
      if (cacheData?.block) {
        res.json({ valid: false });
        return;
      }
      res.json({ valid: true });
    });

    server.post(`${prefixApi}/logout`, ensureBlocklet(), async (req, res) => {
      if (req.user) {
        const { blocklet } = req;
        const teamDid = blocklet.appPid;
        // NOTICE: 此处需要保留从 body 携带 visitorId 的功能，用于已登录用户注销自己指定的登录会话
        // eslint-disable-next-line prefer-const
        let { status, visitorId, includeFederated, refreshToken } = req.body;
        const params = {};
        if (!visitorId) {
          visitorId = req.get('x-blocklet-visitor-id');
        }
        if (status) {
          params.status = status;
          if (visitorId && status === USER_SESSION_STATUS.ONLINE) {
            // HACK: 用户使用当前登录会话注销所有会话时，要排除当前登录会话
            params.visitorId = { [Op.ne]: visitorId };
          }
        } else {
          params.status = {
            [Op.ne]: USER_SESSION_STATUS.OFFLINE,
          };
          if (visitorId) {
            params.visitorId = visitorId;
          }
        }
        if (!params.visitorId && !params.status) {
          res.status(400).json({ error: 'visitorId or status is required' });
          return;
        }

        try {
          const { token } = req;
          if (token) {
            const sessionTtl = jwtDecode(token).exp * 1000 - Date.now();
            if (sessionTtl > 0) {
              await cache.sessionToken.set(md5(token), { block: true }, { ttl: sessionTtl });
            }
          }
          // 兼容旧版本，API 不会携带 refreshToken 的情况
          if (refreshToken) {
            const refreshTtl = jwtDecode(refreshToken).exp * 1000 - Date.now();
            if (refreshTtl > 0) {
              await cache.refreshToken.set(md5(refreshToken), { block: true }, { ttl: refreshTtl });
            }
          }
        } catch (err) {
          logger.error('Failed to block session token & refresh token', { error: err });
        }

        await node.logoutUser({
          ...params,
          userDid: req.user.did,
          appPid: includeFederated ? undefined : teamDid,
          teamDid,
        });
      }
      res.status(204).send();
    });

    // public api
    server.get(`${prefixApi}/privacy/config`, ensureBlocklet({ useCache: true }), async (req, res) => {
      const { error, value } = privacyConfigInputSchema.validate({
        did: req.query?.did,
        name: req.query?.name,
      });
      if (error || (!value.did && !value.name)) {
        res.status(400).send({ error: 'Invalid user did or name' });
        return;
      }

      const { blocklet } = req;
      const teamDid = blocklet.appPid;
      let queryOptions;
      if (value.name) {
        queryOptions = {
          name: value.name,
        };
      }
      const user = await node.getUser({
        teamDid,
        user: { did: value.did },
        options: queryOptions,
      });
      if (!user || !user?.approved) {
        res.status(404).send({ error: 'User not found' });
        return;
      }
      res.json(user?.extra?.privacy || {});
    });

    server.post(`${prefixApi}/privacy/config`, checkUser, ensureBlocklet({ useCache: true }), async (req, res) => {
      const { value, error } = privacyConfigSetSchema.validate(req.body);
      if (error) {
        res.status(400).send({ error: error.message });
        return;
      }

      const { blocklet } = req;
      const teamDid = blocklet.appPid;
      const exist = await node.getUser({ teamDid, user: { did: req.user.did } });
      if (!exist || !exist?.approved) {
        res.status(404).send({ error: 'User not found' });
        return;
      }
      const preSaveData = merge({}, exist.extra || {}, {
        privacy: value,
      });
      const user = await node.updateUserExtra({
        teamDid,
        did: req.user.did,
        extra: JSON.stringify(preSaveData),
      });

      const result = user?.extra?.privacy || {};

      await node.createAuditLog(
        {
          action: 'updateUserExtra',
          args: { teamDid, userDid: req.user.did, type: 'privacy' },
          context: formatContext(req),
          result: {
            privacy: value, // @FIXME: liushuang，多传一层的目的是为了保持和 SDK 相同结构
          },
        },
        node
      );
      res.json(result);
    });

    server.get(
      `${prefixApi}/notification/config`,
      checkUserSig({ node }),
      checkUser,
      ensureBlocklet(),
      async (req, res) => {
        const { blocklet } = req;
        const teamDid = blocklet.appPid;
        const user = await node.getUser({ teamDid, user: { did: req.user.did } });
        if (!user || !user?.approved) {
          res.status(404).send({ error: 'User not found' });
          return;
        }
        res.json(pick(user.extra || {}, ['notifications', 'webhooks']));
      }
    );
    server.post(
      `${prefixApi}/notification/config`,
      checkUserSig({ node }),
      checkUser,
      ensureBlocklet(),
      async (req, res) => {
        const { value, error } = notificationConfigSetSchema.validate(req.body);
        if (error) {
          res.status(400).send({ error: error.message });
          return;
        }
        const referer = req.get('referer');
        if (!referer) {
          res.status(400).send({ error: 'Invalid request' });
          return;
        }
        const currentHost = req.get('x-real-hostname') || req.get('host');
        if (!isAllowedReferer(referer, currentHost)) {
          res.status(400).send({ error: 'Invalid request' });
          return;
        }

        const { blocklet } = req;
        const teamDid = blocklet.appPid;
        const exist = await node.getUser({ teamDid, user: { did: req.user.did } });
        if (!exist || !exist?.approved) {
          res.status(404).send({ error: 'User not found' });
          return;
        }
        const preSaveData = merge({}, exist?.extra || {}, {
          notifications: value.notifications,
        });

        // 对 webhook URL 进行验证
        const { value: webhooksValue, error: webhooksError } = await userUtil.validateWebhooks({
          webhooks: value.webhooks,
          user: exist,
        });
        if (webhooksError) {
          res.status(400).send({ error: webhooksError });
          return;
        }
        if (webhooksValue) {
          preSaveData.webhooks = webhooksValue;
        }
        const user = await node.updateUserExtra({
          teamDid,
          did: req.user.did,
          extra: JSON.stringify(preSaveData),
        });
        const result = pick(user.extra || {}, ['notifications', 'webhooks']);
        await node.createAuditLog(
          {
            action: 'updateUserExtra',
            args: { teamDid, userDid: req.user.did, type: value.webhooks ? 'webhooks' : 'notifications' },
            context: formatContext(req),
            result,
          },
          node
        );
        res.json(result);
      }
    );

    // master 帮 member 进行邮件代发
    server.post(
      `${prefixApi}/email/forwardSendCode`,
      ensureBlocklet(),
      checkFederatedCall({ mode: 'memberToMaster', allowStatus: ['approved'] }),
      createEmailLimiter({ prefix: '/email/forwardSendCode', getEmail: (req) => req.verifyData?.subject }),
      async (req, res) => {
        const { blocklet, verifyData, verifySite } = req;
        const teamDid = blocklet.appPid;
        const { subject, code, magicLink, appName, locale } = verifyData;

        const emailBody = await render(
          VerifyCodeBody({
            code,
            magicLink,
            appName,
            locale,
          })
        );
        const result = await sendEmail(
          subject,
          {
            title: t('emailTitle', locale, { appName }),
            body: emailBody,
            appInfo: {
              logo: joinURL(verifySite.appUrl, verifySite.appLogo),
              description: verifySite.appDescription,
              title: verifySite.appName,
              version: verifySite.version,
              url: getUTMUrl(verifySite.appUrl),
            },
          },
          {
            teamDid,
            node,
            locale,
            raw: true,
            launcher: true,
          }
        );
        res.json(result);
      }
    );

    server.post(
      `${prefixApi}/email/sendCode`,
      ensureBlocklet(),
      ensureCors,
      createEmailLimiter({ prefix: '/email/sendCode', getEmail: (req) => req.body?.email }),
      async (req, res) => {
        const locale = req.blockletLocale;
        const { blocklet } = req;
        const teamDid = blocklet.appPid;
        const { email, useCode = true, useMagicLink = true, sourceAppPid = null } = req.body;

        const { error, value: subject } = emailSchema.validate(email);

        if (error) {
          res.status(400).send({ error: t('emailInvalid', locale), code: 'email_invalid' });
          return;
        }

        if (await node.isSubjectSent({ teamDid, subject })) {
          res.status(400).send({
            error: t('emailAlreadySent', locale),
            code: 'email_already_sent',
          });
          return;
        }

        const blockletInfo = await req.getBlockletInfo();
        const doc = await node.createVerifyCode({ teamDid, subject, purpose: 'login' });
        const now = Math.floor(Date.now() / 1000);
        const magicLinkToken = await JWT.signV2(blockletInfo.wallet.address, blockletInfo.wallet.secretKey, {
          exp: String(now + VERIFY_CODE_TTL),
          data: {
            id: doc.id,
            code: doc.code,
          },
        });
        logger.info('Email login: create verify code', { teamDid, doc });

        const emailData = {
          appName: blockletInfo.name,
          locale,
        };
        if (useCode) {
          emailData.code = doc.code;
        }
        if (useMagicLink) {
          emailData.magicLink = withQuery(req.get('referer'), {
            magicToken: magicLinkToken,
            sourceAppPid,
          });
        }

        let result;
        if (sourceAppPid) {
          // 通知 master 去发送邮件
          result = await federatedUtil.sendEmailVerifyCode({
            blocklet,
            blockletInfo,
            request: req,
            params: {
              ...emailData,
              subject,
              locale,
            },
          });
        } else {
          const emailBody = await render(VerifyCodeBody(emailData));
          result = await sendEmail(
            subject,
            {
              title: t('emailTitle', locale, { appName: blockletInfo.name }),
              body: emailBody,
            },
            {
              teamDid,
              node,
              locale,
              raw: true,
              launcher: true,
            }
          );
        }

        logger.info('Email login: send verify code', { teamDid, result });
        await node.sendVerifyCode({ teamDid, code: doc.code });

        // 返回 verify code 的 id，用于后续状态的监听
        res.json({ id: doc.id });
      }
    );
    server.get(`${prefixApi}/email/status`, ensureBlocklet(), ensureCors, async (req, res) => {
      const { codeId } = req.query;
      const { blocklet } = req;
      const teamDid = blocklet.appPid;
      const doc = await node.getVerifyCode({ teamDid, id: codeId });
      logger.info('Email login: check verify code status', { teamDid, codeId, doc });
      if (doc) {
        res.json({ verified: doc.verified, id: doc.id });
      } else {
        res.json({ verified: false, id: undefined });
      }
    });
    server.get(`${prefixApi}/email/test`, ensureBlocklet(), ensureCors, async (req, res) => {
      res.json({ success: true });
    });
    server.post(
      `${prefixApi}/email/login`,
      ensureBlocklet(),
      ensureCors,
      createRateLimiter({ limit: process.env.ABT_NODE_EMAIL_VERIFY_RATE_LIMIT || 5, prefix: '/email/login' }),
      async (req, res) => {
        const { action = 'login' } = req.body;
        const actionMap = {
          login: loginEmail,
          invite: inviteEmail,
          'destroy-self': loginEmail,
        };
        if (!actionMap[action]) {
          logger.error('Failed to login by email', { error: 'action not exist', action });
          throw new CustomError(400, `action not exist: ${action}`);
        }

        try {
          const result = await actionMap[action](req, node, options);
          res.json(result);
        } catch (err) {
          logger.error('Failed login email', { error: err, action });
          throw err;
        }
      }
    );

    server.put(`${prefixApi}/notification/webhook`, checkUser, ensureBlocklet(), async (req, res) => {
      const { value, error } = webhookSetSchema.validate(req.body);
      if (error) {
        res.status(400).send({ error: error.message });
        return;
      }

      // 验证是否相同的 referer
      const referer = req.get('referer');
      const currentHost = req.get('x-real-hostname') || req.get('host');
      if (!isAllowedReferer(referer, currentHost)) {
        res.status(400).send({ error: 'Invalid request' });
        return;
      }

      if (!(await isAllowedURL(value.url))) {
        res.status(400).send('Invalid parameter: internal');
        return;
      }

      await node.sendTestMessage(
        {
          webhook: {
            type: value.type,
            params: [{ name: 'url', value: value.url }],
          },
          message: `This is a test message from user ${req.user.did}`,
        },
        { referer, host: currentHost }
      );

      res.json({ success: true });
    });

    // 获取用户的个人信息配置
    server.get(`${prefixApi}/profile`, checkUser, ensureBlocklet(), async (req, res) => {
      const { blocklet } = req;
      const teamDid = blocklet.appPid;
      const exist = await node.getUser({ teamDid, user: { did: req.user.did } });
      if (!exist || !exist?.approved) {
        res.status(404).send({ error: 'User not found' });
        return;
      }
      res.json(pick(exist || {}, ['did', 'locale']));
    });

    // 更新用户的个人信息配置
    server.put(
      `${prefixApi}/profile`,
      checkUser,
      ensureBlocklet(),
      xss({
        whiteList: {},
        stripIgnoreTag: true,
        onIgnoreTag: false,
        stripIgnoreTagBody: ['script'],
      }),
      async (req, res) => {
        const { value, error } = profileSetSchema.validate(req.body);
        if (error) {
          res.status(400).send({ error: error.message });
          return;
        }

        const { blocklet } = req;
        const { metadata, address, avatar } = value;
        const teamDid = blocklet.appPid;

        // 构建更新对象，只包含有值的字段
        const updateData = {
          did: req.user.did,
          ...omitBy(value, (x) => !x),
        };

        // 只有当 address 存在时才添加到更新对象中
        if (address) {
          updateData.address = address;
          if (metadata.location) {
            metadata.location = address.city;
          }
        }

        // 只有当 metadata 存在时才添加到更新对象中
        if (metadata) {
          const _metadata = omit(metadata, ['email']);
          updateData.metadata = _metadata;

          // 处理 email 和 phone
          if (metadata.email) {
            updateData.email = metadata.email;
          }

          if (metadata.phone) {
            updateData.phone = metadata.phone?.phoneNumber || null;
          }
        }

        if (avatar) {
          if (!avatar.startsWith(USER_AVATAR_URL_PREFIX)) {
            let imageData = avatar;
            if (isUrl(avatar)) {
              imageData = await convertImageToBase64(avatar);
            }
            if (imageData) {
              const regex = /^data:image\/(\w+);base64,/;
              const match = regex.exec(imageData);
              if (match) {
                updateData.avatar = await extractUserAvatar(imageData, { dataDir: blocklet.env.dataDir });
              }
            }
          }
        }
        try {
          const user = await node.updateUserInfoAndSync({
            teamDid,
            user: updateData,
          });
          if (!user || !user?.approved) {
            res.status(404).send({ error: 'User not found' });
            return;
          }

          await node.createAuditLog(
            {
              action: 'updateUserInfo',
              args: { teamDid, userDid: req.user.did },
              context: formatContext(req),
              result: updateData,
            },
            node
          );

          res.json(
            pick(user || {}, [
              'did',
              'locale',
              'avatar',
              'name',
              'fullName',
              'email',
              'phone',
              'url',
              'inviter',
              'generation',
              'emailVerified',
              'phoneVerified',
              'metadata',
              'address',
            ])
          );
        } catch (err) {
          res.status(getStatusFromError(err)).send(formatError(err));
        }
      }
    );

    // 支持用户刷新 profile 信息
    server.put(
      `${prefixApi}/refreshProfile`,
      ensureBlocklet(),
      /**
       *
       * @param {import('express').Request} req
       * @param {import('express').Response} res
       * @returns
       */
      async (req, res) => {
        try {
          const { blocklet } = req;
          const teamDid = blocklet.appPid;
          const userDid = req.user.did;

          await Profile.refresh({
            node,
            blocklet,
            teamDid,
            userDid,
          });

          return res.send();
        } catch (err) {
          /** @type {import('axios').AxiosError} */
          const e = err;
          console.error(e);
          return res.status(400).send(e?.response?.data || e.message);
        }
      }
    );

    // 支持用户更新 DID Space 信息
    server.put(`${prefixApi}/updateDidSpace`, checkUser, ensureBlocklet(), async (req, res) => {
      try {
        const { error, value } = spaceGatewaySchema.validate(req.body.spaceGateway);

        if (error) {
          console.error(error);
          res.status(400).send(error.message);
          return;
        }

        const { blocklet } = req;
        const teamDid = blocklet.appPid;
        const userDid = req.user.did;

        const user = await node.getUser({
          teamDid,
          user: {
            did: userDid,
          },
          options: {
            enableConnectedAccount: true,
          },
        });

        const doc = node.updateUser({
          teamDid,
          user: {
            did: user.did,
            didSpace: {
              ...user?.didSpace,
              ...value,
            },
          },
        });

        await node.createAuditLog(
          {
            action: 'updateDidSpace',
            args: { teamDid, userDid, spaceGateway: value },
            context: formatContext(req),
            result: doc,
          },
          node
        );

        res.send();
      } catch (err) {
        console.error(err);
        res.status(400).send(formatError(err));
      }
    });

    // update or query space hosts for existing users
    server.get(`${prefixApi}/spaceHosts`, checkUser, ensureBlocklet(), async (req, res) => {
      try {
        const action = req.query.update ? 'update' : 'query';
        if (action === 'update') {
          const state = await node.getUserState(req.blocklet.appPid);
          const items = await state.query('SELECT didSpace FROM users WHERE didSpace IS NOT NULL');
          const hosts = uniq(items.map((x) => JSON.parse(x.didSpace)?.url).filter(Boolean));
          for (const host of hosts) {
            // eslint-disable-next-line no-await-in-loop
            await node.updateUserSpaceHosts({ did: req.blocklet.appPid, url: host });
          }
        }

        const hosts = await node.getUserSpaceHosts({ did: req.blocklet.appPid });
        res.json({
          hosts,
          settings: req.blocklet.settings.userSpaceHosts,
        });
      } catch (err) {
        console.error(err);
        res.status(400).send(formatError(err));
      }
    });

    // public api
    // 获取用户可以公开的信息
    server.get(`${prefixApi}`, ensureBlocklet(), async (req, res) => {
      try {
        const { blocklet } = req;
        const teamDid = blocklet.appPid;
        const userInfo = await getUserPublicInfo({ req, teamDid, node });
        res.json(userInfo);
      } catch (err) {
        logger.error('Failed to get user public info', { error: err, userDid: req.user?.did });
        res.status(400).send(formatError(err));
      }
    });

    server.delete(`${prefixApi}`, checkUser, ensureBlocklet(), async (req, res) => {
      const { blocklet } = req;
      const teamDid = blocklet.appPid;
      const allowSkipDestroyMyselfVerify = blocklet?.configObj?.ALLOW_SKIP_DESTROY_MYSELF_VERIFY;
      if (!['true', true].includes(allowSkipDestroyMyselfVerify)) {
        const connectedAccounts = req.user?.connectedAccounts || [];
        const ALLOW_VERIFY_PROVIDERS = [LOGIN_PROVIDER.WALLET];
        if (connectedAccounts.some((x) => ALLOW_VERIFY_PROVIDERS.includes(x.provider))) {
          res.status(401).json({ error: t('notAllowedToDestroy', req.blockletLocale) });
          return;
        }
      }

      try {
        const result = await node.removeUser({ teamDid, user: req.user });
        logger.info('User.destroySelf', { teamDid, userDid: req.user.did, result });
        await node.createAuditLog(
          {
            action: 'destroySelf',
            args: { teamDid, userDid: req.user.did },
            context: formatContext(req),
            result,
          },
          node
        );
        res.json(result);
      } catch (err) {
        logger.error('Failed to destroy user', { error: err, userDid: req.user.did });
        res.status(500).json({ error: t('failedToDestroyUser', req.blockletLocale) });
      }
    });

    server.post(`${prefixApi}/follow/:userDid`, checkUser, ensureBlocklet(), async (req, res) => {
      const { blocklet } = req;
      const teamDid = blocklet.appPid;
      const followerDid = req.user.did;
      const { userDid } = req.params;
      // 防止自己关注自己
      if (followerDid === userDid) {
        res.status(400).send({ error: 'Cannot follow yourself' });
        return;
      }
      const user = await node.getUser({ teamDid, user: { did: userDid } });
      if (!user) {
        res.status(404).send({ error: 'User not found' });
        return;
      }

      try {
        const result = await node.followUser({ teamDid, userDid, followerDid });
        await node.createAuditLog(
          {
            action: 'followUser',
            args: { teamDid, userDid, followerDid },
            context: formatContext(req),
          },
          node
        );
        res.json(result);
      } catch (err) {
        logger.error('Failed to follow user', { error: err, userDid: req.user.did });
        res.status(500).send(formatError(err));
      }
    });

    server.delete(`${prefixApi}/follow/:userDid`, checkUser, ensureBlocklet(), async (req, res) => {
      const { blocklet } = req;
      const teamDid = blocklet.appPid;
      const followerDid = req.user.did;
      const { userDid } = req.params;
      if (!followerDid) {
        res.status(400).send({ error: 'User not login' });
        return;
      }
      // 防止自己取消关注自己
      if (followerDid === userDid) {
        res.status(400).send({ error: 'Cannot unfollow yourself' });
        return;
      }
      const user = await node.getUser({ teamDid, user: { did: userDid } });
      if (!user) {
        res.status(404).send({ error: 'User not found' });
        return;
      }

      try {
        const result = await node.unfollowUser({ teamDid, userDid, followerDid });
        await node.createAuditLog(
          {
            action: 'unfollowUser',
            args: { teamDid, userDid, followerDid },
            context: formatContext(req),
          },
          node
        );
        res.json(result);
      } catch (err) {
        logger.error('Failed to unfollow user', { error: err, userDid: req.user.did });
        res.status(500).send(formatError(err));
      }
    });

    server.get(`${prefixApi}/follow/:userDid`, checkUser, ensureBlocklet(), async (req, res) => {
      const { blocklet } = req;
      const teamDid = blocklet.appPid;
      const followerDid = req.user.did;
      const { userDid } = req.params;
      if (followerDid === userDid) {
        res.status(400).send({ error: 'Cannot check following yourself' });
        return;
      }
      if (!userDid) {
        res.status(400).send({ error: 'User DID is required' });
        return;
      }
      const user = await node.getUser({ teamDid, user: { did: userDid } });
      if (!user) {
        res.status(404).send({ error: 'User not found' });
        return;
      }
      try {
        const data = await node.checkFollowing({ teamDid, userDids: [userDid], followerDid });
        const isFollowing = data && typeof data[userDid] === 'boolean' ? data[userDid] : false;
        res.json({ isFollowing });
      } catch (err) {
        logger.error('Failed to check if user is following', { error: err, userDid: req.user.did });
        res.status(500).send(formatError(err));
      }
    });

    /* ********************************* org 相关 ********************************* */
    /**
     * 获取用户所有的 org 列表：包括我创建的和加入的
     */
    server.get(`${prefixApi}/orgs`, checkUser, ensureBlocklet(), ensureOrgEnabled(), async (req, res) => {
      try {
        const { blocklet } = req;
        const teamDid = blocklet.appPid;
        const { error, value } = queryOrgsInputSchema.validate(req.query);
        if (error) {
          res.status(400).send({ error: error.message });
          return;
        }
        const { search, page = 1, pageSize = 20, type } = value;
        // 查询所有的（包括我创建的和我加入的）
        const params = { teamDid, paging: { page, pageSize }, ...(type ? { type } : {}) };
        if (search) {
          params.org = {
            name: search,
            description: search,
          };
        }
        const result = await node.getOrgs(params, { user: req.user });
        res.json(result);
      } catch (err) {
        logger.error('Failed to get orgs', { error: err, userDid: req.user.did });
        res.status(getStatusFromError(err)).send(formatError(err));
      }
    });

    /**
     * 创建 org
     */
    server.post(`${prefixApi}/orgs`, checkUser, ensureBlocklet(), ensureOrgEnabled(), async (req, res) => {
      try {
        const { blocklet } = req;
        const teamDid = blocklet.appPid;
        const { org } = req.body;
        if (!org.name) {
          res.status(400).send({ error: 'name is required' });
          return;
        }
        const result = await node.createOrg({ teamDid, ...org }, { user: req.user });
        await node.createAuditLog(
          {
            action: 'createOrg',
            args: { teamDid, ...org },
            context: formatContext(Object.assign(req, { user: req.user })),
            result,
          },
          node
        );
        res.json(result);
      } catch (err) {
        logger.error('Failed to create org', { error: err, userDid: req.user.did });
        res.status(getStatusFromError(err)).send(formatError(err));
      }
    });

    /**
     * 获取一个 org 详情
     */
    server.get(`${prefixApi}/orgs/:orgId`, checkUser, ensureBlocklet(), ensureOrgEnabled(), async (req, res) => {
      try {
        const { blocklet } = req;
        const teamDid = blocklet.appPid;
        const { orgId } = req.params;
        const result = await node.getOrg({ teamDid, id: orgId }, { user: req.user });
        res.json(result);
      } catch (err) {
        logger.error('Failed to get org', { error: err, userDid: req.user.did });
        res.status(getStatusFromError(err)).send(formatError(err));
      }
    });

    /**
     * 获取所有的 roles 列表
     */
    server.get(`${prefixApi}/role`, checkUser, ensureBlocklet(), async (req, res) => {
      try {
        const { blocklet } = req;
        const teamDid = blocklet.appPid;
        const { name = '' } = req.query;
        if (!name) {
          res.status(400).send({ error: 'role name is required' });
          return;
        }

        const result = await node.getRole({ teamDid, role: { name } }, { user: req.user });
        res.json(result);
      } catch (err) {
        logger.error('Failed to get role', { error: err, userDid: req.user.did });
        res.status(getStatusFromError(err)).send(formatError(err));
      }
    });

    /**
     * 将资源添加到 org 下
     */
    server.post(
      `${prefixApi}/orgs/:orgId/resources`,
      checkUser,
      ensureBlocklet(),
      ensureOrgEnabled(),
      async (req, res) => {
        try {
          const { blocklet } = req;
          const teamDid = blocklet.appPid;
          const { orgId } = req.params;
          const { resourceId, ...rest } = req.body;
          const result = await node.addOrgResource(
            { teamDid, orgId, resourceIds: [resourceId], ...rest },
            { user: req.user }
          );
          await node.createAuditLog(
            {
              action: 'addOrgResource',
              args: { teamDid, orgId, resourceIds: [resourceId], ...rest },
              context: formatContext(Object.assign(req, { user: req.user })),
              result,
            },
            node
          );
          res.json(result);
        } catch (err) {
          logger.error('Failed to add org resource', { error: err, orgId: req.params.orgId });
          res.status(getStatusFromError(err)).send(formatError(err));
        }
      }
    );

    /**
     * 迁移资源到新的 org
     */
    server.put(
      `${prefixApi}/orgs/:from/resources`,
      checkUser,
      ensureBlocklet(),
      ensureOrgEnabled(),
      async (req, res) => {
        try {
          const { blocklet } = req;
          const teamDid = blocklet.appPid;
          const { from } = req.params;
          const { to, resourceId } = req.body;
          const result = await node.migrateOrgResource(
            { teamDid, from, to, resourceIds: [resourceId] },
            { user: req.user }
          );
          await node.createAuditLog(
            {
              action: 'migrateOrgResource',
              args: { teamDid, from, to, resourceIds: [resourceId] },
              context: formatContext(Object.assign(req, { user: req.user })),
              result,
            },
            node
          );
          res.json(result);
        } catch (err) {
          logger.error('Failed to migrate org resource', { error: err, from: req.params.from });
          res.status(getStatusFromError(err)).send(formatError(err));
        }
      }
    );
  },
};
