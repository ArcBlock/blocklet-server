/* eslint-disable no-await-in-loop */
const chalk = require('chalk');
const capitalize = require('lodash/capitalize');

const { clearRouterByConfigKeyword, clearDockerContainer, checkDockerInstalled } = require('@abtnode/router-provider');
const tryWithTimeout = require('@abtnode/util/lib/try-with-timeout');
const sleep = require('@abtnode/util/lib/sleep');
const pm2 = require('@abtnode/util/lib/pm2/async-pm2');
const pAll = require('p-all');

const {
  PROCESS_NAME_DAEMON,
  PROCESS_NAME_SERVICE,
  PROCESS_NAME_EVENT_HUB,
  CONFIG_FOLDER_NAME,
  CONFIG_FOLDER_NAME_OLD,
  EVENTS,
  SERVER_STATUS,
} = require('@abtnode/constant');

const { BLOCKLET_MODES, BlockletStatus } = require('@blocklet/constant');

const debug = require('../../debug')('kill');
const {
  printError,
  printInfo,
  printSuccess,
  printWarning,
  stopRouting,
  getCLICommandName,
  killPm2Process,
} = require('../../util');
const { getNode } = require('../../node');
const { checkRunning } = require('../../manager');
const { wrapSpinner } = require('../../ui');
const clearAllCache = require('../../util/clear-all-cache');

const BATCH_PAGE_SIZE = 100;

const STATUSES_NEED_UPDATE = [
  BlockletStatus.running,
  BlockletStatus.waiting,
  BlockletStatus.starting,
  BlockletStatus.restarting,
  BlockletStatus.downloading,
];

/**
 * Process blocklets in batches, calling the callback for each batch
 * @param {Object} node - The node instance
 * @param {Function} callback - Called with (blocklets, paging) for each batch. Return false to stop iteration.
 */
const forEachBlockletBatch = async (node, callback) => {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const result = await node.getBlocklets({
      includeRuntimeInfo: false,
      paging: { page, pageSize: BATCH_PAGE_SIZE },
    });
    const blocklets = result.blocklets || [];
    const paging = result.paging || {};

    const shouldContinue = await callback(blocklets, paging);
    if (shouldContinue === false) {
      break;
    }

    hasMore = paging.next && blocklets.length === BATCH_PAGE_SIZE;
    page += 1;
  }
};

/**
 * Update a single blocklet's component statuses to waiting/stopped
 * @param {Object} node - The node instance
 * @param {Object} blocklet - The blocklet to update
 */
const updateBlockletComponentStatus = async (node, blocklet) => {
  const { did } = blocklet.meta;
  const componentDids = [];

  if (blocklet.children && blocklet.children.length > 0) {
    for (const child of blocklet.children) {
      if (STATUSES_NEED_UPDATE.includes(child.status) || STATUSES_NEED_UPDATE.includes(child.greenStatus)) {
        componentDids.push(child.meta.did);
      }
    }
  }

  if (componentDids.length > 0) {
    await node.setBlockletStatus(did, BlockletStatus.waiting, {
      componentDids,
      operator: 'daemon',
    });
    await node.setBlockletStatus(did, BlockletStatus.stopped, {
      componentDids,
      operator: 'daemon',
      isGreen: true,
    });
  }
};

/**
 * Update all running/starting blocklets status to waiting
 * Uses batched processing to handle large numbers of blocklets efficiently
 * @param {Object} node - The node instance
 */
const updateRunningBlockletsToWaiting = async (node) => {
  try {
    await forEachBlockletBatch(node, async (blocklets) => {
      for (const blocklet of blocklets) {
        try {
          await updateBlockletComponentStatus(node, blocklet);
        } catch (err) {
          printError(`Failed to update blocklet status for ${blocklet.meta.did}:`, err.message);
        }
      }
    });
  } catch (err) {
    printError('Failed to update blocklet statuses to waiting:', err.message);
  }
};

const forceStopServer = async () => {
  const stop = async () => {
    try {
      await clearAllCache(printSuccess, printError);
      const results = await Promise.all([
        clearRouterByConfigKeyword(CONFIG_FOLDER_NAME),
        clearRouterByConfigKeyword(CONFIG_FOLDER_NAME_OLD),
      ]);

      const clearedProvider = results.find(Boolean);
      if (clearedProvider) {
        printSuccess(`${capitalize(clearedProvider)} router is stopped successfully`);
      }

      try {
        const { node } = await getNode({ dir: process.cwd() });
        await updateRunningBlockletsToWaiting(node);
        printSuccess('All blocklet processes stopped successfully');
      } catch (error) {
        printError(`Failed to update blocklet statuses to waiting: ${error.message}`);
      }

      // Kill all blocklet processes
      await wrapSpinner('Stopping blocklet processes', async () => {
        const list = await pm2.listAsync();
        const blockletProcesses = list.filter(
          (process) => !!process.pm2_env['abt-node-daemon'] || !!process.pm2_env.blocklet
        );
        await pAll(
          blockletProcesses.map((process) => () => pm2.deleteAsync(process.name)),
          { concurrency: 6 }
        );
      });

      // Kill PM2 daemon last
      await wrapSpinner('Stopping process manager', async () => {
        await pm2.killDaemonAsync();
      });

      const isDockerInstalled = await checkDockerInstalled();
      if (isDockerInstalled) {
        await wrapSpinner('Stopping Docker containers managed by blocklet server', async () => {
          await clearDockerContainer();
        });
      }
    } catch (error) {
      printError(`Blocklet Server related processes stop failed: ${error.message}`);
      throw error;
    }
  };
  const timeout = 20; // 20 seconds
  try {
    await tryWithTimeout(stop, timeout * 1000);
  } catch (err) {
    printError(`Blocklet server failed to stop within ${timeout} seconds`);
    printInfo(`You can stop blocklet server with ${chalk.cyan(`${getCLICommandName()} stop --force`)} again.`);
  }
};

exports.run = async ({ force = false }) => {
  if (force) {
    await forceStopServer();
    process.exit(0);
  }

  const { node, publishEvent } = await getNode({ dir: process.cwd() });

  const isRunning = await checkRunning();
  if (!isRunning) {
    printWarning('Blocklet Server is not running!');
    process.exit(0);
  }

  const stopOnReady = () =>
    new Promise((resolve) => {
      node.onReady(async () => {
        // Single pass: check for dev mode blocklets AND update statuses
        try {
          await forEachBlockletBatch(node, async (blocklets) => {
            // Check for running dev mode blocklet - exit immediately if found
            const devBlocklet = blocklets.find(
              (x) => x.mode === BLOCKLET_MODES.DEVELOPMENT && x.status === BlockletStatus.running
            );
            if (devBlocklet) {
              printError(
                `Unable to stop Blocklet Server, please stop the development by pressing ${chalk.cyan(
                  'Ctrl + C'
                )} in the terminal of ${chalk.cyan(devBlocklet.meta.name)}`
              );
              process.exit(1);
            }

            // Update status for each blocklet in this batch
            for (const blocklet of blocklets) {
              try {
                await updateBlockletComponentStatus(node, blocklet);
              } catch (err) {
                printError(`Failed to update blocklet status for ${blocklet.meta.did}:`, err.message);
              }
            }
          });
        } catch (err) {
          printWarning('Blocklet processing skipped:', err.message);
        }

        try {
          await wrapSpinner('Sending shutdown notification to web dashboard users', async () => {
            await publishEvent(EVENTS.NODE_STOPPED, {});
            await sleep(2000);
          }); // prettier-ignore
        } catch (err) {
          printError(`Failed to publish stop event to socket server: ${err.message}`);
        }

        const info = await node.getNodeInfo();

        debug('stopping server');

        try {
          await stopRouting({ info, routerDir: node.dataDirs.router });
          printSuccess('Routing engine is stopped successfully');
        } catch (err) {
          printError('Failed to stop routing engine', err.message);
        }

        const actions = [
          { action: 'kill', processName: PROCESS_NAME_DAEMON },
          { action: 'kill', processName: PROCESS_NAME_SERVICE },
          { action: 'kill', processName: PROCESS_NAME_EVENT_HUB },
          { action: 'updateStatus' },
        ];

        for (let i = 0; i < actions.length; i++) {
          const { action, processName } = actions[i];
          if (action === 'kill') {
            try {
              // eslint-disable-next-line no-await-in-loop
              await killPm2Process(processName);
              printSuccess(`${processName} is stopped successfully`);
            } catch (err) {
              printError(`Failed to stop ${processName}`, err.message);
            }
          }

          if (action === 'updateStatus') {
            // eslint-disable-next-line no-await-in-loop
            await node.updateNodeStatus(SERVER_STATUS.STOPPED);
          }
        }

        const isDockerInstalled = await checkDockerInstalled();
        if (isDockerInstalled) {
          await clearDockerContainer();
          printSuccess('Docker containers managed by blocklet server are stopped');
        }

        printSuccess('Done!');
        resolve(true);
        process.exit(0);
      });
    });

  const timeout = 60 * 5; // 5 minute
  try {
    await tryWithTimeout(stopOnReady, timeout * 1000);
  } catch (err) {
    printError(`Blocklet Server failed to stop within ${timeout / 60} minutes`);
    printInfo(`You can stop blocklet server with ${chalk.cyan(`${getCLICommandName()} stop --force`)}`);
  } finally {
    process.exit(0);
  }
};
