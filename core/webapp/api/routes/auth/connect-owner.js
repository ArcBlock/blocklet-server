const get = require('lodash/get');
const path = require('path');
const { ROLES, VC_TYPE_NODE_PASSPORT, NODE_DATA_DIR_NAME } = require('@abtnode/constant');
const getNodeWallet = require('@abtnode/util/lib/get-app-wallet');
const getRandomMessage = require('@abtnode/util/lib/get-random-message');
const formatContext = require('@abtnode/util/lib/format-context');
const { extractUserAvatar, getServerAvatarUrl } = require('@abtnode/util/lib/user');
const { createPassport, createPassportVC, createUserPassport } = require('@abtnode/auth/lib/passport');

const { PASSPORT_SOURCE, PASSPORT_LOG_ACTION, PASSPORT_ISSUE_ACTION } = require('@abtnode/constant');
const createPassportSvg = require('@abtnode/auth/lib/util/create-passport-svg');

const verifySignature = require('@abtnode/auth/lib/util/verify-signature');
const {
  messages,
  checkWalletVersion,
  getPassportStatusEndpoint,
  canSessionBeElevated,
} = require('@abtnode/auth/lib/auth');
const getRequestIP = require('@abtnode/util/lib/get-request-ip');
const { LOGIN_PROVIDER } = require('@blocklet/constant');

const logger = require('@abtnode/logger')(require('../../../package.json').name);

const { createToken } = require('../../libs/login');

module.exports = function createRoutes(node) {
  return {
    action: 'connect-owner',
    onConnect: () => {
      return {
        profile: async ({ extraParams: { locale } }) => {
          const info = await node.getNodeInfo();

          if (info.ownerNft && info.ownerNft.holder && info.ownerNft.issuer) {
            throw new Error(messages.requestOwnershipNft[locale]);
          }

          return {
            fields: ['fullName', 'email', 'avatar'],
            description: messages.requestProfile[locale],
          };
        },

        signature: async ({ userDid, extraParams: { locale }, context: { baseUrl, didwallet } }) => {
          checkWalletVersion({ didwallet, locale });
          const info = await node.getNodeInfo();
          const result = await createPassport({ name: ROLES.OWNER, node, teamDid: info.did, locale });
          const issuerName = info.name;

          return {
            description: messages.receivePassport[locale],
            data: getRandomMessage(),
            type: 'mime:text/plain',
            display: JSON.stringify(
              result.display
                ? result.display
                : {
                    type: 'svg',
                    content: createPassportSvg({
                      title: result.passport.title,
                      issuer: issuerName,
                      issuerAvatarUrl: getServerAvatarUrl(baseUrl, info),
                      issuerDid: info.did,
                      ownerDid: userDid,
                      ownerName: 'Your Name',
                      preferredColor: 'default',
                    }),
                  }
            ),
          };
        },
      };
    },

    onAuth: async ({ claims, userDid, userPk, updateSession, extraParams: { locale }, req, baseUrl }) => {
      const profile = claims.find(x => x.type === 'profile');
      const info = await node.getNodeInfo();
      const teamDid = info.did;

      // Verify signature
      const claim = claims.find(x => x.type === 'signature');
      verifySignature(claim, userDid, userPk, locale);

      // Add owner
      await node.updateNodeOwner({ nodeOwner: { did: userDid, pk: userPk } });
      logger.info('connect owner to node', { userDid });

      // Issue owner passport
      const vc = await createPassportVC({
        issuerName: info.name,
        issuerWallet: getNodeWallet(info.sk),
        issuerAvatarUrl: getServerAvatarUrl(baseUrl, info),
        ownerDid: userDid,
        ...(await createPassport({
          name: ROLES.OWNER,
          node,
          teamDid,
          locale,
          endpoint: baseUrl,
        })),
        endpoint: getPassportStatusEndpoint({
          baseUrl,
          userDid, // NOTICE: 这里是 owner，只用 userDid 即可
          teamDid,
        }),
        types: [VC_TYPE_NODE_PASSPORT],
        tag: info.did,
        ownerProfile: profile,
      });

      const role = ROLES.OWNER;

      const passport = createUserPassport(vc, { role, source: PASSPORT_SOURCE.ISSUE });

      const doc = await node.loginUser({
        teamDid,
        user: {
          ...profile,
          avatar: await extractUserAvatar(get(profile, 'avatar'), {
            dataDir: path.join(node.dataDirs.data, NODE_DATA_DIR_NAME),
          }),
          did: userDid,
          pk: userPk,
          passport,
          locale,
          lastLoginIp: getRequestIP(req),
          connectedAccount: {
            provider: LOGIN_PROVIDER.WALLET,
            did: userDid,
            pk: userPk,
          },
        },
      });
      await node.createAuditLog(
        {
          action: 'addUser',
          args: { teamDid, userDid, reason: 'claim server' },
          context: formatContext(Object.assign(req, { user: doc })),
          result: doc,
        },
        node
      );

      if (passport.id) {
        await node.createPassportLog(
          teamDid,
          {
            passportId: passport.id,
            action: PASSPORT_LOG_ACTION.ISSUE,
            operatorDid: userDid,
            metadata: {
              action: PASSPORT_ISSUE_ACTION.ISSUE_ON_LAUNCH,
            },
          },
          req
        );
      }

      // Generate new session token that client can save to localStorage
      const { sessionToken, refreshToken } = await createToken(userDid, {
        secret: await node.getSessionSecret(),
        passport,
        role,
        fullName: profile?.fullName,
        elevated: canSessionBeElevated(role, info),
      });
      await updateSession({ sessionToken, refreshToken }, true);

      return {
        disposition: 'attachment',
        type: 'VerifiableCredential',
        data: vc,
      };
    },
  };
};
