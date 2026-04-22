const isEmpty = require('lodash/isEmpty');
const logger = require('@abtnode/logger')('@abtnode/core:blocklet:manager:controller');
const { BLOCKLET_CONTROLLER_STATUS, SUSPENDED_REASON } = require('@blocklet/constant');

const states = require('../../../states');
const launcher = require('../../../util/launcher');

/**
 * Check controller status
 * @param {Object} manager - BlockletManager instance
 * @param {Object} blocklet - Blocklet
 * @param {string} action - Action name
 * @returns {Promise<void>}
 */
async function checkControllerStatus(manager, blocklet, action) {
  if (isEmpty(blocklet.controller)) {
    return;
  }

  const isExpired = await launcher.isBlockletExpired(blocklet.meta.did, blocklet.controller);

  if (isExpired) {
    if (blocklet.controller.status?.value !== BLOCKLET_CONTROLLER_STATUS.suspended) {
      await states.blockletExtras.updateByDid(blocklet.meta.did, {
        controller: {
          ...blocklet.controller,
          status: {
            value: BLOCKLET_CONTROLLER_STATUS.suspended,
            reason: SUSPENDED_REASON.expired,
          },
        },
      });
      logger.info('update blocklet controller status to suspended', {
        did: blocklet.meta.did,
        nftId: blocklet.controller?.nftId,
      });
    }
    logger.error(`try to ${action} an expired blocklet`, {
      did: blocklet.meta.did,
      nftId: blocklet.controller?.nftId,
    });
    throw new Error(`Can not ${action} an expired blocklet`);
  }

  if (
    blocklet.controller.status?.value === BLOCKLET_CONTROLLER_STATUS.suspended &&
    blocklet.controller.status?.reason === SUSPENDED_REASON.expired
  ) {
    // 如果是因为过期被暂停的，续期后, 并且不影响启动
    await states.blockletExtras.updateByDid(blocklet.meta.did, {
      controller: {
        ...blocklet.controller,
        status: {
          value: BLOCKLET_CONTROLLER_STATUS.normal,
          reason: '',
        },
      },
    });
  }
}

module.exports = {
  checkControllerStatus,
};
