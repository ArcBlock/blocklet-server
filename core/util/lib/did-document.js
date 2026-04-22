const stringify = require('json-stable-stringify');
const { toBase64, toBase58, toDid, toAddress } = require('@ocap/util');
const { joinURL } = require('ufo');
const pRetry = require('p-retry');
const debug = require('debug')('@abtnode/util:did-document');
const { BLOCKLET_CONFIGURABLE_KEY } = require('@blocklet/constant');

const sleep = require('./sleep');
const axios = require('./axios');
const { encode: encodeBase32 } = require('./base32');

const getDID = (address) => {
  if (!address || typeof address !== 'string') {
    return address;
  }

  if (address.startsWith('did:abt:')) {
    return address;
  }

  return `did:abt:${address}`;
};

const update = async ({
  id,
  services,
  didRegistryUrl,
  wallet,
  alsoKnownAs = [],
  blockletServerVersion,
  name,
  capabilities,
}) => {
  debug('starting update did document', { didRegistryUrl });

  const did = getDID(wallet.address);
  const time = new Date().toISOString();

  const document = {
    '@context': 'https://www.w3.org/ns/did/v1',
    id: toDid(id),
    controller: did,
    service: services,
    alsoKnownAs,
    verificationMethod: [
      {
        id: `${did}#key-1`,
        type: 'Ed25519Signature',
        controller: did,
        publicKeyMultibase: toBase58(wallet.publicKey),
      },
    ],
    authentication: [`${did}#key-1`],
    created: time,
    updated: time,
  };

  if (name) {
    document.name = name;
  }

  if (capabilities) {
    document.capabilities = capabilities;
  }

  const proof = {
    type: 'Ed25519Signature',
    created: time,
    verificationMethod: `${did}#key-1`,
    jws: toBase64(await wallet.sign(stringify(document))),
  };

  document.proof = proof;

  debug('update did document', { didRegistryUrl, document: JSON.stringify(document) });

  return axios.post(joinURL(didRegistryUrl, '/.well-known/did-resolver/registries'), document, {
    timeout: 10 * 1000,
    headers: { 'X-Blocklet-Server-Version': blockletServerVersion },
  });
};

const DEFAULT_RETRY_COUNT = 6;
const DEFAULT_DEBOUNCE_TIME = 3000;

const getRetryCount = () => {
  try {
    let retryCount = parseInt(process.env.ABT_NODE_UPDATE_DID_DOCUMENT_RETRY_COUNT, 10);
    retryCount = Number.isNaN(retryCount) ? DEFAULT_RETRY_COUNT : retryCount;
    debug('get retry count', retryCount);
    return retryCount;
  } catch (error) {
    debug('get retry count error', error);
    return DEFAULT_RETRY_COUNT;
  }
};

const getDebounceTime = () => {
  try {
    let debounceTime = parseInt(process.env.ABT_NODE_DID_DOCUMENT_DEBOUNCE_TIME, 10);
    debounceTime = Number.isNaN(debounceTime) ? DEFAULT_DEBOUNCE_TIME : debounceTime;
    return debounceTime;
  } catch (error) {
    return DEFAULT_DEBOUNCE_TIME;
  }
};

const pendingUpdates = new Map();
const updateTimers = new Map();

const updateWithRetry = (...args) => {
  const params = args[0];
  const did = toDid(params.id);

  return new Promise((resolve, reject) => {
    if (updateTimers.has(did)) {
      clearTimeout(updateTimers.get(did));
      debug('cancelled pending update for did', { did });
    }

    pendingUpdates.set(did, { args, resolve, reject });

    const timer = setTimeout(async () => {
      const pending = pendingUpdates.get(did);
      pendingUpdates.delete(did);
      updateTimers.delete(did);

      if (!pending) {
        return;
      }

      debug('executing debounced update for did', { did });

      try {
        const result = await pRetry(() => update(...pending.args), {
          retries: getRetryCount(),
          onFailedAttempt: async (error) => {
            debug('update did document failed', error);
            if (error.status >= 500 || error.status === 429) {
              await sleep(10 * 1000);
            } else {
              throw error;
            }
          },
        });
        pending.resolve(result);
      } catch (error) {
        pending.reject(error);
      }
    }, getDebounceTime());

    updateTimers.set(did, timer);
    debug('scheduled update for did', { did, debounceTime: getDebounceTime() });
  });
};

const getServerServices = ({ ips, wallet, domain }) => {
  const records = ips.map((ip) => ({
    type: 'A',
    rr: encodeBase32(wallet.address),
    value: ip,
    domain,
  }));

  const services = [
    {
      id: getDID(wallet.address),
      type: 'DNSRecords',
      records,
    },
  ];

  return services;
};

const getBlockletServices = ({
  appPid,
  appAlsoKnownAs = [],
  slpDid,
  daemonDidDomain,
  domain,
  slpDomain,
  serverDid,
}) => {
  const seen = new Set();
  const appPidEncoded = encodeBase32(appPid);
  seen.add(appPidEncoded);

  const records = [
    {
      type: 'CNAME',
      rr: appPidEncoded,
      value: daemonDidDomain,
      domain,
    },
  ];

  // Add CNAME records for migrated application DIDs in alsoKnownAs
  // so that the DID Registry can verify each entry against a DNS record
  for (const did of appAlsoKnownAs) {
    const encoded = encodeBase32(did);
    if (!seen.has(encoded)) {
      seen.add(encoded);
      records.push({
        type: 'CNAME',
        rr: encoded,
        value: daemonDidDomain,
        domain,
      });
    }
  }

  if (slpDid) {
    records.push({
      type: 'CNAME',
      rr: encodeBase32(slpDid),
      value: daemonDidDomain,
      domain: slpDomain,
      derivedFrom: serverDid, // used to verify that the ownership of slpDid is legitimate
    });
  }

  return [
    {
      id: getDID(appPid),
      type: 'DNSRecords',
      records,
    },
  ];
};

// eslint-disable-next-line require-await
const updateServerDocument = async ({ ips, wallet, didRegistryUrl, domain, blockletServerVersion }) => {
  if (['0', 'false', 0, false].includes(process.env.ABT_NODE_DID_DOCUMENT_UPDATE)) {
    throw new Error('Did Document update is disabled');
  }

  const filteredIps = (ips || []).filter(Boolean);
  if (filteredIps.length === 0) {
    throw new Error('No DID Document to update');
  }

  const services = getServerServices({ ips: filteredIps, domain, wallet });

  return updateWithRetry({ id: getDID(wallet.address), services, didRegistryUrl, wallet, blockletServerVersion });
};

// Fetch existing DID document from registry
const getDidDocument = async ({ did, didRegistryUrl }) => {
  const fullDid = getDID(did);
  const resolveUrl = joinURL(didRegistryUrl, '/.well-known/did-resolver/resolve', fullDid);

  debug('fetching did document', { did: fullDid, resolveUrl });

  const response = await axios.get(resolveUrl, {
    timeout: 10 * 1000,
  });

  return response.data?.didDocument || null;
};

// Internal function to update blocklet state only
const updateBlockletStateOnlyInternal = async ({ did, state, didRegistryUrl, wallet, blockletServerVersion }) => {
  if (['0', 'false', 0, false].includes(process.env.ABT_NODE_DID_DOCUMENT_UPDATE)) {
    throw new Error('Did Document update is disabled');
  }

  debug('updating blocklet state only', { did, state });

  // Fetch current DID document from registry
  const currentDoc = await getDidDocument({ did, didRegistryUrl });

  if (!currentDoc) {
    throw new Error(`Failed to fetch DID document for ${did} from registry`);
  }

  // Only update state if the path exists
  if (currentDoc.capabilities?.blocklet?.metadata) {
    currentDoc.capabilities.blocklet.metadata.state = state;
  } else {
    throw new Error(`DID document for ${did} does not have capabilities.blocklet.metadata structure`);
  }

  // Update timestamp
  const time = new Date().toISOString();
  currentDoc.updated = time;

  // Remove old proof before re-signing
  delete currentDoc.proof;

  // Generate new proof with updated document
  const controllerDid = getDID(wallet.address);
  const proof = {
    type: 'Ed25519Signature',
    created: time,
    verificationMethod: `${controllerDid}#key-1`,
    jws: toBase64(await wallet.sign(stringify(currentDoc))),
  };

  currentDoc.proof = proof;

  debug('update blocklet state only - sending to registry', { did, state, didRegistryUrl });

  // Send directly to registry without reconstructing
  return axios.post(joinURL(didRegistryUrl, '/.well-known/did-resolver/registries'), currentDoc, {
    timeout: 10 * 1000,
    headers: { 'X-Blocklet-Server-Version': blockletServerVersion },
  });
};

// Update only blocklet state (e.g., to 'deleted') by fetching current document from registry with retry
// This function preserves the complete DID document structure and only modifies the state field
const updateBlockletStateOnly = (params) => {
  debug('updateBlockletStateOnly with retry', { did: params.did });

  return pRetry(() => updateBlockletStateOnlyInternal(params), {
    retries: getRetryCount(),
    onFailedAttempt: async (error) => {
      debug('update blocklet state only failed', error);
      await sleep(10 * 1000);
    },
  });
};

const updateBlockletDocument = ({
  blocklet,
  slpDid,
  wallet,
  didRegistryUrl,
  domain,
  slpDomain,
  daemonDidDomain,
  alsoKnownAs = [],
  serverDid,
  blockletServerVersion,
  name,
  state,
  owner,
  launcher,
  domains,
}) => {
  const appPid = blocklet.appPid || blocklet.meta?.did;
  if (['0', 'false', 0, false].includes(process.env.ABT_NODE_DID_DOCUMENT_UPDATE)) {
    throw new Error('Did Document update is disabled');
  }

  // Filter alsoKnownAs to application DIDs only (exclude slpDid),
  // so getBlockletServices can add DNS records for migrated DIDs
  const appAlsoKnownAs = alsoKnownAs
    .filter((did) => !slpDid || toAddress(did) !== toAddress(slpDid))
    .map((did) => toAddress(did));

  const services = getBlockletServices({
    appPid,
    appAlsoKnownAs,
    slpDid,
    daemonDidDomain,
    domain,
    slpDomain,
    serverDid,
  });

  const tagMap = new Set(blocklet.meta?.keywords || []);
  tagMap.add('type:blocklet');

  const metadata = {
    name: blocklet.environments.find((x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_NAME)?.value,
    description: blocklet.environments.find((x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_DESCRIPTION)?.value,
    icon: blocklet.environments.find((x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO)?.value,
    tags: [],
    state,
    owner,
  };

  if (launcher) {
    tagMap.add('launcher:app');
    metadata.launcher = launcher;
  }

  metadata.tags = Array.from(tagMap);

  const capabilities = {
    blocklet: {
      metadata,
      domains,
    },
  };

  debug('update blocklet document', { appPid, capabilities });

  return updateWithRetry({
    id: appPid,
    services,
    didRegistryUrl,
    alsoKnownAs,
    wallet,
    blockletServerVersion,
    name,
    capabilities,
  });
};

module.exports = {
  DEFAULT_RETRY_COUNT,
  DEFAULT_DEBOUNCE_TIME,
  updateServerDocument,
  updateBlockletDocument,
  updateBlockletStateOnly,
  getDidDocument,
  getDID,
  getServerServices,
  getBlockletServices,
  updateWithRetry,
  getRetryCount,
  getDebounceTime,
};
