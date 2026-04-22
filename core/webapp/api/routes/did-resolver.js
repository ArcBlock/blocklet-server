const {
  WELLKNOWN_DID_RESOLVER_PREFIX,
  WELLKNOWN_SERVER_ADMIN_PATH,
  WELLKNOWN_SERVICE_PATH_PREFIX,
} = require('@abtnode/constant');
const { BlockletStatus } = require('@blocklet/constant');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const { toDid, toBase58 } = require('@ocap/util');
const { joinURL } = require('ufo');

const getDidDocumentMiddleware = node => async (req, res) => {
  const server = await node.getNodeInfo();
  if (!server) {
    return res.status(404).json({ message: 'Service can not be found' });
  }

  const blockletDid = req.get('x-blocklet-did') || server.did;
  let info = null;
  let appId = server.did;
  let { did } = server;
  const alsoKnownAs = [];
  const services = [];

  if (blockletDid !== server.did) {
    const blocklet = await node.getBlocklet({ did: blockletDid });
    if (!blocklet) {
      return res.status(404).json({ message: 'Service can not be found' });
    }

    appId = blocklet.appPid || blocklet.appDid;
    did = blockletDid;
    info = getBlockletInfo(blocklet, server.sk);

    if (Array.isArray(blocklet.migratedFrom)) {
      alsoKnownAs.push(did);
      blocklet.migratedFrom.forEach(x => {
        alsoKnownAs.push(x.appDid);
      });
    }

    services.push({
      id: toDid(appId),
      type: 'blocklet',
      path: joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/admin'),
      metadata: {
        name: info.name,
        description: info.description,
        version: blocklet.meta?.version || '1.0.0',
        running: blocklet.status === BlockletStatus.running,
      },
    });
  } else {
    services.push({
      id: toDid(appId),
      type: 'server',
      path: server.routing?.adminPath || WELLKNOWN_SERVER_ADMIN_PATH,
      metadata: {
        name: server.name,
        description: server.description,
        initialized: server.initialized,
        version: server.version,
        mode: server.mode,
      },
    });
  }

  const document = {
    id: toDid(appId),
    alsoKnownAs: alsoKnownAs.map(d => toDid(d)),
    controller: toDid(server.did),
    services,
    verificationMethod: [
      {
        id: `${did}#key-1`,
        type: 'Ed25519Signature',
        controller: toDid(appId),
        publicKeyMultibase: info ? toBase58(info.wallet.publicKey) : toBase58(server.pk),
      },
    ],
  };

  return res.json(document);
};

module.exports = {
  init(app, node) {
    app.get(WELLKNOWN_DID_RESOLVER_PREFIX, getDidDocumentMiddleware(node));
  },
  getDidDocumentMiddleware,
};
