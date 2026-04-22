const { createPassportList, createPassportSwitcher } = require('@abtnode/auth/lib/oauth');
const { createPasskeyHandlers } = require('@abtnode/auth/lib/passkey');

const { createToken } = require('../libs/login');

module.exports = {
  init(router, node) {
    const {
      ensurePasskeySession,
      ensureUser,
      handleRegisterRequest,
      handleRegisterResponse,
      handleAuthRequest,
      handleAuthResponse,
    } = createPasskeyHandlers(node, 'server', createToken);

    router.get('/api/passkey/register', handleRegisterRequest);
    router.post('/api/passkey/register', ensurePasskeySession, handleRegisterResponse);
    router.get('/api/passkey/auth', ensureUser, handleAuthRequest);
    router.post('/api/passkey/auth', ensurePasskeySession, handleAuthResponse);

    const checkUser = (req, res, next) => {
      if (!req.user) {
        res.status(401).json({ error: 'not login' });
      } else {
        next();
      }
    };

    // Following routes are same as oauth routes
    router.get('/api/passkey/passports', checkUser, createPassportList(node, 'server'));
    router.post('/api/passkey/switch', checkUser, createPassportSwitcher(node, createToken, 'server'));
  },
};
