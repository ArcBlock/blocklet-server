const JWT = require('@arcblock/jwt');
const { v4: generateId } = require('uuid');
const { isSameDid } = require('@ocap/util');
const { getDeviceData } = require('@abtnode/util/lib/device');
const getRequestIP = require('@abtnode/util/lib/get-request-ip');
const getOrigin = require('@abtnode/util/lib/get-origin');
const { USER_SESSION_STATUS } = require('@blocklet/constant');

const { createTokenFn } = require('../util');
const initJwt = require('../libs/jwt');
const logger = require('../libs/logger')('blocklet-services:launcher-login');

const doLauncherLogin = async (req, token, blocklet, node, options) => {
  const decoded = JWT.decode(token);
  const info = await req.getNodeInfo();
  const owner = await node.getOwner({ teamDid: blocklet.appPid });

  const isSameLauncher = isSameDid(decoded.iss, info.registerInfo?.appId);
  const isSameOwner = isSameDid(decoded.oid, owner?.did);
  const isSameLauncherSessionId = decoded.lid === blocklet.controller.launcherSessionId;
  const isSameBlocklet = [blocklet.appDid, blocklet.appPid].includes(decoded.aid);

  logger.debug('Launcher login check', {
    isSameLauncher,
    isSameOwner,
    isSameLauncherSessionId,
    isSameBlocklet,
    decoded,
    owner,
    launcher: info.registerInfo,
    controller: blocklet.controller,
    appDids: [blocklet.appDid, blocklet.appPid],
  });

  if (isSameLauncher && isSameOwner && isSameLauncherSessionId && isSameBlocklet) {
    const verified = await JWT.verify(token, info.registerInfo?.appPk);
    if (verified) {
      const user = await node.getUser({
        teamDid: blocklet.appPid,
        user: { did: decoded.oid },
        options: { enableConnectedAccount: true },
      });
      if (user?.approved) {
        const { secret } = await req.getBlockletInfo();

        const { createSessionToken } = initJwt(node, Object.assign({}, options));
        const createToken = createTokenFn(createSessionToken);
        const { sessionToken, refreshToken } = createToken(
          user.did,
          {
            secret,
            role: 'owner',
            fullName: user.fullName,
            provider: user.sourceProvider,
            walletOS: user.walletOS,
            emailVerified: !!user?.emailVerified,
            phoneVerified: !!user?.phoneVerified,
            elevated: true,
          },
          blocklet.settings?.session || {}
        );

        const visitorId = decoded.vid || req.cookies?.vid || generateId();

        logger.info('done auto login for launcher user', {
          appPid: blocklet.appPid,
          userDid: user.did,
          visitorId,
        });

        await node.upsertUserSession({
          teamDid: blocklet.appPid,
          userDid: user.did,
          visitorId,
          appPid: blocklet.appPid,
          passportId: null,
          status: USER_SESSION_STATUS.ONLINE,
          ua: req.get('user-agent'),
          lastLoginIp: getRequestIP(req),
          extra: {
            walletOS: user.walletOS,
            device: getDeviceData({ req }),
          },
          locale: req.blockletLocale,
          origin: await getOrigin({ req }),
        });

        return {
          sessionToken,
          refreshToken,
          visitorId,
        };
      }
      logger.warn('Launcher login failed, user is revoked', { userDid: user?.did });
    } else {
      logger.warn('Launcher login failed, token is invalid', { token, verified });
    }
  }

  return null;
};

// auto login from authenticated launcher users: will skip if user is already logged in
const launcherLogin = (node, options) => async (req, res, next) => {
  if (!req.query.__lt) {
    return next();
  }

  if (req.user) {
    return next();
  }

  const blocklet = await req.getBlocklet();
  if (!blocklet.controller) {
    logger.debug('Launcher login is not supported for this blocklet', { blockletDid: blocklet.appDid });
    return next();
  }

  try {
    const token = req.query.__lt;
    const result = await doLauncherLogin(req, token, blocklet, node, options);
    if (result) {
      res.cookie('login_token', result.sessionToken, {
        maxAge: 24 * 60 * 60 * 1000,
        secure: true,
        sameSite: 'lax',
      });
      res.cookie('vid', result.visitorId, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        secure: true,
        sameSite: 'lax',
      });
    }
  } catch (err) {
    logger.error('Failed to attach launcher token', { error: err });
  }

  return next();
};

module.exports = {
  launcherLogin,
  doLauncherLogin,
};
