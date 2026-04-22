/**
 * App Utils Module
 *
 * Functions for app-level utilities like archive creation, SK utilities, and domain handling
 * Logo functions moved to ./logo.js
 */

const fs = require('fs-extra');
const path = require('node:path');
const os = require('node:os');
const get = require('lodash/get');
const uniq = require('lodash/uniq');
const createArchive = require('archiver');

const { toAddress } = require('@ocap/util');
const { getDidDomainForBlocklet } = require('@abtnode/util/lib/get-domain-for-blocklet');
const { BLOCKLET_CONFIGURABLE_KEY, BLOCKLET_MODES } = require('@blocklet/constant');

const { getSlpDid, shouldEnableSlpDomain, getBlockletKnownAs } = require('./did-document');

// updateBlockletFallbackLogo, ensureAppLogo

/**
 * Create a zip archive of a data directory
 * @param {string} dataDir - Directory to archive
 * @param {string} fileName - Output filename
 * @returns {Promise<string>} Path to created archive
 */
const createDataArchive = (dataDir, fileName) => {
  const zipPath = path.join(os.tmpdir(), fileName);
  if (fs.existsSync(zipPath)) {
    fs.removeSync(zipPath);
  }

  const archive = createArchive('zip', { zlib: { level: 9 } });
  const stream = fs.createWriteStream(zipPath);

  return new Promise((resolve, reject) => {
    archive
      .directory(dataDir, false)
      .on('error', (err) => reject(err))
      .pipe(stream);

    stream.on('close', () => resolve(zipPath));
    archive.finalize();
  });
};

/**
 * Check if an app SK is currently in use
 * @param {object} blocklet - Blocklet with environments and migratedFrom
 * @param {string} appSk - App SK to check
 * @returns {boolean}
 */
const isBlockletAppSkUsed = ({ environments, migratedFrom = [] }, appSk) => {
  const isUsedInEnv = environments.find((e) => e.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SK)?.value === appSk;
  const isUsedInHistory = migratedFrom.some((x) => x.appSk === appSk);
  return isUsedInEnv || isUsedInHistory;
};

/**
 * Check if the app SK is being rotated
 * @param {Array} newConfigs - New configuration array
 * @param {Array} oldConfigs - Old configuration array
 * @param {string} externalSk - External SK if any
 * @returns {boolean}
 */
const isRotatingAppSk = (newConfigs, oldConfigs, externalSk) => {
  const newSk = newConfigs.find((x) => BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SK === x.key);
  if (!newSk) {
    // If no newSk found, we are not rotating the appSk
    return false;
  }

  const oldSk = oldConfigs.find((x) => BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SK === x.key);
  if (!oldSk) {
    // If we have no oldSk, we are setting the initial appSk for external managed apps
    // If we have no oldSk, but we are not external managed apps, we are rotating the appSk
    return !externalSk;
  }

  // Otherwise, we must be rotating the appSk
  // eslint-disable-next-line sonarjs/prefer-single-boolean-return
  if (oldSk.value !== newSk.value) {
    return true;
  }

  return false;
};

/**
 * Get blocklet URL for launcher
 * @param {object} options - Options
 * @param {object} options.blocklet - Blocklet object
 * @param {object} options.nodeInfo - Node info
 * @returns {string} Blocklet URL
 */
const getBlockletURLForLauncher = ({ blocklet, nodeInfo }) => {
  const enableSlpDomain = shouldEnableSlpDomain(nodeInfo.mode);
  let didDomain = '';
  if (enableSlpDomain) {
    didDomain = getDidDomainForBlocklet({
      did: getSlpDid(nodeInfo.did, blocklet.appPid),
      didDomain: nodeInfo.slpDomain,
    });
  } else {
    didDomain = getDidDomainForBlocklet({
      did: blocklet.appPid,
      didDomain: nodeInfo.didDomain,
    });
  }

  return `https://${didDomain}`;
};

/**
 * Get list of DID domains for a blocklet
 * @param {object} blocklet - Blocklet object
 * @param {object} nodeInfo - Node info
 * @returns {Array} Array of domain aliases
 */
const getBlockletDidDomainList = (blocklet, nodeInfo) => {
  const domainAliases = [];
  const alsoKnownAs = getBlockletKnownAs(blocklet);

  const dids = [blocklet.appPid, blocklet.appDid, ...alsoKnownAs].filter(Boolean).map((did) => toAddress(did));

  uniq(dids).forEach((did) => {
    const domain = getDidDomainForBlocklet({ did, didDomain: nodeInfo.didDomain });

    domainAliases.push({ value: domain, isProtected: true });
  });

  const enableSlpDomain = shouldEnableSlpDomain(nodeInfo.mode);
  if (enableSlpDomain) {
    const slpDid = getSlpDid(nodeInfo.did, blocklet.appPid);
    const domain = getDidDomainForBlocklet({ did: slpDid, didDomain: nodeInfo.slpDomain });

    domainAliases.push({ value: domain, isProtected: true });
  }

  return domainAliases;
};

/**
 * Get component names with version for display
 * @param {object} app - App blocklet
 * @param {Array} componentDids - Component DIDs
 * @returns {string} Comma-separated component names with versions
 */
const getComponentNamesWithVersion = (app = {}, componentDids = []) => {
  const str = uniq(componentDids)
    .map((x) => {
      const component = (app.children || []).find((y) => y.meta.did === x);
      return `${component.meta.title}@${component.meta.version}`;
    })
    .join(', ');
  return str;
};

/**
 * Check if blocklet is in development mode
 * @param {import('@blocklet/server-js').BlockletState} blocklet
 * @returns {boolean}
 */
const isDevelopmentMode = (blocklet) => blocklet?.mode === BLOCKLET_MODES.DEVELOPMENT;

/**
 * Get hook arguments for a blocklet
 * @param {object} blocklet - Blocklet object
 * @returns {object} Hook arguments
 */
const getHookArgs = (blocklet) => ({
  output: blocklet.mode === BLOCKLET_MODES.DEVELOPMENT ? '' : path.join(blocklet.env.logsDir, 'output.log'),
  error: blocklet.mode === BLOCKLET_MODES.DEVELOPMENT ? '' : path.join(blocklet.env.logsDir, 'error.log'),
  timeout:
    Math.max(
      get(blocklet, 'meta.timeout.script', 120),
      ...(blocklet?.children || []).map((child) => child.meta?.timeout?.script || 0)
    ) * 1000,
});

module.exports = {
  createDataArchive,
  isBlockletAppSkUsed,
  isRotatingAppSk,
  getBlockletURLForLauncher,
  getBlockletDidDomainList,
  getComponentNamesWithVersion,
  isDevelopmentMode,
  getHookArgs,
};
