const { joinURL } = require('ufo');
const {
  createInvitationRequest,
  handleInvitationResponse,
  messages,
  checkWalletVersion,
  beforeInvitationRequest,
  canSessionBeElevated,
} = require('@abtnode/auth/lib/auth');
const { getSourceAppPid } = require('@blocklet/sdk/lib/util/login');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { LOGIN_PROVIDER, USER_SESSION_STATUS } = require('@blocklet/constant');
const getRequestIP = require('@abtnode/util/lib/get-request-ip');
const { getDeviceData } = require('@abtnode/util/lib/device');
const getOrigin = require('@abtnode/util/lib/get-origin');

const { createTokenFn, getDidConnectVersion } = require('../../../util');
const { getUserWithinFederated } = require('../../../util/federated');
const { getProfileItems, getKycClaims, verifyKycClaims } = require('../../../libs/kyc');
const { getUser } = require('../../../libs/jwt');
const logger = require('../../../libs/logger')('auth');

module.exports = function createRoutes(node, authenticator, createSessionToken) {
  return {
    action: 'invite',

    onStart: async ({ extraParams, req }) => {
      const { locale = 'en', inviteId } = extraParams;
      const teamDid = req.get('x-blocklet-did');

      await beforeInvitationRequest({ node, teamDid, locale, inviteId });
    },

    onConnect: async ({ userDid, extraParams, request, baseUrl, didwallet }) => {
      const { locale, inviteId } = extraParams;
      checkWalletVersion({ didwallet, locale });
      const nodeInfo = await request.getNodeInfo();
      const blocklet = await request.getBlocklet();
      const teamDid = request.get('x-blocklet-did');

      const claims = {
        profile: {
          fields: getProfileItems(blocklet.settings?.session, didwallet),
          description: messages.description[locale],
        },
        signature: await createInvitationRequest({
          node,
          nodeInfo,
          teamDid,
          inviteId,
          locale,
          baseUrl,
        }),
      };

      const sourceAppPid = getSourceAppPid(request);
      const user = await getUser(node, teamDid, userDid);
      const kycClaims = await getKycClaims({ blocklet, user, locale, baseUrl, sourceAppPid });
      Object.assign(claims, kycClaims);

      return claims;
    },

    onAuth: async ({ claims, userDid, userPk, challenge, updateSession, extraParams, req, baseUrl }) => {
      // NOTICE: 和 did-connect 相关的 visitorId 需要从 extraParams 中获取，不能从 headers 中获取
      const { locale, inviteId, visitorId } = extraParams;
      const sourceAppPid = getSourceAppPid(req);
      const nodeInfo = await req.getNodeInfo();
      const { secret } = await req.getBlockletInfo();
      const blocklet = await req.getBlocklet();
      const teamDid = req.get('x-blocklet-did');
      const statusEndpointBaseUrl = joinURL(baseUrl, WELLKNOWN_SERVICE_PATH_PREFIX);
      const endpoint = baseUrl;

      const existUser = await getUserWithinFederated({ sourceAppPid, teamDid, userDid, userPk }, { node, blocklet });

      const kycUpdates = await verifyKycClaims({
        node,
        blocklet,
        teamDid,
        claims,
        challenge,
        locale,
        sourceAppPid,
        user: existUser,
      });

      const { passport, response, role, profile, user, purpose } = await handleInvitationResponse({
        req,
        node,
        nodeInfo,
        teamDid,
        userDid,
        userPk,
        inviteId,
        locale,
        claims,
        statusEndpointBaseUrl,
        endpoint,
        kycUpdates,
      });

      if (purpose === 'login') {
        const walletOS = req.context.didwallet.os;

        // Generate new session token that client can save to localStorage
        const createToken = createTokenFn(createSessionToken);
        const sessionConfig = blocklet.settings?.session || {};
        const { sessionToken, refreshToken } = createToken(
          user.did,
          {
            secret,
            passport,
            role,
            fullName: profile.fullName,
            provider: LOGIN_PROVIDER.WALLET,
            walletOS,
            emailVerified: !!user?.emailVerified,
            phoneVerified: !!user?.phoneVerified,
            elevated: canSessionBeElevated(role, blocklet?.settings),
          },
          { ...sessionConfig, didConnectVersion: getDidConnectVersion(req) }
        );

        const lastLoginIp = getRequestIP(req);
        const ua = req.get('user-agent');
        const deviceData = getDeviceData({ req });
        const userSessionDoc = await node.upsertUserSession({
          teamDid,
          visitorId,
          userDid: user.did,
          appPid: teamDid,
          passportId: response.data.id,
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
        await updateSession(
          {
            sessionToken,
            refreshToken,
            visitorId: userSessionDoc?.visitorId,
          },
          true
        );
      }

      await updateSession({ passportId: response.data.id });
      logger.info('invite.success', { userDid: user.did });

      return response;
    },
  };
};
