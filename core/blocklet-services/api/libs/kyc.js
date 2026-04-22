const get = require('lodash/get');
const uniq = require('lodash/uniq');
const pick = require('lodash/pick');
const trim = require('lodash/trim');
const lowerCase = require('lodash/lowerCase');
const semver = require('semver');
const { Hasher } = require('@ocap/mcrypto');
const { LOGIN_PROVIDER } = require('@blocklet/constant');
const { messages, getVCFromClaims } = require('@abtnode/auth/lib/auth');
const { getPassportClaimUrl, getKycAcquireUrl } = require('@abtnode/auth/lib/passport');
const { PASSPORT_VC_TYPES } = require('@abtnode/auth/lib/util/transfer-passport');
const logger = require('@abtnode/logger')('@abtnode/blocklet-services/kyc');

const { getTrustedIssuers } = require('../util/blocklet-utils');
const { api } = require('./api');

const getPassportVc = async ({ claims, challenge, locale, trustedIssuers, types = PASSPORT_VC_TYPES }) => {
  const { vc } = await getVCFromClaims({
    claims,
    challenge,
    trustedIssuers,
    types,
    locale,
  });

  return vc;
};

/**
 * @description 兼容老的 DID Wallet 版本，不是所有的 DID Wallet 都可以出示 profile url
 * @param {import('../../types').DidWallet} didWallet
 * @return {boolean}
 */
function isProfileUrlSupported(didWallet) {
  if (!didWallet) {
    return false;
  }

  const { os, version } = didWallet;
  const webCanUse = os === 'web' && semver.satisfies(version, '>= 4.13.0');
  const iosCanUse = os === 'ios' && semver.satisfies(version, '>= 5.6.0');
  const androidCanUse = os === 'android' && semver.satisfies(version, '>= 5.6.0');

  return webCanUse || iosCanUse || androidCanUse;
}

function createEmailDomainChecker(toggleField, listField, valueOnDisabled = false) {
  return async (blocklet, email) => {
    if (!email) {
      return false;
    }
    let domain = email.split('@')[1];
    if (!domain) {
      return false;
    }
    domain = domain.toLowerCase();

    const config = blocklet.settings?.session?.email || {};
    if (!config[toggleField]) {
      return valueOnDisabled;
    }
    if (!config[listField] || !Array.isArray(config[listField]) || config[listField].length === 0) {
      return valueOnDisabled;
    }

    const results = await Promise.allSettled(config[listField].map((x) => api.get(x, { timeout: 5000 })));
    const data = results
      .filter((x) => x.status === 'fulfilled' && x.value.data)
      .map((x) => (x.value.data || '').split('\n').map(trim));
    return data.some((x) => x.includes(domain));
  };
}
const isEmailBlocked = createEmailDomainChecker('enableDomainBlackList', 'domainBlackList', false);
const isEmailAllowed = createEmailDomainChecker('enableDomainWhiteList', 'domainWhiteList', true);

/**
 * @description
 * @param {object} settings
 * @param {import('../../types').DidWallet} didWallet
 * @return {string[]}
 */
function getProfileItems(settings, didWallet) {
  const profileItems = ['fullName', 'avatar'];
  if (settings?.email?.enabled) {
    profileItems.push('email');
  }
  if (settings?.phone?.enabled) {
    profileItems.push('phone');
  }

  if (isProfileUrlSupported(didWallet)) {
    profileItems.push('url');
  }

  return uniq(profileItems);
}

const isEmailKycRequired = (blocklet) => {
  return blocklet.settings?.session?.email?.enabled && blocklet.settings?.session?.email?.requireVerified;
};

const isEmailUniqueRequired = (blocklet) => {
  return blocklet.settings?.session?.email?.enabled && blocklet.settings?.session?.email?.requireUnique;
};

const isOAuthKycTrusted = (blocklet) => {
  return blocklet.settings?.session?.email?.enabled && blocklet.settings?.session?.email?.trustOauthProviders;
};

const isPhoneKycRequired = (blocklet) => {
  return blocklet.settings?.session?.phone?.enabled && blocklet.settings?.session?.phone?.requireVerified;
};

const isPhoneUniqueRequired = (blocklet) => {
  return blocklet.settings?.session?.phone?.enabled && blocklet.settings?.session?.phone?.requireUnique;
};

// github 的 email 是 verified, 其他 oauth 的 email 通过 emailVerified 判断
const isOAuthEmailVerified = (blocklet, info) => {
  return (
    isOAuthKycTrusted(blocklet) && (!!info?.email_verified || !!info?.emailVerified || info?.provider === 'github')
  );
};

const isProfileClaimRequired = (blocklet, user) => {
  if (isEmailKycRequired(blocklet) && !user.email) {
    return true;
  }
  if (isPhoneKycRequired(blocklet) && !user.phone) {
    return true;
  }
  return false;
};

async function getKycClaims({ blocklet, user, locale, baseUrl, sourceAppPid = '', inviter }) {
  const claims = {};
  if (isEmailKycRequired(blocklet) && !user?.emailVerified) {
    const trustedIssuers = await getTrustedIssuers(blocklet, { sourceAppPid, trustAllFederated: true });
    const emailKycClaim = {
      type: 'verifiableCredential',
      description: messages.requestEmailKyc[locale],
      item: ['VerifiedEmailCredential'],
      trustedIssuers,
      optional: false,
      acquireUrl: getKycAcquireUrl(baseUrl, '', {
        role: 'email',
        inviter,
      }),
      claimUrl: getPassportClaimUrl(baseUrl, '', {
        role: 'email',
        inviter,
      }),
    };
    if (user?.email) {
      emailKycClaim.tag = Hasher.SHA3.hash256(user.email);
      emailKycClaim.description += `: ${user.email}`;
    }
    claims.emailKyc = ['verifiableCredential', emailKycClaim];
  }

  if (isPhoneKycRequired(blocklet) && !user?.phoneVerified) {
    const trustedIssuers = await getTrustedIssuers(blocklet, { sourceAppPid, trustAllFederated: true });
    const phoneKycClaim = {
      type: 'verifiableCredential',
      description: messages.requestPhoneKyc[locale],
      item: ['VerifiedPhoneCredential'],
      trustedIssuers,
      optional: false,
      acquireUrl: getKycAcquireUrl(baseUrl, '', {
        role: 'phone',
        inviter,
      }),
      claimUrl: getPassportClaimUrl(baseUrl, '', {
        role: 'phone',
        inviter,
      }),
    };
    if (user?.phone) {
      phoneKycClaim.tag = Hasher.SHA3.hash256(user.phone);
      phoneKycClaim.description += `: ${user.phone}`;
    }
    claims.phoneKyc = ['verifiableCredential', phoneKycClaim];
  }

  return claims;
}

const isSameEmail = (email1, email2) => {
  if (!email1 || !email2) {
    return false;
  }
  return lowerCase(email1) === lowerCase(email2);
};

const isSamePhone = (phone1, phone2) => {
  if (!phone1 || !phone2) {
    return false;
  }
  return phone1.replace(/\s+/g, '').replace(/[()-]/g, '') === phone2.replace(/\s+/g, '').replace(/[()-]/g, '');
};

async function verifyKycClaims({ node, blocklet, teamDid, claims, challenge, locale, sourceAppPid, user }) {
  const profile = claims.find((claim) => claim.type === 'profile');
  const kycUpdates = pick(user || {}, ['email', 'emailVerified', 'phone', 'phoneVerified']);

  // verify email kyc
  if (isEmailKycRequired(blocklet) && !user?.emailVerified) {
    const trustedIssuers = await getTrustedIssuers(blocklet, { sourceAppPid, trustAllFederated: true });
    const emailKyc = await getPassportVc({
      blocklet,
      claims,
      challenge,
      locale,
      trustedIssuers,
      types: ['VerifiedEmailCredential'],
    });
    if (!emailKyc) {
      throw new Error(messages.missingEmailKyc[locale]);
    }
    const email = get(emailKyc, 'credentialSubject.kyc.subject');
    const allowed = await isEmailAllowed(blocklet, email);
    if (!allowed) {
      logger.warn('Email domain is not allowed', { teamDid, email });
      throw new Error(messages.emailBlocked[locale]);
    }
    const blocked = await isEmailBlocked(blocklet, email);
    if (blocked) {
      logger.warn('Email domain is blocked', { teamDid, email });
      throw new Error(messages.emailBlocked[locale]);
    }

    if (!user && isEmailUniqueRequired(blocklet)) {
      const isEmailUsed = await node.isEmailUsed({
        teamDid,
        email,
        verified: true,
        sourceProvider: LOGIN_PROVIDER.WALLET,
      });
      if (isEmailUsed) {
        throw new Error(messages.emailAlreadyUsed[locale]);
      }
    }

    kycUpdates.emailVerified = true;
    kycUpdates.email = email;
  } else if (!user && profile?.email && isEmailUniqueRequired(blocklet)) {
    const allowed = await isEmailAllowed(blocklet, profile.email);
    if (!allowed) {
      logger.warn('Email domain is not allowed', { teamDid, email: profile.email });
      throw new Error(messages.emailBlocked[locale]);
    }
    const blocked = await isEmailBlocked(blocklet, profile.email);
    if (blocked) {
      logger.warn('Email domain is blocked', { teamDid, email: profile.email });
      throw new Error(messages.emailBlocked[locale]);
    }

    const isEmailUsed = await node.isEmailUsed({
      teamDid,
      email: profile.email,
      verified: false,
      sourceProvider: LOGIN_PROVIDER.WALLET,
    });
    if (isEmailUsed) {
      throw new Error(messages.emailAlreadyUsed[locale]);
    }
  } else if (user && profile?.email && !isSameEmail(user.email, profile.email)) {
    kycUpdates.email = profile.email;
  }

  // verify phone kyc
  if (isPhoneKycRequired(blocklet) && !user?.phoneVerified) {
    const trustedIssuers = await getTrustedIssuers(blocklet, { sourceAppPid, trustAllFederated: true });
    const phoneKyc = await getPassportVc({
      blocklet,
      claims,
      challenge,
      locale,
      trustedIssuers,
      types: ['VerifiedPhoneCredential'],
    });
    if (!phoneKyc) {
      throw new Error(messages.missingPhoneKyc[locale]);
    }
    const phone = get(phoneKyc, 'credentialSubject.kyc.subject');
    if (profile?.phone && !isSamePhone(profile.phone, phone)) {
      throw new Error(messages.phoneMismatch[locale]);
    }
    if (!user && isPhoneUniqueRequired(blocklet)) {
      const isPhoneUsed = await node.isPhoneUsed({ teamDid, phone, verified: true });
      if (isPhoneUsed) {
        throw new Error(messages.phoneAlreadyUsed[locale]);
      }
    }
    kycUpdates.phoneVerified = true;
    kycUpdates.phone = phone;
  } else if (!user && profile?.phone && isPhoneUniqueRequired(blocklet)) {
    const isPhoneUsed = await node.isPhoneUsed({ teamDid, phone: profile.phone, verified: false });
    if (isPhoneUsed) {
      throw new Error(messages.phoneAlreadyUsed[locale]);
    }
  } else if (user && profile?.phone && !isSamePhone(user.phone, profile.phone)) {
    kycUpdates.phone = profile.phone;
  }

  return kycUpdates;
}

module.exports = {
  isEmailKycRequired,
  isOAuthKycTrusted,
  isPhoneKycRequired,
  isEmailUniqueRequired,
  isPhoneUniqueRequired,
  isProfileUrlSupported,
  isProfileClaimRequired,
  isOAuthEmailVerified,
  getProfileItems,
  getKycClaims,
  verifyKycClaims,
  getPassportVc,
  isEmailBlocked,
  isEmailAllowed,
  isSameEmail,
  isSamePhone,
};
