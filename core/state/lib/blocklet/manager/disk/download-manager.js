const logger = require('@abtnode/logger')('@abtnode/core:blocklet:manager:download');
const { BlockletStatus, fromBlockletStatus } = require('@blocklet/constant');
const { forEachComponentV2Sync } = require('@blocklet/meta/lib/util');

const states = require('../../../states');

/**
 * Cancel download
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {string} params.did - Blocklet DID
 * @param {Object} statusLock - Status lock
 * @returns {Promise<Object>}
 */
async function cancelDownload(manager, { did: inputDid }, statusLock) {
  await statusLock.acquire('cancel-download');
  try {
    const blocklet = await states.blocklet.getBlocklet(inputDid);
    if (!blocklet) {
      throw new Error(`Can not cancel download for non-exist blocklet in database. did: ${inputDid}`);
    }

    const { name, did, version } = blocklet.meta;

    if (
      ![BlockletStatus.downloading, BlockletStatus.waiting].includes(blocklet.greenStatus) &&
      ![BlockletStatus.downloading, BlockletStatus.waiting].includes(blocklet.status)
    ) {
      throw new Error(`Can not cancel blocklet that status is ${fromBlockletStatus(blocklet.status)}`);
    }

    const job = await manager.installQueue.get(did);

    // cancel job
    if (blocklet.greenStatus === BlockletStatus.downloading || blocklet.status === BlockletStatus.downloading) {
      try {
        await manager.blockletDownloader.cancelDownload(blocklet.meta.did);
      } catch (error) {
        logger.error('failed to exec blockletDownloader.download', { did: blocklet.meta.did, error });
      }
    } else if (blocklet.greenStatus === BlockletStatus.waiting || blocklet.status === BlockletStatus.waiting) {
      try {
        await manager.installQueue.cancel(blocklet.meta.did);
      } catch (error) {
        logger.error('failed to cancel waiting', { did: blocklet.meta.did, error });
      }
    }

    // rollback
    if (job) {
      const { postAction, oldBlocklet } = job;
      await manager._rollback(postAction, did, oldBlocklet);
    } else {
      const data = await manager._rollbackCache.restore({ did });
      if (data) {
        const { action, oldBlocklet } = data;
        await manager._rollback(action, did, oldBlocklet);
        await manager._rollbackCache.remove({ did: inputDid });
      } else {
        throw new Error(`Cannot find rollback data in queue or backup file of blocklet ${inputDid}`);
      }
    }

    logger.info('cancel download blocklet', { did, name, version, status: fromBlockletStatus(blocklet.status) });

    return blocklet;
  } catch (error) {
    try {
      // fallback blocklet status to error
      const blocklet = await states.blocklet.getBlocklet(inputDid);
      if (blocklet) {
        const componentDids = [];
        forEachComponentV2Sync(blocklet, (x) => {
          if (
            [BlockletStatus.waiting, BlockletStatus.downloading].includes(x.status) ||
            [BlockletStatus.waiting, BlockletStatus.downloading].includes(x.greenStatus)
          ) {
            componentDids.push(x.meta.did);
          }
        });

        await states.blocklet.setBlockletStatus(blocklet.meta.did, BlockletStatus.error, { componentDids });
      }
    } catch (err) {
      logger.error('Failed to fallback blocklet status to error on cancelDownload', { error });
    }

    throw error;
  } finally {
    await statusLock.releaseLock('cancel-download');
  }
}

module.exports = {
  cancelDownload,
};
