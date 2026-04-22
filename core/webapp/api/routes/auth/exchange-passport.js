const get = require('lodash/get');
const {
  messages,
  verifyNFT,
  getApplicationInfo,
  getPassportStatusEndpoint,
  canSessionBeElevated,
} = require('@abtnode/auth/lib/auth');
const {
  createPassport,
  createPassportVC,
  createUserPassport,
  getRoleFromLocalPassport,
} = require('@abtnode/auth/lib/passport');
const { MAIN_CHAIN_ENDPOINT, VC_TYPE_NODE_PASSPORT } = require('@abtnode/constant');
const { extractUserAvatar, getUserAvatarUrl } = require('@abtnode/util/lib/user');
const formatContext = require('@abtnode/util/lib/format-context');
const getRequestIP = require('@abtnode/util/lib/get-request-ip');
const { LOGIN_PROVIDER } = require('@blocklet/constant');

const logger = require('@abtnode/logger')(require('../../../package.json').name);
const { PASSPORT_SOURCE, PASSPORT_LOG_ACTION, PASSPORT_ISSUE_ACTION } = require('@abtnode/constant');

const { createToken } = require('../../libs/login');

module.exports = function createRoutes(node) {
  return {
    action: 'exchange-passport',
    onConnect: async ({ userDid, extraParams }) => {
      const { locale } = extraParams;

      if ((await node.isInitialized()) === false) {
        throw new Error(messages.notInitialized[locale]);
      }

      const info = await node.getNodeInfo();
      if (!info.trustedFactories || info.trustedFactories.length === 0) {
        throw new Error(messages.noTrustedFactories[locale]);
      }

      const user = await node.getUser({ teamDid: info.did, user: { did: userDid } });
      if (!user) {
        throw new Error(messages.userNotFound[locale]);
      }
      if (!user.approved) {
        throw new Error(messages.notAllowedAppUser[locale]);
      }

      const trustedFactories = (info.trustedFactories || []).map(x => x.factoryAddress);
      return {
        profile: {
          type: 'profile',
          fields: ['fullName', 'email', 'avatar'],
          description: messages.requestProfile[locale],
        },
        asset: {
          type: 'asset',
          description: messages.requestNFT[locale],
          filters: trustedFactories.map(x => ({ trustedParents: [x] })),
          optional: false,
        },
      };
    },

    onAuth: async ({ claims, challenge, userDid, userPk, updateSession, extraParams, req, baseUrl }) => {
      const { locale } = extraParams;
      const nodeInfo = await node.getNodeInfo();
      const teamDid = nodeInfo.did;

      // ensure nft not collected
      const claim = claims.find(x => x.type === 'asset');
      const isConnected = await node.isConnectedAccount({ teamDid, did: claim.asset });
      if (isConnected) {
        throw new Error(messages.nftAlreadyUsed[locale]);
      }

      // ensure nft state
      const nftState = await verifyNFT({ claims, challenge, locale, chainHost: MAIN_CHAIN_ENDPOINT });
      const matchFactory = nodeInfo.trustedFactories.find(x => x.factoryAddress === nftState.parent);
      if (!matchFactory) {
        throw new Error(messages.invalidNftParent[locale]);
      }

      const { role: name, ttl } = matchFactory.passport;

      const {
        name: issuerName,
        wallet: issuerWallet,
        passportColor,
        dataDir,
        logo,
      } = await getApplicationInfo({ node, nodeInfo, teamDid, baseUrl });

      const user = await node.getUser({ teamDid, user: { did: userDid } });
      if (user) {
        user.avatar = getUserAvatarUrl(baseUrl, user.avatar, nodeInfo, nodeInfo.did === teamDid);
      }

      const vc = await createPassportVC({
        issuerName,
        issuerWallet,
        issuerAvatarUrl: logo,
        ownerDid: userDid,
        ...(await createPassport({
          name,
          node,
          teamDid,
          locale,
          endpoint: baseUrl,
        })),
        endpoint: getPassportStatusEndpoint({
          baseUrl,
          // NOTICE: 优先使用用户的永久 did
          userDid: user?.did || userDid,
          teamDid,
        }),
        types: [VC_TYPE_NODE_PASSPORT],
        ownerProfile: user,
        preferredColor: passportColor,
        tag: nodeInfo.did,
        expirationDate: ttl ? new Date(Date.now() + ttl * 1000).toISOString() : undefined,
      });

      const role = getRoleFromLocalPassport(get(vc, 'credentialSubject.passport'));
      const passport = createUserPassport(vc, { role, source: PASSPORT_SOURCE.ISSUE });

      const profile = claims.find(x => x.type === 'profile');

      let doc;
      if (user) {
        doc = await node.loginUser({
          teamDid,
          user: {
            did: userDid,
            pk: userPk,
            passport,
            locale,
            lastLoginIp: getRequestIP(req),
            connectedAccount: [
              { provider: LOGIN_PROVIDER.WALLET, did: userDid, pk: userPk },
              { provider: LOGIN_PROVIDER.NFT, did: claim.asset },
            ],
          },
        });
        await node.createAuditLog(
          {
            action: 'updateUser',
            args: { teamDid, userDid, reason: 'exchange passport' },
            context: formatContext(Object.assign(req, { user: doc })),
            result: doc,
          },
          node
        );
      } else {
        doc = await node.loginUser({
          teamDid,
          user: {
            ...profile,
            avatar: await extractUserAvatar(get(profile, 'avatar'), { dataDir }),
            did: userDid,
            pk: userPk,
            passport,
            locale,
            lastLoginIp: getRequestIP(req),
            connectedAccount: [
              { provider: LOGIN_PROVIDER.WALLET, did: userDid, pk: userPk },
              { provider: LOGIN_PROVIDER.NFT, did: claim.asset },
            ],
          },
        });
        await node.createAuditLog(
          {
            action: 'addUser',
            args: { teamDid, userDid, reason: 'exchange passport' },
            context: formatContext(Object.assign(req, { user: doc })),
            result: doc,
          },
          node
        );
      }

      if (passport) {
        await node.createPassportLog(
          teamDid,
          {
            passportId: passport.id,
            action: PASSPORT_LOG_ACTION.ISSUE,
            operatorDid: userDid,
            metadata: {
              action: PASSPORT_ISSUE_ACTION.ISSUE_ON_EXCHANGE_PASSPORT,
              context: formatContext(Object.assign(req, { user: doc })),
            },
          },
          req
        );
      }

      // Generate new session token
      const { sessionToken, refreshToken } = await createToken(userDid, {
        secret: await node.getSessionSecret(),
        passport,
        role,
        fullName: profile?.fullName,
        elevated: canSessionBeElevated(role, nodeInfo),
      });
      await updateSession({ sessionToken, refreshToken }, true);
      logger.info('exchangePassport.success', { userDid, claim });

      return {
        disposition: 'attachment',
        type: 'VerifiableCredential',
        data: vc,
      };
    },
  };
};
