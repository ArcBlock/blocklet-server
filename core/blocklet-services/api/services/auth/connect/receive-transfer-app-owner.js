const get = require('lodash/get');
const { toHex } = require('@ocap/util');
const pRetry = require('p-retry');
const { messages, getApplicationInfo, getPassportStatusEndpoint, getUser } = require('@abtnode/auth/lib/auth');
const { getKeyPairClaim, getAuthPrincipalForTransferAppOwnerShip } = require('@abtnode/auth/lib/server');
const sleep = require('@abtnode/util/lib/sleep');
const { getChainClient } = require('@abtnode/util/lib/get-chain-client');
const formatContext = require('@abtnode/util/lib/format-context');
const { extractUserAvatar } = require('@abtnode/util/lib/user');
const { ensureAccountOnMainChain } = require('@abtnode/util/lib/ensure-account-on-main-chain');
const {
  createPassport,
  createPassportVC,
  createUserPassport,
  getRoleFromLocalPassport,
} = require('@abtnode/auth/lib/passport');
const { getApplicationWallet: getBlockletWallet } = require('@blocklet/meta/lib/wallet');
const getRequestIP = require('@abtnode/util/lib/get-request-ip');
const { getBlockletChainInfo, isInProgress } = require('@blocklet/meta/lib/util');
const { ROLES, MAIN_CHAIN_ENDPOINT } = require('@abtnode/constant');
const { LOGIN_PROVIDER } = require('@blocklet/constant');
const { PASSPORT_SOURCE, PASSPORT_LOG_ACTION, PASSPORT_ISSUE_ACTION } = require('@abtnode/constant');

const { createTokenFn, getDidConnectVersion } = require('../../../util');
const logger = require('../../../libs/logger')('blocklet-service:transfer-blocklet-owner');

const migrateAppOnChain = async (blocklet, oldSk, newSk) => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  logger.info('Preparing for on-chain migration', { did: blocklet.meta.did });
  if (!oldSk) {
    // should not be here
    logger.error('on-chain migration aborted because oldSk is empty', { did: blocklet.meta.did });
    return;
  }

  if (!newSk) {
    // should not be here
    logger.error('on-chain migration aborted because newSk is empty', { did: blocklet.meta.did });
    return;
  }

  // ensure account changed
  const type = blocklet.configObj?.BLOCKLET_APP_CHAIN_TYPE;
  const oldWallet = getBlockletWallet(oldSk, undefined, type);
  const newWallet = getBlockletWallet(newSk, undefined, type);
  if (oldWallet.address === newWallet.address) {
    // should not be here
    logger.info('on-chain migration aborted because newSk same with oldSk', { did: blocklet.meta.did });
    await ensureAccountOnMainChain(newWallet, blocklet.meta.title);
    return;
  }

  // ensure chain host
  let chainHost = getBlockletChainInfo(blocklet).host;
  if (!chainHost || chainHost === 'none') {
    logger.info('CHAIN_HOST is empty, use main chain endpoint', {
      did: blocklet.meta.did,
      chainHost: MAIN_CHAIN_ENDPOINT,
    });

    chainHost = MAIN_CHAIN_ENDPOINT;
  }

  // migrate on chain
  logger.info('on-chain migration for chain ', { did: blocklet.meta.did, host: chainHost });
  const client = getChainClient(chainHost);
  const newResult = await client.getAccountState({ address: newWallet.address });

  if (!newResult.state) {
    logger.info('on-chain migration for wallets', { oldAddress: oldWallet.address, newAddress: newWallet.address });

    // migrate old account to new account
    const tx = await client.signAccountMigrateTx({
      tx: {
        itx: {
          address: newWallet.address,
          pk: newWallet.publicKey,
        },
      },
      wallet: oldWallet,
    });
    const hash = await client.sendAccountMigrateTx({ tx, wallet: oldWallet });
    logger.info('on-chain migration done', { did: blocklet.meta.did, hash });
  } else {
    logger.info('on-chain migration aborted because newSk declared on chain', { did: blocklet.meta.did });
  }

  // should not throw error because signAccountMigrateTx is already happened
  try {
    await ensureAccountOnMainChain(newWallet, blocklet.meta.title);
  } catch (error) {
    logger.error('ensureAccountOnMainChain failed', { error });
  }
};

module.exports = function createRoutes(node, _, createSessionToken) {
  const getBlocklet = async (did) => {
    const blocklet = await node.getBlocklet({ did, attachConfig: false });
    if (!blocklet) {
      throw new Error(`application not found: ${did}`);
    }
    return blocklet;
  };

  return {
    action: 'receive-transfer-app-owner',
    authPrincipal: false,
    claims: [
      {
        authPrincipal: getAuthPrincipalForTransferAppOwnerShip(node),
      },
      {
        keyPair: async (opts) => {
          const {
            extraParams: { appDid, transferId, locale },
          } = opts;

          const transfer = await node.checkTransferAppOwnerSession({ appDid, transferId });

          if (transfer.appDid !== appDid) {
            throw new Error(`Invalid appDid. Expect: ${transfer.appDid}, Actual: ${appDid}`);
          }

          const blocklet = await getBlocklet(appDid);

          if (isInProgress(blocklet.status)) {
            throw new Error(messages.appIsInProgress[locale]);
          }

          return getKeyPairClaim(node, { title: blocklet.meta.title, declare: false })(opts);
        },
        profile: ({ extraParams: { locale = 'en' } }) => {
          return {
            fields: ['fullName', 'email', 'avatar'],
            description: messages.requestProfile[locale],
          };
        },
      },
    ],
    onAuth: async ({ userDid, userPk, claims, req, updateSession, extraParams, baseUrl }) => {
      logger.info('transferAppOwnerHandler', extraParams);

      // prepare data

      const { locale = 'en', appDid, transferId } = extraParams;

      if (!transferId) {
        throw new Error('missing transferId in extraParams');
      }

      if (!appDid) {
        throw new Error(messages.missingBlockletDid[locale]);
      }

      const profile = claims.find((x) => x.type === 'profile');
      if (!profile) {
        throw new Error('app keyPair must be provided');
      }

      const keyPair = claims.find((x) => x.type === 'keyPair');
      if (!keyPair) {
        throw new Error(messages.missingKeyPair[locale]);
      }

      const newSk = toHex(keyPair.secret);
      if (!newSk) {
        throw new Error(`keyPair.secret is empty: ${appDid}`);
      }

      const blocklet = await node.getBlocklet({ did: appDid });
      if (!blocklet) {
        throw new Error(messages.invalidBlocklet[locale]);
      }

      if (blocklet.appDid !== appDid) {
        throw new Error(`Invalid appDid. Expect: ${blocklet.appDid}, Actual: ${appDid}`);
      }

      const oldSk = (blocklet.environments || []).find((x) => x.key === 'BLOCKLET_APP_SK').value;

      const initialized = !!blocklet.settings?.initialized;
      if (!initialized) {
        throw new Error(messages.appNotInitialized[locale]);
      }

      const oldOwnerDid = blocklet.settings?.owner?.did;

      const { appPid } = blocklet;

      const transfer = await node.checkTransferAppOwnerSession({ appDid, transferId });

      if (transfer.appDid !== appDid) {
        throw new Error(`Invalid appDid. Expect: ${transfer.appDid}, Actual: ${appDid}`);
      }

      const {
        name: issuerName,
        wallet: issuerWallet,
        passportColor,
        dataDir,
        secret,
        logo,
      } = await getApplicationInfo({ node, nodeInfo: await node.getNodeInfo(), teamDid: appPid, baseUrl });

      const statusEndpointBaseUrl = baseUrl;
      const endpoint = baseUrl;

      const vcParams = {
        issuerName,
        issuerWallet,
        issuerAvatarUrl: logo,
        ownerDid: userDid,
        ...(await createPassport({
          name: ROLES.OWNER,
          node,
          teamDid: appPid,
          locale,
          endpoint,
        })),
        endpoint: getPassportStatusEndpoint({
          baseUrl: statusEndpointBaseUrl,
          userDid,
          teamDid: appPid,
        }),
        types: [],
        ownerProfile: profile,
        preferredColor: passportColor,
      };

      const vc = await createPassportVC(vcParams);
      const role = getRoleFromLocalPassport(get(vc, 'credentialSubject.passport'));
      const passport = createUserPassport(vc, { role, source: PASSPORT_SOURCE.ISSUE });

      // NOTICE: owner 必须是 did-wallet 账户，这里不应该去查询 connectedAccount
      const user = await getUser(node, appPid, userDid);

      // update state
      await node.updateBlockletOwner({ did: appPid, owner: { did: userDid, pk: userPk } });
      const avatar = await extractUserAvatar(get(profile, 'avatar'), { dataDir });

      if (user) {
        const doc = await node.updateUser({
          teamDid: appPid,
          user: {
            did: user.did,
            lastLoginIp: getRequestIP(req),
            passports: [passport],
            connectedAccounts: [
              {
                provider: LOGIN_PROVIDER.WALLET,
                did: userDid,
                pk: userPk,
              },
            ],
            ...profile,
            avatar,
          },
        });
        await node.createAuditLog(
          {
            action: 'updateUser',
            args: { teamDid: appPid, userDid, passport, reason: 'transfer ownership' },
            context: formatContext(Object.assign(req, { user })),
            result: doc,
          },
          node
        );
      } else {
        // NOTICE: owner 不能是 federated 账户，所以不能包含 sourceAppPid 字段
        const doc = await node.loginUser({
          teamDid: appPid,
          user: {
            ...profile,
            avatar,
            did: userDid,
            pk: userPk,
            locale,
            passport,
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
            args: { teamDid: appPid, userDid, passport, reason: 'transfer ownership' },
            context: formatContext(Object.assign(req, { user: doc })),
            result: doc,
          },
          node
        );
      }

      if (passport) {
        await node.createPassportLog(
          appPid,
          {
            passportId: passport.id,
            action: PASSPORT_LOG_ACTION.ISSUE,
            operatorDid: userDid,
            metadata: {
              action: PASSPORT_ISSUE_ACTION.ISSUE_ON_RECEIVE_TRANSFER_APP_OWNER,
            },
          },
          req
        );
      }

      // NOTICE: must NOT use appDid here if update BLOCKLET_APP_SK
      await node.configBlocklet(
        {
          did: blocklet.appPid,
          configs: [{ key: 'BLOCKLET_APP_SK', value: newSk, secure: true }],
          skipHook: true,
          skipDidDocument: true,
        },
        formatContext(Object.assign(req, { user: { did: userDid, fullName: 'Owner', role: 'owner' } }))
      );

      try {
        if (oldOwnerDid && oldOwnerDid !== userDid) {
          // NOTICE: owner 必须是 did-wallet 账户，这里不应该去查询 connectedAccount
          const oldOwner = await getUser(node, appPid, oldOwnerDid);
          if (oldOwner) {
            const filteredPassports = (oldOwner.passports || []).filter((p) => p.role !== ROLES.OWNER);
            if (filteredPassports.length !== (oldOwner.passports || []).length) {
              logger.info('update old owner passport', {
                oldOwnerDid,
                filteredPassports: filteredPassports.map((x) => x.id),
              });
              await node.updateUser({
                teamDid: appPid,
                user: {
                  did: oldOwner.did,
                  pk: oldOwner.pk,
                  passports: filteredPassports,
                },
              });
            }
          }
        }
      } catch (error) {
        logger.error('remove old owner passport failed', { error });
      }

      try {
        await node.closeTransferAppOwnerSession({
          appPid: blocklet.appPid,
          transferId,
          status: 'success',
        });
      } catch (error) {
        logger.error('closeTransferAppOwnerSession failed', { error });
      }

      // migrate on-chain account
      pRetry(() => migrateAppOnChain(blocklet, oldSk, newSk), {
        retries: 10,
        onFailedAttempt: console.error,
      }).catch((error) => {
        logger.error('migrateAppOnChain failed', { error });
      });

      // restart blocklet (not use queue)
      node
        .stopBlocklet({ did: appPid, updateStatus: false })
        .then(() => {
          return node.startBlocklet({ did: appPid, checkHealthImmediately: true, throwOnError: true, atomic: true });
        })
        .then((doc) => {
          logger.info('restart blocklet success after transfer ownership', { appPid });
          return node.createAuditLog(
            {
              action: 'restartBlocklet',
              args: { did: appPid },
              context: formatContext(req),
              result: doc,
            },
            node
          );
        })
        .catch((error) => {
          logger.error('restart blocklet failed after transfer ownership', { appPid, error });
        });

      await sleep(3000);
      logger.info('transfer ownership success', { userDid });

      // Generate new session token that client can save to localStorage
      const createToken = createTokenFn(createSessionToken);
      const sessionConfig = blocklet.settings?.session || {};
      const walletOS = req.context?.didwallet?.os;
      const { sessionToken, refreshToken } = createToken(
        userDid,
        {
          secret,
          passport: vc,
          role,
          fullName: profile.fullName,
          provider: LOGIN_PROVIDER.WALLET,
          walletOS,
          emailVerified: !!user?.emailVerified,
          phoneVerified: !!user?.phoneVerified,
          elevated: true,
        },
        { ...sessionConfig, didConnectVersion: getDidConnectVersion(req) }
      );
      await updateSession({ sessionToken, refreshToken }, true);
      await updateSession({ passportId: vc?.id });
      logger.info('invite.success', { userDid });

      return {
        disposition: 'attachment',
        type: 'VerifiableCredential',
        data: vc,
      };
    },
  };
};
