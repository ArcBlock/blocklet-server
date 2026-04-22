/* eslint-disable import/no-unresolved */
const { joinURL } = require('ufo');
const { OAUTH_ENDPOINTS, OAUTH_CLIENT_SECRET_TTL, WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { authorizationHandler } = require('@modelcontextprotocol/sdk/server/auth/handlers/authorize.js');
const { tokenHandler } = require('@modelcontextprotocol/sdk/server/auth/handlers/token.js');
const { revocationHandler } = require('@modelcontextprotocol/sdk/server/auth/handlers/revoke.js');
const { clientRegistrationHandler } = require('@modelcontextprotocol/sdk/server/auth/handlers/register.js');

const { createBlockletOAuthServerProvider } = require('../../services/oauth/server');
const { redirectWithoutCache, getRedirectUrl } = require('../../util');

const logger = require('../../libs/logger')('oauth:server:routes');

const hexToBase64Url = (hex) => {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const buffer = Buffer.from(cleanHex, 'hex');
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

module.exports = {
  init(router, node, options) {
    const prefix = `${WELLKNOWN_SERVICE_PATH_PREFIX}/oauth`;

    const ensureOAuthProvider = async (req, res, next) => {
      const [blocklet, info] = await Promise.all([req.getBlocklet(), req.getBlockletInfo()]);

      if (!blocklet) {
        return res.status(404).json({ error: 'Blocklet not found' });
      }
      // TODO: check if oauth server service is enabled, make it configurable
      req.provider = createBlockletOAuthServerProvider(node, Object.assign({}, options), blocklet, info);

      // save blocklet and info to res.locals for later use
      res.locals.info = info;

      return next();
    };

    router.use(joinURL(prefix, OAUTH_ENDPOINTS.AUTHORIZATION), ensureOAuthProvider, (req, res, next) => {
      if (req.method === 'GET') {
        if (req.user) {
          logger.debug('User already logged in, send to consent page');
          // Send to oauth consent page
          next();
        } else {
          logger.debug('User not logged in, send to login page');
          // redirect to login page and redirect back once login success
          redirectWithoutCache(
            res,
            getRedirectUrl({
              req,
              pagePath: '/login',
              params: {
                redirect: req.originalUrl,
              },
            })
          );
        }
      } else if (req.method === 'POST') {
        logger.debug('Handle oauth authorization request', req.body);

        if (req.body.action === 'deny') {
          logger.debug('User denied oauth authorization, redirect to redirect_uri');
          const errorUrl = new URL(req.body.redirect_uri);
          errorUrl.searchParams.set('error', 'access_denied');
          errorUrl.searchParams.set('error_description', 'The user denied the request');
          if (req.body.state) errorUrl.searchParams.set('state', req.body.state);
          res.redirect(errorUrl.toString());
          return;
        }

        authorizationHandler({ provider: req.provider, rateLimit: false })(req, res, next);
      } else {
        res.status(405).json({ error: 'Method not allowed' });
      }
    });

    router.use(joinURL(prefix, OAUTH_ENDPOINTS.TOKEN), ensureOAuthProvider, (req, res, next) => {
      tokenHandler({ provider: req.provider, rateLimit: false })(req, res, next);
    });

    router.use(joinURL(prefix, OAUTH_ENDPOINTS.REGISTRATION), ensureOAuthProvider, (req, res, next) => {
      clientRegistrationHandler({
        clientsStore: req.provider.clientsStore,
        clientSecretExpirySeconds: OAUTH_CLIENT_SECRET_TTL,
        rateLimit: false,
      })(req, res, next);
    });

    router.use(joinURL(prefix, OAUTH_ENDPOINTS.REVOCATION), ensureOAuthProvider, (req, res, next) => {
      revocationHandler({ provider: req.provider, rateLimit: false })(req, res, next);
    });

    router.get(joinURL(prefix, OAUTH_ENDPOINTS.USERINFO), ensureOAuthProvider, async (req, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ error: 'No authenticated user' });
        }
        const user = await req.provider.getUserInfo(req.user.did, res.locals.info.appUrl);
        return res.json(user);
      } catch (error) {
        logger.error('Error in userinfo endpoint:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });

    router.get(joinURL(prefix, OAUTH_ENDPOINTS.USERINFO, 'emails'), ensureOAuthProvider, async (req, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ error: 'No authenticated user' });
        }

        // TODO: get email from connected accounts
        const user = await req.provider.getUserInfo(req.user.did, res.locals.info.appUrl);
        return res.json([
          {
            email: user.email,
            primary: true,
            verified: user.emailVerified,
            visibility: 'public',
          },
        ]);
      } catch (error) {
        logger.error('Error in userinfo/emails endpoint:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });

    router.get(joinURL(prefix, OAUTH_ENDPOINTS.JWKS), ensureOAuthProvider, (req, res) => {
      try {
        const { publicKey } = res.locals.info.wallet;
        return res.json({
          keys: [
            {
              kty: 'OKP', // Octet Key Pair - for Ed25519
              use: 'sig',
              kid: res.locals.info.wallet.address,
              alg: 'EdDSA',
              crv: 'Ed25519',
              x: hexToBase64Url(publicKey), // The public key in base64url format
            },
          ],
        });
      } catch (error) {
        logger.error('Error in jwks endpoint:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });

    router.get(joinURL(prefix, OAUTH_ENDPOINTS.LOGOUT), ensureOAuthProvider, (req, res) => {
      try {
        // TODO: implement logout
        return res.json({ success: true });
      } catch (error) {
        logger.error('Error in logout endpoint:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });

    router.get(joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/api/oauth/client'), ensureOAuthProvider, async (req, res) => {
      const { clientId } = req.query;
      if (!clientId) {
        res.status(400).json({ error: 'clientId is required' });
        return;
      }
      const client = await req.provider.clientsStore.getClient(clientId);
      res.json(client);
    });
  },
};
