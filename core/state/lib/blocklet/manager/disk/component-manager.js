const logger = require('@abtnode/logger')('@abtnode/core:blocklet:manager:component');
const { BlockletGroup, BlockletEvents, BlockletInternalEvents, BlockletStatus } = require('@blocklet/constant');
const { updateMountPointSchema } = require('@blocklet/meta/lib/schema');
const { getComponentsInternalInfo } = require('@blocklet/meta/lib/blocklet');

const states = require('../../../states');
const { checkDuplicateMountPoint } = require('../../../util/blocklet');

/**
 * Update component mount point
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {string} params.did - Component DID
 * @param {string} params.rootDid - Root blocklet DID
 * @param {string} params.mountPoint - New mount point
 * @param {Object} context - Context
 * @returns {Promise<Object>}
 */
async function updateComponentMountPoint(manager, { did, rootDid: inputRootDid, mountPoint: tmpMountPoint }, context) {
  const mountPoint = await updateMountPointSchema.validateAsync(tmpMountPoint);

  const blocklet = await states.blocklet.getBlocklet(inputRootDid);

  if (!blocklet) {
    throw new Error('blocklet does not exist');
  }

  const rootDid = blocklet.meta.did;

  const isRootComponent = !did;

  const component = isRootComponent ? blocklet : blocklet.children.find((x) => x.meta.did === did);
  if (!component) {
    throw new Error('component does not exist');
  }

  if (isRootComponent && component.group === BlockletGroup.gateway) {
    throw new Error('cannot update mountPoint of gateway blocklet');
  }

  checkDuplicateMountPoint(blocklet, mountPoint);

  component.mountPoint = mountPoint;

  await states.blocklet.updateBlocklet(rootDid, { mountPoint: blocklet.mountPoint, children: blocklet.children });

  manager.emit(BlockletEvents.upgraded, { blocklet, context: { ...context, createAuditLog: false } }); // trigger router refresh
  manager.emit(BlockletInternalEvents.componentUpdated, {
    appDid: blocklet.appDid,
    components: getComponentsInternalInfo(blocklet).filter((x) => x.did === component.meta.did),
  });
  manager.configSynchronizer.throttledSyncAppConfig(blocklet.meta.did);

  // Restart blocklet if it's running to pick up the new mount point
  // Only restart the component that was modified (did)
  if (!isRootComponent && did) {
    const updatedBlocklet = await manager.getBlocklet(rootDid);
    const updatedComponent = updatedBlocklet.children.find((x) => x.meta.did === did);

    if (
      updatedComponent &&
      (updatedComponent.status === BlockletStatus.running || updatedComponent.greenStatus === BlockletStatus.running)
    ) {
      try {
        await manager.restart({ did: rootDid, componentDids: [did], operator: context?.user?.did }, context);
        logger.info('restarted blocklet after mount point update', { rootDid, componentDid: did });
      } catch (error) {
        logger.error('failed to restart blocklet after mount point update', {
          rootDid,
          componentDid: did,
          error,
        });
        // Don't throw error - mount point update succeeded, restart failure is logged but doesn't block the operation
      }
    }
  }

  return manager.getBlocklet(rootDid);
}

module.exports = {
  updateComponentMountPoint,
};
