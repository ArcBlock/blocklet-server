/* eslint-disable max-len */
const uniq = require('lodash/uniq');
const { getActivePassports } = require('@abtnode/util/lib/passport');
const { getAppAvatarUrl, getUserAvatarUrl } = require('@abtnode/util/lib/user');
const { ROLES, USER_SESSION_STATUS } = require('@abtnode/constant');
const formatContext = require('@abtnode/util/lib/format-context');
const { getBlockletAppIdList } = require('@blocklet/meta/lib/util');
const { LOGIN_PROVIDER } = require('@blocklet/constant');
const getOrigin = require('@abtnode/util/lib/get-origin');

const { getAccessWallet } = require('@abtnode/util/lib/blocklet');
const { sign } = require('@blocklet/sdk/lib/util/csrf');
const { getApplicationInfo } = require('./auth');

const getSessionConfig = async (req) => {
  const blocklet = typeof req.getBlocklet === 'function' ? await req.getBlocklet() : null;
  return blocklet?.settings?.session || {};
};

function createPassportList(node, mode = 'server') {
  return async (req, res) => {
    const info = await node.getNodeInfo({ useCache: true });
    const userDid = req.user.did;
    const teamDid = mode === 'server' ? info.did : req.getBlockletDid();

    const { passportColor, appUrl } = await getApplicationInfo({ node, nodeInfo: info, teamDid });
    let issuers = [];
    if (mode === 'server') {
      issuers = [info.did];
    } else {
      const blockletInfo = await req.getBlockletInfo();
      issuers = uniq([blockletInfo.wallet.address, ...getBlockletAppIdList(blockletInfo)]);
    }

    // NOTICE: 这里获取的 did 是当前登录用户的永久 did，无需查询 connectedAccount
    const user = await node.getUser({ teamDid, user: { did: userDid } });
    let ownerAvatarUrl = getUserAvatarUrl(appUrl, user.avatar);
    try {
      // FIXME: 暂时将 imageFilter 等 queryString 参数移除
      const ownerAvatarUrlInstance = new URL(ownerAvatarUrl);
      ownerAvatarUrlInstance.search = '';
      ownerAvatarUrl = ownerAvatarUrlInstance.href;
    } catch {
      /* empty */
    }
    let issuerAvatarUrl = getAppAvatarUrl(appUrl);
    try {
      // FIXME: 暂时将 imageFilter 等 queryString 参数移除
      const issuerAvatarUrlInstance = new URL(issuerAvatarUrl);
      issuerAvatarUrlInstance.search = '';
      issuerAvatarUrl = issuerAvatarUrlInstance.href;
    } catch {
      /* empty */
    }

    const { passports = [] } = user || {};
    const passportTypes = getActivePassports({ passports }, issuers).map((x) => {
      return {
        display: x.scope === 'custom' ? x.display : null,
        id: x.id,
        name: x.name,
        scope: x.scope,
        role: x.role,
        title: x.scope === 'kyc' ? x.name : x.title,
        issuer: x.issuer.name,
        issuerDid: x.issuer.id,
        issuerAvatarUrl,
        ownerName: user?.fullName,
        ownerDid: userDid,
        ownerAvatarUrl,
        isDataUrl: false,
        preferredColor: passportColor || 'auto',
      };
    });
    res.send(passportTypes);
  };
}

function createPassportSwitcher(node, createToken, mode = 'server') {
  return async (req, res) => {
    const info = await node.getNodeInfo({ useCache: true });

    const { passportId } = req.body;
    const userDid = req.user.did;
    const isServer = mode === 'server';
    const teamDid = isServer ? info.did : req.getBlockletDid();
    const secret = isServer ? await node.getSessionSecret() : (await req.getBlockletInfo()).secret;

    // NOTICE: 这里获取的 did 是当前登录用户的永久 did，无需查询 connectedAccount
    const user = await node.getUser({ teamDid, user: { did: userDid } });
    const { passports = [] } = user || {};
    const visitorId = req.get('x-blocklet-visitor-id');

    const passport = passportId
      ? passports.find((item) => item.id === passportId)
      : { name: 'Guest', role: 'guest', scope: 'passport' };

    if (!isServer) {
      // 需要更新用户会话中记录的 passportId
      await node.upsertUserSession({
        teamDid,
        userDid: user.did,
        visitorId,
        appPid: teamDid,
        passportId: passport?.id ?? null,
        status: USER_SESSION_STATUS.ONLINE,
        locale: req.blockletLocale,
        origin: await getOrigin({ req }),
      });
    }

    await node.createAuditLog(
      {
        action: 'switchPassport',
        args: { teamDid, userDid, passport, provider: user?.sourceProvider },
        context: formatContext(Object.assign(req, { user })),
        result: user,
      },
      node
    );

    const role = passport.scope === 'passport' ? passport.role : ROLES.GUEST;
    const { sessionToken, refreshToken } = await createToken(
      userDid,
      {
        secret,
        passport,
        role,
        fullName: user?.fullName,
        provider: passport.provider || LOGIN_PROVIDER.WALLET,
        walletOS: 'web',
        emailVerified: !!user?.emailVerified,
        phoneVerified: !!user?.phoneVerified,
      },
      { ...(await getSessionConfig(req)) }
    );

    const result = { sessionToken, refreshToken };
    if (!isServer) {
      // 生成 csrf token
      const blocklet = await req.getBlocklet();
      const accessWallet = getAccessWallet({
        blockletAppDid: blocklet.appDid || blocklet.meta.did,
        serverSecretKey: info.sk,
      });
      result.csrfToken = sign(accessWallet.secretKey, sessionToken);
    }

    res.status(200).json(result);
  };
}

/**
 * @param {object} config
 * @param {any} node
 * @param {string} teamDid
 * @returns {Promise<boolean>}
 */
const checkInvitedUserOnly = async (config, node, teamDid) => {
  const count = await node.getUsersCount({ teamDid });

  // issue owner passport for first login user
  if (count === 0) {
    return false;
  }

  const accessRoles = config?.accessPolicy?.roles ?? null;
  const accessReverse = config?.accessPolicy?.reverse ?? false;
  // eslint-disable-next-line sonarjs/prefer-single-boolean-return
  if (accessRoles === null && accessReverse === false) {
    return false;
  }

  // NOTICE: 其他情况都是需要保护的（默认情况应该也是需要保护）
  return true;
};

module.exports = {
  createPassportList,
  createPassportSwitcher,
  checkInvitedUserOnly,
  getSessionConfig,
};
