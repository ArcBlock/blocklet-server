const stableStringify = require('json-stable-stringify');
const { fromSecretKey, WalletType } = require('@ocap/wallet');
const { types } = require('@ocap/mcrypto');
const { DidType, isEthereumType } = require('@arcblock/did');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const JWT = require('@arcblock/jwt');
const { formatError } = require('@blocklet/error');
const { fromAppDid } = require('@arcblock/did-ext');
const { Joi } = require('@arcblock/validator');
const formatContext = require('@abtnode/util/lib/format-context');
const { getComponentApiKey } = require('@abtnode/util/lib/blocklet');
const { findComponentByIdV2 } = require('@blocklet/meta/lib/util');

const ensureBlocklet = require('../middlewares/ensure-blocklet');
const logger = require('../libs/logger')('blocklet-services:sign');

// Validation schemas
const didTypeSchema = Joi.alternatives().try(
  Joi.string().valid('default', 'arcblock', 'eth', 'ethereum', 'passkey').allow(null),
  Joi.object().allow(null)
);

const signSchema = Joi.object({
  apiKey: Joi.string().required(),
  payload: Joi.required(),
  options: Joi.object({
    keyType: Joi.string().valid('sk', 'psk').allow(null).optional(),
    type: didTypeSchema.optional(),
    hashBeforeSign: Joi.boolean().allow(null).optional(),
    encoding: Joi.string().valid('hex', 'base16', 'base58', 'base64', 'Uint8Array', 'buffer').allow(null).optional(),
  })
    .unknown(true)
    .optional(),
});

const signJwtSchema = Joi.object({
  apiKey: Joi.string().required(),
  payload: Joi.alternatives().try(Joi.object(), Joi.string()).allow(null).optional(),
  options: Joi.object({
    keyType: Joi.string().valid('sk', 'psk').allow(null).optional(),
    type: didTypeSchema.optional(),
    doSign: Joi.boolean().allow(null).optional(),
    version: Joi.string().valid('1.0.0', '1.1.0').allow(null).optional(),
  })
    .unknown(true)
    .optional(),
});

const signEthSchema = Joi.object({
  apiKey: Joi.string().required(),
  data: Joi.string().required(),
  hashBeforeSign: Joi.boolean().allow(null).optional(),
  options: Joi.object({
    keyType: Joi.string().valid('sk', 'psk').allow(null).optional(),
    type: didTypeSchema.optional(),
  })
    .unknown(true)
    .optional(),
});

const signDeriveSchema = Joi.object({
  apiKey: Joi.string().required(),
  sub: Joi.string().required(),
  type: didTypeSchema.optional(),
  index: Joi.number().allow(null).optional(),
  options: Joi.object({
    keyType: Joi.string().valid('sk', 'psk').allow(null).optional(),
    type: didTypeSchema.optional(),
  })
    .unknown(true)
    .optional(),
});

/**
 * Middleware to ensure request comes from localhost only
 */
function ensureLocalhost(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

  const isLocalhost = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost';

  // Check if the request is from private network (RFC 1918)
  // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
  const isPrivateNetwork = /^10\./.test(ip) || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip) || /^192\.168\./.test(ip);

  // Check if the request is from localhost
  if (!isLocalhost && !isPrivateNetwork) {
    logger.warn('Rejected non-localhost request to signing API', {
      ip,
      path: req.path,
    });
    res.status(403).json({ error: 'Signing API is only accessible from localhost' });
    return;
  }

  next();
}

/**
 * Middleware to verify component API key
 */
function ensureComponentApiKey(req, res, next) {
  (async () => {
    try {
      const { blocklet } = req;
      const { apiKey } = req.body || {};

      // Get component ID from header
      const componentId = req.headers['x-component-did'];
      if (!componentId) {
        res.status(400).json({ error: 'Missing x-component-did header' });
        return;
      }

      // Find component in blocklet
      const component = findComponentByIdV2(blocklet, componentId);
      if (!component) {
        logger.warn('Component not found', {
          blockletDid: blocklet?.meta?.did,
          componentId,
        });
        res.status(404).json({ error: 'Component not found' });
        return;
      }

      const nodeInfo = await req.getNodeInfo();

      // Calculate expected component API key
      const componentApiKey = getComponentApiKey({
        serverSk: nodeInfo.sk,
        app: blocklet,
        component,
      });

      // Verify API key
      if (!apiKey || componentApiKey !== apiKey) {
        logger.warn('Component API key verification failed', {
          blockletDid: blocklet?.meta?.did,
          componentId,
        });
        res.status(401).json({ error: 'Invalid component API key' });
        return;
      }

      next();
    } catch (error) {
      logger.error('Component API key verification error', {
        error,
        blockletDid: req?.blocklet?.meta?.did,
        componentId: req.headers['x-component-did'],
      });
      res.status(500).json({ error: 'Failed to verify component API key' });
    }
  })();
}

function toSignablePayload(payload) {
  if (payload === null || payload === undefined) {
    return stableStringify({});
  }

  if (payload && payload.__type === 'buffer' && typeof payload.data === 'string') {
    return Buffer.from(payload.data, 'hex');
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (Buffer.isBuffer(payload)) {
    return payload;
  }

  if (typeof payload === 'object') {
    return stableStringify(payload);
  }

  return String(payload);
}

/**
 * Format message for audit log display
 */
function formatMessageForAudit(message) {
  if (Buffer.isBuffer(message)) {
    return message.toString('hex');
  }

  return String(message);
}

function getWalletFromBlocklet({ blocklet, options = {} }) {
  const env = blocklet?.environmentObj || {};

  // Support keyType parameter ('sk' | 'psk'), default to 'sk'
  const keyType = options.keyType || 'sk';
  const appSk = keyType === 'psk' ? env.BLOCKLET_APP_PSK : env.BLOCKLET_APP_SK;

  if (!appSk) {
    throw new Error(`BLOCKLET_APP_${keyType.toUpperCase()} not found for blocklet`);
  }

  const type = options.type || env.BLOCKLET_APP_CHAIN_TYPE || env.BLOCKLET_WALLET_TYPE;
  let walletType;
  let secretKey;

  if (type && isEthereumType(DidType(type))) {
    secretKey = appSk.slice(0, 66);
    walletType = WalletType(type);
  } else {
    secretKey = appSk;
    walletType = WalletType({
      role: types.RoleType.ROLE_APPLICATION,
      pk: types.KeyType.ED25519,
      hash: types.HashType.SHA3,
    });
  }

  return fromSecretKey(secretKey, walletType);
}

module.exports = {
  // eslint-disable-next-line no-unused-vars
  init(server, node, _options) {
    server.post(
      `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/sign`,
      ensureLocalhost,
      ensureBlocklet(),
      ensureComponentApiKey,
      async (req, res) => {
        try {
          const { blocklet } = req;
          const { payload, options, apiKey } = req.body || {};

          // Validate request body
          const { error } = signSchema.validate({ apiKey, payload, options });
          if (error) {
            res.status(400).json({ error: formatError(error) });
            return;
          }

          const wallet = getWalletFromBlocklet({ blocklet, options });
          const message = toSignablePayload(payload);
          // Pass through additional sign parameters (encoding, hashBeforeSign)
          const signature = await wallet.sign(message, options?.hashBeforeSign, options?.encoding);

          // Create audit log asynchronously (don't block response)
          const componentId = req.headers['x-component-did'];
          node
            .createAuditLog({
              action: 'remoteSign',
              args: {
                teamDid: blocklet.meta.did,
                componentId,
                payloadType: typeof payload,
                payloadContent: formatMessageForAudit(message),
              },
              context: {
                ...formatContext(req),
                user: {
                  did: blocklet.meta.did,
                  fullName: `Component: ${componentId || 'unknown'}`,
                  role: 'blocklet',
                  componentDid: componentId,
                },
              },
              result: { publicKey: wallet.publicKey },
            })
            .catch((err) => logger.error('create remoteSign audit log failed', { error: err }));

          res.json({ signature, publicKey: wallet.publicKey });
        } catch (error) {
          logger.error('Failed to sign payload', {
            error,
            blockletDid: req?.blocklet?.meta?.did,
            componentId: req.headers['x-component-did'],
          });
          res.status(500).json({ error: formatError(error) });
        }
      }
    );

    server.post(
      `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/sign/jwt`,
      ensureLocalhost,
      ensureBlocklet(),
      ensureComponentApiKey,
      async (req, res) => {
        try {
          const { blocklet } = req;
          const { payload, options, apiKey } = req.body || {};

          // Validate request body
          const { error } = signJwtSchema.validate({ apiKey, payload, options });
          if (error) {
            res.status(400).json({ error: formatError(error) });
            return;
          }

          const wallet = getWalletFromBlocklet({ blocklet, options });
          // Use doSign from options, default to true if not provided
          const token = await JWT.sign(
            wallet.address,
            wallet.secretKey,
            payload || {},
            options?.doSign ?? true,
            options?.version
          );

          const componentId = req.headers['x-component-did'];
          node
            .createAuditLog({
              action: 'remoteSignJWT',
              args: {
                teamDid: blocklet.meta.did,
                componentId,
                jwtVersion: options?.version,
                payloadContent: stableStringify(payload || {}),
              },
              context: {
                ...formatContext(req),
                user: {
                  did: blocklet.meta.did,
                  fullName: `Component: ${componentId || 'unknown'}`,
                  role: 'blocklet',
                  componentDid: componentId,
                },
              },
              result: { publicKey: wallet.publicKey },
            })
            .catch((err) => logger.error('create remoteSignJWT audit log failed', { error: err }));

          res.json({ token, publicKey: wallet.publicKey });
        } catch (error) {
          logger.error('Failed to sign JWT', {
            error,
            blockletDid: req?.blocklet?.meta?.did,
            componentId: req.headers['x-component-did'],
          });
          res.status(500).json({ error: formatError(error) });
        }
      }
    );

    server.post(
      `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/sign/eth`,
      ensureLocalhost,
      ensureBlocklet(),
      ensureComponentApiKey,
      async (req, res) => {
        try {
          const { blocklet } = req;
          const { data, hashBeforeSign, options, apiKey } = req.body || {};

          // Validate request body
          const { error } = signEthSchema.validate({ apiKey, data, hashBeforeSign, options });
          if (error) {
            res.status(400).json({ error: formatError(error) });
            return;
          }

          // Force ethereum type for ethSign - pass type: 'ethereum' explicitly
          const wallet = getWalletFromBlocklet({
            blocklet,
            options: { ...options, type: 'ethereum' },
          });
          const signature = await wallet.ethSign(data, hashBeforeSign);

          const componentId = req.headers['x-component-did'];
          node
            .createAuditLog({
              action: 'remoteSignETH',
              args: {
                teamDid: blocklet.meta.did,
                componentId,
                hashBeforeSign: !!hashBeforeSign,
                dataContent: data,
              },
              context: {
                ...formatContext(req),
                user: {
                  did: blocklet.meta.did,
                  fullName: `Component: ${componentId || 'unknown'}`,
                  role: 'blocklet',
                  componentDid: componentId,
                },
              },
              result: { publicKey: wallet.publicKey },
            })
            .catch((err) => logger.error('create remoteSignETH audit log failed', { error: err }));

          res.json({ signature, publicKey: wallet.publicKey });
        } catch (error) {
          logger.error('Failed to sign ETH', {
            error,
            blockletDid: req?.blocklet?.meta?.did,
            componentId: req.headers['x-component-did'],
          });
          res.status(500).json({ error: formatError(error) });
        }
      }
    );

    server.post(
      `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/sign/derive`,
      ensureLocalhost,
      ensureBlocklet(),
      ensureComponentApiKey,
      (req, res) => {
        try {
          const { blocklet } = req;
          const { sub, type, index, options, apiKey } = req.body || {};

          // Validate request body
          const { error } = signDeriveSchema.validate({ apiKey, sub, type, index, options });
          if (error) {
            res.status(400).json({ error: formatError(error) });
            return;
          }

          const wallet = getWalletFromBlocklet({ blocklet, options: { type, ...options } });
          const userWallet = fromAppDid(sub, wallet.secretKey, type, index);

          const componentId = req.headers['x-component-did'];
          node
            .createAuditLog({
              action: 'remoteDeriveWallet',
              args: {
                teamDid: blocklet.meta.did,
                componentId,
                sub,
                type,
                index,
              },
              context: {
                ...formatContext(req),
                user: {
                  did: blocklet.meta.did,
                  fullName: `Component: ${componentId || 'unknown'}`,
                  role: 'blocklet',
                  componentDid: componentId,
                },
              },
              result: {
                address: userWallet.address,
                publicKey: userWallet.publicKey,
                type: userWallet.type,
              },
            })
            .catch((err) => logger.error('create remoteDeriveWallet audit log failed', { error: err }));

          res.json(userWallet.toJSON());
        } catch (error) {
          logger.error('Failed to create wallet from app DID', {
            error,
            blockletDid: req?.blocklet?.meta?.did,
            componentId: req.headers['x-component-did'],
          });
          res.status(500).json({ error: formatError(error) });
        }
      }
    );
  },
};
