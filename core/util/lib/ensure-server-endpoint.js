const { joinURL } = require('ufo');
const { default: axios } = require('axios');
const { WELLKNOWN_DID_RESOLVER_PREFIX } = require('@abtnode/constant');
const { getDidDomainForBlocklet } = require('./get-domain-for-blocklet');

const BLOCKLET_JSON_PATH = '__blocklet__.js?type=json';

const ensureServerEndpoint = async (endpoint) => {
  let serverBaseUrl;
  let appPid;
  let appName;
  let appDescription;

  const jsonPathUrl = joinURL(new URL(endpoint).origin, BLOCKLET_JSON_PATH);

  const checkEndpoint = await axios(jsonPathUrl).catch(() => null);
  const contentType = checkEndpoint && checkEndpoint.headers['content-type'];
  if (contentType?.includes('application/json')) {
    const url = getDidDomainForBlocklet({ did: checkEndpoint.data.serverDid });
    // service endpoint
    serverBaseUrl = new URL(`https://${url}`).origin;
    appPid = checkEndpoint.data.appPid;
    appName = checkEndpoint.data.appName;
    appDescription = checkEndpoint.data.appDescription;
  } else {
    // maybe server endpoint
    serverBaseUrl = new URL(endpoint).origin;
    appPid = '';
  }

  if (!serverBaseUrl) {
    throw new Error('Invalid endpoint');
  }

  // local debug
  if (serverBaseUrl.includes('localhost:3000')) {
    return {
      endpoint: serverBaseUrl,
      appPid,
    };
  }

  const didJsonUrl = joinURL(serverBaseUrl, WELLKNOWN_DID_RESOLVER_PREFIX);
  const didJson = await axios(didJsonUrl);

  const didJsonContentType = didJson.headers['content-type'];
  if (!didJsonContentType.includes('application/json')) {
    throw new Error('Invalid endpoint');
  }

  return {
    endpoint: joinURL(serverBaseUrl, didJson?.data?.services?.[0]?.path),
    appPid,
    appName,
    appDescription,
  };
};

module.exports = ensureServerEndpoint;
