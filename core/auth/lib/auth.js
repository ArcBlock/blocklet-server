const path = require('path');
const jwt = require('jsonwebtoken');
const semver = require('semver');
const { joinURL, withQuery } = require('ufo');
const get = require('lodash/get');
const isEmpty = require('lodash/isEmpty');
const { verifyPresentation, createCredentialList } = require('@arcblock/vc');
const { encode: encodeBase32 } = require('@abtnode/util/lib/base32');
const formatContext = require('@abtnode/util/lib/format-context');
const getNodeWallet = require('@abtnode/util/lib/get-app-wallet');
const { CustomError } = require('@blocklet/error');
const { getChainClient } = require('@abtnode/util/lib/get-chain-client');
const { fromPublicKey } = require('@ocap/wallet');
const { fromBase58, toAddress } = require('@ocap/util');
const { toTypeInfo, isFromPublicKey } = require('@arcblock/did');
const { getRandomBytes } = require('@ocap/mcrypto');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const {
  PASSPORT_STATUS,
  VC_TYPE_NODE_PASSPORT,
  ROLES,
  NODE_DATA_DIR_NAME,
  AUTH_CERT_TYPE,
  WELLKNOWN_BLOCKLET_ADMIN_PATH,
  SERVER_ROLES,
  DEFAULT_DID_DOMAIN,
  PASSPORT_SOURCE,
  PASSPORT_LOG_ACTION,
  PASSPORT_ISSUE_ACTION,
} = require('@abtnode/constant');
const axios = require('@abtnode/util/lib/axios');
const getRequestIP = require('@abtnode/util/lib/get-request-ip');
const { extractUserAvatar, getUserAvatarUrl, getAppAvatarUrl, getServerAvatarUrl } = require('@abtnode/util/lib/user');
const { LOGIN_PROVIDER } = require('@blocklet/constant');
const dayjs = require('@abtnode/util/lib/dayjs');

const { omit } = require('lodash');
const { getAccessWallet } = require('@abtnode/util/lib/blocklet');
const logger = require('./logger');
const verifySignature = require('./util/verify-signature');
const { getEmailServiceProvider } = require('./email');
const { getLocaleMap } = require('../locales');
const {
  createPassport,
  createPassportVC,
  upsertToPassports,
  createUserPassport,
  getRoleFromLocalPassport,
  createKycVC,
} = require('./passport');

const createPassportSvg = require('./util/create-passport-svg');

const messages = {
  description: getLocaleMap('description'),
  requestProfile: getLocaleMap('requestProfile'),
  requestDidSpace: getLocaleMap('requestDidSpace'),
  requestNFT: getLocaleMap('requestNFT'),
  requestCredential: getLocaleMap('requestCredential'),
  requestPassport: getLocaleMap('requestPassport'),
  requestOwnerPassport: getLocaleMap('requestOwnerPassport'),
  requestBlockletNft: getLocaleMap('requestBlockletNft'),
  receivePassport: getLocaleMap('receivePassport'),
  requestEmailKyc: getLocaleMap('requestEmailKyc'),
  requestPhoneKyc: getLocaleMap('requestPhoneKyc'),
  receiveEmailKyc: getLocaleMap('receiveEmailKyc'),
  receivePhoneKyc: getLocaleMap('receivePhoneKyc'),

  // error
  actionForbidden: getLocaleMap('actionForbidden'),
  notAllowedToSwitchProfile: getLocaleMap('notAllowedToSwitchProfile'),
  passportNotBelongToYou: getLocaleMap('passportNotBelongToYou'),
  noTrustedFactories: getLocaleMap('noTrustedFactories'),
  failedToDestroyUser: getLocaleMap('failedToDestroyUser'),
  passportHasBeenRevoked: getLocaleMap('passportHasBeenRevoked'),
  onlyOwnerCanPerformThisAction: getLocaleMap('onlyOwnerCanPerformThisAction'),
  notRequiredVerifcation: getLocaleMap('notRequiredVerifcation'),

  notInitialized: getLocaleMap('notInitialized'),
  appNotInitialized: getLocaleMap('appNotInitialized'),
  alreadyInitiated: getLocaleMap('alreadyInitiated'),
  notAllowed: getLocaleMap('notAllowed'),
  notInvited: getLocaleMap('notInvited'),
  notEnabled: getLocaleMap('notEnabled'),
  notAppOwner: getLocaleMap('notAppOwner'),
  notSupported: getLocaleMap('notSupported'),
  notAllowedAppUser: getLocaleMap('notAllowedAppUser'),
  noKycRequired: getLocaleMap('noKycRequired'),
  noPassportFound: getLocaleMap('noPassportFound'),
  missingPassport: getLocaleMap('missingPassport'),
  missingEmailKyc: getLocaleMap('missingEmailKyc'),
  missingPhoneKyc: getLocaleMap('missingPhoneKyc'),
  missingChallenge: getLocaleMap('missingChallenge'),
  emailMismatch: getLocaleMap('emailMismatch'),
  emailBlocked: getLocaleMap('emailBlocked'),
  phoneMismatch: getLocaleMap('phoneMismatch'),
  emailAlreadyUsed: getLocaleMap('emailAlreadyUsed'),
  phoneAlreadyUsed: getLocaleMap('phoneAlreadyUsed'),
  invalidCredentialHolder: getLocaleMap('invalidCredentialHolder'),
  invalidCredentialProof: getLocaleMap('invalidCredentialProof'),
  notOwner: getLocaleMap('notOwner'),
  userMismatch: getLocaleMap('userMismatch'),
  lowVersion: getLocaleMap('lowVersion'),

  unKnownStatus: getLocaleMap('unKnownStatus'),
  statusNotFound: getLocaleMap('statusNotFound'),
  statusLabel: getLocaleMap('statusLabel'),
  passportNotFound: getLocaleMap('passportNotFound'),
  passportExpired: getLocaleMap('passportExpired'),
  userNotFound: getLocaleMap('userNotFound'),
  notAuthorized: getLocaleMap('notAuthorized'),
  invalidParams: getLocaleMap('invalidParams'),
  missingKeyPair: getLocaleMap('missingKeyPair'),
  missingBlockletUrl: getLocaleMap('missingBlockletUrl'),
  missingBlockletDid: getLocaleMap('missingBlockletDid'),
  missingChainHost: getLocaleMap('missingChainHost'),
  missingLauncherSession: getLocaleMap('missingLauncherSession'),
  invalidBlocklet: getLocaleMap('invalidBlocklet'),
  blockletExists: getLocaleMap('blockletExists'),
  invalidBlockletVc: getLocaleMap('invalidBlockletVc'),
  invalidAppVersion: getLocaleMap('invalidAppVersion'),

  // NFT related
  missingProfileClaim: getLocaleMap('missingProfileClaim'),
  invalidNftClaim: getLocaleMap('invalidNftClaim'),
  invalidNft: getLocaleMap('invalidNft'),
  invalidNftHolder: getLocaleMap('invalidNftHolder'),
  invalidNftProof: getLocaleMap('invalidNftProof'),
  invalidNftIssuer: getLocaleMap('invalidNftIssuer'),
  invalidNftParent: getLocaleMap('invalidNftParent'),
  tagNotMatch: getLocaleMap('tagNotMatch'),
  requestBlockletSpaceNFT: getLocaleMap('requestBlockletSpaceNFT'),
  blockletSpaceNftIdRequired: getLocaleMap('blockletSpaceNftIdRequired'),
  nftAlreadyConsumed: getLocaleMap('nftAlreadyConsumed'),
  sessionAlreadyConsumed: getLocaleMap('sessionAlreadyConsumed'),
  nftAlreadyExpired: getLocaleMap('nftAlreadyExpired'),
  nftAlreadyUsed: getLocaleMap('nftAlreadyUsed'),
  missingNftClaim: getLocaleMap('missingNftClaim'),
  noNft: getLocaleMap('noNft'),
  noLauncherDid: getLocaleMap('noLauncherDid'),
  noNftDid: getLocaleMap('noNftDid'),
  noChainHost: getLocaleMap('noChainHost'),
  alreadyTransferred: getLocaleMap('alreadyTransferred'),
  delegateTransferOwnerNFT: getLocaleMap('delegateTransferOwnerNFT'),
  notAllowedTransferToSelf: getLocaleMap('notAllowedTransferToSelf'),
  tagRequired: getLocaleMap('tagRequired'),
  appIsInProgress: getLocaleMap('appIsInProgress'),
  // 以后新增的文本尽量使用 `hello {name}` 的模版方式, 而不是函数
  invalidCredentialType: {
    ar: (types) => `نوع الاعتماد غير صالح ، يتوقع ${types.join(' أو ')}`,
    de: (types) => `Ungültiger Anmeldeinformationstyp, erwarte ${types.join(' oder ')}`,
    es: (types) => `Tipo de credencial no válido, espera ${types.join(' o ')}`,
    en: (types) => `Invalid credential type, expect ${types.join(' or ')}`,
    fr: (types) => `Type de justificatif invalide, attendre ${types.join(' ou ')}`,
    hi: (types) => `अमान्य प्रमाणीकरण प्रकार, ${types.join(' या ')}`,
    id: (types) => `Jenis kredensial tidak valid, harap ${types.join(' atau ')}`,
    ja: (types) => `無効な資格情報タイプ、${types.join(' または ')}`,
    ko: (types) => `잘못된 자격 증명 유형, ${types.join(' 또는 ')}`,
    pt: (types) => `Tipo de credencial inválido, espera ${types.join(' ou ')}`,
    ru: (types) => `Неверный тип учетных данных, ожидается ${types.join(' или ')}`,
    th: (types) => `ประเภทข้อมูลประจำตัวไม่ถูกต้อง ต้องการ ${types.join(' หรือ ')}`,
    vi: (types) => `Loại chứng chỉ không hợp lệ, mong đợi ${types.join(' hoặc ')}`,
    zh: (types) => `无效的凭证类型，必须是 ${types.join(' 或 ')}`,
    'zh-TW': (types) => `無效的憑證類型，必須是 ${types.join(' 或 ')}`,
  },
  invalidCredentialId: {
    ar: (ids) => `المعرف غير صالح: ${[].concat(ids).join(' أو ')}`,
    de: (ids) => `Ungültige ID: ${[].concat(ids).join(' oder ')}`,
    en: (ids) => `Invalid credential type, expect ${[].concat(ids).join(' or ')}`,
    es: (ids) => `ID no válida: ${[].concat(ids).join(' o ')}`,
    fr: (ids) => `ID non valide: ${[].concat(ids).join(' ou ')}`,
    hi: (ids) => `अमान्य परिचय: ${[].concat(ids).join(' या ')}`,
    id: (ids) => `ID tidak valid: ${[].concat(ids).join(' atau ')}`,
    ja: (ids) => `無効なID：${[].concat(ids).join('または')}`,
    ko: (ids) => `잘못된 ID: ${[].concat(ids).join(' 또는 ')}`,
    pt: (ids) => `ID inválido: ${[].concat(ids).join(' ou ')}`,
    ru: (ids) => `Неверный идентификатор: ${[].concat(ids).join(' или ')}`,
    th: (ids) => `รหัสไม่ถูกต้อง: ${[].concat(ids).join(' หรือ ')}`,
    vi: (ids) => `ID không hợp lệ: ${[].concat(ids).join(' hoặc ')}`,
    zh: (ids) => `无效的凭证，ID 必须是 ${[].concat(ids).join(' 或 ')}`,
    'zh-TW': (ids) => `無效的憑證，ID 必須是 ${[].concat(ids).join(' 或 ')}`,
  },
  passportRevoked: {
    ar: (title, issuer) => `تم إلغاء جواز السفر ${title} من قبل ${issuer ? ' ' : ''}${issuer || ''}`,
    de: (title, issuer) => `Pass ${title} wurde von ${issuer ? ' ' : ''}${issuer || ''} widerrufen`,
    es: (title, issuer) => `Pasaporte ${title} ha sido revocado por ${issuer ? ' ' : ''}${issuer || ''}`,
    en: (title, issuer) => `Passport ${title} has been revoked${issuer ? ' by ' : ''}${issuer || ''}`,
    fr: (title, issuer) => `Le passeport ${title} a été révoqué par ${issuer ? ' ' : ''}${issuer || ''}`,
    hi: (title, issuer) => `पासपोर्ट ${title} को ${issuer ? ' ' : ''}${issuer || ''} द्वारा रद्द कर दिया गया है`,
    id: (title, issuer) => `Paspor ${title} telah dicabut oleh ${issuer ? ' ' : ''}${issuer || ''}`,
    ja: (title, issuer) => `パスポート ${title} は ${issuer ? ' ' : ''}${issuer || ''} によって取り消されました`,
    ko: (title, issuer) => `여권 ${title} 은 ${issuer ? ' ' : ''}${issuer || ''} 에 의해 취소되었습니다`,
    pt: (title, issuer) => `O passaporte ${title} foi revogado por ${issuer ? ' ' : ''}${issuer || ''}`,
    ru: (title, issuer) => `Паспорт ${title} был отозван ${issuer ? ' ' : ''}${issuer || ''}`,
    th: (title, issuer) => `หนังสือเดินทาง ${title} ถูกยกเลิกโดย ${issuer ? ' ' : ''}${issuer || ''}`,
    vi: (title, issuer) => `Hộ chiếu ${title} đã bị thu hồi bởi ${issuer ? ' ' : ''}${issuer || ''}`,
    zh: (title, issuer) => `通行证 ${title} 已被${issuer ? ' ' : ''}${issuer || ''}${issuer ? ' ' : ''}吊销`,
    'zh-TW': (title, issuer) => `通行證 ${title} 已被${issuer ? ' ' : ''}${issuer || ''}${issuer ? ' ' : ''}吊銷`,
  },
  passportStatusCheckFailed: {
    ar: (message) => `فشلت عملية التحقق من حالة جواز السفر: ${message}`,
    de: (message) => `Passport-Statusprüfung fehlgeschlagen: ${message}`,
    es: (message) => `Error al verificar el estado del pasaporte: ${message}`,
    en: (message) => `Passport status check failed: ${message}`,
    fr: (message) => `Échec de la vérification du statut du passeport: ${message}`,
    hi: (message) => `पासपोर्ट स्थिति जांच विफल: ${message}`,
    id: (message) => `Pemeriksaan status paspor gagal: ${message}`,
    ja: (message) => `パスポートのステータスチェックに失敗しました：${message}`,
    ko: (message) => `여권 상태 확인 실패 : ${message}`,
    pt: (message) => `Falha na verificação do status do passaporte: ${message}`,
    ru: (message) => `Ошибка проверки статуса паспорта: ${message}`,
    th: (message) => `การตรวจสอบสถานะหนังสือเดินทางล้มเหลว: ${message}`,
    vi: (message) => `Kiểm tra trạng thái hộ chiếu không thành công: ${message}`,
    zh: (message) => `通行证状态检测失败：${message}`,
    'zh-TW': (message) => `通行證狀態檢測失敗：${message}`,
  },
  /**
   *
   * @param {Parameters<typeof getLocaleMap>[1]} data
   * @returns
   */
  cannotImportFromDidSpace: (data) => getLocaleMap('cannotImportFromDidSpace', data),

  destroySelf: (data) => getLocaleMap('destroyMyself', data),
  userNotExist: (data) => getLocaleMap('userNotExist', data),
  notAllowedToDelete: (data) => getLocaleMap('notAllowedToDelete', data),
  notAllowedToDeleteOwner: (data) => getLocaleMap('notAllowedToDeleteOwner', data),
  passportNotAllowedToUse: (data) => getLocaleMap('passportNotAllowedToUse', data),
};

const PASSPORT_STATUS_KEY = 'passport-status';

const TEAM_TYPE = {
  NODE: 'node',
  BLOCKLET: 'blocklet',
};

const getPassportStatusEndpoint = ({ baseUrl, userDid, teamDid }) => {
  if (!baseUrl) {
    return null;
  }

  return withQuery(joinURL(baseUrl, '/api/passport/status'), {
    userDid,
    teamDid,
  });
};

const getRandomMessage = (len = 16) => {
  const hex = getRandomBytes(len);
  return hex.replace(/^0x/, '').toUpperCase();
};

const getApplicationInfo = async ({ node, nodeInfo = {}, teamDid, baseUrl = '' }) => {
  let type;
  let name;
  let wallet;
  let permanentWallet;
  let description;
  let passportColor;
  let owner;
  let dataDir;
  let secret;
  let logo;
  let appUrl;
  let accessWallet;

  if (teamDid === nodeInfo.did) {
    name = nodeInfo.name;
    description = nodeInfo.description;
    const _wallet = getNodeWallet(nodeInfo.sk);
    wallet = _wallet;
    permanentWallet = _wallet;
    type = TEAM_TYPE.NODE;
    passportColor = 'default';
    owner = nodeInfo.nodeOwner;
    dataDir = path.join(node.dataDirs.data, NODE_DATA_DIR_NAME);
    secret = await node.getSessionSecret();
    logo = getServerAvatarUrl(baseUrl, nodeInfo);
    appUrl = `https://${encodeBase32(teamDid)}.${DEFAULT_DID_DOMAIN}`;
  } else {
    const blocklet = await node.getBlocklet({ did: teamDid, useCache: true });
    const blockletInfo = getBlockletInfo(blocklet, nodeInfo.sk);
    name = blockletInfo.name;
    description = blockletInfo.description;
    wallet = blockletInfo.wallet;
    permanentWallet = blockletInfo.permanentWallet;
    passportColor = blockletInfo.passportColor;
    type = TEAM_TYPE.BLOCKLET;
    owner = get(blocklet, 'settings.owner');
    dataDir = blocklet.env.dataDir;
    secret = blockletInfo.secret;
    logo = getAppAvatarUrl(baseUrl || blockletInfo.appUrl);
    appUrl = blockletInfo.appUrl;
    accessWallet = getAccessWallet({
      serverSecretKey: nodeInfo.sk,
      blockletAppDid: blocklet.appDid || blocklet.meta.did,
    });
  }

  return {
    type,
    name,
    description,
    wallet,
    permanentWallet,
    passportColor,
    owner,
    dataDir,
    secret,
    logo,
    appUrl,
    accessWallet,
  };
};

const canSessionBeElevated = (role, info) => {
  if (!info.enableSessionHardening) {
    return false;
  }

  return [
    SERVER_ROLES.OWNER,
    SERVER_ROLES.ADMIN,
    SERVER_ROLES.MEMBER,
    SERVER_ROLES.CI,
    SERVER_ROLES.BLOCKLET_OWNER,
    SERVER_ROLES.BLOCKLET_ADMIN,
    SERVER_ROLES.BLOCKLET_MEMBER,
    SERVER_ROLES.BLOCKLET_SDK,
  ].includes(role);
};

const createAuthToken = ({
  did,
  passport,
  role,
  secret,
  expiresIn,
  fullName,
  tokenType,
  provider = LOGIN_PROVIDER.WALLET,
  walletOS,
  kyc = 0,
  elevated = false,
  oauth = null,
  org = '',
} = {}) => {
  const payload = {
    type: 'user',
    did,
    role,
    provider,
    kyc,
    elevated,
  };
  if (walletOS) {
    payload.walletOS = walletOS;
  }

  if (passport) {
    const { id } = passport;
    payload.passport = {
      id,
    };
  }

  if (tokenType) {
    payload.tokenType = tokenType;
  }

  if (fullName) {
    payload.fullName = fullName;
  }

  if (oauth) {
    payload.oauth = oauth;
  }

  if (org) {
    payload.org = org;
  }

  const token = jwt.sign(payload, secret, { expiresIn });
  return token;
};

const createBlockletControllerAuthToken = ({ did, role, controller, secret, expiresIn, fullName } = {}) => {
  const payload = {
    type: AUTH_CERT_TYPE.BLOCKLET_CONTROLLER,
    did,
    role,
    controller,
  };
  if (fullName) {
    payload.fullName = fullName;
  }

  return jwt.sign(payload, secret, { expiresIn });
};

const createAuthTokenByOwnershipNFT = ({ did, role, secret, expiresIn, fullName } = {}) => {
  const payload = {
    type: AUTH_CERT_TYPE.OWNERSHIP_NFT,
    did,
    role,
    elevated: true,
  };
  if (fullName) {
    payload.fullName = fullName;
  }

  return jwt.sign(payload, secret, { expiresIn });
};

const getUser = async (node, teamDid, userDid, options = {}) => {
  const user = await node.getUser({ teamDid, user: { did: userDid }, options });
  return user;
};

const beforeInvitationRequest = async ({ node, teamDid, inviteId, locale = 'en' }) => {
  await node.checkInvitation({ teamDid, inviteId });

  const count = await node.getUsersCount({ teamDid });
  if (count === 0) {
    throw new CustomError(
      403,
      {
        en: 'The Application has no owner attached',
        zh: '应用未绑定所有者',
      }[locale]
    );
  }
};

const createInvitationRequest = async ({ node, nodeInfo, teamDid, inviteId, baseUrl, locale = 'en', orgId = '' }) => {
  // verify invite id
  await node.checkInvitation({ teamDid, inviteId });
  const inviteInfo = await node.getInvitation({ teamDid, inviteId });

  const {
    name: issuerName,
    wallet: issuerWallet,
    passportColor,
    logo,
  } = await getApplicationInfo({ node, nodeInfo, teamDid, baseUrl });

  const result = await createPassport({ name: inviteInfo.role, node, teamDid, locale, orgId });

  return {
    description: messages.receivePassport[locale],
    data: getRandomMessage(),
    type: 'mime:text/plain',
    display: JSON.stringify(
      inviteInfo.display
        ? inviteInfo.display
        : {
            type: 'svg',
            content: createPassportSvg({
              scope: 'passport',
              role: inviteInfo.role,
              issuer: issuerName,
              title: result.passport.title,
              issuerDid: issuerWallet.address,
              issuerAvatarUrl: logo,
              ownerName: 'Your Name',
              ownerDid: teamDid,
              preferredColor: passportColor,
              extra: inviteInfo?.passportExpireTime
                ? {
                    key: 'Exp',
                    value: dayjs(inviteInfo.passportExpireTime).format('YYYY-MM-DD HH:mm:ss'),
                  }
                : null,
            }),
          }
    ),
  };
};

const handleInvitationReceive = async ({
  node,
  req,
  nodeInfo,
  locale = 'en',
  teamDid,
  inviteId,
  userDid,
  userPk,
  statusEndpointBaseUrl,
  endpoint,
  profile,
  provider = LOGIN_PROVIDER.WALLET,
  newNftOwner = '',
  kycUpdates = {},
  connectedAccountUpdates = {},
  source = PASSPORT_SOURCE.INVITE,
}) => {
  if (!nodeInfo.nodeOwner) {
    throw new CustomError(403, messages.notInitialized[locale]);
  }
  await node.checkInvitation({ teamDid, inviteId });

  const inviteInfo = await node.getInvitation({ teamDid, inviteId });
  if (inviteInfo.role === 'owner') {
    // 禁止将 owner 转移给自己的逻辑
    if (userDid === nodeInfo.nodeOwner.did) {
      throw new CustomError(403, messages.notAllowedTransferToSelf[locale]);
    }

    if (get(nodeInfo, 'ownerNft.holder')) {
      // 这种情况下是 Transfer 有 Owner NFT 的 Blocklet Server
      const client = getChainClient(nodeInfo.launcher.chainHost);
      const ownerNftDid = get(nodeInfo, 'ownerNft.did');

      const { state: assetState } = await client.getAssetState({ address: ownerNftDid });
      if (assetState.owner !== newNftOwner) {
        const hash = await client.transfer({
          delegator: get(nodeInfo, 'ownerNft.holder'),
          to: newNftOwner,
          assets: [ownerNftDid],
          wallet: getNodeWallet(nodeInfo.sk),
        });

        logger.info('transferred nft', { hash, nft: ownerNftDid });
        await node.updateNftHolder(newNftOwner);
        logger.info('updated owner nft holder', { holder: newNftOwner, nft: ownerNftDid });
      }
    }
  }

  const {
    name: issuerName,
    wallet: issuerWallet,
    type: issuerType,
    passportColor,
    dataDir,
    logo,
  } = await getApplicationInfo({ node, nodeInfo, teamDid, baseUrl: endpoint });

  const user = await getUser(node, teamDid, userDid, {
    enableConnectedAccount: true,
  });

  const { orgId = '', inviteUserDids = [] } = inviteInfo || {};
  const isOrgInvite = !!orgId;
  if (isOrgInvite && !user) {
    throw new CustomError(403, 'Please log in with your account to accept this organization invitation.');
  }
  // 邀请内部成员时，接收者必须在邀请列表中
  if (orgId && inviteUserDids.length > 0 && !inviteUserDids.includes(userDid)) {
    // 接收者不在邀请列表中，不允许接收通行证
    throw new CustomError(403, 'You are not invited to this org');
  }

  const result = await createPassport({ name: inviteInfo.role, node, teamDid, locale, endpoint });
  let purpose = teamDid === nodeInfo.did || isEmpty(result.types) ? 'login' : 'verification';
  if (isOrgInvite) {
    purpose = 'accept-invitation';
  }

  const vcParams = {
    issuerName,
    issuerWallet,
    issuerAvatarUrl: logo,
    // NOTICE: 通行证的 owner 必须是钱包用户的 did
    ownerDid: userDid,
    display: inviteInfo.display,
    endpoint: getPassportStatusEndpoint({
      baseUrl: statusEndpointBaseUrl,
      // NOTICE: 通行证状态使用用户的 pid
      userDid: user?.did || userDid,
      teamDid,
    }),
    passport: result.passport,
    types: teamDid === nodeInfo.did ? [VC_TYPE_NODE_PASSPORT] : result.types,
    purpose,
    ownerProfile: profile,
    preferredColor: passportColor,
  };

  if (issuerType === TEAM_TYPE.NODE) {
    vcParams.tag = nodeInfo.did;
  }

  if (inviteInfo?.passportExpireTime) {
    vcParams.expirationDate = inviteInfo.passportExpireTime;
  }

  const vc = await createPassportVC(vcParams);
  let role = getRoleFromLocalPassport(get(vc, 'credentialSubject.passport'));
  const passport = createUserPassport(vc, { role, display: inviteInfo.display, source });

  // NOTICE: owner 目前必须是 did-wallet 的账户，暂不做额外 did 判断
  if (role === 'owner') {
    if (issuerType === TEAM_TYPE.blocklet) {
      // should not be here
      throw new CustomError(403, 'not allowed to transfer application ownership');
    }

    if (userDid === nodeInfo.nodeOwner.did) {
      throw new CustomError(403, messages.alreadyTransferred[locale](userDid));
    }

    await node.updateNodeOwner({ nodeOwner: { did: userDid, pk: userPk } });

    // NOTICE: 这里理论上不需要查询 connectedAccount (owner 必须是 did-wallet 的账户)，加上后也不影响
    const originalOwner = await getUser(node, teamDid, nodeInfo.nodeOwner.did, {
      enableConnectedAccount: true,
    });
    const originalOwnerPassport = (originalOwner.passports || []).find((p) => p.role === 'owner');
    if (originalOwnerPassport) {
      await node.revokeUserPassport({ teamDid, userDid: nodeInfo.nodeOwner.did, passportId: originalOwnerPassport.id });
      logger.info('passport revoked on server transfer claiming', {
        teamDid,
        userDid: nodeInfo.nodeOwner.did,
        passportId: originalOwnerPassport.id,
      });
    }
  }

  const avatar = await extractUserAvatar(get(profile, 'avatar'), {
    dataDir,
  });

  let doc;

  if (!isOrgInvite) {
    if (user) {
      doc = await node.loginUser({
        teamDid,
        user: {
          ...profile,
          ...kycUpdates,
          avatar,
          did: user.did,
          pk: user.pk,
          locale,
          passport,
          lastLoginIp: getRequestIP(req),
          remark: inviteInfo.remark,
          inviter: inviteInfo.inviter?.did,
          connectedAccount: {
            ...connectedAccountUpdates,
            provider,
            did: userDid,
            pk: userPk,
          },
        },
      });
      await node.createAuditLog(
        {
          action: 'updateUser',
          args: { teamDid, userDid: user.did, passport, inviteId, reason: 'accepted invitation' },
          context: formatContext(Object.assign(req, { user })),
          result: doc,
        },
        node
      );
    } else {
      doc = await node.loginUser({
        teamDid,
        user: {
          ...profile,
          ...kycUpdates,
          avatar,
          did: userDid,
          pk: userPk,
          locale,
          passport,
          lastLoginIp: getRequestIP(req),
          inviter: inviteInfo.inviter?.did,
          remark: inviteInfo.remark,
          connectedAccount: {
            ...connectedAccountUpdates,
            provider,
            did: userDid,
            pk: userPk,
          },
        },
      });
      await node.createAuditLog(
        {
          action: 'addUser',
          args: { teamDid, userDid: user?.did || userDid, passport, inviteId, reason: 'accepted invitation' },
          context: formatContext(Object.assign(req, { user: doc })),
          result: doc,
        },
        node
      );
    }
  } else {
    const roles = await node.getRoles({ teamDid });
    const orgPassports = roles.filter((r) => r.orgId).map((r) => r.name);
    role = (user.passports || []).filter((p) => !orgPassports.includes(p.role))[0]?.role || 'guest';
  }

  logger.info('invite success', { userDid: user?.did || userDid, inviter: inviteInfo?.inviter });

  if (passport) {
    await node.createPassportLog(
      teamDid,
      {
        passportId: passport.id,
        action: PASSPORT_LOG_ACTION.ISSUE,
        operatorDid: userDid,
        metadata: {
          action: PASSPORT_ISSUE_ACTION.ISSUE_ON_INVITE,
          context: formatContext(Object.assign(req, { user: doc })),
          inviteId,
          inviter: omit(inviteInfo?.inviter, 'passports'),
          receiver: userDid,
        },
      },
      req
    );
  }

  // 处理加入组织逻辑
  const inviteMemberDid = user?.did || userDid;
  if (isOrgInvite && inviteUserDids.length > 0) {
    await node.updateOrgMember({ teamDid, orgId, userDid: inviteMemberDid, status: 'active' }, req);
  } else if (isOrgInvite && !inviteUserDids.length) {
    await node.addOrgMember({ teamDid, orgId, userDid: inviteMemberDid }, req);
  }

  // await node.closeInvitation({ teamDid, inviteId, status: 'success', receiver: { did: userDid, role } });
  await node.closeInvitation({
    teamDid,
    inviteId,
    status: 'success',
    isOrgInvite,
    receiver: { did: user?.did || userDid, role, timeout: 1000 * 9999 },
  });

  return {
    passport,
    role,
    response: {
      disposition: 'attachment',
      type: 'VerifiableCredential',
      data: vc,
    },
    profile,
    user: isOrgInvite ? user : doc,
    inviteInfo,
    purpose,
  };
};

const handleInvitationResponse = async ({
  req = {},
  node,
  nodeInfo,
  teamDid,
  userDid,
  userPk,
  inviteId,
  locale = 'en',
  claims,
  statusEndpointBaseUrl,
  endpoint,
  newNftOwner = '',
  kycUpdates = {},
}) => {
  const claim = claims.find((x) => x.type === 'signature');
  verifySignature(claim, userDid, userPk, locale);

  const profile = claims.find((x) => x.type === 'profile');

  const receiveResult = await handleInvitationReceive({
    nodeInfo,
    locale,
    req,
    node,
    inviteId,
    teamDid,
    newNftOwner,
    userDid,
    userPk,
    statusEndpointBaseUrl,
    endpoint,
    profile,
    provider: LOGIN_PROVIDER.WALLET,
    kycUpdates,
  });

  return receiveResult;
};

const beforeIssuePassportRequest = async ({ node, teamDid, id, locale = 'en' }) => {
  const issuanceInfo = await node.getPassportIssuance({ teamDid, sessionId: id });

  if (!issuanceInfo) {
    throw new CustomError(
      404,
      {
        en: 'The receiving url does not exist or has been used',
        zh: '领取链接不存在或已被使用',
      }[locale]
    );
  }
};

const createIssuePassportRequest = async ({ node, nodeInfo, teamDid, id, baseUrl, locale = 'en', visitorId }) => {
  if (!id) {
    throw new CustomError(404, 'The issuance id does not exist');
  }
  const list = await node.getPassportIssuances({ teamDid });
  const issuanceInfo = list.find((x) => x.id === id);
  if (!issuanceInfo) {
    throw new CustomError(404, 'The issuance does not exist or has been used');
  }

  const inviteInfo = await node.getInvitation({ teamDid, inviteId: visitorId });

  const {
    name: issuerName,
    wallet: issuerWallet,
    passportColor,
    owner: teamOwner,
    logo,
  } = await getApplicationInfo({ node, nodeInfo, teamDid, baseUrl });

  if (issuanceInfo.name === ROLES.OWNER && !!teamOwner) {
    throw new CustomError(403, 'Cannot receive owner passport because the owner already exists');
  }

  // NOTICE: 这里是给指定用户颁发 passport，绑定的 did 无需查询 connectedAccount
  const user = await getUser(node, teamDid, issuanceInfo.ownerDid);

  const result = await createPassport({ name: issuanceInfo.name, node, teamDid, locale });
  const ownerAvatarUrl = getUserAvatarUrl(baseUrl, user.avatar, nodeInfo, teamDid === nodeInfo.did);

  return {
    description: messages.receivePassport[locale],
    data: getRandomMessage(),
    type: 'mime:text/plain',
    display: JSON.stringify(
      issuanceInfo.display
        ? issuanceInfo.display
        : {
            type: 'svg',
            content: createPassportSvg({
              scope: 'passport',
              role: issuanceInfo.name,
              issuer: issuerName,
              title: result.passport.title,
              issuerDid: issuerWallet.address,
              issuerAvatarUrl: logo,
              ownerDid: user.did,
              ownerName: get(user, 'fullName', 'Your Name'),
              ownerAvatarUrl,
              preferredColor: passportColor,
              extra: inviteInfo?.passportExpireTime
                ? {
                    key: 'Exp',
                    value: dayjs(inviteInfo.passportExpireTime).format('YYYY-MM-DD HH:mm:ss'),
                  }
                : null,
            }),
          }
    ),
  };
};

const handleIssuePassportResponse = async ({
  req = {},
  node,
  nodeInfo,
  teamDid,
  userDid,
  userPk,
  id,
  locale = 'en',
  claims,
  statusEndpointBaseUrl,
  updateSession,
  endpoint,
  source = PASSPORT_SOURCE.ISSUE,
  inviteId,
}) => {
  // verify signature
  const claim = claims.find((x) => x.type === 'signature');
  verifySignature(claim, userDid, userPk, locale);

  const inviteInfo = await node.getInvitation({ teamDid, inviteId });

  const user = await getUser(node, teamDid, userDid, { enableConnectedAccount: true });
  const realDid = user.did || userDid;
  const realPk = user.pk || userPk;
  if (user && !user.approved) {
    throw new CustomError(
      403,
      {
        zh: '你没有权限访问该应用',
        en: 'You are not allowed to access this app',
      }[locale]
    );
  }

  const {
    name: issuerName,
    wallet: issuerWallet,
    type: issuerType,
    passportColor,
    owner: teamOwner,
    logo,
  } = await getApplicationInfo({ node, nodeInfo, teamDid, baseUrl: endpoint });

  // get issuanceInfo from session
  const list = await node.getPassportIssuances({ teamDid });
  const issuanceInfo = list.find((x) => x.id === id);

  const { name, ownerDid, display } = issuanceInfo;

  if (name === ROLES.OWNER && !!teamOwner) {
    throw new CustomError(403, 'Cannot receive Owner Passport because the owner already exists');
  }

  if (ownerDid !== realDid) {
    throw new CustomError(403, messages.notOwner[locale]);
  }

  if (user) {
    user.avatar = getUserAvatarUrl(endpoint, user.avatar, nodeInfo, teamDid === nodeInfo.did);
  }

  let result = await createPassport({ name, node, teamDid, locale, endpoint });

  const vcParams = {
    issuerName,
    issuerWallet,
    issuerAvatarUrl: logo,
    ownerDid: userDid,
    endpoint: getPassportStatusEndpoint({
      baseUrl: statusEndpointBaseUrl,
      userDid,
      teamDid,
    }),
    ownerProfile: user,
    preferredColor: passportColor,
    passport: result.passport,
    types: teamDid === nodeInfo.did ? [VC_TYPE_NODE_PASSPORT] : result.types,
    purpose: teamDid === nodeInfo.did || isEmpty(result.types) ? 'login' : 'verification',
    display,
  };

  if (issuerType === TEAM_TYPE.NODE) {
    vcParams.tag = nodeInfo.did;
  }

  if (inviteInfo?.passportExpireTime) {
    vcParams.expirationDate = inviteInfo.passportExpireTime;
  }

  const vc = await createPassportVC(vcParams);
  const role = getRoleFromLocalPassport(get(vc, 'credentialSubject.passport'));
  const passport = createUserPassport(vc, { role, display, source });

  if (user) {
    await node.updateUser({
      teamDid,
      user: {
        did: realDid,
        pk: realPk,
        passports: upsertToPassports(user.passports || [], passport),
      },
    });
  }

  // delete session
  result = await node.processPassportIssuance({ teamDid, sessionId: id });
  await node.createAuditLog(
    {
      action: 'processPassportIssuance',
      args: { teamDid, userDid: realDid, ...result, sessionId: id, reason: 'claimed passport' },
      context: formatContext(Object.assign(req, { user })),
      result,
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
          action: PASSPORT_ISSUE_ACTION.ISSUE_ON_INVITE,
          context: formatContext(Object.assign(req, { user })),
          inviteId,
          inviter: omit(inviteInfo?.inviter, 'passports'),
          receiver: userDid,
        },
      },
      req
    );
  }

  if (name === ROLES.OWNER && issuerType === TEAM_TYPE.BLOCKLET) {
    logger.info('Bind owner for blocklet', { teamDid, userDid: realDid });
    await node.setBlockletInitialized({ did: teamDid, owner: { did: realDid, pk: userPk } });
  }

  await updateSession({ passportId: vc.id });

  return {
    response: {
      disposition: 'attachment',
      type: 'VerifiableCredential',
      data: vc,
    },
    role,
    passport,
  };
};

const getVCFromClaims = async ({ claims, challenge, trustedIssuers, types, locale = 'en', vcId = '' }) => {
  const credential = claims
    .filter(Boolean) // FIXES: https://github.com/ArcBlock/did-connect/issues/74
    .find(
      (x) =>
        x.type === 'verifiableCredential' &&
        // 注意此处不要筛选出 did Spaces 的 verifiableCredential
        x?.meta?.purpose !== 'DidSpace' &&
        types.some((item) => x.item?.includes(item) || x.filters?.some((f) => f.type?.includes(item)))
    );

  if (!credential || !credential.presentation) {
    return {};
  }

  const presentation = JSON.parse(credential.presentation);

  // verify challenge
  if (challenge !== presentation.challenge) {
    throw new CustomError(400, messages.missingChallenge[locale]);
  }

  // verify presentation
  try {
    await verifyPresentation({ presentation, trustedIssuers, challenge });
  } catch (err) {
    console.error('geteVCFromClaims.verifyPresentation', err);
    throw new CustomError(400, messages.invalidCredentialProof[locale]);
  }

  // get vc
  const credentials = Array.isArray(presentation.verifiableCredential)
    ? presentation.verifiableCredential
    : [presentation.verifiableCredential];
  const vc = JSON.parse(credentials[0]);

  // verify vc id
  if (vcId && vc.id !== vcId) {
    throw new CustomError(400, messages.invalidCredentialId[locale](vcId));
  }

  // verify vc type
  if (![].concat(vc.type).some((x) => types.includes(x))) {
    throw new CustomError(400, messages.invalidCredentialType[locale](types));
  }

  return {
    vc,
    types: [].concat(vc.type),
  };
};

const checkWalletVersion = ({ didwallet, locale = 'en', expected = {} }) => {
  const { os, version } = didwallet;

  const defaultExpected = '4.0.0';

  const expectedWallet = {
    android: expected.android || defaultExpected,
    ios: expected.ios || defaultExpected,
    web: expected.web || defaultExpected,
  };

  if (semver.lt(version, expectedWallet[os] || defaultExpected)) {
    throw new CustomError(400, messages.lowVersion[locale || 'en']);
  }

  return true;
};

const checkWalletVersionForMigrateAppToV2 = (param) => {
  param.expected = {
    android: '4.11.15',
    ios: '4.11.29',
    web: '4.6.12',
  };
  return checkWalletVersion(param);
};

const getPassportStatus = async ({ node, teamDid, userDid, vcId, locale = 'en' }) => {
  const nodeInfo = await node.getNodeInfo();
  const {
    wallet: issuerWallet,
    name: issuerName,
    type: issuerType,
  } = await getApplicationInfo({ node, nodeInfo, teamDid });

  const actionLabel = {
    open: {
      zh: `${issuerType === TEAM_TYPE.NODE ? '管理节点' : '查看 Blocklet'}`,
      en: `${issuerType === TEAM_TYPE.NODE ? 'Manage Node' : 'View Blocklet'}`,
    },
    manage: {
      zh: '管理 Blocklet',
      en: 'Manage Blocklet',
    },
  };

  // NOTICE: 该方法使用的地方是外部通过 api 来使用，无法控制输入的 userDid，所以需要查询 connectedAccount，加上后也不影响任何逻辑
  const user = await node.getUser({ teamDid, user: { did: userDid }, options: { enableConnectedAccount: true } });

  if (!user) {
    throw new CustomError(404, messages.userNotFound[locale]);
  }

  const passport = (user.passports || []).find((x) => x.id === vcId);
  if (!passport) {
    throw new CustomError(404, messages.passportNotFound[locale]);
  }

  if (!user.approved) {
    passport.status = PASSPORT_STATUS.REVOKED;
  }

  const issuer = {
    wallet: issuerWallet,
    name: issuerName,
  };

  // FIXME 梳理 blocklet interface, team, router 的关系, 以确定是否可以在这里根据 request 计算出 endpoint
  // 这样就不需要在 passport 中存储 endpoint 了

  const actionList = [];
  if (passport.endpoint) {
    const claims = [];

    // open blocklet
    claims.push({
      id: passport.endpoint,
      type: 'navigate',
      name: issuerType === TEAM_TYPE.NODE ? 'open-node' : 'open-blocklet',
      scope: 'public',
      label: actionLabel.open[locale],
    });

    // manage blocklet
    const { name } = passport;
    if ([ROLES.OWNER, ROLES.ADMIN].includes(name) && issuerType === TEAM_TYPE.BLOCKLET) {
      claims.push({
        id: joinURL(passport.endpoint, WELLKNOWN_BLOCKLET_ADMIN_PATH),
        type: 'navigate',
        name: 'open-blocklet-admin',
        scope: 'public',
        label: actionLabel.manage[locale],
      });
    }

    actionList.push(
      ...(await createCredentialList({
        issuer,
        claims,
      }))
    );
  }

  return {
    id: vcId,
    statusList: await createCredentialList({
      issuer,
      claims: [
        {
          type: 'text',
          name: PASSPORT_STATUS_KEY,
          label: messages.statusLabel[locale],
          value: passport.status,
          reason:
            passport.status === PASSPORT_STATUS.REVOKED
              ? messages.passportRevoked[locale](passport.title, issuerName)
              : '',
        },
      ],
    }),
    actionList,
  };
};

const validatePassportStatus = async ({ vcId, endpoint, locale = 'en' }) => {
  if (!['en', 'zh'].includes(locale)) {
    // eslint-disable-next-line no-param-reassign
    locale = 'en';
  }
  try {
    const url = new URL(endpoint);
    url.searchParams.set('vcId', vcId);
    url.searchParams.set('locale', locale);
    const { data } = await axios.get(url.href, {
      timeout: 20 * 1000,
    });

    const claims = (get(data, 'statusList') || []).map((x) => x.claim || {});
    const claim = claims.find((x) => x.name === PASSPORT_STATUS_KEY);
    const status = get(claim, 'value');

    if (!status) {
      throw new CustomError(404, messages.statusNotFound[locale]);
    }

    if (status === PASSPORT_STATUS.REVOKED) {
      throw new CustomError(403, claim.reason);
    }

    if (status !== PASSPORT_STATUS.VALID) {
      throw new CustomError(403, `${messages.unKnownStatus[locale]}: ${status}`);
    }
  } catch (err) {
    logger.error('failed to validate passport status', { vcId, endpoint, locale, err });

    if (err instanceof CustomError) {
      throw err;
    }
    throw new CustomError(500, messages.passportStatusCheckFailed[locale](err.message));
  }
};

const setUserInfoHeaders = (req) => {
  if (req.user) {
    req.headers['x-user-did'] = req.user.did;
    req.headers['x-user-fullname'] = encodeURIComponent(req.user.fullName);
    req.headers['x-user-role'] = req.user.role;
    req.headers['x-user-provider'] = req.user.provider || LOGIN_PROVIDER.WALLET;
    req.headers['x-connected-did'] = req.user.did;
    req.headers['x-user-wallet-os'] = req.user.walletOS || '';
    req.headers['x-user-kyc'] = req.user.kyc || 0;
    req.headers['x-user-org'] = req.user.org || '';
  } else {
    delete req.headers['x-user-did'];
    delete req.headers['x-user-fullname'];
    delete req.headers['x-user-role'];
    delete req.headers['x-user-provider'];
    delete req.headers['x-user-wallet-os'];
    delete req.headers['x-user-kyc'];
    delete req.headers['x-user-org'];

    if (req.cookies && req.cookies.connected_did) {
      req.headers['x-connected-did'] = req.cookies.connected_did;
    } else {
      delete req.headers['x-connected-did'];
    }
  }
};

/**
 * Defines properties for an asset.
 * @typedef {Object} AssetClaim
 * @property {string} acquireUrl URL to acquire the asset
 * @property {string} asset The asset identifier
 * @property {string} description A description of the asset
 * @property {Filter[]} [filters] Filters that can be used to acquire the asset
 * @property {Object} [meta] Metadata associated with the asset
 * @property {string[]} [mfaCode] Multi-factor authentication code for the asset
 * @property {boolean} optional Whether the asset is optional or required
 * @property {string} ownerDid DID of the asset owner
 * @property {string} ownerPk Public key of the asset owner
 * @property {string} ownerProof Ownership proof for the asset
 * @property {string} [tag] Tag or category of the asset
 * @property {'asset'} type The type of entity, always "asset"
 */

/**
 * @typedef {Object} Filter
 * @property {string} acquireUrl URL to acquire the asset through this filter
 * @property {string} tag Tag associated with this filter
 * @property {string[]} trustedIssuers Issuers trusted for this filter
 */

/**
 *
 * @description 校验 NFT
 * @param {{
 *  claims: any[],
 *  challenge: any,
 *  chainHost: string,
 *  locale: 'zh' | 'en',
 * }}
 * @returns {Promise<import('@ocap/client').AssetState>}
 */
const verifyNFT = async ({ claims, challenge, chainHost, locale }) => {
  const client = getChainClient(chainHost);
  /** @type {AssetClaim} */
  const claim = claims.find((x) => x.type === 'asset');
  if (!claim) {
    throw new CustomError(400, messages.missingNftClaim[locale]);
  }

  const fields = ['asset', 'ownerProof', 'ownerPk', 'ownerDid'];
  for (const field of fields) {
    if (!claim[field]) {
      throw new CustomError(400, messages.invalidNftClaim[locale]);
    }
  }

  const address = claim.asset;
  const ownerDid = toAddress(claim.ownerDid);
  const ownerPk = fromBase58(claim.ownerPk);
  const ownerProof = fromBase58(claim.ownerProof);
  if (isFromPublicKey(ownerDid, ownerPk) === false) {
    throw new CustomError(400, messages.invalidNftHolder[locale]);
  }

  const owner = fromPublicKey(ownerPk, toTypeInfo(ownerDid));
  if ((await owner.verify(challenge, ownerProof)) === false) {
    throw new CustomError(400, messages.invalidNftProof[locale]);
  }

  const { state } = await client.getAssetState({ address }, { ignoreFields: ['context'] });
  if (!state) {
    throw new CustomError(400, messages.invalidNft[locale]);
  }
  if (state.owner !== ownerDid) {
    throw new CustomError(400, messages.invalidNftHolder[locale]);
  }

  return state;
};

const beforeIssueKycRequest = async ({ node, teamDid, code, locale = 'en' }) => {
  const blocklet = await node.getBlocklet({ did: teamDid });
  if (!getEmailServiceProvider(blocklet)) {
    throw new CustomError(
      400,
      {
        en: 'Email notification is not enabled',
        zh: '邮箱通知未启用',
      }[locale]
    );
  }

  const doc = await node.getVerifyCode({ teamDid, code });
  if (!doc || !doc.verified) {
    throw new CustomError(
      400,
      {
        en: 'The verification code is not verified',
        zh: '验证码未验证',
      }[locale]
    );
  }
};

const handleIssueKycResponse = async ({
  request = {},
  node,
  nodeInfo,
  teamDid,
  userDid,
  userPk,
  code,
  locale = 'en',
  claims,
  statusEndpointBaseUrl,
  endpoint,
  updateKyc,
  inviter,
  sourceAppPid,
  source = PASSPORT_SOURCE.ISSUE,
}) => {
  const blocklet = await node.getBlocklet({ did: teamDid });
  const profile = claims.find((x) => x.type === 'profile');
  const doc = await node.getVerifyCode({ teamDid, code });

  const user = await getUser(node, teamDid, userDid, { enableConnectedAccount: true });
  if (user && !user.approved) {
    throw new CustomError(
      403,
      {
        zh: '你没有权限访问该应用',
        en: 'You are not allowed to access this app',
      }[locale]
    );
  }

  const {
    name: issuerName,
    wallet: issuerWallet,
    dataDir,
    passportColor,
    logo,
  } = await getApplicationInfo({ node, nodeInfo, teamDid, baseUrl: endpoint });

  const ownerAvatar = getUserAvatarUrl(
    endpoint,
    await extractUserAvatar(profile.avatar, { dataDir }),
    nodeInfo,
    teamDid === nodeInfo.did
  );

  const vc = await createKycVC({
    issuerName,
    issuerWallet,
    issuerAvatarUrl: logo,
    ownerDid: userDid,
    kyc: {
      scope: doc.scope,
      subject: doc.subject,
      digest: doc.digest,
      specVersion: doc.specVersion,
    },
    endpoint: getPassportStatusEndpoint({
      baseUrl: statusEndpointBaseUrl,
      // NOTICE: user 可能不存在，优先使用用户永久 did
      userDid: user?.did || userDid,
      teamDid,
    }),
    types: {
      email: ['VerifiedEmailCredential'],
      phone: ['VerifiedPhoneCredential'],
    }[doc.scope],
    ownerProfile: {
      avatar: ownerAvatar,
      fullName: profile.fullName,
    },
    preferredColor: passportColor,
  });

  let updatedUser;

  // persist passport
  const passport = createUserPassport(vc, { role: doc.scope, source });
  logger.debug('issued kyc passport', passport);
  const passports = upsertToPassports(user?.passports || [], passport);

  if (user) {
    const emailVerified = Boolean(updateKyc ? doc.scope === 'email' : user.emailVerified);
    const phoneVerified = Boolean(updateKyc ? doc.scope === 'phone' : user.phoneVerified);
    const newEmail = updateKyc && doc.scope === 'email' && emailVerified ? doc.subject : user.email;
    const newPhone = updateKyc && doc.scope === 'phone' && phoneVerified ? doc.subject : user.phone;
    updatedUser = await node.updateUser({
      teamDid,
      user: {
        did: user.did,
        email: newEmail,
        phone: newPhone,
        passports,
        emailVerified,
        phoneVerified,
      },
    });
    logger.info('issued kyc passport for existing user', { userDid, teamDid, updateKyc, doc, newEmail, newPhone });
    await node.createAuditLog(
      {
        action: 'issueKyc',
        args: { teamDid, userDid, doc, reason: 'claimed kyc' },
        context: formatContext(Object.assign(request, { user: updatedUser })),
        result: passport,
      },
      node
    );
  } else {
    const emailVerified = doc.scope === 'email';
    const phoneVerified = doc.scope === 'phone';
    const newEmail = emailVerified ? doc.subject : '';
    const newPhone = phoneVerified ? doc.subject : '';
    updatedUser = await node.addUser({
      teamDid,
      user: {
        did: userDid,
        pk: userPk,
        // NOTICE: 创建用户时一定要加上 sourceAppPid 字段
        sourceAppPid,
        email: newEmail,
        phone: newPhone,
        // 创建用户时 emailVerified 和 phoneVerified 都为 false
        emailVerified: false,
        phoneVerified: false,
        passports,
        inviter,
        approved: true,
        ...profile,
        avatar: await extractUserAvatar(get(profile, 'avatar'), {
          dataDir: blocklet.env.dataDir,
        }),
      },
    });
    logger.info('issued kyc passport for new user', { userDid, teamDid, updateKyc, doc, newEmail, newPhone });
    await node.createAuditLog(
      {
        action: 'issueKyc',
        args: { teamDid, userDid, doc, reason: 'claimed kyc' },
        context: formatContext(Object.assign(request, { user: updatedUser })),
        result: passport,
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
          action: PASSPORT_ISSUE_ACTION.ISSUE_ON_KYC,
          context: formatContext(Object.assign(request, { user: updatedUser })),
        },
      },
      request
    );
  }

  await node.issueVerifyCode({ teamDid, code });
  return {
    user: updatedUser,
    credential: {
      disposition: 'attachment',
      type: 'VerifiableCredential',
      data: vc,
    },
  };
};

/**
 * @typedef {Object} UserSessionRequstData
 * @property {string} teamDid
 * @property {string} userDid
 * @property {string} [visitorId]
 */

/**
 * @typedef {Object} UserSessionRequstOption
 * @property {object} req - 当前请求的 req 上下文
 * @property {object} node - 注入的 node 对象
 * @property {string} [sourceAppPid] - 统一登录的 master appPid
 * @property {string} [appPid] - 统一登录的 master appPid
 */

module.exports = {
  getUser,
  getApplicationInfo,
  verifyNFT,
  canSessionBeElevated,
  createAuthToken,
  createAuthTokenByOwnershipNFT,
  createBlockletControllerAuthToken,
  beforeInvitationRequest,
  createInvitationRequest,
  handleInvitationResponse,
  handleInvitationReceive,
  beforeIssuePassportRequest,
  createIssuePassportRequest,
  handleIssuePassportResponse,
  getVCFromClaims,
  messages,
  checkWalletVersion,
  checkWalletVersionForMigrateAppToV2,
  getPassportStatusEndpoint,
  getPassportStatus,
  validatePassportStatus,
  setUserInfoHeaders,
  beforeIssueKycRequest,
  handleIssueKycResponse,
  TEAM_TYPE,
};
