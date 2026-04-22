const isUrl = require('is-url');
const Client = require('@ocap/client');
const { isValid } = require('@arcblock/did');
const { joinURL } = require('ufo');
const { api } = require('./api');

/**
 * @description
 * @param {string} endpoint
 * @return {string}
 */
function getDIDSpacesUrlFromDisplayUrl(endpoint) {
  if (!isUrl(endpoint)) {
    throw new Error(`Endpoint(${endpoint}) is not a valid url`);
  }

  return endpoint.replace(/\/api\/.+/, '');
}

/**
 * @description
 * @param {{
 *  chainHost: string,
 *  assetDid: string,
 * }} { chainHost, assetDid }
 * @return {Promise<{
 *  didSpacesCoreUrl: string,
 *  assetDid: string
 * }>}
 */
async function getDidSpaceInfoByAsset({ chainHost, assetDid }) {
  if (!isValid(assetDid)) {
    throw new Error(`Invalid asset did(${assetDid})`);
  }

  const client = new Client(chainHost);
  /** @type {{ state: import('@ocap/client').AssetState }} */
  const { state } = await client.getAssetState({ address: assetDid });

  const didSpacesCoreUrl = getDIDSpacesUrlFromDisplayUrl(state.display.content);

  return {
    didSpacesCoreUrl,
    assetDid,
  };
}
/**
 * @description
 * @param {{ vcClaim: any }} { vcClaim }
 * @return {{
 *  didSpacesCoreUrl: string,
 *  spaceDid: string,
 * }}
 */
async function getDidSpaceInfoByVC({ vcClaim }) {
  const vcData = JSON.parse(JSON.parse(vcClaim.presentation).verifiableCredential[0]);

  /**
   *  @type {{
   *    appAuth: {
   *      appUrl?: string,
   *      spaceDid: string,
   *      endpoint?: string,
   *    }
   * }}
   * */
  const { appAuth } = vcData.credentialSubject;
  const spacesAnyUrl = appAuth.appUrl || appAuth.endpoint;

  if (!spacesAnyUrl) {
    throw new Error('Unable to find any valid space paths');
  }

  const didSpacesCoreUrl = await getDidSpacesCoreUrl(spacesAnyUrl);

  return {
    didSpacesCoreUrl,
    spaceDid: appAuth.spaceDid,
  };
}

/**
 * @description
 * @param {string} spacesAnyUrl
 * @param {{ timeout: number }} [options={ timeout: 5000 }]
 * @return {Promise<string>}
 */
async function getDidSpacesCoreUrl(spacesAnyUrl, options = { timeout: 5000 }) {
  const u = new URL(spacesAnyUrl);

  /** @type {{ data: import('@blocklet/sdk').WindowBlocklet }} */
  const { data: blockletMeta } = await api.get(joinURL(u.origin, '/__blocklet__.js?type=json'), {
    timeout: options.timeout,
  });

  /** @type {string} */
  const mountPoint = blockletMeta.componentMountPoints.find(
    (x) => x.did === 'z8iZnaYxnkMD5AKRjTKiCb8pQr1ut8UantAcf'
  )?.mountPoint;

  if (!mountPoint) {
    throw new Error(`MountPoint(${mountPoint}) not found`);
  }

  return joinURL(u.origin, mountPoint);
}

/**
 * @typedef {{
 *    didSpacesCoreUrl: string,
 *    spaceDid?: string,
 *    assetDid?: string, // spaceDid, assetDid 必定会存在一个
 * }} DidSpaceInfo
 * @typedef {{
 *    appDid: string,
 *    appName: string,
 *    appDescription: string,
 *    scopes: string,
 *    appUrl: string,
 *    referer: string,
 * }} DidSpaceExtraParams
 * @typedef {{
 *    claims: any[],
 *    challenge: any,
 *    locale: 'en' | 'zh',
 * }} DidSpaceVerifyNFTParams
 */

/**
 * @description
 * @param {{ claims: any[] }} { claims }
 * @return {Promise<DidSpaceInfo>}
 */
function getDidSpacesInfoByClaims({ claims }) {
  const assetOrVcClaim = claims.find(
    (x) => x?.meta?.purpose === 'DidSpace' && ['asset', 'verifiableCredential'].includes(x.type)
  );
  if (!assetOrVcClaim) {
    // 说明 DID Spaces 对于应用来说不是必要的
    return null;
  }

  const isAssetClaim = assetOrVcClaim.type === 'asset';
  if (isAssetClaim) {
    return getDidSpaceInfoByAsset({
      chainHost: getChainHostByAssetChainId(assetOrVcClaim.assetChainId),
      assetDid: assetOrVcClaim.asset,
    });
  }
  return getDidSpaceInfoByVC({ vcClaim: assetOrVcClaim });
}

/**
 * @description
 * @param {DidSpaceInfo} didSpaceInfo
 * @param {{
 *  extrasParams: DidSpaceExtraParams,
 *  verifyNFTParams: DidSpaceVerifyNFTParams
 * }} { extrasParams, verifyNFTParams }
 * @return {*}
 */
async function silentAuthorizationInConnect(didSpaceInfo, data) {
  const silentAuthorizationUrl = joinURL(didSpaceInfo.didSpacesCoreUrl, '/api/space/silent-authorization');

  const res = await api.put(silentAuthorizationUrl, data, {
    params: {
      spaceDid: didSpaceInfo.spaceDid,
      assetDid: didSpaceInfo.assetDid,
    },
  });

  return res;
}
const CHAIN_HOST_MAP = {
  beta: 'https://beta.abtnetwork.io/api/',
  'xenon-2020-01-15': 'https://main.abtnetwork.io/api/',
};
function getChainHostByAssetChainId(assetChainId) {
  if (assetChainId in CHAIN_HOST_MAP) {
    return CHAIN_HOST_MAP[assetChainId];
  }

  throw new Error(`Unknown asset chain id(${assetChainId})`);
}

module.exports = {
  getDIDSpacesUrlFromDisplayUrl,
  getDidSpacesInfoByClaims,
  silentAuthorizationInConnect,
};
