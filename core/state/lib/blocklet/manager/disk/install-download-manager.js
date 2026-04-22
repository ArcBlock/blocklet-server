/* eslint-disable no-await-in-loop */
const path = require('path');
const logger = require('@abtnode/logger')('@abtnode/core:blocklet:manager:install-download');
const promiseSpawn = require('@abtnode/util/lib/promise-spawn');
const { INSTALL_ACTIONS } = require('@abtnode/constant');
const { BlockletStatus, BlockletEvents, fromBlockletStatus } = require('@blocklet/constant');
const { forEachComponentV2 } = require('@blocklet/meta/lib/util');

const states = require('../../../states');
const { getDisplayName } = require('../../../util/blocklet');
const { dockerExecChown } = require('../../../util/docker/docker-exec-chown');
const checkDockerRunHistory = require('../../../util/docker/check-docker-run-history');
const { blueGreenGetComponentIds } = require('../helper/blue-green-get-componentids.js');
const { blueGreenUpgradeBlocklet } = require('../helper/blue-green-upgrade-blocklet.js');
const { statusLock } = require('../lock');

/**
 * Download and install blocklet
 */
async function _downloadAndInstall(manager, params, { _onInstall, _upgradeBlocklet }) {
  const {
    blocklet,
    context,
    postAction,
    oldBlocklet,
    throwOnError,
    skipCheckStatusBeforeDownload,
    componentDids,
    skipCheckIntegrity,
    shouldCleanUploadFile,
    url,
  } = params;

  logger.info('_downloadAndInstall', { did: blocklet?.meta?.did });
  const { meta } = blocklet;
  const { name, did, version } = meta;

  const nodeInfo = await states.node.read();
  if (checkDockerRunHistory(nodeInfo)) {
    const newBlocklet = await manager.getBlocklet(did);
    // pull docker image
    await forEachComponentV2(newBlocklet, async (component) => {
      if (component?.meta?.docker?.image) {
        await promiseSpawn(`docker pull ${component?.meta?.docker?.image}`, {}, { timeout: 120 * 1000, retry: 0 });
      }
    });
  }

  // check status
  if (!skipCheckStatusBeforeDownload) {
    await statusLock.acquire('skip-check-status-before-download');
    try {
      const b0 = await states.blocklet.getBlocklet(did);
      if (!b0 || ![BlockletStatus.waiting].includes(b0.status)) {
        if (!b0) {
          throw new Error('blocklet does not exist before downloading');
        } else {
          logger.warn(`blocklet status is invalid before downloading: ${fromBlockletStatus(b0.status)}`);
        }
      }
    } catch (error) {
      logger.error('Check blocklet status failed before downloading', {
        name,
        did,
        error,
      });
      await manager._rollback(postAction, did, oldBlocklet);
      return;
    } finally {
      await statusLock.releaseLock('skip-check-status-before-download');
    }
  }

  // download bundle
  const childrenToDownload = (blocklet.children || []).filter((x) => {
    if (componentDids?.length) {
      return componentDids.includes(x.meta.did);
    }
    return x;
  });

  const blueGreenComponentIds = blueGreenGetComponentIds(oldBlocklet || blocklet, componentDids);

  try {
    if (process.env.ABT_NODE_DISABLE_BLUE_GREEN === 'true' || process.env.ABT_NODE_DISABLE_BLUE_GREEN === '1') {
      await states.blocklet.setBlockletStatus(did, BlockletStatus.downloading, {
        componentDids,
        isGreen: false,
      });
    } else {
      await Promise.all(
        blueGreenComponentIds.map(async (item) => {
          if (item.componentDids.length === 0) {
            return;
          }
          await states.blocklet.setBlockletStatus(did, BlockletStatus.downloading, {
            componentDids: item.componentDids,
            isGreen: item.changeToGreen,
          });
        })
      );
    }

    const state = await states.blocklet.getBlocklet(did);
    manager.emit(BlockletEvents.statusChange, state);
    const { isCancelled } = await manager._downloadBlocklet(
      {
        ...blocklet,
        children: childrenToDownload,
      },
      Object.assign({}, context, { skipCheckIntegrity })
    );

    if (isCancelled) {
      logger.info('Download was canceled', { name, did, version });

      // rollback on download cancelled
      await statusLock.acquire('download-cancelled');
      try {
        if ((await states.blocklet.getBlockletStatus(did)) === BlockletStatus.downloading) {
          await manager._rollback(postAction, did, oldBlocklet);
        }
      } catch (error) {
        logger.error('Rollback blocklet failed on download canceled', { postAction, name, did, version, error });
      } finally {
        await statusLock.releaseLock('download-cancelled');
      }
      return;
    }
  } catch (err) {
    if (err.message.includes('EACCES:')) {
      if (checkDockerRunHistory(nodeInfo)) {
        try {
          await dockerExecChown({
            name: `${did}-${blocklet.meta.name}-download`,
            dirs: [
              path.join(process.env.ABT_NODE_DATA_DIR, 'blocklets'),
              path.join(process.env.ABT_NODE_DATA_DIR, 'tmp', 'pnpm-stores'),
            ],
          });
        } catch (error) {
          logger.error('Retry download blocklet failed on chown', { did, name, version, error });
        }
      }
    }
    logger.error('Download blocklet tarball failed', { name, did, version });

    manager.emit(BlockletEvents.downloadFailed, {
      meta: { did },
      error: {
        message: err.message,
      },
    });
    manager._createNotification(did, {
      title: `${childrenToDownload.length > 1 ? `${childrenToDownload.length} components` : 'Component'} failed to download for ${getDisplayName(blocklet)}`,
      description: `${childrenToDownload
        .map((x) => `${x.meta.title}@${x.meta.version}`)
        .join(', ')} download failed for ${getDisplayName(blocklet)}: ${err.message}`,
      entityType: 'blocklet',
      entityId: did,
      severity: 'error',
    });

    // rollback on download failed
    await statusLock.acquire('rollback-on-download-failed');

    try {
      const status = await states.blocklet.getBlockletStatus(did);
      if ([BlockletStatus.downloading, BlockletStatus.waiting].includes(status)) {
        await manager._rollback(postAction, did, oldBlocklet);
      }
    } catch (error) {
      logger.error('Rollback blocklet failed on download failed', { postAction, name, did, version, error });
    } finally {
      await statusLock.releaseLock('rollback-on-download-failed');
    }

    if (throwOnError) {
      throw err;
    }

    return;
  }

  // update status
  await statusLock.acquire('download-update-status');
  try {
    await Promise.all(
      blueGreenComponentIds.map(async (item) => {
        if (item.componentDids.length === 0) {
          return;
        }
        if ((await states.blocklet.getBlockletStatus(did)) !== BlockletStatus.downloading) {
          throw new Error('blocklet status changed durning download');
        }

        if (postAction === INSTALL_ACTIONS.INSTALL) {
          const state = await states.blocklet.setBlockletStatus(did, BlockletStatus.installing, {
            componentDids: item.componentDids,
            isGreen: item.changeToGreen,
          });
          manager.emit(BlockletEvents.statusChange, state);
        }

        if (
          [
            INSTALL_ACTIONS.INSTALL_COMPONENT,
            INSTALL_ACTIONS.UPGRADE_COMPONENT,
            'upgrade', // for backward compatibility
          ].includes(postAction)
        ) {
          const state = await states.blocklet.setBlockletStatus(did, BlockletStatus.upgrading, {
            componentDids: item.componentDids,
            isGreen: item.changeToGreen,
          });
          manager.emit(BlockletEvents.statusChange, state);
        }
      })
    );
  } catch (error) {
    logger.error(error.message);
  } finally {
    await statusLock.releaseLock('download-update-status');
  }

  // install
  try {
    // install blocklet
    if (postAction === INSTALL_ACTIONS.INSTALL) {
      await _onInstall(manager, { blocklet, componentDids, context, oldBlocklet });

      return;
    }

    // upgrade blocklet
    if (
      [
        INSTALL_ACTIONS.INSTALL_COMPONENT,
        INSTALL_ACTIONS.UPGRADE_COMPONENT,
        'upgrade', // for backward compatibility
      ].includes(postAction)
    ) {
      logger.info('do upgrade blocklet', { did, version, postAction, componentDids });

      try {
        if (postAction === INSTALL_ACTIONS.UPGRADE_COMPONENT) {
          if (process.env.ABT_NODE_DISABLE_BLUE_GREEN === 'true' || process.env.ABT_NODE_DISABLE_BLUE_GREEN === '1') {
            await _upgradeBlocklet(manager, {
              newBlocklet: blocklet,
              oldBlocklet,
              componentDids,
              context,
              action: postAction,
              shouldCleanUploadFile,
              url,
            });
          } else {
            await blueGreenUpgradeBlocklet(
              {
                newBlocklet: blocklet,
                oldBlocklet,
                componentDids,
                action: postAction,
                shouldCleanUploadFile,
                url,
              },
              context,
              manager,
              states
            );
          }
        } else {
          await _upgradeBlocklet(manager, {
            newBlocklet: blocklet,
            oldBlocklet,
            componentDids,
            action: postAction,
            shouldCleanUploadFile,
            url,
          });
        }

        const newBlocklet = await manager.getBlocklet(did);

        if (newBlocklet.controller) {
          const eventType = 'install';

          manager.reportComponentUsageQueue.push({
            entity: 'blocklet',
            action: 'reportComponentUsage',
            time: new Date().toISOString(),
            did,
            componentDids,
            eventType: 'install',
            context,
          });

          logger.info('pushed reporting install components event job to queue', { did, componentDids, eventType });
        }
      } catch (err) {
        logger.error('blocklet onUpgrade error', { error: err });
      }
    }
  } catch (error) {
    if (throwOnError) {
      throw error;
    }
  }
}

module.exports = {
  _downloadAndInstall,
};
