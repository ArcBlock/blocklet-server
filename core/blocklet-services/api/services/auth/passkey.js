const { createPasskeyHandlers } = require('@abtnode/auth/lib/passkey');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { createPassportList, createPassportSwitcher } = require('@abtnode/auth/lib/oauth');
const { createTokenFn } = require('../../util');
const { checkUser } = require('../../routes/oauth/client');
const ensureBlocklet = require('../../middlewares/ensure-blocklet');

module.exports = {
  init(router, node, options, createSessionToken) {
    const createToken = createTokenFn(createSessionToken);

    const {
      ensurePasskeySession,
      ensureUser,
      handleRegisterRequest,
      handleRegisterResponse,
      handleAuthRequest,
      handleAuthResponse,
    } = createPasskeyHandlers(node, 'service', createToken);

    const prefix = `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/passkey`;

    router.get(`${prefix}/register`, ensureBlocklet(), handleRegisterRequest);
    router.post(`${prefix}/register`, ensureBlocklet(), ensurePasskeySession, handleRegisterResponse);
    router.get(`${prefix}/auth`, ensureBlocklet(), ensureUser, handleAuthRequest);
    router.post(`${prefix}/auth`, ensureBlocklet(), ensurePasskeySession, handleAuthResponse);

    // Following routes are same as oauth routes
    router.get(`${prefix}/passports`, ensureBlocklet(), checkUser, createPassportList(node, 'service'));
    router.post(`${prefix}/switch`, ensureBlocklet(), checkUser, createPassportSwitcher(node, createToken, 'service'));
  },
};
