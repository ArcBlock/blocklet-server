// Holds shared logic for session-manager v1 and v2
const get = require('lodash/get');
const { joinURL } = require('ufo');
const formatContext = require('@abtnode/util/lib/format-context');
const { extractUserAvatar, getAppAvatarUrl } = require('@abtnode/util/lib/user');
const {
  messages,
  validatePassportStatus,
  getPassportStatusEndpoint,
  verifyNFT,
  canSessionBeElevated,
} = require('@abtnode/auth/lib/auth');
const {
  NODE_SERVICES,
  ROLES,
  WELLKNOWN_SERVICE_PATH_PREFIX,
  MAIN_CHAIN_ENDPOINT,
  SECURITY_RULE_DEFAULT_ID,
  USER_SESSION_STATUS,
} = require('@abtnode/constant');
const {
  validatePassport,
  isUserPassportRevoked,
  getRoleFromLocalPassport,
  getRoleFromExternalPassport,
  createUserPassport,
  createPassportVC,
  createPassport,
  upsertToPassports,
  getPassportClaimUrl,
} = require('@abtnode/auth/lib/passport');
const { CustomError } = require('@blocklet/error');
const { getKeyPairClaim, getAuthPrincipalForMigrateAppToV2 } = require('@abtnode/auth/lib/server');
const { checkInvitedUserOnly } = require('@abtnode/auth/lib/oauth');
const { LOGIN_PROVIDER, BLOCKLET_APP_SPACE_REQUIREMENT, DID_SPACES } = require('@blocklet/constant');
const {
  getBlockletAppIdList,
  forEachBlockletSync,
  getAppName,
  getAppDescription,
  getAppUrl,
} = require('@blocklet/meta/lib/util');
const { getSourceAppPid, getLoginProvider } = require('@blocklet/sdk/lib/util/login');
const { getDidSpacesInfoByClaims, silentAuthorizationInConnect } = require('@abtnode/auth/lib/util/spaces');
const getRequestIP = require('@abtnode/util/lib/get-request-ip');
const { PASSPORT_LOG_ACTION, PASSPORT_SOURCE, PASSPORT_STATUS } = require('@abtnode/constant');
const { getDeviceData } = require('@abtnode/util/lib/device');
const { getVerifyAccessClaims } = require('@abtnode/auth/lib/server');
const getOrigin = require('@abtnode/util/lib/get-origin');
const { PASSPORT_VC_TYPES } = require('@abtnode/auth/lib/util/transfer-passport');
const bindWallet = require('@abtnode/auth/lib/util/bind-wallet');
const { sign } = require('@blocklet/sdk/lib/util/csrf');
const { getAccessWallet } = require('@abtnode/util/lib/blocklet');

const logger = require('../logger')('connect');
const { createTokenFn, getDidConnectVersion } = require('../../util');
const { getKycClaims, verifyKycClaims, getPassportVc, getProfileItems } = require('../kyc');
const { getTrustedIssuers, getFederatedTrustedIssuers } = require('../../util/blocklet-utils');
const {
  getUserAvatarUrl,
  getFederatedMaster,
  shouldSyncFederated,
  getUserWithinFederated,
  syncFederatedUser,
} = require('../../util/federated');
const { Profile } = require('../../state/profile');
const { getDefaultPassport } = require('../../util/user-util');

// do some check if the passport issued by the blocklet itself
const validateLocalPassport = async ({ vc, node, locale, blocklet, teamDid, userDid }) => {
  // skip passport validation for e2e test
  if (blocklet.settings?.purpose === 'e2e') {
    return;
  }

  const appIdList = getBlockletAppIdList(blocklet);
  if (appIdList.includes(vc?.issuer.id)) {
    if (vc.credentialSubject.id !== userDid) {
      throw new CustomError(403, messages.passportNotBelongToYou[locale]);
    }

    const passport = await node.getPassportById({ teamDid, passportId: vc.id });
    if (!passport) {
      throw new CustomError(403, messages.passportNotFound[locale]);
    }

    if (passport.status === PASSPORT_STATUS.REVOKED) {
      throw new CustomError(403, messages.passportRevoked[locale](passport.title));
    }

    if (passport.status === PASSPORT_STATUS.EXPIRED) {
      throw new CustomError(403, messages.passportExpired[locale]);
    }

    if (!(await node.isPassportValid({ teamDid, passportId: vc.id }))) {
      throw new CustomError(403, messages.passportNotFound[locale]);
    }
  }
};

const getRoleFromVC = async ({ vc, node, locale, blocklet, teamDid, sourceAppPid }) => {
  let role = ROLES.GUEST;
  if (vc) {
    await validatePassport(get(vc, 'credentialSubject.passport'));
    const actualIssuer = get(vc, 'issuer.id');
    const expectedIssuers = getBlockletAppIdList(blocklet);
    if (expectedIssuers.includes(actualIssuer)) {
      role = getRoleFromLocalPassport(get(vc, 'credentialSubject.passport'));
    } else {
      // MEMO: 如果是 federated，需要将 actualIssuer 做一个转换
      const actualIssuerList = sourceAppPid ? await getFederatedTrustedIssuers(blocklet) : [actualIssuer];
      // map external passport to local role
      const { mappings = [] } =
        (blocklet.trustedPassports || []).find((x) => actualIssuerList.includes(x.issuerDid)) || {};
      role = await getRoleFromExternalPassport({
        passport: get(vc, 'credentialSubject.passport'),
        node,
        teamDid,
        locale,
        mappings,
      });

      // check status of external passport if passport has an endpoint
      const endpoint = get(vc, 'credentialStatus.id');
      if (endpoint) {
        await validatePassportStatus({ vcId: vc.id, endpoint, locale });
      }
    }
  }
  return role;
};

const validateRole = async ({ role, securityConfig, locale, node, teamDid }) => {
  const accessRoles = securityConfig?.accessPolicy?.roles ?? null;
  const accessReverse = securityConfig?.accessPolicy?.reverse ?? false;

  const roleList = await node.getRoles({ teamDid });
  if (!roleList.some((x) => x.name === role)) {
    // 事实上，这里表示的是通行证已经被删除了，也就是这个 role 不存在了
    throw new Error(messages.passportHasBeenRevokedByTheApp[locale]);
  }

  if (accessRoles === null && accessReverse === false) {
    return;
  }

  const validRoles = accessReverse
    ? (roleList || []).filter((x) => !accessRoles.includes(x.name)).map((x) => x.name)
    : accessRoles;
  if (!validRoles.includes(role)) {
    const roleTitleList = (roleList || []).filter((x) => validRoles.some((y) => y === x.name)).map((x) => x.title);
    throw new Error(
      {
        zh: `请使用 ${roleTitleList.join(' 或 ')} 通行证登录`,
        en: `Please use ${roleTitleList.join(' or ')} passport to login`,
      }[locale]
    );
  }
};

const checkAppOwner = async ({ node, role, blocklet, userDid, locale = 'en' }) => {
  if (role !== ROLES.OWNER) {
    return;
  }

  if (!blocklet.settings.initialized) {
    return;
  }

  // Blocklet owner may have migrated from managed to external
  const user = await node.getUser({
    teamDid: blocklet.meta.did,
    user: { did: blocklet.settings.owner.did },
    options: { enableConnectedAccount: true },
  });
  if (user.connectedAccounts.some((x) => x.did === userDid)) {
    return;
  }

  throw new Error(messages.notAppOwner[locale]);
};

const checkUserRole = async ({ node, userDid, locale, request, roles }) => {
  const blocklet = await request.getBlocklet();
  logger.info('checkUserRole get blocklet', { userDid, teamDid: blocklet.appPid });
  const user = await node.getUser({
    teamDid: blocklet.appPid,
    user: { did: userDid },
    options: { enableConnectedAccount: true },
  });
  logger.info('checkUserRole get user', { userDid, user });

  if (!user) {
    logger.error('user not found', { userDid });
    throw new Error(messages.userNotFound[locale]);
  }

  if (!user.approved) {
    logger.error('user not approved', { userDid });
    throw new Error(messages.notAllowedAppUser[locale]);
  }

  const sourceAppPid = getSourceAppPid(request);
  return {
    verifiableCredential: getVerifyAccessClaims({
      node,
      passports: user.passports,
      roles,
      types: PASSPORT_VC_TYPES,
      source: 'blocklet',
      trustedIssuers: await getTrustedIssuers(blocklet, { sourceAppPid }),
    }),
  };
};

/**
 * @description
 * @param {import('@blocklet/server-js').BlockletState} blocklet
 * @param {{ headers: Record<string, string> }} headers
 * @return {boolean}
 */
const isDidSpaceRequiredOnConnect = (blocklet, request) => {
  let flag = false;

  const [, componentDid] = (request.get('x-blocklet-component-id') || '').split('/');

  forEachBlockletSync(blocklet, (b) => {
    flag =
      flag ||
      (b?.meta?.capabilities?.didSpace === BLOCKLET_APP_SPACE_REQUIREMENT.REQUIRED_ON_CONNECT &&
        b?.meta?.did === componentDid);
  });

  return !!flag;
};

module.exports = {
  login: {
    /**
     *
     * @param {{
     *  node: import('@abtnode/core').TNode
     * }} param0
     * @returns
     */
    onConnect: async ({ node, request, userDid, userPk, locale = 'en', passportId = '', action, baseUrl, inviter }) => {
      /**
       * @type {import('@blocklet/server-js').BlockletState}
       */
      const blocklet = await request.getBlocklet();
      const { accessPolicyConfig } = await request.getSecurityConfig({ id: SECURITY_RULE_DEFAULT_ID });
      const blockletInfo = await request.getBlockletInfo();
      const { did: teamDid } = blockletInfo;
      const sourceAppPid = getSourceAppPid(request);

      const profileItems = getProfileItems(blocklet.settings?.session, request.context.didwallet);
      const claims = {
        profile: {
          type: 'profile',
          description: messages.description[locale],
          items: profileItems,
        },
      };

      const user = await getUserWithinFederated({ sourceAppPid, teamDid, userDid, userPk }, { node, blocklet });

      const isInvitedUserOnly = accessPolicyConfig
        ? await checkInvitedUserOnly(accessPolicyConfig, node, teamDid)
        : false;

      if (!user && isInvitedUserOnly) {
        throw new Error(messages.notInvited[locale]);
      }

      if (action === 'login') {
        // passport claim
        // 只显示非 Org 下的通行证
        const roles = await node.getRoles({ teamDid });

        const defaultClaims = {
          type: 'verifiableCredential',
          description: messages.requestPassport[locale],
          item: PASSPORT_VC_TYPES,
          trustedIssuers: await getTrustedIssuers(blocklet, { sourceAppPid }),
          optional: !isInvitedUserOnly,
          claimUrl: getPassportClaimUrl(baseUrl),
          // 此限制会导致无法正常配置的信任通行证，暂时去掉此条件
          // ownerDid: [userDid],
        };
        const passportClaim = !user
          ? defaultClaims
          : getVerifyAccessClaims({
              node,
              passports: user.passports || [],
              roles: roles.filter((x) => !x.orgId).map((x) => x.name),
              types: PASSPORT_VC_TYPES,
              optional: !isInvitedUserOnly,
              source: 'blocklet',
              trustedIssuers: await getTrustedIssuers(blocklet, { sourceAppPid }),
              defaultClaims,
            });
        if (passportId) {
          passportClaim.target = passportId;
        }
        claims.passport = ['verifiableCredential', passportClaim];

        // attach assetOrVC claim when space is required for user
        if (isDidSpaceRequiredOnConnect(blocklet, request)) {
          const currentUser = await node.getUser({
            teamDid,
            user: {
              did: userDid,
            },
            options: {
              enableConnectedAccount: true,
            },
          });

          if (!currentUser?.didSpace?.endpoint) {
            // 当这个用户没有 didSpace endpoint 时,我们需要用户主动授权
            claims.assetOrVC = {
              description: messages.requestDidSpace[locale],
              optional: false,
              filters: [
                {
                  tag: DID_SPACES.NFT_TAG, // 用于筛选 NFT
                },
                {
                  type: DID_SPACES.VC_TYPES, // 用于筛选 VC
                },
              ],
              meta: {
                purpose: 'DidSpace',
              },
            };
          }
        }

        const kycClaims = await getKycClaims({ blocklet, user, locale, baseUrl, sourceAppPid, inviter });
        Object.assign(claims, kycClaims);
      }

      if (action === 'exchangePassport') {
        const trustedFactories = (blocklet.trustedFactories || []).map((x) => x.factoryAddress);
        claims.asset = {
          type: 'asset',
          description: messages.requestNFT[locale],
          filters: trustedFactories.map((x) => ({ trustedParents: [x] })),
          optional: false,
        };
      }

      if (user) {
        delete claims.profile;

        // HACK: 确保用户在尝试登录时，就将 avatar 进行一次 fix (base64 -> bn-url)
        if (user.avatar) {
          const parsedAvatar = await extractUserAvatar(get(user, 'avatar'), {
            dataDir: blocklet.env.dataDir,
          });
          if (parsedAvatar !== user.avatar) {
            await node.updateUser({
              teamDid,
              user: {
                ...user,
                avatar: parsedAvatar,
              },
            });
          }
        }
      }

      return claims;
    },

    onApprove: async ({
      node,
      request,
      locale,
      challenge,
      userDid,
      userPk,
      claims,
      baseUrl,
      createSessionToken,
      action,
      visitorId,
      inviter,
    }) => {
      /** @type {import('@blocklet/server-js').BlockletState} */
      const blocklet = await request.getBlocklet();
      const blockletInfo = await request.getBlockletInfo();
      const { wallet, secret, name, passportColor, did: teamDid } = blockletInfo;
      const sourceAppPid = getSourceAppPid(request);

      // Check user approved
      const currentUser = await getUserWithinFederated({ sourceAppPid, teamDid, userDid, userPk }, { node, blocklet });
      if (currentUser && !currentUser.approved) {
        throw new Error(messages.notAllowedAppUser[locale]);
      }

      const realDid = currentUser?.did || userDid;
      const realPk = currentUser?.pk || userPk;

      // Get auth config
      const { accessPolicyConfig } = await request.getSecurityConfig({ id: SECURITY_RULE_DEFAULT_ID });

      const isInvitedUserOnly = await checkInvitedUserOnly(accessPolicyConfig, node, teamDid);
      if (!currentUser && isInvitedUserOnly) {
        throw new CustomError(403, messages.notInvited[locale]);
      }

      let vc;
      let nftState;
      let defaultRole = ROLES.GUEST;
      let defaultTtl = 0;
      let defaultTtlPolicy = 'never';
      let issuePassport = false;

      const provider = getLoginProvider(request);
      const masterSite = getFederatedMaster(blocklet);

      // updates for kyc
      let kycUpdates = {};

      // Get passport vc
      if (action === 'login') {
        vc = await getPassportVc({
          claims,
          challenge,
          locale,
          trustedIssuers: await getTrustedIssuers(blocklet, { sourceAppPid }),
        });
        if (isInvitedUserOnly && !vc) {
          throw new CustomError(403, messages.missingPassport[locale]);
        }

        await validateLocalPassport({ vc, node, locale, blocklet, teamDid, userDid });

        const userCount = await node.getUsersCount({ teamDid });
        if (userCount === 0) {
          defaultRole = ROLES.OWNER;
          issuePassport = true;
        }

        kycUpdates = await verifyKycClaims({
          node,
          blocklet,
          teamDid,
          claims,
          challenge,
          locale,
          sourceAppPid,
          user: currentUser,
        });
      } else if (action === 'exchangePassport') {
        const claim = claims.find((x) => x.type === 'asset');
        const isConnected = await node.isConnectedAccount({ teamDid, did: claim.asset });
        if (isConnected) {
          throw new Error(messages.nftAlreadyUsed[locale]);
        }

        nftState = await verifyNFT({ claims, challenge, locale, chainHost: MAIN_CHAIN_ENDPOINT });
        const matchFactory = blocklet.trustedFactories.find((x) => x.factoryAddress === nftState.parent);
        if (!matchFactory) {
          throw new Error(messages.invalidNftParent[locale]);
        }

        defaultRole = matchFactory.passport.role;
        defaultTtl = matchFactory.passport.ttl;
        defaultTtlPolicy = matchFactory.passport.ttlPolicy;
        issuePassport = true;
      }

      if (issuePassport) {
        let expirationDate;
        if (nftState && defaultTtl) {
          if (defaultTtlPolicy === 'mint') {
            expirationDate = +new Date(nftState.context.genesisTime) + defaultTtl;
          }
          if (defaultTtlPolicy === 'exchange') {
            expirationDate = +new Date() + defaultTtl;
          }
        }

        logger.info(`issue passport to user at the ${action} workflow`, {
          role: defaultRole,
          expire: expirationDate,
          policy: defaultTtlPolicy,
          ttl: defaultTtl,
        });

        const profile = claims.find((x) => x.type === 'profile');

        vc = await createPassportVC({
          issuerName: name,
          issuerWallet: wallet,
          issuerAvatarUrl: getAppAvatarUrl(baseUrl),
          ownerDid: userDid,
          ...(await createPassport({
            name: defaultRole,
            node,
            teamDid,
            locale,
            endpoint: baseUrl,
          })),
          endpoint: getPassportStatusEndpoint({
            baseUrl: joinURL(baseUrl, WELLKNOWN_SERVICE_PATH_PREFIX),
            userDid: realDid,
            teamDid,
          }),
          ownerProfile: profile,
          preferredColor: passportColor,
          expirationDate: expirationDate ? new Date(expirationDate).toISOString() : undefined,
        });
      }

      // Get user passport from vc
      let passport = vc ? createUserPassport(vc) : null;
      if (currentUser && passport && isUserPassportRevoked(currentUser, passport)) {
        throw new Error(messages.passportRevoked[locale](passport.title, name));
      }

      // Get role
      const role = await getRoleFromVC({ vc, node, locale, blocklet, teamDid, sourceAppPid });
      await validateRole({ role, securityConfig: accessPolicyConfig, locale, node, teamDid });
      await checkAppOwner({ node, role, blocklet, userDid, locale });

      if (blocklet.settings?.purpose !== 'e2e') {
        // do not allow non-exist user to login as owner/admin
        if (!currentUser && !issuePassport && [ROLES.OWNER, ROLES.ADMIN].includes(role)) {
          throw new Error(messages.notInvited[locale]);
        }
      }

      // Recreate passport with correct role
      passport = vc ? createUserPassport(vc, { role, source: PASSPORT_SOURCE.ISSUE }) : null;
      if (passport?.id) {
        const isTrustedPassport = (blocklet.trustedPassports || []).some((x) => x.issuerDid === passport?.issuer?.id);
        if (isTrustedPassport) {
          passport.source = PASSPORT_SOURCE.TRUSTED;
        }
      }

      const now = new Date().toISOString();
      const connectedNft = nftState
        ? {
            provider: LOGIN_PROVIDER.NFT,
            did: nftState.address,
            owner: nftState.owner,
            firstLoginAt: now,
            lastLoginAt: now,
          }
        : null;

      let fullName = currentUser?.fullName;
      // Update profile
      const passportForLog = passport || getDefaultPassport();

      const connectAccount = { provider, did: userDid, pk: userPk };

      let updatedUser;
      const profile = claims.find((x) => x.type === 'profile');

      if (profile) {
        profile.url = profile?.url || '';
      }

      if (currentUser) {
        updatedUser = await node.loginUser({
          teamDid,
          user: {
            did: currentUser.did,
            pk: currentUser.pk,
            locale,
            passport,
            sourceAppPid,
            lastLoginIp: getRequestIP(request),
            connectedAccount: [connectAccount, connectedNft],
            ...profile,
            ...kycUpdates,
            avatar: await extractUserAvatar(get(profile, 'avatar'), {
              dataDir: blocklet.env.dataDir,
            }),
          },
        });
        await node.createAuditLog({
          action,
          args: { teamDid, userDid: realDid, passport: passportForLog, provider, sourceAppPid },
          context: formatContext(Object.assign(request, { user: updatedUser })),
          result: updatedUser,
        });
      } else {
        // Create user
        fullName = profile.fullName;

        updatedUser = await node.loginUser({
          teamDid,
          user: {
            ...profile,
            avatar: await extractUserAvatar(get(profile, 'avatar'), {
              dataDir: blocklet.env.dataDir,
            }),
            did: realDid,
            pk: realPk,
            locale,
            passport,
            sourceAppPid,
            lastLoginIp: getRequestIP(request),
            connectedAccount: [connectAccount, connectedNft],
            inviter,
            ...kycUpdates,
          },
        });
        await node.createAuditLog(
          {
            action: 'addUser',
            args: {
              teamDid,
              userDid: realDid,
              sourceAppPid,
              provider,
              reason: `first login as ${passportForLog.role}`,
            },
            context: formatContext(Object.assign(request, { user: updatedUser })),
            result: updatedUser,
          },
          node
        );
      }
      const lastLoginIp = getRequestIP(request);
      const ua = request.get('user-agent');
      // request.context.store.connectedWallet
      const walletOS = request.context.didwallet.os;
      const deviceData = getDeviceData({ req: request });

      const userSessionDoc = await node.upsertUserSession({
        teamDid,
        visitorId,
        userDid: realDid,
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
        origin: await getOrigin({ req: request }),
      });

      if (shouldSyncFederated(blocklet, sourceAppPid)) {
        await node.syncFederated({
          did: teamDid,
          data: {
            users: [
              {
                action: 'connectAccount',
                did: updatedUser.did,
                pk: updatedUser.pk,
                fullName: updatedUser.fullName,
                email: updatedUser.email || '',
                avatar: getUserAvatarUrl(updatedUser.avatar, blocklet),
                connectedAccount: [connectAccount, connectedNft],
                sourceAppPid: sourceAppPid || masterSite.appPid,
                inviter: updatedUser.inviter,
                generation: updatedUser.generation,
                emailVerified: updatedUser.emailVerified,
                phoneVerified: updatedUser.phoneVerified,
              },
            ],
          },
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
      }

      if (passport) {
        await node.createPassportLog(
          teamDid,
          {
            passportId: passport.id,
            action: PASSPORT_LOG_ACTION.USED,
            operatorDid: userDid,
            metadata: {
              action,
            },
          },
          request
        );
      }

      // Generate new session token that client can save to localStorage
      const createToken = createTokenFn(createSessionToken);
      const sessionConfig = blocklet.settings?.session || {};

      const { sessionToken, refreshToken } = createToken(
        realDid,
        {
          secret,
          passport,
          role,
          fullName,
          // NOTE: token 中存储当前的 login provider
          provider,
          walletOS,
          emailVerified: updatedUser.emailVerified,
          phoneVerified: updatedUser.phoneVerified,
          elevated: canSessionBeElevated(role, blocklet?.settings),
        },
        { ...sessionConfig, didConnectVersion: getDidConnectVersion(request) }
      );
      logger.info(`${action}.success`, { userDid: realDid, role });

      if (
        // if user provides owner passport AND app does not have owner, set this user to owner
        (vc && role === ROLES.OWNER && !blocklet.settings?.owner) ||
        // if the user will receive a owner passport AND app does not have owner, set this user to owner
        (issuePassport && defaultRole === ROLES.OWNER && !blocklet.settings?.owner)
      ) {
        logger.info('Bind owner for blocklet', { teamDid, userDid: realDid });
        await node.setBlockletInitialized({ did: teamDid, owner: { did: realDid, pk: realPk } });
      }

      // @note: 当第一个用户将要成为 owner 的时候,也是需要绑定 DID Space 的,所以延后执行在此时设置 DID Spaces
      const shouldConnectSpace = claims.some(
        (x) => x?.meta?.purpose === 'DidSpace' && ['asset', 'verifiableCredential'].includes(x.type)
      );
      if (action === 'login' && shouldConnectSpace) {
        const didSpaceInfo = await getDidSpacesInfoByClaims({ claims });

        const appUrl = getAppUrl(blocklet);
        const { data } = await silentAuthorizationInConnect(didSpaceInfo, {
          appInfo: {
            appDid: blocklet.appDid,
            appName: getAppName(blocklet),
            appDescription: getAppDescription(blocklet),
            appUrl,
            scopes: DID_SPACES.AUTHORIZE.DEFAULT_SCOPE,
            referrer: joinURL(appUrl, WELLKNOWN_SERVICE_PATH_PREFIX, '/connect'),
            metadata: {
              did: blocklet.meta.did,
            },
          },
          verifyNFTParams: {
            claims,
            challenge,
            locale,
          },
        });

        /**
         * @type {Omit<import('@blocklet/server-js').SpaceGatewayInput, 'protected'>}
         */
        const spaceGateway = {
          did: data.did,
          name: data.name,
          endpoint: data.endpoint,
          url: didSpaceInfo.didSpacesCoreUrl,
        };

        const user = await node.getUser({
          teamDid,
          user: {
            did: userDid,
          },
          options: {
            enableConnectedAccount: true,
          },
        });

        await node.updateUser({
          teamDid,
          user: {
            did: user.did,
            didSpace: {
              ...user?.didSpace,
              ...spaceGateway,
            },
          },
        });
      }

      // @NOTE: 异步地刷新 profile
      Profile.refresh({
        node,
        blocklet,
        teamDid,
        userDid,
      }).catch((error) => console.warn(error));

      // 创建 csrf token
      const nodeInfo = await node.getNodeInfo();
      const accessWallet = getAccessWallet({
        blockletAppDid: blocklet.appDid || blocklet.meta.did,
        serverSecretKey: nodeInfo.sk,
      });
      const csrfToken = sign(accessWallet.secretKey, sessionToken);

      // issue passport for the first login user in a invite-only team
      if (issuePassport) {
        return {
          disposition: 'attachment',
          type: 'VerifiableCredential',
          data: vc,
          csrfToken,
          sessionToken,
          refreshToken,
          visitorId: userSessionDoc.visitorId,
          nextWorkflowData: {
            userDid: realDid,
          },
        };
      }

      return {
        sessionToken,
        refreshToken,
        csrfToken,
        visitorId: userSessionDoc.visitorId,
        nextWorkflowData: {
          userDid: realDid,
        },
      };
    },
  },

  switchProfile: {
    onConnect: async ({ node, request, locale, userDid, baseUrl, previousUserDid }) => {
      if (userDid && previousUserDid && userDid !== previousUserDid) {
        throw new Error(messages.userMismatch[locale]);
      }

      const serviceConfig = await request.getServiceConfig(NODE_SERVICES.AUTH);
      if (get(serviceConfig, 'allowSwitchProfile', true) === false) {
        throw new Error(messages.notAllowedToSwitchProfile[locale]);
      }

      const blocklet = await request.getBlocklet();
      const user = await node.getUser({
        teamDid: blocklet.appDid,
        user: {
          did: userDid,
        },
        options: {
          enableConnectedAccount: true,
        },
      });

      if (!user) {
        throw new Error(messages.userNotFound[locale]);
      }
      if (!user.approved) {
        throw new Error(messages.notAllowedAppUser[locale]);
      }

      const profileItems = getProfileItems(blocklet.settings?.session, request.context.didwallet);
      const claims = {
        profile: {
          type: 'profile',
          description: messages.description[locale],
          items: profileItems,
        },
      };

      const sourceAppPid = getSourceAppPid(request);
      const kycClaims = await getKycClaims({ blocklet, user, locale, baseUrl, sourceAppPid });
      Object.assign(claims, kycClaims);

      return claims;
    },
    onApprove: async ({ node, request, locale, profile, userDid, challenge, claims }) => {
      const blocklet = await request.getBlocklet();
      const { did: teamDid } = await request.getBlockletInfo();
      const sourceAppPid = getSourceAppPid(request);

      // check user approved
      const user = await node.getUser({
        teamDid,
        user: {
          did: userDid,
        },
        options: {
          enableConnectedAccount: true,
        },
      });
      if (!user) {
        throw new Error(messages.userNotFound[locale]);
      }
      if (!user.approved) {
        throw new Error(messages.notAllowedAppUser[locale]);
      }

      // 兼容新版本和老版本的 DID Wallet之间来回切换 Profile
      if (profile) {
        profile.url = profile.url || '';
      }

      const kycUpdates = await verifyKycClaims({
        node,
        blocklet,
        teamDid,
        claims,
        challenge,
        locale,
        sourceAppPid,
        user,
      });

      // Update user
      const doc = await node.updateUser({
        teamDid,
        user: {
          ...user,
          ...profile,
          ...kycUpdates,
          avatar: await extractUserAvatar(get(profile, 'avatar'), {
            dataDir: blocklet.env.dataDir,
          }),
        },
      });

      await node.createAuditLog(
        {
          action: 'switchProfile',
          args: { teamDid, userDid: user.did, profile },
          context: formatContext(Object.assign(request, { user })),
          result: doc,
        },
        node
      );

      syncFederatedUser(blocklet, node, doc, sourceAppPid);

      // @NOTE: 异步地刷新 profile
      Profile.refresh({
        node,
        blocklet,
        teamDid,
        userDid,
      }).catch((error) => console.warn(error));
    },
  },

  switchPassport: {
    onConnect: async ({ node, request, locale, userDid, previousUserDid, baseUrl }) => {
      if (userDid && previousUserDid && userDid !== previousUserDid) {
        throw new Error(messages.userMismatch[locale]);
      }

      const { did: teamDid } = await request.getBlockletInfo();

      const user = await node.getUser({
        teamDid,
        user: {
          did: userDid,
        },
        options: {
          enableConnectedAccount: true,
        },
      });

      if (!user) {
        throw new Error(messages.userNotFound[locale]);
      }
      if (!user.approved) {
        throw new Error(messages.notAllowedAppUser[locale]);
      }

      const { accessPolicyConfig } = await request.getSecurityConfig({ id: SECURITY_RULE_DEFAULT_ID });
      const isInvitedUserOnly = await checkInvitedUserOnly(accessPolicyConfig, node, teamDid);
      if (!user && isInvitedUserOnly) {
        throw new Error(messages.notInvited[locale]);
      }

      const blocklet = await request.getBlocklet();
      const sourceAppPid = getSourceAppPid(request);

      // 只显示非 Org 下的通行证
      const roles = await node.getRoles({ teamDid });
      const defaultClaims = {
        type: 'verifiableCredential',
        description: messages.requestPassport[locale],
        item: PASSPORT_VC_TYPES,
        trustedIssuers: await getTrustedIssuers(blocklet, { sourceAppPid }),
        optional: !isInvitedUserOnly,
        claimUrl: getPassportClaimUrl(baseUrl),
      };

      return {
        verifiableCredential: getVerifyAccessClaims({
          node,
          passports: user.passports || [],
          roles: roles.filter((x) => !x.orgId).map((x) => x.name),
          types: PASSPORT_VC_TYPES,
          optional: !isInvitedUserOnly,
          source: 'blocklet',
          trustedIssuers: await getTrustedIssuers(blocklet, { sourceAppPid }),
          defaultClaims,
        }),
      };
    },
    onApprove: async ({
      node,
      request,
      locale,
      challenge,
      verifiableCredential,
      userDid,
      createSessionToken,
      sourceAppPid,
      provider,
      visitorId,
    }) => {
      const blocklet = await request.getBlocklet();
      const { name, did: teamDid, secret } = await request.getBlockletInfo();

      // Validate user
      const user = await node.getUser({
        teamDid,
        user: {
          did: userDid,
        },
        options: {
          enableConnectedAccount: true,
        },
      });
      if (!user) {
        throw new Error(messages.userNotFound[locale]);
      }
      if (!user.approved) {
        throw new Error(messages.notAllowedAppUser[locale]);
      }

      // Get auth config
      const { accessPolicyConfig } = await request.getSecurityConfig({ id: SECURITY_RULE_DEFAULT_ID });
      const isInvitedUserOnly = await checkInvitedUserOnly(accessPolicyConfig, node, teamDid);
      if (!user && isInvitedUserOnly) {
        throw new Error(messages.notInvited[locale]);
      }

      // Get passport vc
      const vc = await getPassportVc({
        claims: [verifiableCredential],
        challenge,
        locale,
        trustedIssuers: await getTrustedIssuers(blocklet, { sourceAppPid }),
      });

      // Validate passport required
      if (isInvitedUserOnly && !vc) {
        throw new Error(messages.missingPassport[locale]);
      }

      await validateLocalPassport({ vc, node, locale, blocklet, teamDid, userDid });

      // Get user passport from vc
      let passport = vc ? createUserPassport(vc) : null;
      if (passport && isUserPassportRevoked(user, passport)) {
        throw new Error(messages.passportRevoked[locale](passport.title, name));
      }

      // Get role
      const role = await getRoleFromVC({ vc, node, locale, blocklet, teamDid, sourceAppPid });
      await validateRole({ role, securityConfig: accessPolicyConfig, locale, node, teamDid });
      await checkAppOwner({ node, role, blocklet, userDid, locale });

      // Recreate passport with correct role
      passport = vc ? createUserPassport(vc, { role, source: PASSPORT_SOURCE.ISSUE }) : null;

      await node.updateUser({
        teamDid,
        user: {
          did: user.did,
          pk: user.pk,
          passports: upsertToPassports(
            user.passports || [],
            passport && { ...passport, lastLoginAt: new Date().toISOString() }
          ),
        },
      });

      // Audit log
      const passportForLog = passport || getDefaultPassport();
      await node.createAuditLog(
        {
          action: 'switchPassport',
          args: { teamDid, userDid, passport: passportForLog, sourceAppPid },
          context: formatContext(Object.assign(request, { user })),
          result: {},
        },
        node
      );

      if (passport) {
        await node.createPassportLog(
          teamDid,
          {
            passportId: passport.id,
            action: PASSPORT_LOG_ACTION.USED,
            operatorDid: '',
            metadata: {
              action: 'switch-passport-approve',
            },
          },
          request
        );
      }
      await node.upsertUserSession({
        teamDid,
        userDid,
        visitorId,
        appPid: teamDid,
        passportId: passport?.id,
      });

      // Generate new session token that client can save to localStorage
      const createToken = createTokenFn(createSessionToken);
      const sessionConfig = blocklet.settings?.session || {};
      const { sessionToken, refreshToken } = createToken(
        userDid,
        {
          secret,
          passport,
          role,
          fullName: user.fullName,
          provider,
          // request.context.store.connectedWallet
          walletOS: request.context.didwallet.os,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          elevated: canSessionBeElevated(role, blocklet?.settings),
        },
        { ...sessionConfig, didConnectVersion: getDidConnectVersion(request) }
      );

      // 创建 csrf token
      const nodeInfo = await node.getNodeInfo();
      const accessWallet = getAccessWallet({
        blockletAppDid: blocklet.appDid || blocklet.meta.did,
        serverSecretKey: nodeInfo.sk,
      });
      const csrfToken = sign(accessWallet.secretKey, sessionToken);

      return { sessionToken, refreshToken, csrfToken };
    },
  },

  // 给 Auth0 绑定 DID Wallet 账户，基本流程与 login 一致，但在创建更新用户信息的逻辑不一样
  bindWallet,

  migrateToStructV2: {
    authPrincipal: false,
    getClaims: ({ node }) => [
      {
        authPrincipal: getAuthPrincipalForMigrateAppToV2(node),
      },
      {
        verifiableCredential: async ({ extraParams: { locale }, context: { request, baseUrl } }) => {
          const blocklet = await request.getBlocklet();
          return {
            type: 'verifiableCredential',
            description: messages.requestPassport[locale],
            item: PASSPORT_VC_TYPES,
            trustedIssuers: await getTrustedIssuers(blocklet),
            optional: false,
            claimUrl: getPassportClaimUrl(baseUrl),
          };
        },
        keyPair: getKeyPairClaim(node, { declare: false }),
      },
    ],

    onAuth: async ({ claims, challenge, userDid, extraParams: { locale }, req, node }) => {
      const blocklet = await req.getBlocklet();
      const { wallet, did: teamDid } = await req.getBlockletInfo();
      const appId = wallet.address;

      // Get passport vc
      const vc = await getPassportVc({
        claims,
        challenge,
        locale,
        trustedIssuers: await getTrustedIssuers(blocklet),
      });
      if (!vc) {
        throw new Error(messages.missingPassport[locale]);
      }

      const role = await getRoleFromVC({ vc, appId, node, locale, blocklet, teamDid });
      if (role !== ROLES.OWNER) {
        throw new Error(messages.onlyOwnerCanPerformThisAction[locale]);
      }

      const keyPair = claims.find((x) => x.type === 'keyPair');
      if (!keyPair) {
        throw new Error(messages.missingKeyPair[locale]);
      }

      return { blocklet, keyPair, user: { role, did: userDid } };
    },
  },

  utils: {
    checkAppOwner,
    checkUserRole,
  },
};
