/**
 * DID Document Module
 *
 * Functions for managing blocklet DID documents
 * Extracted from blocklet.js for better modularity
 */

const isEmpty = require('lodash/isEmpty');

const { toDid, toBuffer } = require('@ocap/util');
const { fromPublicKey } = require('@ocap/wallet');
const logger = require('@abtnode/logger')('@abtnode/core:util:blocklet:did-document');
const { isCustomDomain } = require('@abtnode/util/lib/url-evaluation');
const { isInServerlessMode } = require('@abtnode/util/lib/serverless');
const md5 = require('@abtnode/util/lib/md5');
const didDocument = require('@abtnode/util/lib/did-document');
const { SLOT_FOR_IP_DNS_SITE } = require('@abtnode/constant');
const { BLOCKLET_CONFIGURABLE_KEY, fromBlockletStatus } = require('@blocklet/constant');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const { fixAvatar } = require('@blocklet/sdk/lib/util/user');

const { getServerDidDomain, replaceDomainSlot } = require('../index');
const { getFromCache: getAccessibleExternalNodeIp } = require('../get-accessible-external-node-ip');

/**
 * Check if SLP domain should be enabled based on mode
 * @param {string} mode - Node mode
 * @returns {boolean}
 */
const shouldEnableSlpDomain = (mode) => {
  if (process.env.ABT_NODE_ENABLE_SLP_DOMAIN === 'true') {
    return true;
  }

  if (process.env.ABT_NODE_ENABLE_SLP_DOMAIN === 'false') {
    return false;
  }

  return isInServerlessMode({ mode });
};

/**
 * Get SLP DID from server DID and app permanent ID
 * @param {string} serverDid - Server DID
 * @param {string} appPid - App permanent ID
 * @returns {string} SLP DID address
 */
const getSlpDid = (serverDid, appPid) => {
  if (!serverDid || !appPid) {
    throw new Error('serverDid and appPid is required');
  }

  const buffer = Buffer.concat([toBuffer(serverDid), toBuffer(appPid)]);
  const md5Str = md5(buffer);

  const wallet = fromPublicKey(md5Str);
  return wallet.address;
};

/**
 * Get blocklet known as (alias DIDs)
 * @param {object} blocklet - Blocklet object
 * @returns {string[]} Array of DIDs
 */
const getBlockletKnownAs = (blocklet) => {
  const alsoKnownAs = [blocklet.appDid];
  if (Array.isArray(blocklet.migratedFrom)) {
    blocklet.migratedFrom
      .filter((x) => x.appDid !== blocklet.appPid || blocklet.meta?.did)
      .forEach((x) => alsoKnownAs.push(x.appDid));
  }

  return alsoKnownAs.filter(Boolean).map(toDid);
};

/**
 * Publish DID document for a blocklet
 * @param {object} options - Options
 * @param {object} options.blocklet - Blocklet object
 * @param {object} options.ownerInfo - Owner info
 * @param {object} options.nodeInfo - Node info
 */
// eslint-disable-next-line require-await
const publishDidDocument = async ({ blocklet, ownerInfo, nodeInfo }) => {
  const alsoKnownAs = getBlockletKnownAs(blocklet);
  logger.debug('updateDidDocument blocklet info', { blocklet });

  const { wallet } = getBlockletInfo(blocklet, nodeInfo.sk);
  const { mode, did: serverDid } = nodeInfo;

  let slpDid = null;
  const enableSlpDomain = shouldEnableSlpDomain(mode);
  if (enableSlpDomain) {
    slpDid = getSlpDid(serverDid, blocklet.meta.did);

    if (alsoKnownAs.indexOf(slpDid) === -1) {
      alsoKnownAs.push(toDid(slpDid));
    }
  }

  logger.info('update did document', {
    blockletDid: blocklet.meta.did,
    alsoKnownAs,
    slpDid,
    daemonDidDomain: getServerDidDomain(nodeInfo),
    didRegistryUrl: nodeInfo.didRegistry,
    domain: nodeInfo.didDomain,
    slpDomain: nodeInfo.slpDomain,
  });

  const name = blocklet.meta?.title || blocklet.meta?.name;
  const state = fromBlockletStatus(blocklet.status);

  let launcher;
  if (!isEmpty(blocklet.controller)) {
    launcher = {
      did: toDid(blocklet.controller.did || nodeInfo.registerInfo.appPid), // 目前 controller 没有 launcher 的元信息, 默认在 nodeInfo 中存储
      name: blocklet.controller.launcherName || nodeInfo.registerInfo.appName || '',
      url: blocklet.controller.launcherUrl || nodeInfo.registerInfo.appUrl || '',
      userDid: toDid(blocklet.controller.nftOwner),
    };
  }

  const isPrimaryDomain = (d) => {
    const appUrl = blocklet.environments.find((x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_URL)?.value;
    if (!appUrl) {
      return false;
    }

    try {
      const url = new URL(appUrl);
      return url.hostname === d;
    } catch (error) {
      logger.error('failed to get primary domain', { error, domain: d, appUrl });
      return false;
    }
  };

  const domains = await Promise.all(
    (blocklet.site?.domainAliases || []).map(async (item) => {
      let type = isCustomDomain(item.value) ? 'custom' : 'internal';
      // 如果域名是 appUrl，则设置为 primary
      if (isPrimaryDomain(item.value)) {
        type = 'primary';
      }

      if (item.value.includes(SLOT_FOR_IP_DNS_SITE)) {
        const nodeIp = await getAccessibleExternalNodeIp();
        item.value = replaceDomainSlot({ domain: item.value, nodeIp });
      }

      return {
        type,
        host: item.value,
        url: `https://${item.value}`,
        source: 'dnsRecords', // 固定为 dnsRecords
      };
    })
  );

  let owner;
  if (ownerInfo) {
    owner = {
      did: toDid(ownerInfo.did),
      name: ownerInfo.fullName,
      avatar: fixAvatar(ownerInfo.avatar),
    };
  }

  return didDocument.updateBlockletDocument({
    blocklet,
    wallet,
    alsoKnownAs,
    slpDid,
    daemonDidDomain: getServerDidDomain(nodeInfo),
    didRegistryUrl: nodeInfo.didRegistry,
    domain: nodeInfo.didDomain,
    slpDomain: nodeInfo.slpDomain,
    serverDid,
    blockletServerVersion: nodeInfo.version,
    name,
    state,
    owner,
    launcher,
    domains,
  });
};

/**
 * Update DID document for a blocklet
 * @param {object} options - Options
 * @param {string} options.did - Blocklet DID
 * @param {object} options.nodeInfo - Node info
 * @param {object} options.teamManager - Team manager
 * @param {object} options.states - State managers
 */
const updateDidDocument = async ({ did, nodeInfo, teamManager, states }) => {
  const blocklet = await states.blocklet.getBlocklet(did);
  const blockletExtra = await states.blockletExtras.findOne({ did });

  blocklet.site = await states.site.findOneByBlocklet(did);
  blocklet.settings = await states.blockletExtras.getSettings(did);
  blocklet.controller = blockletExtra?.controller;

  const ownerDid = blocklet.settings?.owner?.did;
  let ownerInfo;
  if (ownerDid) {
    logger.info('get owner info', { ownerDid, teamDid: blocklet.meta.did });
    const userState = await teamManager.getUserState(blocklet.meta.did);
    ownerInfo = await userState.getUser(ownerDid);
  }

  return publishDidDocument({ blocklet, ownerInfo, nodeInfo });
};

/**
 * Update DID document state only (e.g., to 'deleted') without fetching from database
 * Used when blocklet is being removed and database data may not be available
 * @param {object} options - Options
 * @param {string} options.did - Blocklet DID
 * @param {object} options.blocklet - Blocklet object
 * @param {string} options.state - New state
 * @param {object} options.nodeInfo - Node info
 */
const updateDidDocumentStateOnly = ({ did, blocklet, state, nodeInfo }) => {
  logger.debug('update did document state only', { did, state });

  const { wallet } = getBlockletInfo(blocklet, nodeInfo.sk);

  return didDocument.updateBlockletStateOnly({
    did,
    state,
    didRegistryUrl: nodeInfo.didRegistry,
    wallet,
    blockletServerVersion: nodeInfo.version,
  });
};

module.exports = {
  shouldEnableSlpDomain,
  getSlpDid,
  getBlockletKnownAs,
  publishDidDocument,
  updateDidDocument,
  updateDidDocumentStateOnly,
};
