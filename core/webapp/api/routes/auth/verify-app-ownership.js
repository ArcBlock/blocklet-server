// FIXME: i18n for error messages
const get = require('lodash/get');
const Jwt = require('@arcblock/jwt');
const { toHex, fromBase58, toBase64 } = require('@ocap/util');
const formatContext = require('@abtnode/util/lib/format-context');
const { messages } = require('@abtnode/auth/lib/auth');

// eslint-disable-next-line global-require
const logger = require('@abtnode/logger')(`${require('../../../package.json').name}:auth:verify-app-ownership`);

const { handleRestoreByLauncherSession } = require('@abtnode/auth/lib/server');
const { wallet } = require('../../libs/auth');

const onStart =
  node =>
  async ({ extraParams: { locale, appDid, launcherUrl, launcherSessionId, overwrite } }) => {
    const blocklet = await node.getBlocklet({ did: appDid });
    if (blocklet && !overwrite) {
      logger.info('restore aborted because blocklet already exists', { appDid });
      throw new Error('Blocklet with same appDid already exists');
    }

    if (launcherUrl && launcherSessionId) {
      if (await node.isLauncherSessionConsumed({ launcherUrl, launcherSessionId })) {
        throw new Error(messages.sessionAlreadyConsumed[locale]);
      }
    }

    return { saveConnect: false };
  };

const authPrincipal = ({ extraParams: { appDid } }) => {
  return {
    description: 'Please select application account',
    target: appDid,
  };
};

const createSpacesRoutes = node => {
  return {
    action: 'verify-app-ownership-spaces',
    authPrincipal: false,
    onStart: onStart(node),
    claims: [
      { authPrincipal },
      {
        signature: async ({ userDid, userPk, extraParams: { appDid } }) => {
          const jwt = await Jwt.sign(
            userDid,
            undefined,
            {
              from: appDid,
              to: wallet.address,
              userPk,
              permissions: [
                { role: 'DIDSpaceAgent', spaces: ['*'] },
                { role: 'DIDConnectAgent', claims: ['encryptionKey'] },
              ],
              exp: Math.floor(new Date().getTime() / 1000) + 60 * 60,
              version: '1.1.0',
            },
            false
          );

          return {
            type: 'fg:x:delegation',
            description: 'Sign this delegation to allow server to download and decrypt blocklet backup',
            mfa: !process.env.DID_CONNECT_MFA_DISABLED,
            data: toHex(jwt),
            meta: {
              jwt,
            },
          };
        },
      },
      {
        encryptionKey: ({ context, extraParams: { appDid } }) => {
          const delegation = get(context, 'request.context.delegation');
          if (!delegation) {
            throw new Error('encryptionKey delegation not found');
          }
          return {
            description: 'Please derive encryptionKey',
            salt: appDid,
            delegation,
          };
        },
      },
    ],

    onAuth: async ({ req, claims, userDid, userPk, step, updateSession, extraParams }) => {
      const { appDid, endpoint, referrer, previousWorkflowData, appPid, launcherUrl, launcherSessionId, overwrite } =
        extraParams;
      if (step === 1) {
        const claim = claims.find(x => x.type === 'signature');
        const delegation = `${claim.meta.jwt}.${toBase64(fromBase58(claim.sig))}`;
        if (!(await Jwt.verify(delegation, fromBase58(userPk)))) {
          throw new Error('delegation signature verify failed');
        }

        // save for next claim
        req.context.delegation = delegation;

        // save for next callback
        await updateSession({ delegation });
      }

      if (step === 2) {
        const claim = claims.find(x => x.type === 'encryptionKey');
        const password = fromBase58(claim.key);

        // extract controller info if we are restoring with launcher session
        let controller;
        if (launcherUrl && launcherSessionId) {
          controller = await handleRestoreByLauncherSession({ node, userDid, updateSession, extraParams });
          logger.info('authenticateByLauncher when restore blocklet', { appDid, launcherUrl, launcherSessionId });
        }

        node
          .restoreBlocklet(
            {
              from: 'spaces',
              appDid,
              endpoint,
              delegation: req.context.store.delegation,
              password,
              wallet,
              controller: previousWorkflowData?.controller || controller,
              appPid,
              overwrite: !!overwrite,
            },
            formatContext(
              Object.assign(req, {
                user: { did: userDid, role: 'owner' },
                headers: {
                  ...req.headers,
                  referrer,
                },
              })
            )
          )
          .catch(error => {
            logger.error('restoreFromSpaces error', { error });
          });
      }
    },
  };
};

const createDiskRoutes = node => {
  return {
    action: 'verify-app-ownership-disk',
    authPrincipal: false,
    onStart: onStart(node),
    claims: [
      { authPrincipal },
      {
        signature: async ({ userDid, userPk, extraParams: { appDid } }) => {
          const jwt = await Jwt.sign(
            userDid,
            undefined,
            {
              from: appDid,
              to: wallet.address,
              userPk,
              permissions: [{ role: 'DIDConnectAgent', claims: ['encryptionKey'] }],
              exp: Math.floor(new Date().getTime() / 1000) + 60 * 60,
              version: '1.1.0',
            },
            false
          );

          return {
            type: 'fg:x:delegation',
            description: 'Sign this delegation to allow server to download and decrypt blocklet backup',
            mfa: !process.env.DID_CONNECT_MFA_DISABLED,
            data: toHex(jwt),
            meta: {
              jwt,
            },
          };
        },
      },
      {
        encryptionKey: ({ context, extraParams: { appDid } }) => {
          const delegation = get(context, 'request.context.delegation');
          if (!delegation) {
            throw new Error('encryptionKey delegation not found');
          }
          return {
            description: 'Please derive encryptionKey',
            salt: appDid,
            delegation,
          };
        },
      },
    ],

    onAuth: async ({ req, claims, userDid, step, updateSession, userPk, extraParams: { appDid, overwrite } }) => {
      if (step === 1) {
        const claim = claims.find(x => x.type === 'signature');
        const delegation = `${claim.meta.jwt}.${toBase64(fromBase58(claim.sig))}`;
        if (!(await Jwt.verify(delegation, fromBase58(userPk)))) {
          throw new Error('delegation signature verify failed');
        }

        // save for next claim
        req.context.delegation = delegation;

        // save for next callback
        await updateSession({ delegation });
        return;
      }

      const claim = claims.find(x => x.type === 'encryptionKey');
      const password = fromBase58(claim.key);
      try {
        await node.restoreBlocklet(
          { appDid, password, from: 'disk', overwrite: !!overwrite },
          formatContext(
            Object.assign(req, {
              user: { did: userDid },
              headers: {
                ...req.headers,
              },
            })
          )
        );
      } catch (err) {
        console.error('restoreFromDisk error', err);
        throw err;
      }
    },
  };
};

module.exports = function createRoutes(node, restoreFrom) {
  if (restoreFrom === 'spaces') {
    return createSpacesRoutes(node);
  }

  if (restoreFrom === 'disk') {
    return createDiskRoutes(node);
  }

  throw new Error('unknown restoreFrom');
};
