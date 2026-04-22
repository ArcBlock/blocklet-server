const jwt = require('jsonwebtoken');
// https://appleid.apple.com/.well-known/openid-configuration

/**
 * @typedef {Object} AppleUserProfile
 * @property {string} iss - issuer of oauth provider
 * @property {string} aud
 * @property {string} at_hash
 * @property {string} iat
 * @property {string} exp
 * @property {string} sub - user's usb
 * @property {string} email - user's email
 * @property {boolean} email_verified - user's email is verified
 * @property {boolean} is_private_email - user's email is verified
 */

function Apple(options) {
  return {
    id: 'apple',
    name: 'Apple',
    type: 'oidc',
    issuer: 'https://appleid.apple.com',
    jwks_uri: 'https://appleid.apple.com/auth/keys',
    token: 'https://appleid.apple.com/auth/token',
    authorization: {
      url: 'https://appleid.apple.com/auth/authorize',
      params: {
        scope: 'name email',
        response_mode: 'form_post',
        // prompt: 'none',
      },
    },
    /**
     * @param {AppleUserProfile} profile
     * @returns {Object}
     */
    profile(profile) {
      return {
        sub: `appleid|${profile.sub}`,
        // HACK: apple 可能无法正确获得用户名，使用 email 做为兜底方案
        name: profile.name || profile.email.split('@')[0],
        email: profile.email,
        picture: null,
        emailVerified: profile.email_verified,
        extraData: {
          isPrivateEmail: profile.is_private_email,
        },
      };
    },
    getClientId() {
      return options.serviceId?.trim();
    },
    getClientList() {
      return [...options.serviceId.split(','), ...options.bundleId.split(',')].map((x) => x?.trim()).filter(Boolean);
    },
    getClientSecret() {
      const headers = {
        alg: 'ES256',
        kid: options.keyId,
      };
      const timeNow = Math.floor(Date.now() / 1000);
      const claims = {
        iss: options.teamId,
        aud: 'https://appleid.apple.com',
        sub: options.serviceId,
        iat: timeNow,
        exp: timeNow + 86400,
      };

      const token = jwt.sign(claims, options.authKey, {
        algorithm: 'ES256',
        header: headers,
      });

      return token;
    },
    options,
  };
}

module.exports = Apple;
