const crypto = require('crypto');
// const { Hasher } = require('@ocap/mcrypto');
const { getLastUsedPassport } = require('@abtnode/auth/lib/passport');
const snakeCase = require('lodash/snakeCase');
const camelCase = require('lodash/camelCase');
const {
  OAUTH_CODE_TTL,
  OAUTH_ACCESS_TOKEN_TTL,
  OAUTH_REFRESH_TOKEN_TTL,
  WELLKNOWN_SERVICE_PATH_PREFIX,
} = require('@abtnode/constant');

const { canSessionBeElevated } = require('@abtnode/auth/lib/auth');
const { joinURL } = require('ufo');
const initJwt = require('../../libs/jwt');
const { createTokenFn, redirectWithoutCache } = require('../../util');

const logger = require('../../libs/logger')('oauth:server');

const snakeCaseObject = (obj) => Object.fromEntries(Object.entries(obj).map(([key, value]) => [snakeCase(key), value]));
const camelCaseObject = (obj) => Object.fromEntries(Object.entries(obj).map(([key, value]) => [camelCase(key), value]));

const createBlockletOAuthServerProvider = (node, options, blocklet, info) => {
  const { createSessionToken, verifySessionToken } = initJwt(node, options);

  const createToken = createTokenFn(createSessionToken);
  // const hashToken = (token) => Hasher.SHA3.hash256(token);
  const generateCode = (length = 16) => crypto.randomBytes(length).toString('hex').toUpperCase();
  const generateTokens = async (client, userDid, scopes = ['profile:read']) => {
    const user = await node.getUser({
      teamDid: blocklet.appDid,
      user: { did: userDid },
      options: { enableConnectedAccount: true },
    });

    if (!user) {
      throw new Error('User not found');
    }
    if (!user.approved) {
      throw new Error('User not approved');
    }

    const passport = getLastUsedPassport(user?.passports || []);
    const role = passport?.role || 'guest';

    const { sessionToken, refreshToken } = createToken(
      userDid,
      {
        secret: info.secret,
        passport,
        role,
        fullName: user.fullName,
        provider: passport?.provider || 'oauth',
        emailVerified: !!user.emailVerified,
        phoneVerified: !!user.phoneVerified,
        elevated: canSessionBeElevated(role, (await node.getBlocklet({ did: blocklet.appDid }))?.settings),
        oauth: {
          clientId: client.client_id,
          scopes,
        },
      },
      { cacheTtl: OAUTH_ACCESS_TOKEN_TTL, ttl: OAUTH_REFRESH_TOKEN_TTL, didConnectVersion: true }
    );

    return {
      access_token: sessionToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      scope: scopes.join(' '),
      expires_in: OAUTH_ACCESS_TOKEN_TTL,
    };
  };

  return {
    async authorize(client, params, res) {
      if (!res.locals.user) {
        throw new Error('User not logged in');
      }

      logger.info('authorize', {
        client,
        params,
        user: res.locals.user,
        code: {
          challenge: params.codeChallenge,
          scopes: params.scopes,
          clientId: client.client_id,
          userDid: res.locals.user.did,
          expiresAt: Date.now() + OAUTH_CODE_TTL * 1000,
        },
      });
      const { oauthCodeState } = await node.getOAuthState(blocklet.appDid);

      // Generate authorization code
      const code = generateCode();
      await oauthCodeState.insert({
        code,
        challenge: params.codeChallenge,
        scopes: params.scopes,
        clientId: client.client_id,
        userDid: res.locals.user.did,
        expiresAt: Date.now() + OAUTH_CODE_TTL * 1000,
      });

      const redirectUrl = new URL(params.redirectUri);
      redirectUrl.searchParams.set('code', code);
      if (params.state) {
        redirectUrl.searchParams.set('state', params.state);
      }
      redirectWithoutCache(res, redirectUrl.toString());
    },

    async challengeForAuthorizationCode(client, authorizationCode) {
      logger.info('challengeForAuthorizationCode', { client, authorizationCode });
      const { oauthCodeState } = await node.getOAuthState(blocklet.appDid);
      const code = await oauthCodeState.findOne({ code: authorizationCode });
      if (!code) {
        throw new Error('Invalid authorization code');
      }

      if (code.expiresAt < Date.now()) {
        await oauthCodeState.update({ isRevoked: true }, { where: { code } });
        throw new Error('Expired authorization code');
      }

      return code.challenge;
    },

    async exchangeAuthorizationCode(client, authorizationCode) {
      logger.info('exchangeAuthorizationCode', { client, authorizationCode });
      const { oauthCodeState } = await node.getOAuthState(blocklet.appDid);
      const code = await oauthCodeState.findOne({ code: authorizationCode });
      if (!code) {
        throw new Error('Invalid authorization code');
      }

      if (code.clientId !== client.client_id) {
        throw new Error('Authorization code was not issued to this client');
      }

      if (Date.now() > code.expiresAt) {
        throw new Error('Authorization code has expired');
      }

      // Delete the used authorization code
      await oauthCodeState.remove({ id: code.id });

      // Generate tokens
      return generateTokens(client, code.userDid, code.scopes);
    },

    async exchangeRefreshToken(client, token, scopes) {
      logger.info('exchangeRefreshToken', { client, token, scopes });
      try {
        const { did: userDid } = await verifySessionToken(token, info.secret, {
          locale: 'en',
          checkFromDb: true,
          teamDid: blocklet.appDid,
          checkToken: (t) => {
            if (t.tokenType !== 'refresh') {
              throw new Error(`invalid token type ${t.tokenType}`);
            }
          },
        });

        // Generate new tokens
        return generateTokens(client, userDid, scopes);
      } catch (error) {
        console.error('Failed to exchange refresh token:', error);
        throw new Error('Invalid refresh token');
      }
    },

    async verifyAccessToken(token) {
      logger.info('verifyAccessToken', { token });
      const { oauth, exp } = await verifySessionToken(token, info.secret, {
        locale: 'en',
        checkFromDb: true,
        teamDid: blocklet.appDid,
        checkToken: (t) => {
          if (t.tokenType !== 'refresh') {
            throw new Error(`invalid token type ${t.tokenType}`);
          }
        },
      });

      return {
        token,
        clientId: oauth.clientId,
        scopes: oauth.scopes,
        expiresAt: exp,
      };
    },

    // eslint-disable-next-line no-unused-vars
    revokeToken(client, token) {
      throw new Error('Not implemented');
    },

    clientsStore: {
      async getClient(clientId) {
        const { oauthClientState } = await node.getOAuthState(blocklet.appDid);
        const client = await oauthClientState.findOne({ clientId });
        return client ? snakeCaseObject(client) : null;
      },

      async registerClient(client) {
        logger.info('registerClient.start', { teamDid: blocklet.appDid, client });
        const { oauthClientState } = await node.getOAuthState(blocklet.appDid);
        const newClient = await oauthClientState.insert(camelCaseObject(client));
        logger.info('registerClient.end', { teamDid: blocklet.appDid, newClient });
        return snakeCaseObject(newClient);
      },
    },

    async getUserInfo(userDid, appUrl) {
      logger.info('getUserInfo', { userDid, appUrl });

      const user = await node.getUser({
        teamDid: blocklet.appDid,
        user: { did: userDid },
        options: { enableConnectedAccount: true },
      });

      return {
        sub: user.did,
        name: user.fullName,
        email: user.email,
        picture: joinURL(
          appUrl,
          WELLKNOWN_SERVICE_PATH_PREFIX,
          '/user/avatar/',
          `${user.did}?imageFilter=resize&w=48&h=48`
        ),
        preferred_username: user.fullName,
        email_verified: user.emailVerified,
      };
    },
  };
};

module.exports = {
  createBlockletOAuthServerProvider,
};
