const { createPassport, createPassportVC, createUserPassport } = require('@abtnode/auth/lib/passport');
const { ROLES, VC_TYPE_NODE_PASSPORT } = require('@abtnode/constant');
const formatContext = require('@abtnode/util/lib/format-context');
const { getPassportStatusEndpoint, canSessionBeElevated } = require('@abtnode/auth/lib/auth');
const { authenticateByNFT, getOwnershipNFTClaim } = require('@abtnode/auth/lib/server');
const getNodeWallet = require('@abtnode/util/lib/get-app-wallet');
const { getServerAvatarUrl } = require('@abtnode/util/lib/user');
const { messages } = require('@abtnode/auth/lib/auth');
const getRequestIP = require('@abtnode/util/lib/get-request-ip');
const { LOGIN_PROVIDER } = require('@blocklet/constant');
const { PASSPORT_SOURCE, PASSPORT_LOG_ACTION } = require('@abtnode/constant');

const logger = require('@abtnode/logger')(require('../../../package.json').name);
const { createToken } = require('../../libs/login');

const localMessages = {
  requestProfile: {
    en: 'This node has already been accepted, please login.',
    zh: '请提供节点所有者信息',
  },
  alreadyAccepted: {
    en: 'Already accepted, please login',
    zh: '已经接受过该节点，请登录。',
  },
};

const onAddNodeOwnerAuth = async ({
  action,
  req,
  node,
  baseUrl,
  claims,
  userDid,
  locale,
  challenge,
  userPk,
  updateSession,
}) => {
  // get profile
  const profile = claims.find(x => x.type === 'profile');
  if (!profile) {
    throw new Error(messages.missingProfileClaim[locale]);
  }

  const { teamDid, ownerDid, ownerNFT } = await authenticateByNFT({ node, claims, userDid, challenge, locale });

  const info = await node.getNodeInfo();

  const newOwnerInfo = { did: userDid, pk: userPk };

  const ownerNft = info.ownerNft || {};
  // 只有在 action 是 accept-server 时才需要更新 ownerNft
  if (action === 'accept-server') {
    // 更新 ownerNft holder
    ownerNft.holder = ownerDid;
  } else {
    // 添加新用户
    ownerNft.did = ownerNFT;
  }

  await node.updateNodeOwner({ nodeOwner: newOwnerInfo, ownerNft });

  logger.info('verify owner to node', { userDid });

  const passportVC = await createPassportVC({
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
      userDid,
      teamDid,
    }),
    types: [VC_TYPE_NODE_PASSPORT],
    tag: info.did,
    ownerProfile: profile,
    preferredColor: 'default',
  });

  const role = ROLES.OWNER;
  const passport = createUserPassport(passportVC, { role, source: PASSPORT_SOURCE.ISSUE });

  // Add owner as approved member
  const doc = await node.loginUser({
    teamDid,
    user: {
      ...profile,
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
      args: { teamDid, userDid, reason: 'claim server with server nft' },
      context: formatContext(Object.assign(req, { user: doc })),
      result: doc,
    },
    node
  );

  if (passport) {
    await node.createPassportLog(
      teamDid,
      {
        passportId: passport.id,
        action: PASSPORT_LOG_ACTION.ISSUE,
        operatorDid: userDid,
        metadata: {
          action,
          context: formatContext(Object.assign(req, { user: doc })),
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

  // Issue owner passport
  return {
    disposition: 'attachment',
    type: 'VerifiableCredential',
    data: passportVC,
  };
};

const getAssetProfile =
  node =>
  ({ extraParams: { locale } }) => {
    return getOwnershipNFTClaim(node, locale);
  };

const getProfileClaim = locale => {
  return {
    fields: ['fullName', 'email', 'avatar'],
    description: localMessages.requestProfile[locale],
  };
};

module.exports = { getAssetProfile, getProfileClaim, onAddNodeOwnerAuth };
