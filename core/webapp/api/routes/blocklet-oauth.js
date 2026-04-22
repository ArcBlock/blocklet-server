const cors = require('cors');
const { joinURL } = require('ufo');
const {
  OAUTH_ENDPOINTS,
  WELLKNOWN_SERVICE_PATH_PREFIX,
  WELLKNOWN_OAUTH_SERVER,
  WELLKNOWN_OPENID_SERVER,
} = require('@abtnode/constant');

module.exports = {
  /**
   * Initialize the blocklet oauth routes
   * @param {import('express').Express} app
   * @param {import('@abtnode/core').Node} node
   */
  init(app, node) {
    // OAuth 2.0 Authorization Server Metadata endpoint
    app.get(WELLKNOWN_OAUTH_SERVER, cors(), async (req, res) => {
      const did = req.headers['x-blocklet-did'] || '';
      const blocklet = await node.getBlocklet({ did, useCache: true });
      if (!blocklet) {
        return res.status(404).json({ error: 'Blocklet not found' });
      }

      const appUrl = blocklet.environmentObj?.BLOCKLET_APP_URL;
      const baseUrl = joinURL(appUrl, WELLKNOWN_SERVICE_PATH_PREFIX, 'oauth');

      const metadata = {
        issuer: appUrl,
        service_documentation: appUrl,

        authorization_endpoint: joinURL(baseUrl, OAUTH_ENDPOINTS.AUTHORIZATION),
        response_types_supported: ['code'],
        code_challenge_methods_supported: ['S256'],

        token_endpoint: joinURL(baseUrl, OAUTH_ENDPOINTS.TOKEN),
        token_endpoint_auth_methods_supported: ['client_secret_post'],
        grant_types_supported: ['authorization_code', 'refresh_token'],

        revocation_endpoint: joinURL(baseUrl, OAUTH_ENDPOINTS.REVOCATION),
        revocation_endpoint_auth_methods_supported: ['client_secret_post'],

        registration_endpoint: joinURL(baseUrl, OAUTH_ENDPOINTS.REGISTRATION),
      };

      return res.status(200).json(metadata);
    });

    app.get(`${WELLKNOWN_OAUTH_SERVER}/*`, cors(), (_req, res) => {
      return res.status(404).json('Not found');
    });

    // OpenID Connect Discovery endpoint
    app.get(WELLKNOWN_OPENID_SERVER, cors(), async (req, res) => {
      const did = req.headers['x-blocklet-did'] || '';
      const blocklet = await node.getBlocklet({ did, useCache: true });
      if (!blocklet) {
        return res.status(404).json({ error: 'Blocklet not found' });
      }

      const appUrl = blocklet.environmentObj?.BLOCKLET_APP_URL;
      const baseUrl = joinURL(appUrl, WELLKNOWN_SERVICE_PATH_PREFIX, 'oauth');

      const metadata = {
        issuer: appUrl,
        authorization_endpoint: joinURL(baseUrl, OAUTH_ENDPOINTS.AUTHORIZATION),
        token_endpoint: joinURL(baseUrl, OAUTH_ENDPOINTS.TOKEN),
        userinfo_endpoint: joinURL(baseUrl, OAUTH_ENDPOINTS.USERINFO),
        jwks_uri: joinURL(baseUrl, OAUTH_ENDPOINTS.JWKS),
        registration_endpoint: joinURL(baseUrl, OAUTH_ENDPOINTS.REGISTRATION),
        scopes_supported: ['openid', 'profile', 'email'],
        response_types_supported: ['code'],
        response_modes_supported: ['query'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['EdDSA'],
        token_endpoint_auth_methods_supported: ['client_secret_post'],
        claims_supported: ['sub', 'iss', 'name', 'email', 'picture', 'preferred_username', 'email_verified'],
        code_challenge_methods_supported: ['S256'],
        service_documentation: appUrl,
        end_session_endpoint: joinURL(baseUrl, OAUTH_ENDPOINTS.LOGOUT),
      };

      return res.status(200).json(metadata);
    });
  },
};
