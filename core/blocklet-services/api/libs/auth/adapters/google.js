// https://accounts.google.com/.well-known/openid-configuration

/**
 * @typedef {Object} GoogleUserProfile
 * @property {string} iss - issuer of oauth provider
 * @property {string} azp
 * @property {string} aud
 * @property {string} at_hash
 * @property {string} iat
 * @property {string} exp
 * @property {string} sub - user's usb
 * @property {string} email - user's email
 * @property {string} name - user's name
 * @property {string} picture - user's avatar url
 * @property {boolean} email_verified - user's email is verifyed
 * @property {string} given_name
 * @property {string} family_name
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} sub - The subject of the user profile.
 * @property {string} name - The name of the user.
 * @property {string} picture - The picture URL of the user.
 * @property {string} email - The email of the user.
 * @property {boolean} [emailVerified] - Indicates if the user's email is verified.
 * @property {object} [extraData] - Extra data of the user.
 */

function Google(options) {
  return {
    id: 'google',
    name: 'Google',
    type: 'oidc',
    issuer: 'https://accounts.google.com',
    jwks_uri: 'https://www.googleapis.com/oauth2/v3/certs',
    authorization: {
      url: 'https://accounts.google.com/o/oauth2/v2/auth',
      params: {
        scope: 'openid profile email',
        // prompt: 'none',
      },
    },
    token: 'https://oauth2.googleapis.com/token',
    userinfo: 'https://openidconnect.googleapis.com/v1/userinfo',
    options,
    /**
     * @param {GoogleUserProfile} profile
     * @returns {UserProfile}
     */
    profile(profile) {
      return {
        sub: `google-oauth2|${profile.sub}`,
        name: profile.name,
        picture: profile.picture,
        email: profile.email,
        emailVerified: profile.email_verified,
        extraData: {
          givenName: profile.given_name,
          familyName: profile.family_name,
        },
      };
    },
  };
}

module.exports = Google;
