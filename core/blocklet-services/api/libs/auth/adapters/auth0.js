// https://auth0.openai.com/.well-known/openid-configuration

/**
 * @typedef {Object} Auth0UserProfile
 * @property {string} sub - The subject of the user profile.
 * @property {string} name - The name of the user.
 * @property {string} picture - The picture URL of the user.
 * @property {string} email - The email of the user.
 * @property {boolean} email_verified - Indicates if the user's email is verified.
 * @property {string} locale - The locale of the user.
 * @property {string} nickname - The nickname of the user.
 * @property {string} updated_at - The last time the user profile was updated.
 * @property {string} iss - The issuer of the token.
 * @property {string} aud - The audience of the token.
 * @property {number} iat - The issued at time of the token.
 * @property {number} exp - The expiration time of the token.
 * @property {string} sid
 */

const { joinURL } = require('ufo');

function Auth0(options) {
  const { issuer } = options;
  return {
    id: 'auth0',
    name: 'Auth0',
    type: 'oidc',
    issuer,
    jwks_uri: joinURL(issuer, '/.well-known/jwks.json'),
    authorization: {
      url: joinURL(issuer, '/authorize'),
      params: {
        // prompt: 'none',
        scope: 'openid profile email',
      },
    },
    token: joinURL(issuer, '/oauth/token'),
    userinfo: {
      url: joinURL(issuer, '/userinfo'),
    },
    /**
     * @param {Auth0UserProfile} profile - The profile object to be modified.
     * @return {Object} The modified profile object.
     */
    profile(profile) {
      return {
        ...profile,
        name: profile.nickname || profile.name,
        emailVerified: profile.email_verified,
      };
    },
    options,
  };
}

module.exports = Auth0;
