const { BLOCKLET_CONFIGURABLE_KEY } = require('@blocklet/constant');
const { default: axios } = require('axios');
const isUrl = require('is-url');
const isArray = require('lodash/isArray');
const isEmpty = require('lodash/isEmpty');
const { joinURL, withQuery } = require('ufo');

/**
 * @description
 * @param {import('@blocklet/server-js').ConfigEntry[]} configs
 * @return {string | null}
 */
const getBackupEndpoint = (configs) => {
  if (!isArray(configs) || isEmpty(configs)) {
    return '';
  }

  return configs.find((config) => config.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_BACKUP_ENDPOINT)?.value || null;
};

/**
 * FIXME: move this into the SDK later
 * @description
 * @param {string} endpoint
 * @returns {string}
 */
function getBackupFilesUrlFromEndpoint(endpoint) {
  if (isEmpty(endpoint)) {
    throw new Error(`Endpoint(${endpoint}) cannot be empty`);
  }

  const prefix = endpoint.replace(/\/api\/space\/.+/, '');

  const strArray = endpoint.replace(/\/$/, '').split('/');
  const spaceDid = strArray.at(-4);
  const appDid = strArray.at(-2);

  return withQuery(joinURL(prefix, 'space', spaceDid, 'apps', appDid, 'explorer'), {
    key: `/apps/${appDid}/.did-objects/${appDid}/`,
  });
}

function getDIDSpacesUrlFromEndpoint(endpoint) {
  if (!isUrl(endpoint)) {
    throw new Error(`Endpoint(${endpoint}) is not a valid url`);
  }

  return endpoint.replace(/\/api\/space\/.+/, '');
}

/**
 * @description
 * @export
 * @param {string} endpoint
 * @param {string} [defaultValue='DID Space']
 * @return {Promise<string >}
 */
async function getSpaceNameByEndpoint(endpoint, defaultValue = '') {
  try {
    if (!isUrl(endpoint)) {
      return '';
    }

    const { headers } = await axios.head(endpoint, {
      timeout: 3000,
    });

    const spaceName = headers['x-space-name'];

    return spaceName ? decodeURIComponent(spaceName) : defaultValue;
  } catch (error) {
    console.error(error);
    return defaultValue;
  }
}

/**
 * @description
 * @param {string} did
 * @return {string}
 */
function getBackupJobId(did) {
  return `${did}.backupToSpaces`;
}

/**
 * @description
 * @param {string} did
 * @return {string}
 */
function getCheckUpdateJobId(did) {
  return `${did}.checkUpdate`;
}

module.exports = {
  getBackupEndpoint,
  getBackupFilesUrlFromEndpoint,
  getDIDSpacesUrlFromEndpoint,
  getSpaceNameByEndpoint,
  getBackupJobId,
  getCheckUpdateJobId,
};
