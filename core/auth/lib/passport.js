/* eslint-disable max-len */

const Joi = require('joi');
const { joinURL, withQuery } = require('ufo');
const pick = require('lodash/pick');
const uniq = require('lodash/uniq');
const sortBy = require('lodash/sortBy');
const head = require('lodash/head');
const { CustomError } = require('@blocklet/error');
const { create: createVC } = require('@arcblock/vc');
const {
  ROLES,
  VC_TYPE_GENERAL_PASSPORT,
  PASSPORT_STATUS,
  WELLKNOWN_SERVICE_PATH_PREFIX,
  PASSPORT_SOURCE,
} = require('@abtnode/constant');

const createPassportSvg = require('./util/create-passport-svg');

const SPEC_VERSION = '1.0.0';

const passportSchema = Joi.object({
  name: Joi.string().required(),
  title: Joi.string(),
  specVersion: Joi.string(),
  endpoint: Joi.string().uri(), // deprecated
});

const validatePassport = (d) => {
  const { value, error } = passportSchema.validate(d);
  if (error) {
    throw Array.isArray(error) ? error[0] : error;
  }
  return value;
};

const kycSchema = Joi.object({
  scope: Joi.string().valid('email', 'phone').required(),
  subject: Joi.alternatives().conditional('scope', {
    is: 'email',
    then: Joi.string().email().required(),
    otherwise: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .required(),
  }),
  digest: Joi.string().required().trim(),
  specVersion: Joi.string().trim(),
}).options({ stripUnknown: true });

const validateKyc = (d) => {
  const { value, error } = kycSchema.validate(d);
  if (error) {
    throw Array.isArray(error) ? error[0] : error;
  }
  return value;
};

const createPassport = async ({ name, node, locale = 'en', teamDid, endpoint, role: inputRole = null } = {}) => {
  const passportNotFound = {
    en: (x) => `The passport was not found: ${x}`,
    zh: (x) => `未找到通行证: ${x}`,
  };

  let role = inputRole;
  if (!role) {
    const roles = await node.getRoles({ teamDid });
    role = roles.find((x) => x.name === name);
    if (!role) {
      throw new CustomError(404, passportNotFound[locale](name));
    }
  }

  const passport = {
    specVersion: SPEC_VERSION,
    name: role.name,
    title: role.title,
  };

  if (endpoint) {
    passport.endpoint = endpoint;
  }

  passportSchema.validate(passport);

  return { passport, types: role.extra?.types || [] };
};

const createPassportVC = async ({
  issuerWallet,
  issuerName,
  issuerAvatarUrl,
  ownerDid,
  passport,
  endpoint,
  types = [],
  tag = '',
  ownerProfile,
  preferredColor,
  expirationDate,
  display = null,
  purpose = 'login',
  // eslint-disable-next-line require-await
} = {}) => {
  validatePassport(passport);

  return createVC({
    type: [
      ...new Set(
        // general passport is used for login, otherwise it is used for verification
        [purpose === 'login' ? VC_TYPE_GENERAL_PASSPORT : '', 'VerifiableCredential', ...types].filter(Boolean)
      ),
    ],
    issuer: {
      wallet: issuerWallet,
      name: issuerName,
    },
    subject: {
      id: ownerDid,
      passport,
      display: display || {
        type: 'svg',
        content: createPassportSvg({
          scope: 'passport',
          issuer: issuerName,
          issuerDid: issuerWallet.address,
          issuerAvatarUrl,
          title: passport.title,
          ownerDid,
          ownerName: ownerProfile ? ownerProfile.fullName : '',
          ownerAvatarUrl: ownerProfile ? ownerProfile.avatar : '',
          preferredColor,
        }),
      },
    },
    expirationDate,
    endpoint,
    tag,
  });
};

const createKycVC = async ({
  issuerWallet,
  issuerName,
  issuerAvatarUrl,
  ownerDid,
  kyc,
  endpoint,
  types = [],
  ownerProfile,
  preferredColor,
  // eslint-disable-next-line require-await
} = {}) => {
  validateKyc(kyc);

  return createVC({
    type: uniq(['KycCredential', 'VerifiableCredential', ...types].filter(Boolean)),
    issuer: {
      wallet: issuerWallet,
      name: issuerName,
    },
    subject: {
      id: ownerDid,
      kyc,
      display: {
        type: 'svg',
        content: createPassportSvg({
          scope: 'kyc',
          role: kyc.scope,
          issuer: issuerName,
          issuerDid: issuerWallet.address,
          issuerAvatarUrl,
          title: kyc.subject || { email: 'VerifiedEmailCredential', phone: 'VerifiedPhoneCredential' }[kyc.scope],
          ownerDid,
          ownerName: ownerProfile ? ownerProfile.fullName : '',
          ownerAvatarUrl: ownerProfile ? ownerProfile.avatar : '',
          preferredColor,
        }),
      },
    },
    endpoint,
    tag: kyc.digest,
  });
};

/**
 * insert or update passport to passports
 */
const upsertToPassports = (passports, passport) => {
  // eslint-disable-next-line no-param-reassign
  let list = passports || [];

  list = list.filter((x) => x.id);

  if (!passport) {
    return list;
  }

  const index = list.findIndex((x) => x.id === passport.id);
  if (index >= 0) {
    list.splice(index, 1, passport);
  } else {
    list.push(passport);
  }
  return list;
};

const isUserPassportRevoked = (user, passport) =>
  (user.passports || []).some((x) => x.id === passport.id && x.status === PASSPORT_STATUS.REVOKED);

const isPassportAvailable = (passport) => passport.status !== PASSPORT_STATUS.REVOKED;

const getRoleFromLocalPassport = (passport) => passport.name;

/**
 * @param {string} passport external passport
 */
const getRoleFromExternalPassport = async ({ passport, node, teamDid, mappings: customMappings, locale = 'en' }) => {
  const { name, title } = passport || {};

  // custom mapping
  if (customMappings && customMappings.length) {
    const mapping = customMappings.find((x) => [name, title].includes(x.from.passport));
    if (mapping) {
      return mapping.to.role;
    }
    throw new CustomError(
      403,
      {
        en: 'Cannot connect to the app with this passport',
        zh: '无法使用此通行证连接应用',
      }[locale]
    );
  }

  // default mapping
  if (name === ROLES.OWNER) {
    return ROLES.ADMIN;
  }

  const roles = await node.getRoles({ teamDid });
  const role = roles.find((x) => x.name === name);

  if (!role) {
    return ROLES.GUEST;
  }

  return role.name;
};

// source 为 passport 用途，新版本为必填
const createUserPassport = (
  vc,
  { status = PASSPORT_STATUS.VALID, role = ROLES.GUEST, display = null, source = PASSPORT_SOURCE.ISSUE, parentDid } = {}
) => {
  if (!Object.values(PASSPORT_STATUS).includes(status)) {
    throw new CustomError(400, `status is invalid: ${status}`);
  }

  const x = pick(vc, ['id', 'type', 'issuer', 'issuanceDate', 'expirationDate']);
  x.status = status;
  x.role = role;

  if (display) {
    x.display = display;
  }

  if (source) {
    x.source = source;
  }

  if (parentDid) {
    x.parentDid = parentDid;
  }

  if (['email', 'phone'].includes(role)) {
    Object.assign(x, {
      ...vc.credentialSubject.kyc,
      title: { email: 'VerifiedEmailCredential', phone: 'VerifiedPhoneCredential' }[role],
      name: vc.credentialSubject.kyc.subject,
      scope: 'kyc',
      role,
    });
  } else {
    Object.assign(x, {
      ...vc.credentialSubject.passport,
      scope: 'passport',
    });
  }

  return x;
};

const isLocalUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    return ['127.0.0.1', 'localhost'].includes(parsedUrl.hostname);
  } catch (error) {
    return false;
  }
};

const getPassportClaimUrl = (baseUrl, prefix = '', { role = undefined, inviter = undefined } = {}) => {
  const originUrl = isLocalUrl(baseUrl) ? process.env.ABT_NODE_BASE_URL : baseUrl;
  return baseUrl
    ? withQuery(joinURL(new URL(originUrl).origin, prefix, WELLKNOWN_SERVICE_PATH_PREFIX, '/lost-passport'), {
        role,
        inviter,
      })
    : '';
};

const getKycAcquireUrl = (baseUrl, prefix = '', { role = 'email', inviter = undefined } = {}) =>
  baseUrl
    ? withQuery(joinURL(new URL(baseUrl).origin, prefix, WELLKNOWN_SERVICE_PATH_PREFIX, `/kyc/${role}`), { inviter })
    : '';

const getLastUsedPassport = (passports, passportId = '', { useFallback = true } = {}) => {
  let passport = null;
  if (passportId) {
    passport = passports.find(
      (x) => x.status === PASSPORT_STATUS.VALID && x.scope === 'passport' && x.passportId === passportId
    );
  }

  if (!passport) {
    const now = new Date().getTime();
    passport = head(
      sortBy(passports, (x) => {
        const lastLoginAt = new Date(x.lastLoginAt).getTime();
        if (typeof lastLoginAt === 'number') {
          return now - lastLoginAt;
        }
        return now;
      })
    );
  }

  if (useFallback) {
    if (!passport || passport.status !== PASSPORT_STATUS.VALID || passport.scope !== 'passport') {
      passport = { name: 'Guest', role: 'guest' };
    }
  }

  return passport;
};

module.exports = {
  validatePassport,
  createPassport,
  createPassportSvg,
  createPassportVC,
  isPassportAvailable,
  isUserPassportRevoked,
  upsertToPassports,
  SPEC_VERSION,
  getRoleFromLocalPassport,
  getRoleFromExternalPassport,
  createUserPassport,
  getPassportClaimUrl,
  getKycAcquireUrl,
  kycSchema,
  createKycVC,
  validateKyc,
  getLastUsedPassport,
};
