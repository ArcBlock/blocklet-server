const { checkAndKillOrphanProcesses } = require('@abtnode/util/lib/pm2/check-orphan-processes');
const { DAEMON_SCRIPT_PATH, SERVICE_SCRIPT_PATH } = require('@abtnode/constant');
const { forEachComponentV2Sync, isInProgress } = require('@blocklet/meta/lib/util');
const { BlockletStatus } = require('@blocklet/constant');

const { printSuccess, printError, printInfo, printWarning } = require('../../util');
const { getNode } = require('../../node');

exports.run = async ({ target, appId }) => {
  // Handle orphan-process cleanup without requiring node instance
  if (target === 'orphan-process') {
    printInfo('Checking for orphan daemon/service processes...');

    const logger = {
      info: (msg) => printInfo(msg),
      warn: (msg) => printWarning(msg),
      error: (msg) => printError(msg),
    };

    try {
      await checkAndKillOrphanProcesses({ scriptName: DAEMON_SCRIPT_PATH, logger, force: true });
      await checkAndKillOrphanProcesses({ scriptName: SERVICE_SCRIPT_PATH, logger, force: true });
      printSuccess('Orphan process cleanup completed');
    } catch (err) {
      printError(`Failed to cleanup orphan processes: ${err.message}`);
      process.exit(1);
    }

    process.exit(0);
  }

  const { node } = await getNode({ dir: process.cwd() });

  node.onReady(async () => {
    const info = await node.getNodeInfo();

    if (target === 'cache') {
      const removed = await node.clearCache({ pattern: null, teamDid: info.did });
      printSuccess(`Cache for server cleared: ${removed.join(',')}`);
      process.exit(0);
    }

    if (target === 'maintenance-status') {
      await node.states.node.updateNodeInfo({
        mode: info.previousMode || info.mode,
        previousMode: '',
        upgradeSessionId: '',
        nextVersion: '',
      });

      printSuccess('Server maintenance status reset');
      process.exit(0);
    }

    if (target === 'blacklist') {
      await node.clearAllRouterBlacklist();
      await node.handleSystemRouting({ message: 'cleanup blacklist' });
      printSuccess('All router blocklist cleared');
      process.exit(0);
    }

    if (target === 'blacklist-expired') {
      await node.clearExpiredRouterBlacklist();
      await node.handleSystemRouting({ message: 'cleanup blacklist-expired' });
      printSuccess('Expired router blocklist cleared');
      process.exit(0);
    }

    if (target === 'stuck-components') {
      if (!appId) {
        printError('Please provide `--app-id` when cleanup stuck components');
        process.exit(1);
      }
      const blocklet = await node.getBlocklet({ did: appId });
      if (!blocklet) {
        printError(`Blocklet ${appId} not found`);
        process.exit(1);
      }

      const componentDids = [];
      forEachComponentV2Sync(blocklet, (x) => {
        if (isInProgress(x.status) || isInProgress(x.greenStatus)) {
          componentDids.push(x.meta.did);
        }
      });

      if (componentDids.length > 0) {
        await node.states.blocklet.setBlockletStatus(blocklet.meta.did, BlockletStatus.error, { componentDids });
        await node.stopBlocklet({ did: blocklet.meta.did, componentDids });
        printSuccess(`Stuck components for blocklet ${appId} cleared`);
      } else {
        printWarning(`No stuck components found for blocklet ${appId}`);
      }
      process.exit(0);
    }

    printError(`Unknown cleanup target: ${target}`);
    process.exit(1);
  });
};
