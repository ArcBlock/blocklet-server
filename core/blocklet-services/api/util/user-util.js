const JWT = require('@arcblock/jwt');
const { CustomError } = require('@blocklet/error');
const { callFederated } = require('@abtnode/auth/lib/util/federated');
const { fromAppDid } = require('@arcblock/did-ext');

const { SECURITY_RULE_DEFAULT_ID, ROLES } = require('@abtnode/constant');
const { getApplicationInfo, messages } = require('@abtnode/auth/lib/auth');
const { extractUserAvatar, getAvatarByEmail, getUserAvatarUrl, getAvatarByUrl } = require('@abtnode/util/lib/user');
const getRequestIP = require('@abtnode/util/lib/get-request-ip');
const formatContext = require('@abtnode/util/lib/format-context');
const { checkInvitedUserOnly } = require('@abtnode/auth/lib/oauth');
const { getDeviceData } = require('@abtnode/util/lib/device');
const getOrigin = require('@abtnode/util/lib/get-origin');
const { parseWalletUA } = require('@arcblock/did-connect-js/lib/handlers/util');
const { USER_SESSION_STATUS } = require('@blocklet/constant');
const isUrl = require('is-url');
const uniqBy = require('lodash/uniqBy');
const { isSlackWebhookUrl } = require('@abtnode/util/lib/url-evaluation');
const { isAllowedURL } = require('@abtnode/util/lib/ssrf-protector');

const federatedUtil = require('./federated');
const initJwt = require('../libs/jwt');
const { createTokenFn, getDidConnectVersion } = require('.');

// 当无法从 gravatar 获取头像时，使用默认头像
const defaultAvatar =
  'data:image/png;base64,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';

/**
 * @description 获取默认的通行证（常见用于 oauth 账户账户首次登录，无任何可以使用的通行证的情况下，日志中记录的通行证信息）
 * @returns { name: string, role: string }
 */
const getDefaultPassport = () => {
  return { name: 'Guest', role: 'guest', scope: 'passport' };
};

/**
 * @description 从 request 参数中获取验证码
 * @param {object} options
 * @param {object} options.logger 日志对象
 * @param {object} options.req 请求对象
 * @returns {Promise<string>}
 */
const getVerifyCodeFromReq = async ({ logger, req }) => {
  const { code, magicToken } = req.body;
  const blocklet = await req.getBlocklet();
  const blockletInfo = await req.getBlockletInfo();
  const teamDid = blocklet.appPid;
  let finalCode = code;
  if (!code && magicToken) {
    const valid = await JWT.verify(magicToken, blockletInfo.wallet.publicKey);
    if (!valid) {
      logger.error('Email login: Invalid magic token', { teamDid, magicToken });
      throw new CustomError(401, 'Invalid magic link');
    }
    const decodeData = JWT.decode(magicToken, true);
    if (!decodeData?.data?.code) {
      logger.error('Email login: failed to parse magicToken data', { teamDid, magicToken, decodeData });
      throw new CustomError(400, 'Invalid magic token format');
    }
    finalCode = decodeData?.data?.code;
  }
  return finalCode;
};

/**
 * @description 根据 sub 获取用户钱包信息
 * @param {string} sub 用户信息 sub
 * @param {object} options
 * @param {object} options.req 请求对象
 * @returns {Promise<{ wallet: string }>} 用户钱包信息
 */
const getUserFromSub = async (sub, { req }) => {
  const blocklet = await req.getBlocklet();
  const blockletInfo = await req.getBlockletInfo();
  const { sourceAppPid = null } = req.body;

  let userWallet;
  if (sourceAppPid) {
    const masterSite = federatedUtil.getFederatedMaster(blocklet);
    const { permanentWallet } = blockletInfo;
    const result = await callFederated({
      action: 'getUser',
      site: masterSite,
      permanentWallet,
      data: {
        userSub: sub,
      },
    });
    userWallet = result?.wallet;
  } else {
    userWallet = fromAppDid(sub, blockletInfo.wallet.secretKey);
  }
  return {
    wallet: userWallet,
  };
};

const getAvatarBnByEmail = async (email, { req, node }) => {
  if (!email) {
    return defaultAvatar;
  }
  const blocklet = await req.getBlocklet();
  const nodeInfo = await req.getNodeInfo();
  const teamDid = blocklet.appPid;
  const { dataDir } = await getApplicationInfo({ node, nodeInfo, teamDid });
  let result = await getAvatarByEmail(email);
  if (!result) result = defaultAvatar;
  result = await extractUserAvatar(result, { dataDir });

  return result;
};

const getAvatarBnByUrl = async (url, { req, node }) => {
  if (!url) {
    return defaultAvatar;
  }
  const blocklet = await req.getBlocklet();
  const nodeInfo = await req.getNodeInfo();
  const teamDid = blocklet.appPid;
  const { dataDir } = await getApplicationInfo({ node, nodeInfo, teamDid });
  let result;
  try {
    result = await getAvatarByUrl(url);
  } catch {
    result = defaultAvatar;
  }
  result = await extractUserAvatar(result, { dataDir });
  return result;
};

const getUserNameByEmail = (email) => {
  // 目前通过 email 前缀来获取用户名称
  return email.split('@')[0];
};

const loginUserSession = async (
  { did, pk, profile, passport, sourceAppPid, connectedAccount, provider },
  { req, node, options, loggedUser }
) => {
  if (!did || !pk) {
    throw new CustomError(400, 'Missing required parameters');
  }
  const blocklet = await req.getBlocklet();
  const blockletInfo = await req.getBlockletInfo();
  const { locale = 'en' } = req.query;
  const teamDid = blocklet.appPid;
  const lastLoginIp = getRequestIP(req);
  const passportForLog = passport || getDefaultPassport();

  if (!loggedUser) {
    // eslint-disable-next-line no-param-reassign
    loggedUser = await node.loginUser({
      teamDid,
      user: {
        ...profile,
        did,
        pk,
        locale,
        lastLoginIp,
        sourceAppPid,
        passport,
        connectedAccount,
      },
    });
  }

  await node.createAuditLog(
    {
      action: 'login',
      args: {
        teamDid,
        userDid: did,
        passport: passportForLog,
        provider,
        sourceAppPid,
      },
      context: formatContext(Object.assign(req, { user: loggedUser })),
      result: loggedUser,
    },
    node
  );

  const ua = req.get('user-agent');
  const visitorId = req.get('x-blocklet-visitor-id');
  const deviceData = getDeviceData({ req });
  const parsedUA = parseWalletUA(ua);
  const walletOS = parsedUA?.os || 'web';
  const userSessionDoc = await node.upsertUserSession({
    teamDid,
    userDid: did,
    visitorId,
    appPid: teamDid,
    passportId: passport?.id,
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

  if (federatedUtil.shouldSyncFederated(blocklet, sourceAppPid)) {
    const syncUserData = {
      ...profile,
      did,
      pk,
      connectedAccount: [connectedAccount],
      inviter: loggedUser.inviter,
    };
    if (syncUserData.avatar) {
      syncUserData.avatar = getUserAvatarUrl(blockletInfo.appUrl, syncUserData.avatar);
    }
    const masterSite = federatedUtil.getFederatedMaster(blocklet);

    await node.syncFederated({
      did: teamDid,
      data: {
        users: [
          {
            ...syncUserData,
            action: 'connectAccount',
            sourceAppPid: sourceAppPid || masterSite?.appPid,
          },
        ],
      },
    });
    await node.syncUserSession({
      teamDid,
      userDid: userSessionDoc.userDid,
      visitorId: userSessionDoc.visitorId,
      passportId: passport?.id,
      targetAppPid: sourceAppPid,
      ua,
      lastLoginIp,
      extra: {
        walletOS,
        device: deviceData,
      },
    });
  }
  const role = passport?.scope === 'passport' ? passport.role : ROLES.GUEST;
  const { createSessionToken } = initJwt(node, Object.assign({}, options));
  const createToken = createTokenFn(createSessionToken);
  const sessionConfig = blocklet.settings?.session || {};
  const { sessionToken, refreshToken } = createToken(
    did,
    {
      secret: blockletInfo.secret,
      passport,
      role,
      fullName: loggedUser.fullName,
      provider,
      walletOS,
      emailVerified: !!loggedUser?.emailVerified,
      phoneVerified: !!loggedUser?.phoneVerified,
    },
    { ...sessionConfig, didConnectVersion: getDidConnectVersion(req) }
  );

  return {
    sessionToken,
    refreshToken,
    visitorId: userSessionDoc.visitorId,
  };
};

const checkNeedInvite = async ({ req, node, teamDid, locale }) => {
  const { accessPolicyConfig } = await req.getSecurityConfig({ id: SECURITY_RULE_DEFAULT_ID });
  const isInvitedUserOnly = await checkInvitedUserOnly(accessPolicyConfig, node, teamDid);
  if (isInvitedUserOnly) {
    throw new CustomError(403, messages.notInvited[locale]);
  }
};

// eslint-disable-next-line require-await
const validateWebhooks = async ({ webhooks, user }) => {
  if (!webhooks || !Array.isArray(webhooks) || webhooks.length === 0) {
    return { value: webhooks, error: null };
  }

  const existWebhooks = user.extra?.webhooks || [];

  // 找出用户输入中不存在于数据库的 webhook（新增或修改的）
  const webhooksToValidate = webhooks.filter((webhook) => {
    return !existWebhooks.some((existing) => existing.url === webhook.url);
  });

  // 删除操作不进行校验
  if (!webhooksToValidate.length) {
    return { value: webhooks, error: null };
  }

  // 对需要校验的 webhook 进行校验
  for (const webhook of webhooksToValidate) {
    const { url, type } = webhook;
    // 1. 校验 URL 是否合法
    if (!isUrl(url)) {
      return { value: null, error: 'Invalid webhook URL' };
    }

    // 2. 校验类型是否正确
    if (!['slack', 'api'].includes(type) || (type === 'slack' && !isSlackWebhookUrl(url))) {
      return { value: null, error: 'Invalid webhook type' };
    }
    // 3. 校验 URL 是否存在 SSRF 攻击
    // eslint-disable-next-line no-await-in-loop
    if (!(await isAllowedURL(url))) {
      return { value: null, error: 'Invalid webhook URL: internal' };
    }
  }

  // 去重：webhooks 包含全量的数据，去重时会把历史数据存在的重复数据清理掉
  const uniqueWebhooks = uniqBy(webhooks, 'url').map((webhook) => {
    return {
      ...webhook,
      consecutiveFailures: webhook.enabled ? webhook.consecutiveFailures : 0,
    };
  });

  return { value: uniqueWebhooks, error: null };
};

module.exports = {
  getDefaultPassport,
  getVerifyCodeFromReq,
  getUserFromSub,
  getAvatarBnByEmail,
  getAvatarBnByUrl,
  getUserNameByEmail,
  loginUserSession,
  checkNeedInvite,
  validateWebhooks,
};
