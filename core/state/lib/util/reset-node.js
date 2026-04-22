const fs = require('fs-extra');
const path = require('path');
const logger = require('@abtnode/logger')('@abtnode/core:util:reset');

const states = require('../states');
const { isE2E } = require('./env');
const { getDataDirs } = require('./index');

const noop = () => true;

/* istanbul ignore next */
const resetOwner = async ({ teamManager }) => {
  const result = await states.node.updateNodeInfo({ initialized: false, initializedAt: null });

  try {
    const nodeInfo = await states.node.read();
    const teamDid = nodeInfo.did;
    const userState = await teamManager.getUserState(teamDid);
    const passportState = await teamManager.getPassportState(teamDid);
    const connectedAccountState = await teamManager.getConnectedAccountState(teamDid);
    await passportState.remove({ userDid: nodeInfo.nodeOwner.did });
    await connectedAccountState.remove({ userDid: nodeInfo.nodeOwner.did });
    await userState.remove({ did: nodeInfo.nodeOwner.did });
    await states.node.updateNodeInfo({ nodeOwner: null });
    logger.info('reset node owner', result);
  } catch (err) {
    // Do nothing
  }

  return true;
};

/* istanbul ignore next */
const resetDirs = () => {
  try {
    const dataDir = process.env.ABT_NODE_DATA_DIR;
    if (!dataDir) {
      logger.warn('ABT_NODE_DATA_DIR not set, skip reset bundles');
      return false;
    }
    const dataDirs = getDataDirs(dataDir);

    const dirs = [dataDirs.blocklets, dataDirs.cache];

    for (const dir of dirs) {
      if (fs.existsSync(dir)) {
        // Remove all contents in blocklets directory
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
          const entryPath = path.join(dir, entry);
          fs.removeSync(entryPath, { recursive: true, force: true });
        }
        logger.info('reset bundles', { dir, count: entries.length });
      }
    }
    return true;
  } catch (error) {
    logger.error('failed to reset bundles', { error });
    return false;
  }
};

/* istanbul ignore next */
const resetBlocklets = async ({ context, blockletManager }) => {
  const result = await blockletManager.list({ includeRuntimeInfo: false }, context);
  const blocklets = result.blocklets || [];
  for (let i = 0; i < blocklets.length; i++) {
    const blocklet = blocklets[i];
    // eslint-disable-next-line no-await-in-loop
    await blockletManager.delete({ did: blocklet.meta.did, keepData: false }, context);
  }
  logger.info('reset blocklets', blocklets.length);

  resetDirs();
  return true;
};

/* istanbul ignore next */
const resetSites = async ({ context, routerManager, handleAllRouting }) => {
  const sites = await states.site.getSites();
  for (let i = 0; i < sites.length; i++) {
    const site = sites[i];
    try {
      // eslint-disable-next-line no-await-in-loop
      await routerManager.deleteRoutingSite({ id: site.id }, context);
    } catch (err) {
      // Do nothing
    }
  }

  const hash = await handleAllRouting({ message: 'reset routing sites for test' });
  logger.info('reset routing sites', { hash });
};

/* istanbul ignore next */
const resetCertificates = async ({ certManager }) => {
  const certs = await certManager.getAll();
  for (let i = 0; i < certs.length; i++) {
    const cert = certs[i];
    if (!cert.domain === '*.ip.abtnet.io') {
      try {
        // eslint-disable-next-line no-await-in-loop
        await certManager.remove(cert.id);
      } catch (err) {
        // Do nothing
      }
    }
  }
  logger.info('reset routing certificates', { length: certs.length });
};

const resetUsers = async ({ teamManager }) => {
  try {
    const nodeInfo = await states.node.read();

    const teamDid = nodeInfo.did;
    const userState = await teamManager.getUserState(teamDid);
    const passportState = await teamManager.getPassportState(teamDid);
    const connectedAccountState = await teamManager.getConnectedAccountState(teamDid);
    await passportState.remove({ userDid: { $ne: nodeInfo.nodeOwner.did } });
    await connectedAccountState.remove({ userDid: { $ne: nodeInfo.nodeOwner.did } });
    await userState.remove({ did: { $ne: nodeInfo.nodeOwner.did } });

    logger.info('reset users');
  } catch (error) {
    logger.error('failed reset users', { error });
  }
};

const resetInvitations = async ({ teamManager }) => {
  const nodeInfo = await states.node.read();

  const teamDid = nodeInfo.did;
  const sessionState = await teamManager.getSessionState(teamDid);
  const count = sessionState.remove({ type: 'invite' });

  logger.info('reset invitations', { length: count });
};

const resetFns = {
  owner: resetOwner,
  blocklets: resetBlocklets,
  blockletExtras: noop,
  sites: resetSites,
  certificates: resetCertificates,
  webhooks: noop,
  accessKeys: noop,
  users: resetUsers,
  invitations: resetInvitations,
};

module.exports = async ({
  params,
  context,
  blockletManager,
  routerManager,
  handleAllRouting,
  teamManager,
  certManager,
}) => {
  if (!isE2E) {
    throw new Error('Reset node only exists for test purpose');
  }

  const thingsToReset = Object.assign(
    {
      owner: false,
      blocklets: false,
      blockletExtras: false,
      sites: false,
      certificates: false,
      webhooks: false,
      accessKeys: false,
      users: false,
      bundles: false,
    },
    params || {}
  );

  logger.info('reset node', { thingsToReset, context });

  const results = {};
  const keys = Object.keys(thingsToReset);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (thingsToReset[key]) {
      if (typeof resetFns[key] !== 'function') {
        throw new Error(`Unknown reset function ${key}`);
      }

      // eslint-disable-next-line no-await-in-loop
      results[key] = await resetFns[key]({
        context,
        blockletManager,
        routerManager,
        handleAllRouting,
        teamManager,
        certManager,
      });
    }
  }

  return results;
};
