/* eslint-disable no-underscore-dangle */
const jwt = require('jsonwebtoken');
const { createAuthToken, messages } = require('@abtnode/auth/lib/auth');
const { LOGIN_PROVIDER } = require('@blocklet/constant');
const { decodeKycStatus, encodeKycStatus } = require('@blocklet/sdk/lib/util/login');

const getUser = async (node, teamDid, userDid) => {
  const user = await node.getUserByDid({ teamDid, userDid });
  if (user && user.approved) {
    return user;
  }
  return null;
};

// eslint-disable-next-line no-unused-vars
const initJwt = (node, options) => {
  // 保持默认有效期为 1 天
  const ttl = options.sessionTtl || '1d';
  const defaultOrg = options?.org || false;

  /**
   * Creates a JWT session token for a user
   * @param {string} did - The DID of the user
   * @param {Object} options - Token creation options
   * @param {string} options.role - User's role
   * @param {string} options.secret - Secret key used to sign the token
   * @param {Object} [options.passport] - User's passport information
   * @param {string} [options.expiresIn] - Token expiration time, defaults to configured ttl
   * @param {string} [options.tokenType] - Type of token being created
   * @param {string} [options.fullName] - User's full name
   * @param {string} [options.provider=LOGIN_PROVIDER.WALLET] - Authentication provider
   * @param {string} [options.walletOS] - User's wallet operating system
   * @param {boolean} [options.emailVerified=false] - Whether user's email is verified
   * @param {boolean} [options.phoneVerified=false] - Whether user's phone is verified
   * @param {boolean} [options.elevated=false] - Whether the session has elevated privileges
   * @param {Object} [options.oauth=null] - OAuth related information
   * @returns {Object} The created token object
   */
  const createSessionToken = (
    did,
    {
      role,
      secret,
      passport,
      expiresIn,
      tokenType,
      fullName,
      provider = LOGIN_PROVIDER.WALLET,
      walletOS,
      emailVerified = false,
      phoneVerified = false,
      elevated = false,
      oauth = null,
      org = '',
    }
  ) => {
    return createAuthToken({
      did,
      passport,
      role,
      secret,
      expiresIn: expiresIn || ttl,
      tokenType,
      fullName,
      provider,
      walletOS,
      kyc: encodeKycStatus(emailVerified, phoneVerified),
      elevated,
      oauth,
      org: org || defaultOrg,
    });
  };

  /**
   * Verifies a JWT session token
   * @param {string} token - The JWT token to verify
   * @param {string} secret - Secret key used to verify the token
   * @param {Object} [options={}] - Verification options
   * @param {boolean|Function} options.checkFromDb - Whether to check user from database or a function that returns boolean
   * @param {string} options.teamDid - The DID of the team/application
   * @param {Function} options.checkToken - Optional function to perform additional token validation
   * @param {string} [options.locale='en'] - Locale for error messages, defaults to 'en'
   * @returns {Promise<Object>} - Resolves with decoded token data if valid
   */
  const verifySessionToken = (token, secret, { checkFromDb, teamDid, checkToken, locale = 'en' } = {}) =>
    // eslint-disable-next-line implicit-arrow-linebreak
    new Promise((resolve, reject) => {
      jwt.verify(token, secret, async (err, decoded) => {
        if (err) {
          return reject(err);
        }

        if (typeof checkToken === 'function') {
          try {
            await checkToken(decoded);
          } catch (e) {
            return reject(e);
          }
        }

        const {
          did,
          role,
          passport,
          fullName,
          provider = LOGIN_PROVIDER.WALLET,
          walletOS,
          kyc = 0,
          elevated = false,
          oauth = null,
          exp,
          org = '',
        } = decoded;

        let user;
        if (!did) {
          return reject(new Error('Invalid jwt token: invalid did'));
        }

        let isCheck = checkFromDb;
        if (typeof checkFromDb === 'function') {
          isCheck = await checkFromDb(decoded);
        }

        if (isCheck) {
          // NOTICE: session 中的 did 是永久 did，不需要查询 connectedAccount
          user = await getUser(node, teamDid, did);
          if (!user) {
            return reject(new Error('Invalid jwt token: invalid user'));
          }

          if (!user.approved) {
            return reject(new Error(`Invalid jwt token: ${messages.notAllowedAppUser[locale]}`));
          }

          if (passport && passport.id) {
            const valid = await node.isPassportValid({ teamDid, passportId: passport.id });
            if (valid === false) {
              return reject(new Error(messages.passportRevoked[locale](passport.name, passport.issuer?.name)));
            }
          }
          if (role) {
            const roleInfo = await node.getRole({ teamDid, role: { name: role } });
            if (roleInfo?.orgId) {
              user.org = roleInfo.orgId;
            }
          }

          if (org) {
            user.org = org;
          }

          user.role = role;
          user.passport = passport;
          user.provider = provider;
          user.walletOS = walletOS;
          user.kyc = encodeKycStatus(user.emailVerified, user.phoneVerified);
          user.elevated = elevated;
          user.oauth = oauth;
          user.exp = exp;
        } else {
          user = Object.assign(
            { did, role, passport, fullName, provider, walletOS, kyc, elevated, oauth, exp, org },
            decodeKycStatus(kyc)
          );
        }

        return resolve(user);
      });
    });

  return {
    createSessionToken,
    verifySessionToken,
  };
};

initJwt.getUser = getUser;

module.exports = initJwt;
