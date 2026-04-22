const jwt = require('jsonwebtoken');
const pick = require('lodash/pick');

const { AUTH_CERT_TYPE, WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { BLOCKLET_TENANT_MODES } = require('@blocklet/constant');

const proxyToDaemon = ({ proxy, node }) => {
  const getToken = async (did, tenantMode, user, settings) =>
    jwt.sign(
      {
        type: AUTH_CERT_TYPE.BLOCKLET_USER,
        did: user.did,
        role: user.role,
        tenantMode,
        blockletDid: did,
        elevated: user.elevated,
        kyc: user.kyc,
        provider: user.provider,
        esh: settings?.enableSessionHardening, // ensureBlockletSettings.enableSessionHardening, 方便 proxy gql 中获取 blocklet SessionHardening
      },
      await node.getSessionSecret(),
      { expiresIn: '1h' }
    );

  return async (req, res) => {
    req.url = (req.originalUrl || '/').replace(WELLKNOWN_SERVICE_PATH_PREFIX, '');
    // did returned ty req.getBlockletDid() is blocklet.meta.did
    // the blocklet.meta.did is always the same as appPid in structV2 application
    const did = req.getBlockletDid();
    const blocklet = await req.getBlocklet();

    const token = await getToken(
      did,
      req.tenantMode || BLOCKLET_TENANT_MODES.SINGLE,
      pick(req.user, ['did', 'role', 'elevated', 'kyc', 'provider']),
      blocklet?.settings
    );

    req.headers.source = 'blocklet-service';
    req.headers.authorization = `Bearer ${token}`;
    proxy.safeWeb(req, res, {
      target: `http://127.0.0.1:${process.env.ABT_NODE_PORT}`,
    });
  };
};

module.exports = proxyToDaemon;
