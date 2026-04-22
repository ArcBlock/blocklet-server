const { withoutTrailingSlash } = require('ufo');
const logger = require('@abtnode/logger')('@abtnode/core:api:team:store');
const ensureServerEndpoint = require('@abtnode/util/lib/ensure-server-endpoint');

const StoreUtil = require('../../util/store');

const sanitizeUrl = (url) => {
  if (!url) {
    throw new Error('Registry URL should not be empty');
  }

  return url.trim();
};

/**
 * Add store
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.url - Store URL
 * @param {string} params.scope - Scope
 * @param {Object} context
 * @returns {Promise<Object>}
 */
// eslint-disable-next-line no-unused-vars
async function addStore(api, { teamDid, url, scope = '' }, context) {
  logger.info('add store', { teamDid, url, scope });

  const sanitized = withoutTrailingSlash(await StoreUtil.getStoreUrl(url));
  const storeList = await api.teamManager.getStoreList(teamDid);
  const exists = storeList.some((x) => {
    if (x.url === sanitized) {
      if (!x.scope) {
        return true;
      }

      return x.scope === scope;
    }

    return false;
  });

  if (exists) {
    throw new Error(`Blocklet Store already exist: ${sanitized}`);
  }

  const store = await StoreUtil.getStoreMeta(sanitized);

  storeList.push({ ...store, scope, url: sanitized, protected: false });

  return api.teamManager.updateStoreList(teamDid, storeList);
}

/**
 * Add endpoint
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.url - Endpoint URL
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function addEndpoint(api, { teamDid, url }, context) {
  const userDid = context?.user?.did;
  const { endpoint, appPid, appName, appDescription } = await ensureServerEndpoint(url);
  const endpointList = await api.teamManager.getEndpointList(teamDid);

  if (!appPid) {
    throw new Error('current url not blocklet url');
  }

  if (!endpoint) {
    throw new Error('current url not blocklet url');
  }

  const index = endpointList.findIndex((x) => x.id === appPid);
  if (index !== -1) {
    endpointList[index].url = url;
  } else {
    endpointList.push({ id: appPid, appName, appDescription, scope: userDid, url, endpoint, protected: false });
  }

  return api.teamManager.updateEndpointList(teamDid, endpointList);
}

/**
 * Delete endpoint
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.did - Endpoint DID
 * @param {string} params.projectId - Project ID
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function deleteEndpoint(api, { teamDid, did, projectId }, context) {
  const endpointList = await api.teamManager.getEndpointList(teamDid);

  const index = endpointList.findIndex((x) => x.id === did);
  if (index === -1) {
    throw new Error(`Blocklet Endpoint does not exist: ${did}`);
  }
  endpointList.splice(index, 1);

  if (projectId) {
    const { projectState } = await api.teamManager.getProjectState(teamDid);
    await projectState.deleteConnectedEndpoint({ projectId, endpointId: did, createdBy: context?.user?.did });
  }

  return api.teamManager.updateEndpointList(teamDid, endpointList);
}

/**
 * Check if store exists
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.url - Store URL
 * @param {string} params.scope - Scope
 * @param {Object} context
 * @returns {Promise<boolean>}
 */
async function existsStore(api, { teamDid, url, scope }, context) {
  const sanitized = withoutTrailingSlash(await StoreUtil.getStoreUrl(url));
  const storeList = await api.teamManager.getStoreList(teamDid);
  const did = context?.user?.did;
  const exists = storeList.some((x) => {
    if (x.url !== sanitized) {
      return false;
    }
    if (x.scope && x.scope === did) {
      return true;
    }
    if (!x.scope || x.scope === 'studio') {
      return true;
    }
    return x.scope === scope;
  });

  return exists;
}

/**
 * Delete store
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.url - Store URL
 * @param {string} params.projectId - Project ID
 * @param {string} params.scope - Scope
 * @param {Object} context
 * @returns {Promise<Object>}
 */
// eslint-disable-next-line no-unused-vars
async function deleteStore(api, { teamDid, url, projectId, scope }, context) {
  logger.info('delete registry', { url });
  const sanitized = sanitizeUrl(url);

  const storeList = await api.teamManager.getStoreList(teamDid);
  let storeIndex;
  if (scope) {
    storeIndex = storeList.findIndex((x) => {
      if (x.protected) {
        return false;
      }
      return x.url === sanitized && x.scope === scope;
    });
    if (storeIndex === -1) {
      throw new Error(`No permission to delete the Store registry: ${sanitized}`);
    }
  } else {
    storeIndex = storeList.findIndex((x) => x.url === sanitized && !x.scope);
    if (storeIndex === -1) {
      throw new Error(`Store registry does not exist: ${sanitized}`);
    }
  }

  if (projectId && scope) {
    const { projectState } = await api.teamManager.getProjectState(teamDid);
    const store = await StoreUtil.getStoreMeta(sanitized);
    await projectState.deleteConnectedStore({
      projectId,
      storeId: store.id,
      createdBy: scope === 'studio' ? null : context?.user?.did,
    });
  }
  storeList.splice(storeIndex, 1);
  return api.teamManager.updateStoreList(teamDid, storeList);
}

module.exports = {
  sanitizeUrl,
  addStore,
  addEndpoint,
  deleteEndpoint,
  existsStore,
  deleteStore,
};
