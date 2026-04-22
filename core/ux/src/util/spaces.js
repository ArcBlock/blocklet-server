import isUrl from 'is-url';
import { BLOCKLET_CONFIGURABLE_KEY } from '@blocklet/constant';
import isString from 'lodash/isString';
import isObject from 'lodash/isObject';
import { joinURL, withQuery } from 'ufo';
import { api } from './api';

/* eslint-disable import/prefer-default-export */

/**
 * @typedef {import('../contexts/config-space').SpaceGateway} SpaceGateway
 */

/**
 * FIXME: move this into the SDK later
 * @description
 * @param {string} endpoint
 * @returns {string}
 */
export function getBackupFilesUrlFromEndpoint(endpoint) {
  const prefix = endpoint.replace(/\/api\/space\/.+/, '');

  const strArray = endpoint.replace(/\/$/, '').split('/');
  const spaceDid = strArray.at(-4);
  const appDid = strArray.at(-2);

  return joinURL(prefix, 'space', spaceDid, 'apps', appDid, `explorer?key=/apps/${appDid}/.did-objects/${appDid}/`);
}

/**
 * FIXME: move this into the SDK later
 * @description
 * @param {string} endpoint
 * @returns {string}
 */
export function getDIDSpaceUrlFromEndpoint(endpoint) {
  const prefix = endpoint.replace(/\/api\/space\/.+/, '');

  const strArray = endpoint.replace(/\/$/, '').split('/');
  const spaceDid = strArray.at(-4);

  return joinURL(prefix, 'space', spaceDid);
}

/**
 * FIXME: move this into the SDK later
 * @description
 * @param {string} endpoint
 * @returns {string}
 */
export function getDIDSpaceDidFromEndpoint(endpoint) {
  const strArray = endpoint.replace(/\/$/, '').split('/');
  const spaceDid = strArray.at(-4);

  return spaceDid;
}

/**
 * @description
 * @export
 * @param {string} endpoint
 * @return {Promise<boolean>}
 */
export async function hasPermissionByEndpoint(endpoint) {
  try {
    if (!isUrl(endpoint)) {
      return false;
    }

    const { headers } = await api.head(endpoint, {
      timeout: 5000,
    });

    return headers['x-listable'] === 'true' && headers['x-readable'] === 'true' && headers['x-writeable'] === 'true';
  } catch (error) {
    console.error(error);
    return false;
  }
}

/**
 * @description
 * @export
 * @param {import('@blocklet/server-js').ConfigEntry[]} environments
 * @return {string}
 */
export function getSpaceBackupEndpoint(environments) {
  return environments?.find((e) => e.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_BACKUP_ENDPOINT)?.value || '';
}

/**
 * @description
 * @export
 * @param {string} endpoint
 * @return {string}
 */
export function getSpaceGatewayFromEndpoint(endpoint) {
  return endpoint?.replace(/\/api\/space\/.+/, '');
}

/**
 * @description
 * @export
 * @param {string} url
 * @return {string}
 */
export function extraDIDSpacesCoreUrl(url) {
  const Url = new URL(url);
  // @note: 去除查询参数的那部分字符串
  const didSpacesCoreUrl = joinURL(Url.origin, Url.pathname);

  return didSpacesCoreUrl;
}

/**
 * @description
 * @export
 * @param {string} spaceGatewayUrl
 * @return {Promise<boolean>}
 */
export async function isValidSpaceGatewayUrl(spaceGatewayUrl) {
  try {
    if (!isUrl(spaceGatewayUrl)) {
      return false;
    }

    const didSpacesCoreUrl = extraDIDSpacesCoreUrl(spaceGatewayUrl);
    const didConnectTokenUrl = joinURL(didSpacesCoreUrl, 'space/api/did/one-click-authorization/token');

    const { status, data } = await api.get(didConnectTokenUrl, {
      timeout: 5000,
    });
    // note: data 必定返回一个对象才行，如果 data 返回了一个非对象，说明失败了，此时可能返回了前端的 404 页面的 html
    return status === 200 && isObject(data);
  } catch (error) {
    console.error(error);
    return false;
  }
}

/**
 * @description
 * @export
 * @param {string} endpoint
 * @return {Promise<string >}
 */
export async function getSpaceNameByEndpoint(endpoint, { timeout } = { timeout: 3000 }) {
  try {
    if (!isUrl(endpoint)) {
      return '';
    }

    const { headers } = await api.head(endpoint, {
      timeout,
    });

    const spaceName = headers['x-space-name'];

    return spaceName ? decodeURIComponent(spaceName) : '';
  } catch (error) {
    console.error(error);
    return '';
  }
}
/**
 * @description
 * @export
 * @param {string} endpoint
 * @return {string}
 */
export function getSpaceNftDisplayUrlFromEndpoint(endpoint) {
  const prefix = endpoint.replace(/\/api\/space\/.+/, '');

  const strArray = endpoint.replace(/\/$/, '').split('/');
  const spaceDid = strArray.at(-4);

  return joinURL(prefix, `/api/space/nft/display?spaceDid=${spaceDid}`);
}

/**
 * @description
 * @param {import('@blocklet/server-js').BlockletState} blocklet
 * @return {string}
 */
export const getDIDSpaceEndpoint = (blocklet) => {
  return (
    blocklet?.configs?.find((item) => item.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SPACE_ENDPOINT)?.value || null
  );
};

/**
 * @description
 * @export
 * @param {string} endpoint
 * @returns {Promise<SpaceGateway>}
 */
export async function getSpaceGateway(endpoint) {
  /** @type {SpaceGateway} */
  const spaceGateway = {};

  spaceGateway.did = getDIDSpaceDidFromEndpoint(endpoint);
  spaceGateway.name = await getSpaceNameByEndpoint(endpoint);
  spaceGateway.url = getSpaceGatewayFromEndpoint(endpoint);
  spaceGateway.endpoint = endpoint;

  return spaceGateway;
}

/**
 * @description
 * @export
 * @param {string} anyUrl
 * @param {{
 *  timeout: number,
 *  withSearchParams: true | false,
 * }} options
 * @returns {Promise<string>}
 */
export async function getSpaceGatewayUrl(anyUrl, options = { timeout: 30000, withSearchParams: true }) {
  if (!isString(anyUrl)) {
    throw new Error(`url(${anyUrl}) must be a string`);
  }

  const url = anyUrl.startsWith('http') ? anyUrl : `https://${anyUrl}`;
  const u = new URL(url);

  /** @type {{ data: import('@blocklet/sdk').WindowBlocklet }} */
  const { data: blockletMeta } = await api.get(joinURL(u.origin, '/__blocklet__.js?type=json'), {
    timeout: options.timeout,
  });

  /** @type {string} */
  const mountPoint = blockletMeta.componentMountPoints.findLast(
    (x) => x.did === 'z8iZnaYxnkMD5AKRjTKiCb8pQr1ut8UantAcf'
  )?.mountPoint;

  if (!mountPoint) {
    throw new Error(`MountPoint(${mountPoint}) not found`);
  }

  const didSpacesCoreUrl = joinURL(u.origin, mountPoint);
  const spaceGatewayUrl =
    options.withSearchParams && u.searchParams.get('spaceDid')
      ? withQuery(didSpacesCoreUrl, {
          spaceDid: u.searchParams.get('spaceDid'),
        })
      : didSpacesCoreUrl;

  return spaceGatewayUrl;
}
