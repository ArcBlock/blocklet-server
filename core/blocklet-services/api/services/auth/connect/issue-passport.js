const { joinURL } = require('ufo');
const {
  createIssuePassportRequest,
  handleIssuePassportResponse,
  checkWalletVersion,
  beforeIssuePassportRequest,
  canSessionBeElevated,
} = require('@abtnode/auth/lib/auth');
const { getSourceAppPid } = require('@blocklet/sdk/lib/util/login');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { LOGIN_PROVIDER, USER_SESSION_STATUS } = require('@blocklet/constant');
const getRequestIP = require('@abtnode/util/lib/get-request-ip');
const { getDeviceData } = require('@abtnode/util/lib/device');
const getOrigin = require('@abtnode/util/lib/get-origin');

const { createTokenFn, getDidConnectVersion } = require('../../../util');

module.exports = function createRoutes(node, authenticator, createSessionToken) {
  return {
    action: 'issue-passport',

    onStart: async ({ extraParams, req }) => {
      const { locale = 'en', id } = extraParams;
      const teamDid = req.get('x-blocklet-did');

      await beforeIssuePassportRequest({ node, teamDid, locale, id });
    },

    claims: {
      signature: async ({ extraParams, context: { request, baseUrl, didwallet } }) => {
        const { id, locale, inviteId } = extraParams;
        checkWalletVersion({ didwallet, locale });
        const nodeInfo = await node.getNodeInfo();
        const teamDid = request.get('x-blocklet-did');

        return createIssuePassportRequest({ node, nodeInfo, teamDid, id, locale, baseUrl, inviteId });
      },
    },

    onAuth: async ({ userDid, userPk, claims, extraParams, updateSession, req, baseUrl }) => {
      // NOTICE: 和 did-connect 相关的 visitorId 需要从 extraParams 中获取，不能从 headers 中获取
      const { locale, inviteId, id, visitorId, inviter } = extraParams;
      const sourceAppPid = getSourceAppPid(req);
      const nodeInfo = await node.getNodeInfo();
      const blocklet = await req.getBlocklet();
      const { secret } = await req.getBlockletInfo();
      const teamDid = req.get('x-blocklet-did');
      const statusEndpointBaseUrl = joinURL(baseUrl, WELLKNOWN_SERVICE_PATH_PREFIX);
      const endpoint = baseUrl;
      const walletOS = req.context?.didwallet?.os;
      const lastLoginIp = getRequestIP(req);
      const ua = req.get('user-agent');
      const deviceData = getDeviceData({ req });

      const { response, passport, role } = await handleIssuePassportResponse({
        req,
        node,
        nodeInfo,
        teamDid,
        userDid,
        userPk,
        id,
        locale,
        claims,
        statusEndpointBaseUrl,
        updateSession,
        endpoint,
        inviteId,
      });

      // NOTICE: 找回通行证的前提是用户已经存在，不存在需要更新 sourceAppPid 的情况，所以不会包含 sourceAppPid 字段
      const user = await node.loginUser({
        teamDid,
        user: {
          did: userDid,
          pk: userPk,
          locale,
          passport,
          lastLoginIp,
          inviter,
          connectedAccount: {
            provider: LOGIN_PROVIDER.WALLET,
            did: userDid,
            pk: userPk,
          },
        },
      });

      const userSessionDoc = await node.upsertUserSession({
        teamDid,
        visitorId,
        userDid: user.did,
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

      const createToken = createTokenFn(createSessionToken);
      const sessionConfig = blocklet.settings?.session || {};
      const { sessionToken, refreshToken } = createToken(
        userDid,
        {
          secret,
          passport,
          role,
          fullName: user.fullName,
          provider: LOGIN_PROVIDER.WALLET,
          walletOS,
          emailVerified: !!user?.emailVerified,
          phoneVerified: !!user?.phoneVerified,
          elevated: canSessionBeElevated(role, blocklet?.settings),
        },
        { ...sessionConfig, didConnectVersion: getDidConnectVersion(req) }
      );

      await updateSession(
        {
          sessionToken,
          refreshToken,
          visitorId: userSessionDoc?.visitorId,
        },
        true
      );

      return response;
    },
  };
};
