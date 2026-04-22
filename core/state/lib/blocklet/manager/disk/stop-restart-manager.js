/* eslint-disable no-await-in-loop */
const logger = require('@abtnode/logger')('@abtnode/core:blocklet:manager:stop-restart');
const {
  BlockletEvents,
  BlockletInternalEvents,
  SUSPENDED_REASON,
  BLOCKLET_CONTROLLER_STATUS,
  BlockletStatus,
} = require('@blocklet/constant');
const { getDisplayName, isExternalBlocklet } = require('@blocklet/meta/lib/util');

const states = require('../../../states');
const launcher = require('../../../util/launcher');
const hooks = require('../../hooks');
const {
  stopBlockletProcess,
  reloadBlockletProcess,
  getRuntimeEnvironments,
  shouldSkipComponent,
  getComponentNamesWithVersion,
  getHookArgs,
} = require('../../../util/blocklet');
const checkNeedRunDocker = require('../../../util/docker/check-need-run-docker');
const { dockerExec } = require('../../../util/docker/docker-exec');

/**
 * Stop blocklet
 */
async function stop(
  manager,
  { did, updateStatus = true, silent = false, componentDids, reason, operator: _operator },
  context
) {
  const operator = _operator || context?.user?.did;
  logger.info('stop blocklet', { did, componentDids, updateStatus, silent, operator });

  const blocklet = await manager.getBlocklet(did);
  const { processId } = blocklet.env;

  if (updateStatus) {
    const doc = await states.blocklet.setBlockletStatus(did, BlockletStatus.stopping, {
      componentDids,
      operator,
      isGreenAndBlue: true,
    });
    blocklet.status = BlockletStatus.stopping;
    manager.emit(BlockletEvents.statusChange, doc);
  }

  try {
    const nodeInfo = await states.node.read();
    const nodeEnvironments = await states.node.getEnvironments(nodeInfo);
    await stopBlockletProcess(blocklet, {
      preStop: async (b, { ancestors }) => {
        const nextEnv = getRuntimeEnvironments(b, nodeEnvironments, ancestors);
        const needRunDocker = await checkNeedRunDocker(b.meta, nextEnv, nodeInfo, isExternalBlocklet(blocklet));
        const hookArgs = getHookArgs(b);
        if (needRunDocker) {
          const script = b.meta.scripts?.preStop;
          if (script) {
            return dockerExec({
              blocklet,
              meta: b.meta,
              script,
              env: nextEnv,
              hookName: 'preStop',
              nodeInfo,
              ...hookArgs,
            });
          }
          return null;
        }
        return hooks.preStop(b.meta.title, {
          appDir: b.env.appDir,
          hooks: Object.assign(b.meta.hooks || {}, b.meta.scripts || {}),
          env: nextEnv,
          did, // root blocklet did
          notification: states.notification,
          context,
          exitOnError: false,
          silent,
          teamManager: manager.teamManager,
          ...hookArgs,
        });
      },
      componentDids,
      isStopGreenAndBlue: true,
    });
  } catch (error) {
    logger.error('Failed to stop blocklet', { error, did });
    if (updateStatus) {
      const res = await states.blocklet.setBlockletStatus(did, BlockletStatus.error, {
        componentDids,
        operator,
        isGreenAndBlue: true,
      });
      manager.emit(BlockletEvents.statusChange, res);
    }
    throw error;
  }

  logger.info('blocklet stopped successfully', { processId, did });

  launcher.notifyBlockletStopped(blocklet);

  if (updateStatus) {
    const res = await states.blocklet.setBlockletStatus(did, BlockletStatus.stopped, {
      componentDids,
      operator,
      isGreenAndBlue: true,
    });
    // send notification to websocket channel
    manager.emit(BlockletEvents.statusChange, res);

    // send notification to wallet
    manager.emit(BlockletEvents.stopped, { ...res, componentDids });

    manager.emit(BlockletInternalEvents.componentStopped, {
      appDid: blocklet.appDid,
      components: componentDids?.length
        ? componentDids.map((x) => ({ did: x }))
        : blocklet.children.map((x) => ({ did: x.meta.did })),
    });
    manager.configSynchronizer.throttledSyncAppConfig(blocklet.meta.did);

    let description = `${
      componentDids?.length ? getComponentNamesWithVersion(blocklet, componentDids) : 'All components'
    } is successfully stopped for ${getDisplayName(blocklet)}.`;

    if (reason === SUSPENDED_REASON.expired) {
      description = `${description} Reason: The subscription has expired.`;
    }
    const stopLength = componentDids?.length || 0;
    manager._createNotification(did, {
      title: `${stopLength > 1 ? `${stopLength} components` : 'Component'} stopped successfully for ${getDisplayName(blocklet)}`,
      description,
      entityType: 'blocklet',
      entityId: did,
      severity: 'success',
    });

    return res;
  }

  return blocklet;
}

/**
 * Restart blocklet
 */
async function restart(manager, { did, componentDids, operator: _operator }, context) {
  const operator = _operator || context?.user?.did;
  logger.info('restart blocklet', { did, operator });
  const blocklet = await manager.getBlocklet(did);
  await manager.checkControllerStatus(blocklet, 'restart');

  const result = await states.blocklet.getBlocklet(did);
  const dids = componentDids?.length
    ? componentDids
    : result.children
        .filter((x) => x.status === BlockletStatus.running || x.greenStatus === BlockletStatus.running)
        .map((x) => x.meta.did);
  manager.emit(BlockletEvents.statusChange, result);

  const ticket = manager.startQueue.push({
    entity: 'blocklet',
    action: 'restart',
    id: `${did}/${(dids || []).join(',')}`,
    did,
    componentDids: dids,
    operator,
    context,
  });
  ticket.on('failed', (err) => {
    logger.error('failed to restart blocklet', { did, error: err });

    const description = `${getComponentNamesWithVersion(result, componentDids)} restart failed for ${getDisplayName(
      result
    )}: ${err.message || 'queue exception'}`;
    const upgradeLength = dids.length;
    manager._createNotification(did, {
      title: `${upgradeLength > 1 ? `${upgradeLength} components` : 'Component'} failed to restart for ${getDisplayName(result)}`,
      description,
      entityType: 'blocklet',
      entityId: did,
      severity: 'error',
    });
  });

  return result;
}

/**
 * Reload blocklet
 */
async function reload(manager, { did, componentDids: list }) {
  const blocklet = await manager.getBlocklet(did);
  await manager.checkControllerStatus(blocklet, 'reload');

  const componentDids = (blocklet.children || [])
    .filter((x) => x.status === BlockletStatus.running)
    .filter((x) => !shouldSkipComponent(x.meta.did, list))
    .map((x) => x.meta.did);

  if (!componentDids.length) {
    throw new Error('No running component found');
  }

  try {
    await reloadBlockletProcess(blocklet, { componentDids });
    const res = await states.blocklet.setBlockletStatus(did, BlockletStatus.running, { componentDids });
    logger.info('blocklet reload successfully', { did, componentDids });
    manager.emit(BlockletEvents.statusChange, res);
    return res;
  } catch (error) {
    logger.error('Failed to reload blocklet', { error, did, componentDids });
    throw error;
  }
}

/**
 * Stop expired blocklets
 */
async function stopExpiredBlocklets(manager) {
  try {
    logger.info('start checking expired blocklet');
    const blockletExtras = await states.blockletExtras.find(
      {
        controller: {
          $exists: true,
        },
      },
      { did: 1, meta: 1, controller: 1 }
    );

    if (blockletExtras.length === 0) {
      logger.info('no serverless blocklet');
      return;
    }

    logger.info('serverless blocklet count', { count: blockletExtras.length });

    for (const data of blockletExtras) {
      try {
        const { did } = data;
        const isExpired = await launcher.isBlockletExpired(did, data.controller);

        if (isExpired) {
          logger.info('the blocklet already expired and will be stopped', {
            blockletDid: did,
            nftId: data.controller.nftId,
          });

          // 如果 Blocklet 没停止, 先停止
          const blocklet = await states.blocklet.getBlocklet(did);
          if (blocklet.status !== BlockletStatus.stopped) {
            await stop(manager, { did, reason: SUSPENDED_REASON.expired });
            logger.info('the expired blocklet is stopped', { did, blockletDid: did });
          }

          await states.blockletExtras.updateByDid(did, {
            controller: {
              ...data.controller,
              status: {
                value: BLOCKLET_CONTROLLER_STATUS.suspended,
                reason: SUSPENDED_REASON.expired,
              },
            },
          });
          logger.info('the expired blocklet is stopped', { did });
        }
      } catch (error) {
        logger.error('stop expired blocklet failed', {
          blockletDid: data.did,
          nftId: data.controller?.nftId,
          error,
        });
      }
    }

    logger.info('check expired external blocklet end');
  } catch (error) {
    logger.error('check expired external blocklet failed', { error });
  }
}

module.exports = {
  stop,
  restart,
  reload,
  stopExpiredBlocklets,
};
