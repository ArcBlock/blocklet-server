const pick = require('lodash/pick');
const { joinURL } = require('ufo');
const { Joi } = require('@arcblock/validator');
const { fromPublicKey } = require('@ocap/wallet');
const { ROLES, PASSPORT_STATUS, WELLKNOWN_BLOCKLET_ADMIN_PATH, USER_SESSION_STATUS } = require('@abtnode/constant');
const { LOGIN_PROVIDER } = require('@blocklet/constant');
const { WELLKNOWN_SERVICE_PATH_PREFIX, SECURITY_RULE_DEFAULT_ID } = require('@abtnode/constant');
const { fromBase64, toBase64, toBuffer, toUint8Array, toHex } = require('@ocap/util');
const { prepareBaseUrl } = require('@arcblock/did-connect-js/lib/handlers/util');
const logger = require('@abtnode/logger')('@abtnode/auth:passkey');
const formatContext = require('@abtnode/util/lib/format-context');
const getRequestIP = require('@abtnode/util/lib/get-request-ip');
const {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} = require('@simplewebauthn/server');
const { updateConnectedAccount, getAvatarByEmail, extractUserAvatar } = require('@abtnode/util/lib/user');
const getOrigin = require('@abtnode/util/lib/get-origin');

const { getAccessWallet } = require('@abtnode/util/lib/blocklet');
const { sign } = require('@blocklet/sdk/lib/util/csrf');
const { getApplicationInfo, handleInvitationReceive, canSessionBeElevated } = require('./auth');
const { validateVerifyDestroyRequest } = require('./server');
const { getLastUsedPassport } = require('./passport');
const { getSessionConfig, checkInvitedUserOnly } = require('./oauth');
const { findFederatedSite, getUserAvatarUrl } = require('./util/federated');

const PASSKEY_TIMEOUT = 60000;
const PASSKEY_ACTIONS = {
  register: 'register', // create a new user with passkey
  connect: 'connect', // connect passkey to existing user
  login: 'login', // login with passkey
  invite: 'invite', // accept invite with passkey
  disconnect: 'disconnect', // disconnect passkey from user
  'connect-owner': 'connect-owner', // connect passkey as server owner
  'verify-elevated': 'verify-elevated', // elevate access with passkey
  'verify-destroy': 'verify-destroy', // destroy session with passkey
  'connect-to-did-space': 'connect-to-did-space', // connect to did space
  'connect-to-did-domain': 'connect-to-did-domain', // connect to did domain
  'destroy-self': 'destroy-self', // destroy myself with passkey
};

const shouldVerifyUser = (action) =>
  !process.env.ABT_NODE_NO_PASSKEY_USER_VERIFY &&
  ['verify-elevated', 'verify-destroy', 'disconnect', 'destroy-self'].includes(action);

const shouldCheckRole = (mode, req) => {
  if (mode === 'server') {
    return true;
  }
  try {
    const referrerUrl = req.get('referrer');
    if (!referrerUrl) {
      return true;
    }
    const url = new URL(referrerUrl);
    return !url.pathname || url.pathname.startsWith(WELLKNOWN_BLOCKLET_ADMIN_PATH);
  } catch (error) {
    console.warn('Failed to parse URL when checking dashboard path', { error, referrerUrl: req.get('referrer') });
    return true;
  }
};

const isRegisterAction = (action) => ['register', 'connect-owner'].includes(action);

const getDomain = (req) => (req.get('x-real-hostname') || req.get('host')).split(':')[0];
const emailSchema = Joi.string().email().required();
const tryDecodeEmail = (encoded) => {
  try {
    if (!encoded) return null;
    const decoded = fromBase64(encoded).toString();
    return emailSchema.validate(decoded).error ? null : decoded;
  } catch {
    return null;
  }
};

const formatBuffersToBase64 = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Buffer.isBuffer(obj) || obj instanceof Uint8Array) {
    return toBase64(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(formatBuffersToBase64);
  }

  if (typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      acc[key] = formatBuffersToBase64(obj[key]);
      return acc;
    }, {});
  }

  return obj;
};

const getTrustOrigins = ({ blocklet, req }) => {
  const result = [`https://${getDomain(req)}`];
  if (blocklet) {
    const trustOrigins = blocklet.configObj?.TRUST_ORIGINS;
    if (trustOrigins) result.push(...trustOrigins.split(','));
  }

  return result;
};

function createPasskeyHandlers(node, mode, createToken) {
  const ensurePasskeySession = async (req, res, next) => {
    const { challenge } = req.query;
    if (!challenge) {
      return res.status(400).send({ error: 'A valid passkey session is required to continue. Please try again.' });
    }

    const session = await node.getSession({ id: toHex(fromBase64(challenge)) });
    if (!session) {
      return res.status(400).send({ error: 'Your passkey session has expired. Please start over and try again.' });
    }
    if (session.type !== 'passkey') {
      return res.status(400).send({ error: 'Invalid session type. Please start over with a new passkey session.' });
    }

    req.passkeySession = session;

    return next();
  };

  const ensureUser = async (req, res, next) => {
    const info = await node.getNodeInfo({ useCache: true });
    req.info = info;

    const isUserRequired = shouldVerifyUser(req.query.action);
    const userDid = req.user?.did;
    if (!userDid && isUserRequired) {
      return res.status(400).send({ error: 'Please log in or provide your user ID to continue with this action.' });
    }

    const teamDid = mode === 'server' ? info.did : req.getBlockletDid();
    if (userDid) {
      const user = await node.getUser({ teamDid, user: { did: userDid } });
      req.userExpanded = user;

      if (!user) {
        return res
          .status(400)
          .send({ error: 'We could not find your user account. Please check your credentials and try again.' });
      }
      if (!user.approved) {
        return res
          .status(400)
          .send({ error: 'Your account has been deactivated. Please contact support for assistance.' });
      }
    }

    return next();
  };

  const createProfileFromEmail = async (email, info, teamDid) => {
    let avatar = await getAvatarByEmail(email);
    if (avatar && avatar.startsWith('data:')) {
      const { dataDir } = await getApplicationInfo({ node, nodeInfo: info, teamDid });
      avatar = await extractUserAvatar(avatar, { dataDir });
    }

    return {
      fullName: email.split('@')[0],
      email,
      avatar,
    };
  };

  const getLocale = (req) => req.passkeySession?.data?.locale || req.query?.locale || 'en';

  // Add new passkey credential to existing user or create new user
  // If we have user in session, we will update the user's connected accounts
  // If we don't have user in session, we will create a new user
  const handleRegisterRequest = async (req, res) => {
    const { purpose, action } = req.query;
    if (!PASSKEY_ACTIONS[action]) {
      return res.status(400).send({
        error: 'Invalid action requested. Please select a valid passkey action instead of this action.',
      });
    }

    let { email } = req.query;
    if (email) {
      email = tryDecodeEmail(email);
    }

    const info = await node.getNodeInfo({ useCache: true });
    const teamDid = mode === 'server' ? info.did : req.getBlockletDid();
    const user = req.user ? await node.getUser({ teamDid, user: { did: req.user.did } }) : null;

    let credentials = [];
    if (purpose === 'connect') {
      if (!req.user) {
        return res.status(400).send({ error: 'You need to be logged in to connect a passkey to your account.' });
      }

      credentials = ((user || {}).connectedAccounts || [])
        .filter((x) => x.provider === LOGIN_PROVIDER.PASSKEY)
        .map((x) => ({
          id: x.id,
          type: 'public-key',
          transports: x.extra.transports,
        }));
    }
    if (purpose === 'register') {
      if (info.did !== teamDid) {
        // Check if the team is invited user only
        const { accessPolicyConfig } = await req.getSecurityConfig({ id: SECURITY_RULE_DEFAULT_ID });
        const isInvitedUserOnly = await checkInvitedUserOnly(accessPolicyConfig, node, teamDid);
        if (isInvitedUserOnly) {
          return res.status(400).send({ error: 'You need to be invited to register a passkey.' });
        }
      }
    }

    if (isRegisterAction(purpose)) {
      if (!email) {
        return res.status(400).send({ error: 'Please provide your email address to register a new passkey.' });
      }
    }

    const { name: appName } = await getApplicationInfo({ node, nodeInfo: info, teamDid });
    const counter = (user?.passkeyCount || 0) + 1;
    const userName = `${purpose === 'connect' ? user.fullName : email} (${appName}) #${counter}`;
    const session = await node.startSession({
      data: {
        type: 'passkey',
        data: {
          ...req.query,
          user: user?.did,
          origin: getDomain(req),
          email,
          userName,
        },
      },
    });

    const userID = purpose === 'connect' ? `${user.did}#${counter}` : session.challenge;
    logger.info('passkey.register.session', {
      teamDid,
      action,
      purpose,
      email,
      session,
      excludes: credentials,
      counter,
      userID,
      userName,
    });

    const options = {
      rpID: getDomain(req),
      rpName: info.name,
      userID: toBuffer(userID),
      userName,
      userDisplayName: userName,
      timeout: PASSKEY_TIMEOUT,
      challenge: toUint8Array(session.challenge),
      excludeCredentials: credentials,
      attestationType: 'direct', // 'none' | 'direct'
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required',
        authenticatorAttachment: 'platform',
        requireResidentKey: false,
      },
      supportedAlgorithmIDs: [-8, -7, -257],
      // preferredAuthenticatorType: 'securityKey' | 'localDevice' | 'remoteDevice',
    };
    logger.info('passkey.register.options', { teamDid, options });

    return res.send(await generateRegistrationOptions(options));
  };

  // eslint-disable-next-line consistent-return
  const handleRegisterResponse = async (req, res) => {
    const { action, purpose, email } = req.passkeySession.data;
    if (purpose === 'connect' && !req.user) {
      return res.status(400).send({ error: 'You must be logged in to connect a passkey to your account.' });
    }
    if (purpose === 'register' && !email) {
      return res.status(400).send({ error: 'An email address is required to register a new passkey.' });
    }

    const info = await node.getNodeInfo({ useCache: true });
    const teamDid = mode === 'server' ? info.did : req.getBlockletDid();

    const { body } = req;
    const { challenge } = req.query;
    logger.info('passkey.register.response', {
      teamDid,
      action,
      purpose,
      body: JSON.parse(JSON.stringify(body)),
      challenge,
    });

    try {
      const { verified, registrationInfo } = await verifyRegistrationResponse({
        response: body,
        expectedChallenge: toBase64(req.passkeySession.challenge),
        expectedOrigin: getTrustOrigins({ blocklet: req.blocklet, req }),
        expectedRPID: getDomain(req),
        requireUserVerification: shouldVerifyUser(action),
      });
      logger.info('passkey.register.verified', { teamDid, verified, registrationInfo });
      if (!verified || !registrationInfo?.credential) {
        return res.status(400).send({ error: 'We could not verify your passkey. Please try registering again.' });
      }

      const { credential } = registrationInfo;
      const account = fromPublicKey(credential.publicKey, 'passkey');
      const exist = await node.getConnectedAccount({ teamDid, id: credential.id });
      if (exist) {
        logger.info('passkey.register.exist', { teamDid, credential });
        return res
          .status(400)
          .send({ error: 'This passkey is already registered. Please use a different passkey or try logging in.' });
      }

      // Add credential to existing user
      if (purpose === 'connect') {
        const user = await node.getUser({ teamDid, user: { did: req.user.did } });
        const updated = await node.updateUser({
          teamDid,
          user: {
            did: user.did,
            passkeyCount: (user.passkeyCount || 0) + 1,
            connectedAccounts: updateConnectedAccount(user.connectedAccounts, {
              provider: LOGIN_PROVIDER.PASSKEY,
              did: account.address,
              id: credential.id,
              pk: toBase64(credential.publicKey),
              counter: credential.counter,
              userInfo: {
                sub: credential.id,
                name: req.passkeySession.data.userName,
              },
              extra: {
                transports: credential.transports,
                ...formatBuffersToBase64(registrationInfo),
              },
            }),
          },
        });
        logger.info('passkey.register.connected', { teamDid, user: updated });
        return res.send({ verified, userDid: updated.did, credentialId: credential.id });
      }

      // Create new user with the credential
      if (purpose === 'register') {
        const profile = await createProfileFromEmail(email, info, teamDid);

        let emailVerified = false;
        if (info.did !== teamDid) {
          // Check if the email is verified when required
          const settings = await getSessionConfig(req);
          if (settings.email?.enabled && settings.email?.requireVerified) {
            if (!(await node.isSubjectVerified({ teamDid, subject: email }))) {
              return res.status(400).send({ error: 'Please verify your email address before registering.' });
            }
            emailVerified = true;
          }
        }

        const added = await node.addUser({
          teamDid,
          user: {
            did: account.address,
            pk: toBase64(credential.publicKey),
            fullName: profile.fullName,
            email: profile.email,
            avatar: profile.avatar,
            locale: getLocale(req),
            approved: true,
            lastLoginIp: getRequestIP(req),
            inviter: req.passkeySession.data.inviter || '',
            sourceAppPid: req.passkeySession.data.sourceAppPid || '',
            sourceProvider: LOGIN_PROVIDER.PASSKEY,
            emailVerified,
            passkeyCount: 1,
            connectedAccounts: updateConnectedAccount([], {
              provider: LOGIN_PROVIDER.PASSKEY,
              did: account.address,
              id: credential.id,
              pk: toBase64(credential.publicKey),
              userInfo: {
                email,
                sub: credential.id,
                name: req.passkeySession.data.userName,
                emailVerified,
              },
              extra: {
                transports: credential.transports,
                ...formatBuffersToBase64(registrationInfo),
              },
            }),
          },
        });
        logger.info('passkey.register.registered', { teamDid, user: added });
        await node.createAuditLog(
          {
            action: 'addUser',
            args: {
              teamDid,
              userDid: account.address,
              passport: null,
              provider: LOGIN_PROVIDER.PASSKEY,
              reason: 'Passkey',
            },
            context: formatContext(Object.assign(req, { user: added })),
            result: added,
          },
          node
        );

        const result = { verified, userDid: added.did, credentialId: credential.id };

        return res.send(result);
      }

      throw new Error('The requested passkey action is not supported.');
    } catch (error) {
      console.error(error);
      return res.status(400).send({ error: 'Something went wrong while registering your passkey. Please try again.' });
    } finally {
      await node.endSession({ id: req.passkeySession.id });
    }
  };

  const handleAuthRequest = async (req, res) => {
    if (!PASSKEY_ACTIONS[req.query.action]) {
      return res.status(400).send({ error: 'The requested action is not valid for passkey authentication.' });
    }

    let expectedRoles = [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER];
    const userRoles = (req?.userExpanded?.passports || [])
      .filter((x) => x.status === PASSPORT_STATUS.VALID && x.scope === 'passport')
      .map((x) => x.role);
    const shouldCheck = shouldCheckRole(mode, req);
    if (req.query.action === 'verify-destroy') {
      const { payload, roles, locale = 'en' } = req.query;

      expectedRoles = shouldCheck
        ? validateVerifyDestroyRequest({
            payload,
            roles,
            locale,
            allowedRoles: expectedRoles,
          })
        : userRoles;
    }
    if (req.query.action === 'verify-destroy' || req.query.action === 'verify-elevated') {
      if (!req.userExpanded) {
        return res.status(400).send({ error: 'You need to be logged in to perform this action.' });
      }

      const hasRoles = expectedRoles.some((role) => userRoles?.some((x) => x === role));

      if (!hasRoles && shouldCheck && userRoles.length > 0) {
        return res.status(400).send({ error: 'You do not have the required passports to perform this action.' });
      }
    }

    const info = await node.getNodeInfo({ useCache: true });
    if (req.query.action === 'connect-owner') {
      if (info.ownerNft && info.ownerNft.issuer && info.ownerNft.holder) {
        return res.status(400).send({ error: 'The server owner can only be claimed with an NFT.' });
      }
      if (await node.isInitialized()) {
        return res.status(400).send({ error: 'The server has already been initialized.' });
      }
    }

    const session = await node.startSession({
      data: {
        type: 'passkey',
        data: {
          ...req.query,
          user: req.userExpanded?.did,
          origin: getDomain(req),
        },
      },
    });

    // if credentialId is specified, we will use the specified passkey
    const teamDid = mode === 'server' ? info.did : req.getBlockletDid();
    logger.info('passkey.auth.session', { teamDid });

    if (req.query.credentialId) {
      const exist = await node.getConnectedAccount({ teamDid, id: req.query.credentialId });
      if (!exist) {
        return res
          .status(400)
          .send({ error: "We couldn't find the specified passkey. Please make sure it's registered and try again." });
      }

      logger.info('passkey.auth.useSpecifiedPasskey', { teamDid, credentialId: req.query.credentialId });
      req.userExpanded = await node.getUser({ teamDid, user: { did: exist.userDid } });
    }

    const expectedRPID = getDomain(req);
    let allowedCredentials = [];
    if (req.query.credentialId) {
      allowedCredentials = (req.userExpanded?.connectedAccounts || [])
        .filter(
          (x) =>
            x.provider === LOGIN_PROVIDER.PASSKEY && x.extra?.rpID === expectedRPID && x.id === req.query.credentialId
        )
        .map((x) => ({
          id: x.id,
          type: 'public-key',
          transports: x.extra?.transports || [],
        }));
    }

    const options = await generateAuthenticationOptions({
      rpID: expectedRPID,
      challenge: toUint8Array(session.challenge),
      userVerification: shouldVerifyUser(req.query.action) ? 'required' : 'preferred',
      timeout: PASSKEY_TIMEOUT,
      allowCredentials: allowedCredentials,
    });

    logger.info('passkey.auth.options', { teamDid, options, action: req.query.action });

    return res.send(options);
  };

  const handleAuthResponse = async (req, res) => {
    const { body, passkeySession, blocklet } = req;

    // ensure the passkey is registered someway
    const info = await node.getNodeInfo({ useCache: true });
    const teamDid = mode === 'server' ? info.did : req.getBlockletDid();
    const passkey = await node.getConnectedAccount({ teamDid, id: body.id });
    if (!passkey) {
      return res.status(400).send({
        error:
          'This passkey is not registered with this application. Please register a passkey first or use a different one that is already registered.',
      });
    }

    const user = await node.getUser({ teamDid, user: { did: passkey.userDid } });
    logger.info('passkey.auth.response', { teamDid, body: JSON.parse(JSON.stringify(body)), user, passkeySession });
    if (!user) {
      return res.status(400).send({
        error:
          'We could not find the user account associated with this passkey. Please contact support if you believe this is an error.',
      });
    }
    if (!user.approved) {
      return res
        .status(400)
        .send({ error: 'Your account has been deactivated. Please contact support for assistance.' });
    }

    try {
      const verification = await verifyAuthenticationResponse({
        response: body,
        expectedChallenge: toBase64(passkeySession.challenge),
        expectedOrigin: getTrustOrigins({ blocklet: req.blocklet, req }),
        expectedRPID: getDomain(req),
        credential: {
          id: passkey.id,
          publicKey: fromBase64(passkey.pk),
          counter: passkey.counter,
        },
        requireUserVerification: shouldVerifyUser(passkeySession.data.action),
      });
      const { verified, authenticationInfo } = verification;
      if (!verified) {
        return res.status(400).send({ error: 'We could not verify your passkey. Please try again.' });
      }
      logger.info('passkey.auth.verified', { teamDid, verified, authenticationInfo });

      const createUserSession = async ({ targetAppPid } = {}) => {
        const ua = req.get('user-agent');
        const lastLoginIp = getRequestIP(req);
        const userSessionDoc = await node.upsertUserSession({
          teamDid,
          userDid: user.did,
          visitorId: req.get('x-blocklet-visitor-id'),
          appPid: teamDid,
          passportId: null,
          status: USER_SESSION_STATUS.ONLINE,
          ua,
          lastLoginIp: getRequestIP(req),
          extra: {
            walletOS: 'passkey',
          },
          locale: getLocale(req),
          origin: await getOrigin({ req }),
        });
        if (targetAppPid) {
          await node.syncUserSession({
            teamDid,
            userDid: userSessionDoc.userDid,
            visitorId: userSessionDoc.visitorId,
            passportId: null,
            targetAppPid,
            ua,
            lastLoginIp,
            extra: {
              walletOS: 'passkey',
            },
          });
        }
        logger.info('passkey.auth.createUserSession', { teamDid });
        return userSessionDoc;
      };

      const createTokens = async (updated, passport, role, profile, result) => {
        const { secret } = await getApplicationInfo({ node, nodeInfo: info, teamDid });
        const { sessionToken, refreshToken } = await createToken(
          updated.did,
          {
            secret,
            passport,
            role,
            fullName: profile.fullName,
            provider: LOGIN_PROVIDER.PASSKEY,
            walletOS: 'passkey',
            emailVerified: !!updated.emailVerified,
            phoneVerified: !!updated.phoneVerified,
            elevated: canSessionBeElevated(
              role,
              mode === 'service' ? (await node.getBlocklet({ did: teamDid }))?.settings : info
            ),
          },
          { ...(await getSessionConfig(req)) }
        );

        result.sessionToken = sessionToken;
        result.refreshToken = refreshToken;

        if (mode === 'service') {
          const session = await createUserSession();
          result.visitorId = session.visitorId;
        }

        logger.info('passkey.auth.createTokens', { teamDid });
        return result;
      };

      const loginUser = async () => {
        const _result = await node.loginUser({
          teamDid,
          user: {
            did: user.did,
            pk: passkey.pk,
            connectedAccount: {
              ...pick(passkey, ['id', 'did', 'pk', 'provider']),
              counter: authenticationInfo.newCounter,
            },
          },
        });
        logger.info('passkey.auth.loginUser', { teamDid, userDid: user.did });
        return _result;
      };

      const result = { verified, userDid: user.did };

      // Generate new session token that client can save to localStorage
      logger.info('passkey.auth.generateNewSessionToken', { teamDid, action: passkeySession.data.action });
      const { targetAppPid } = req.query;
      // FIXME: 这里目前只是一个 hack 的方式，passkey 和 federated 结合的流程需要重新梳理优化
      const isFederatedHack = targetAppPid && targetAppPid !== teamDid;
      const findMemberSite = findFederatedSite(blocklet, targetAppPid);
      if (
        [
          PASSKEY_ACTIONS.login,
          PASSKEY_ACTIONS['connect-to-did-space'],
          PASSKEY_ACTIONS['connect-to-did-domain'],
        ].includes(passkeySession.data.action)
      ) {
        if (mode === 'service' && isFederatedHack) {
          if (findMemberSite) {
            const postUser = pick(user, ['did', 'pk', 'fullName', 'locale', 'inviter', 'generation']);
            postUser.lastLoginAt = getRequestIP(req);

            if (user.email) {
              postUser.email = user.email;
            }
            if (user.avatar) {
              postUser.avatar = getUserAvatarUrl(user.avatar, req.blocklet);
            }
            // 这里是为了在 member 上创建用户
            const _result = await node.loginFederated({
              did: teamDid,
              data: {
                user: postUser,
                walletOS: 'passkey',
                provider: LOGIN_PROVIDER.PASSKEY,
              },
              site: findMemberSite,
            });
            result.sessionToken = _result.sessionToken;
            result.refreshToken = _result.refreshToken;

            const session = await createUserSession({ targetAppPid });
            result.visitorId = session.visitorId;
          } else {
            throw new Error('Target site not found');
          }
        } else {
          const updated = await loginUser();
          const passport = getLastUsedPassport(updated.passports);
          await createTokens(updated, passport, passport.role, user, result);
          logger.info('passkey.auth.loggedIn', { teamDid, userDid: user.did, passport });
        }
      }

      if (passkeySession.data.action === 'disconnect') {
        const updated = await node.disconnectUserAccount({
          teamDid,
          connectedAccount: pick(passkey, ['provider', 'did', 'pk']),
        });
        logger.info('passkey.auth.disconnect', { teamDid, result: updated });
      }

      if (passkeySession.data.action === 'invite') {
        const profile = pick(user, ['fullName', 'email', 'avatar']);
        const endpoint = prepareBaseUrl(req, {});
        const statusEndpointBaseUrl = joinURL(endpoint, WELLKNOWN_SERVICE_PATH_PREFIX);

        const {
          passport,
          role,
          user: updated,
        } = await handleInvitationReceive({
          node,
          req,
          endpoint,
          inviteId: passkeySession.data.inviteId,
          nodeInfo: info,
          profile,
          statusEndpointBaseUrl,
          teamDid,
          userDid: passkey.userDid,
          userPk: passkey.pk,
          provider: LOGIN_PROVIDER.PASSKEY,
          locale: getLocale(req),
          connectedAccountUpdates: { counter: authenticationInfo.newCounter },
        });

        await createTokens(updated, passport, role, profile, result);
        logger.info('passkey.auth.invited', { teamDid, userDid: updated.did });
      }

      if (['verify-destroy', 'destroy-self'].includes(passkeySession.data.action)) {
        const parsed = JSON.parse(fromBase64(req.passkeySession.data.payload).toString());
        const destroySession = await node.startSession({ data: { ...parsed, type: 'destroy', operator: user.did } });
        result.destroySessionId = destroySession.id;
        logger.info('passkey.auth.verifyDestroy', { teamDid, userDid: user.did, destroySessionId: destroySession.id });
      }

      if (['verify-elevated', 'verify-destroy', 'destroy-self'].includes(passkeySession.data.action)) {
        await loginUser();

        const elevated =
          passkeySession.data.action === 'verify-elevated'
            ? canSessionBeElevated(
                req.user.role,
                mode === 'service' ? (await node.getBlocklet({ did: teamDid }))?.settings : info
              )
            : true;

        if (mode === 'server') {
          const { sessionToken, refreshToken } = await createToken(user.did, {
            secret: await node.getSessionSecret(),
            passport: req.user.passport,
            role: req.user.role,
            fullName: user.fullName,
            elevated,
          });
          result.sessionToken = sessionToken;
          result.refreshToken = refreshToken;
        } else {
          const { secret } = await getApplicationInfo({ node, nodeInfo: info, teamDid });
          const { sessionToken, refreshToken } = await createToken(
            user.did,
            {
              secret,
              passport: req.user.passport,
              role: req.user.role,
              fullName: user.fullName,
              provider: LOGIN_PROVIDER.PASSKEY,
              walletOS: 'passkey',
              emailVerified: user.emailVerified,
              phoneVerified: user.phoneVerified,
              elevated,
            },
            { ...(await getSessionConfig(req)) }
          );
          result.sessionToken = sessionToken;
          result.refreshToken = refreshToken;
        }
        logger.info('passkey.auth.verifyAction', {
          teamDid,
          userDid: user.did,
          mode,
          action: passkeySession.data.action,
        });
      }

      if (passkeySession.data.action === 'connect-owner') {
        // check if the server owner is already claimed
        if (info.ownerNft && info.ownerNft.issuer && info.ownerNft.holder) {
          return res.status(400).send({ error: 'The server owner can only be claimed with an NFT.' });
        }
        if (await node.isInitialized()) {
          return res.status(400).send({ error: 'The server has already been initialized.' });
        }

        // remove all existing users except the current user
        const users = await node.getUsers({ teamDid: info.did });
        if (users.length > 0) {
          await Promise.all(
            users
              .filter((x) => x.did !== user.did)
              .map((x) => node.removeUser({ teamDid: info.did, user: { did: x.did } }))
          );
        }

        // update the server owner
        await node.updateNodeOwner({ nodeOwner: { did: user.did, pk: passkey.pk } });
        logger.info('passkey.auth.updateNodeOwner', { teamDid, userDid: user.did });
        await node.issuePassportToUser({
          teamDid: info.did,
          userDid: user.did,
          role: ROLES.OWNER,
          notify: false,
          action: passkeySession.data.action,
        });
        logger.info('passkey.auth.issuePassportToUser', { teamDid, userDid: user.did });
        const { sessionToken, refreshToken } = await createToken(user.did, {
          secret: await node.getSessionSecret(),
          passport: null,
          role: ROLES.OWNER,
          fullName: user.fullName,
          elevated: true,
        });

        result.sessionToken = sessionToken;
        result.refreshToken = refreshToken;

        logger.info('passkey.auth.connectOwner', { teamDid, userDid: user.did });
      }

      logger.info('passkey.auth.result', { action: passkeySession.data.action, teamDid, userDid: user.did });

      if (mode === 'service') {
        const accessWallet = getAccessWallet({
          blockletAppDid: findMemberSite?.appId || blocklet.appDid || blocklet.meta.did,
          serverSecretKey: info.sk,
        });
        result.csrfToken = await sign(accessWallet.secretKey, result.sessionToken);
      }

      return res.send(result);
    } catch (error) {
      logger.error('passkey.auth.handleAuthResponse.error', { error });
      return res.status(400).send({ error: 'An error occurred during authentication. Please try again.' });
    } finally {
      await node.endSession({ id: req.passkeySession.id });
    }
  };

  return {
    ensurePasskeySession,
    ensureUser,
    handleRegisterRequest,
    handleRegisterResponse,
    handleAuthRequest,
    handleAuthResponse,
  };
}

module.exports = {
  createPasskeyHandlers,
  getSessionConfig,
  getDomain,
  formatBuffersToBase64,
};
