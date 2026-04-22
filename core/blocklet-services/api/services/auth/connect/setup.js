/* eslint-disable arrow-parens */
const get = require('lodash/get');
const { messages } = require('@abtnode/auth/lib/auth');
const { extractUserAvatar } = require('@abtnode/util/lib/user');
const formatContext = require('@abtnode/util/lib/format-context');
const verifySignature = require('@abtnode/auth/lib/util/verify-signature');
const getRequestIP = require('@abtnode/util/lib/get-request-ip');
const { getDeviceData } = require('@abtnode/util/lib/device');
const getOrigin = require('@abtnode/util/lib/get-origin');
const { getLoginProvider } = require('@blocklet/sdk/lib/util/login');
const { USER_SESSION_STATUS } = require('@blocklet/constant');

const logger = require('../../../libs/logger')('setup');

const checkOwner = async ({ node, userDid, blocklet }) => {
  const teamDid = blocklet.meta.did;

  const count = await node.getUsersCount({ teamDid });
  if (count > 1) {
    logger.error(`The number of members should be at most 1, got ${count}`, {
      name: blocklet.meta.name,
      did: blocklet.meta.did,
    });
  }

  // NOTICE: blocklet 的 owner 目前限制为只能为 did-wallet 用户，不需要查询 connectedAccount
  const user = await node.getUser({ teamDid, user: { did: userDid } });

  if (count === 1 && !user) {
    throw new Error('You are not owner of the application');
  }

  return user;
};

module.exports = function createRoutes(node, authenticator, createSessionToken) {
  return {
    action: 'setup',
    onConnect: async ({ req, userDid, extraParams: { locale } }) => {
      const blocklet = await req.getBlocklet();
      await checkOwner({ node, userDid, blocklet });

      return {
        profile: {
          fields: ['fullName', 'avatar'],
          description: messages.description[locale],
        },
      };
    },

    onAuth: async ({ claims, userDid, userPk, updateSession, extraParams, req, baseUrl }) => {
      const { locale, previousWorkflowData: proof } = extraParams;
      const blocklet = await req.getBlocklet();
      const teamDid = blocklet.meta.did;
      const user = await checkOwner({ node, userDid, blocklet });
      const { secret } = await req.getBlockletInfo();

      // ensure owner proof form previous workflow
      if (!proof || !proof.claim || !proof.pk) {
        throw new Error('No owner proof found from previous workflow');
      }
      verifySignature(proof.claim, blocklet.appDid, proof.pk, locale);
      const profile = claims.find((x) => x.type === 'profile');

      const lastLoginIp = getRequestIP(req);
      const deviceData = getDeviceData({ req });
      const walletOS = req.context.didwallet.os;
      const provider = getLoginProvider(req);
      try {
        if (user) {
          // Update user
          await node.updateUser({
            teamDid,
            user: {
              did: userDid,
              pk: userPk,
              approved: true,
              lastLoginAt: new Date().toISOString(),
              lastLoginIp: getRequestIP(req),
              extra: {
                baseUrl,
              },
            },
          });
        } else {
          // Create user

          // NOTICE: 不能使用 federated 账户来进行 setup，所以不能包含 sourceAppPid 字段
          const doc = await node.loginUser({
            teamDid,
            user: {
              ...profile,
              avatar: await extractUserAvatar(get(profile, 'avatar'), {
                dataDir: blocklet.env.dataDir,
              }),
              did: userDid,
              pk: userPk,
              locale,
              lastLoginIp,
              extra: {
                baseUrl,
              },
              connectedAccount: {
                provider,
                did: userDid,
                pk: userPk,
              },
            },
          });

          await node.createAuditLog(
            {
              action: 'addUser',
              args: { teamDid, profile, reason: 'setup blocklet' },
              context: formatContext(Object.assign(req, { user: doc })),
              result: doc,
            },
            node
          );
        }

        const userSessionDoc = await node.upsertUserSession({
          teamDid,
          visitorId: proof?.visitorId || extraParams?.visitorId,
          userDid,
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

        // Generate new session token that client can save to localStorage
        // HACK: 此处没有 passportId，所以特意不设置 refreshToken，失效后下次登录就能选择合适的 passport
        const sessionToken = await createSessionToken(userDid, {
          secret,
          role: 'owner',
          fullName: profile?.fullName,
          elevated: true,
        });
        if (userSessionDoc) {
          await updateSession({ sessionToken, visitorId: userSessionDoc?.visitorId }, true);
        } else {
          await updateSession({ sessionToken }, true);
        }
        logger.info('setup.connect.success', { userDid });
      } catch (err) {
        logger.error('setup.connect.error', { error: err, userDid });
        throw new Error(err.message);
      }
    },
  };
};
