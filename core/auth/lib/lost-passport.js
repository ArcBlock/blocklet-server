const path = require('path');
const { joinURL } = require('ufo');
const uniq = require('lodash/uniq');
const get = require('lodash/get');
const isFunction = require('lodash/isFunction');
const isEmpty = require('lodash/isEmpty');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const formatContext = require('@abtnode/util/lib/format-context');
const getRandomMessage = require('@abtnode/util/lib/get-random-message');
const getNodeWallet = require('@abtnode/util/lib/get-app-wallet');
const { CustomError } = require('@blocklet/error');
const getOrigin = require('@abtnode/util/lib/get-origin');
const { getActivePassports } = require('@abtnode/util/lib/passport');
const { getDisplayName, getBlockletAppIdList } = require('@blocklet/meta/lib/util');
const {
  NODE_DATA_DIR_NAME,
  VC_TYPE_GENERAL_PASSPORT,
  VC_TYPE_NODE_PASSPORT,
  PASSPORT_SOURCE,
  PASSPORT_LOG_ACTION,
  PASSPORT_ISSUE_ACTION,
  USER_SESSION_STATUS,
} = require('@abtnode/constant');
const { getUserAvatarUrl, getAppAvatarUrl, getServerAvatarUrl, extractUserAvatar } = require('@abtnode/util/lib/user');
const getRequestIP = require('@abtnode/util/lib/get-request-ip');
const { getWalletDid } = require('@blocklet/meta/lib/did-utils');
const { Hasher } = require('@ocap/mcrypto');
const { getSourceAppPid, getLoginProvider } = require('@blocklet/sdk/lib/util/login');
const isArray = require('lodash/isArray');
const { getDeviceData } = require('@abtnode/util/lib/device');

const { getAccessWallet } = require('@abtnode/util/lib/blocklet');
const { sign } = require('@blocklet/sdk/lib/util/csrf');
const {
  getFederatedMaster,
  shouldSyncFederated,
  getUserAvatarUrl: getUserAvatarUrlForFederated,
} = require('./util/federated');

const logger = require('./logger');
const { messages, getUser, checkWalletVersion, getPassportStatusEndpoint, canSessionBeElevated } = require('./auth');
const {
  createPassport,
  createPassportVC,
  upsertToPassports,
  createUserPassport,
  getRoleFromLocalPassport,
  createKycVC,
} = require('./passport');
const verifySignature = require('./util/verify-signature');

const createPassportSvg = require('./util/create-passport-svg');
const { getDidConnectVersion } = require('./util/connect');

const TEAM_TYPES = {
  BLOCKLET: 'blocklet',
  NODE: 'node',
};

const getApplicationInfo = async ({ type, node, req, baseUrl = '' }) => {
  let teamDid;
  let issuerDid;
  let issuerDidList;
  let issuerName;
  let issuerWallet;
  let passportColor;
  let dataDir;
  let issuerLogo;

  const info = await node.getNodeInfo();
  if (type === TEAM_TYPES.NODE) {
    teamDid = info.did;
    issuerDid = info.did;
    issuerDidList = [info.did];
    issuerName = info.name;
    issuerWallet = getNodeWallet(info.sk);
    passportColor = 'default';
    dataDir = path.join(node.dataDirs.data, NODE_DATA_DIR_NAME);
    issuerLogo = getServerAvatarUrl(baseUrl, info);
  } else if (TEAM_TYPES.BLOCKLET) {
    teamDid = req.get('x-blocklet-did');
    const blocklet = await node.getBlocklet({ did: teamDid });
    const blockletInfo = getBlockletInfo(blocklet, info.sk);
    issuerDid = blockletInfo.wallet.address;
    issuerDidList = uniq([blockletInfo.wallet.address, ...getBlockletAppIdList(blocklet)]);
    issuerName = getDisplayName(blocklet);
    issuerWallet = blockletInfo.wallet;
    passportColor = blockletInfo.passportColor;
    dataDir = blocklet.env.dataDir;
    issuerLogo = getAppAvatarUrl(baseUrl);
  } else {
    throw new CustomError(400, 'createLostPassportListRoute: unknown type');
  }

  return {
    teamDid,
    issuerDid,
    issuerDidList,
    issuerName,
    issuerWallet,
    issuerLogo,
    passportColor,
    dataDir,
    info,
  };
};

const getStatusEndpointBaseUrl = (type, baseUrl, authServicePrefix) => {
  if (type === TEAM_TYPES.BLOCKLET) {
    return joinURL(baseUrl, authServicePrefix);
  }

  return baseUrl;
};

/**
 * Did Auth api for getting list of lost passport
 * @param {Enum} type node | blocklet
 */
const createLostPassportListRoute = ({ node, type }) => ({
  action: 'lost-passport-list',

  claims: {
    profile: ({ extraParams }) => {
      const { locale } = extraParams;
      return {
        fields: ['fullName'],
        description: messages.description[locale],
      };
    },
  },

  onAuth: async ({ userDid, extraParams, updateSession, req, baseUrl }) => {
    const { locale, scope = 'passport' } = extraParams;

    const { teamDid, issuerDidList, info, dataDir } = await getApplicationInfo({ node, req, type });

    // check user approved
    const user = await getUser(node, teamDid, userDid, { enableConnectedAccount: true });

    if (!user) {
      throw new CustomError(404, messages.userNotFound[locale]);
    }

    if (!user.approved) {
      throw new CustomError(403, messages.notAllowedAppUser[locale]);
    }

    const roles = await node.getRoles({ teamDid });
    const orgPassportList = roles.filter((x) => x.orgId).map((x) => x.name);
    const passportList = getActivePassports(user, issuerDidList);
    user.passportTypes = passportList.filter((x) => x.scope === scope && !orgPassportList.includes(x.name));
    if (!user.passportTypes.length) {
      throw new CustomError(404, messages.noPassportFound[locale]);
    }

    logger.info('get passport type list', { userDid: user.did, baseUrl });

    user.avatar = await extractUserAvatar(user.avatar, { dataDir });
    user.avatar = getUserAvatarUrl(baseUrl, user.avatar, info, info.did === teamDid);

    await updateSession({ user });
  },
});

/**
 * Did Auth api for issue lost passport
 * @param {Enum} type node | blocklet
 */
const createLostPassportIssueRoute = ({ node, type, authServicePrefix, createToken }) => ({
  action: 'lost-passport-issue',
  authPrincipal: false,
  claims: [
    {
      authPrincipal: async ({ extraParams }) => {
        // HACK: authPrincipal 中无法拿到 request 对象，只能由前端传来 teamDid
        const { receiverDid, teamDid } = extraParams;
        let walletDid = receiverDid;
        // 兼容不包含 teamDid 字段的情况
        if (teamDid) {
          const user = await getUser(node, teamDid, receiverDid, {
            enableConnectedAccount: true,
          });
          walletDid = getWalletDid(user);
        }
        return {
          description: 'Please select the required DID',
          target: walletDid,
        };
      },
    },
    {
      signature: async ({ extraParams, context: { baseUrl, request, didwallet } }) => {
        const { locale, passportId, receiverDid } = extraParams;
        checkWalletVersion({ didwallet, locale });

        const { teamDid, issuerDid, issuerName, issuerLogo, passportColor, info, dataDir } = await getApplicationInfo({
          node,
          req: request,
          type,
          baseUrl,
        });
        const user = await getUser(node, teamDid, receiverDid, { enableConnectedAccount: true });
        const oldPassport = await node.getPassportById({ teamDid, passportId });

        let { title } = oldPassport;
        if (oldPassport.scope === 'passport') {
          const result = await createPassport({ name: oldPassport.name, node, teamDid, locale });
          title = result.passport.title;
        }

        const avatar = await extractUserAvatar(user.avatar, { dataDir });

        return {
          description: messages.receivePassport[locale],
          data: getRandomMessage(),
          type: 'mime:text/plain',
          display: JSON.stringify(
            oldPassport.display || {
              type: 'svg',
              content: createPassportSvg({
                scope: oldPassport.scope,
                role: oldPassport.role,
                issuer: issuerName,
                title: oldPassport.scope === 'kyc' ? oldPassport.name : title,
                issuerDid,
                issuerAvatarUrl: issuerLogo,
                ownerDid: receiverDid,
                ownerName: user.fullName || '',
                ownerAvatarUrl: getUserAvatarUrl(baseUrl, avatar, info, info.did === teamDid),
                preferredColor: passportColor,
              }),
            }
          ),
        };
      },
    },
  ],

  onAuth: async ({ claims, userDid, userPk, extraParams, updateSession, baseUrl, req, request }) => {
    const { locale = 'en', receiverDid, passportId } = extraParams;

    const { teamDid, issuerDidList, issuerName, issuerLogo, issuerWallet, passportColor, info, dataDir } =
      await getApplicationInfo({ node, req, type, baseUrl });
    const oldPassport = await node.getPassportById({ teamDid, passportId });
    const statusEndpointBaseUrl = getStatusEndpointBaseUrl(type, baseUrl, authServicePrefix);
    const isService = teamDid && teamDid !== info.did;

    // Verify signature
    const claim = claims.find((x) => x.type === 'signature');
    verifySignature(claim, userDid, userPk, locale);

    // check user approved
    const currentUser = await getUser(node, teamDid, userDid, {
      enableConnectedAccount: true,
    });

    // 二次校验用户是否存在
    if (!currentUser) {
      throw new CustomError(404, messages.userNotFound[locale]);
    }
    if (!currentUser.approved) {
      throw new CustomError(403, messages.notAllowedAppUser[locale]);
    }

    const userPid = currentUser.did;

    // NOTICE: 实际测试过程中，receiverDid 是当前登录用户的永久 did，而 userDid 是 wallet did，所以需要经过转换才能比较
    if (receiverDid !== userPid) {
      // should not be here
      throw new CustomError(
        400,
        {
          en: 'userDid and receiverDid are not same',
          zh: 'userDid 和 receiverDid 不一致',
        }[locale]
      );
    }

    // check passport
    const exist = getActivePassports(currentUser, issuerDidList).find((x) => x.name === oldPassport.name);
    if (!exist) {
      // should not be here
      throw new CustomError(
        404,
        {
          en: 'Passport does not exist',
          zh: '通行证不存在',
        }[locale]
      );
    }

    const avatar = await extractUserAvatar(currentUser.avatar, { dataDir });

    let vc;
    let role;
    let passport;

    const source = PASSPORT_SOURCE.RECOVER;

    // @note: 如果通行证类型为空，或者为通用通行证，则认为是登录，但是这可能会导致恶意应用伪造 type 字段
    const purpose =
      isEmpty(exist.type) || (isArray(exist.type) && exist.type.includes(VC_TYPE_GENERAL_PASSPORT))
        ? 'login'
        : 'verification';
    if (oldPassport.scope === 'passport') {
      const vcParams = {
        issuerName,
        issuerWallet,
        issuerAvatarUrl: issuerLogo,
        // NOTICE: 通行证的 owner 必须是钱包用户的 did
        ownerDid: userDid,
        ...(await createPassport({
          name: oldPassport.name,
          node,
          teamDid,
          locale,
          endpoint: baseUrl,
        })),
        endpoint: getPassportStatusEndpoint({
          baseUrl: statusEndpointBaseUrl,
          // NOTICE: 通行证状态使用用户的 pid
          userDid: userPid,
          teamDid,
        }),
        types: exist.type || [],
        ownerProfile: { ...currentUser, avatar: getUserAvatarUrl(baseUrl, avatar, info, info.did === teamDid) },
        preferredColor: passportColor,
        display: oldPassport.display,
        purpose,
      };

      if (type === TEAM_TYPES.NODE) {
        vcParams.types = [VC_TYPE_NODE_PASSPORT];
        vcParams.tag = teamDid;
      }

      vc = await createPassportVC(vcParams);
      role = getRoleFromLocalPassport(get(vc, 'credentialSubject.passport'));
      passport = createUserPassport(vc, { role, display: oldPassport.display, source, parentDid: oldPassport.id });
    }
    if (oldPassport.scope === 'kyc') {
      vc = await createKycVC({
        issuerName,
        issuerWallet,
        issuerAvatarUrl: issuerLogo,
        ownerDid: userDid,
        kyc: {
          scope: oldPassport.role,
          subject: oldPassport.name,
          digest: Hasher.SHA3.hash256(oldPassport.name),
          specVersion: oldPassport.specVersion,
        },
        endpoint: getPassportStatusEndpoint({
          baseUrl: statusEndpointBaseUrl,
          userDid: userPid,
          teamDid,
        }),
        types: {
          email: ['VerifiedEmailCredential'],
          phone: ['VerifiedPhoneCredential'],
        }[oldPassport.role],
        ownerProfile: { ...currentUser, avatar: getUserAvatarUrl(baseUrl, avatar, info, info.did === teamDid) },
        preferredColor: passportColor,
        tag: Hasher.SHA3.hash256(oldPassport.name),
      });
      role = oldPassport.role;
      passport = createUserPassport(vc, { role, display: oldPassport.display, source, parentDid: oldPassport.id });
    }

    const result = await node.updateUser({
      teamDid,
      user: {
        did: userPid,
        pk: currentUser.pk,
        passports: upsertToPassports(currentUser.passports || [], passport),
      },
    });
    await node.createAuditLog(
      {
        action: 'updateUser',
        args: { teamDid, userDid: userPid, passport, reason: 'recovered passport' },
        context: formatContext(Object.assign(req, { user: currentUser })),
        result,
      },
      node
    );

    if (passport) {
      await node.createPassportLog(
        teamDid,
        {
          passportId: passport.id,
          action: PASSPORT_LOG_ACTION.RECOVER,
          operatorDid: userDid,
          metadata: {
            action: PASSPORT_ISSUE_ACTION.ISSUE_ON_RECOVER,
          },
        },
        req
      );
    }

    if (oldPassport.scope === 'passport' && purpose === 'login' && isFunction(createToken)) {
      if (type === TEAM_TYPES.BLOCKLET) {
        const lastLoginIp = getRequestIP(request);
        const deviceData = getDeviceData({ req: request });
        const ua = request.get('user-agent');
        const walletOS = request.context.didwallet.os;
        const sourceAppPid = getSourceAppPid(request);
        const provider = getLoginProvider(request);

        const connectAccount = { provider, did: userDid, pk: userPk };

        const updatedUser = await node.loginUser({
          teamDid,
          user: {
            did: currentUser.did,
            pk: currentUser.pk,
            locale,
            passport,
            sourceAppPid,
            lastLoginIp,
            connectedAccount: [connectAccount],
          },
        });

        const blocklet = await request.getBlocklet();
        const sessionConfig = blocklet.settings?.session || {};
        const { secret } = await request.getBlockletInfo();
        const userSessionDoc = await node.upsertUserSession({
          teamDid,
          visitorId: extraParams?.visitorId,
          userDid: userPid,
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

        if (shouldSyncFederated(blocklet, sourceAppPid)) {
          const masterSite = getFederatedMaster(blocklet);
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
                  avatar: getUserAvatarUrlForFederated(updatedUser.avatar, blocklet),
                  connectedAccount: [connectAccount],
                  sourceAppPid: sourceAppPid || masterSite.appPid,
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

        const { sessionToken, refreshToken } = await createToken(
          userPid,
          {
            secret,
            passport,
            role,
            fullName: currentUser.fullName,
            provider,
            // request.context.store.connectedWallet
            walletOS,
            elevated: canSessionBeElevated(role, blocklet?.settings),
            emailVerified: !!updatedUser.emailVerified,
            phoneVerified: !!updatedUser.phoneVerified,
          },
          { ...sessionConfig, didConnectVersion: getDidConnectVersion(req) }
        );

        const _result = { sessionToken, refreshToken };
        if (isService) {
          const nodeInfo = await node.getNodeInfo();
          const accessWallet = getAccessWallet({
            blockletAppDid: blocklet.appDid || blocklet.meta.did,
            serverSecretKey: nodeInfo.sk,
          });
          _result.csrfToken = sign(accessWallet.secretKey, sessionToken);
        }
        await updateSession(_result, true);
      } else if (type === TEAM_TYPES.NODE) {
        const { sessionToken, refreshToken } = await createToken(userPid, {
          passport,
          role,
          elevated: canSessionBeElevated(role, info),
        });

        const _result = { sessionToken, refreshToken };
        if (isService) {
          const blocklet = await request.getBlocklet();
          const nodeInfo = await node.getNodeInfo();
          const accessWallet = getAccessWallet({
            blockletAppDid: blocklet.appDid || blocklet.meta.did,
            serverSecretKey: nodeInfo.sk,
          });
          _result.csrfToken = sign(accessWallet.secretKey, sessionToken);
        }

        await updateSession(_result, true);
      }
    }

    await updateSession({ passportId: vc.id });

    return {
      disposition: 'attachment',
      type: 'VerifiableCredential',
      data: vc,
    };
  },
});

module.exports = {
  createLostPassportListRoute,
  createLostPassportIssueRoute,
  TEAM_TYPES,
};
