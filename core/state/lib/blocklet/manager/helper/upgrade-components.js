/* eslint-disable no-await-in-loop */
const cloneDeep = require('@abtnode/util/lib/deep-clone');

const logger = require('@abtnode/logger')('@abtnode/core:upgrade-component');

const { BlockletEvents } = require('@blocklet/constant');
const { INSTALL_ACTIONS } = require('@abtnode/constant');
const { parseOptionalComponents } = require('@blocklet/resolver');
const {
  getUpdateMetaList,
  parseComponents,
  checkDuplicateComponents,
  filterDuplicateComponents,
  checkStructVersion,
  checkVersionCompatibility,
  validateBlocklet,
  getFixedBundleSource,
  getComponentNamesWithVersion,
} = require('../../../util/blocklet');

const check = async ({ did, states }) => {
  const blocklet = await states.blocklet.getBlocklet(did);
  checkStructVersion(blocklet);

  const newBlocklet = cloneDeep(blocklet);

  const newChildren = [];

  for (const child of newBlocklet.children || []) {
    // There may be dirty data without bundleSource but with source and deployedFrom
    const bundleSource = getFixedBundleSource(child);

    if (bundleSource) {
      const { dynamicComponents } = await parseComponents(
        {
          meta: {
            components: [
              {
                source: bundleSource,
                name: child.meta.name,
                mountPoint: child.mountPoint,
              },
            ],
          },
        },
        { continueOnError: true }
      );
      const newChild = dynamicComponents.find((x) => x.meta.name === child.meta.name);
      if (!newChild) {
        continue;
      }
      newChild._dynamicComponents = dynamicComponents.filter((x) => x.meta.name !== child.meta.name);
      newChildren.push(newChild);
    } else {
      const { dynamicComponents } = await parseComponents(child);
      child._dynamicComponents = dynamicComponents;
      newChildren.push(child);
    }
  }

  checkDuplicateComponents(newChildren);

  const updateList = getUpdateMetaList(blocklet, { ...blocklet, children: newChildren });

  if (!updateList.length) {
    return {};
  }

  // start session
  const { id: updateId } = await states.session.start({
    did,
    children: newChildren,
  });

  return {
    updateId,
    updateList,
  };
};

const upgrade = async ({ updateId, componentDids, context, states, manager }) => {
  if (!componentDids?.length) {
    throw new Error('At least one component needs to be selected');
  }

  const sessionData = await states.session.end(updateId);
  const { did } = sessionData;
  const oldBlocklet = await manager._getBlockletForInstallation(did);
  checkStructVersion(oldBlocklet);

  logger.info('upgrade blocklet components', {
    componentDids,
    updateId,
    did,
  });

  // parse children
  let dynamicComponents = [];
  const children = cloneDeep(oldBlocklet.children).map((oldComponent) => {
    const newComponent = sessionData.children.find((x) => x.meta.did === oldComponent.meta.did);
    if (newComponent && componentDids.includes(newComponent.meta.did)) {
      dynamicComponents.push(...(newComponent._dynamicComponents || []));
      delete newComponent._dynamicComponents;
      return newComponent;
    }
    return oldComponent;
  });

  const optionalComponentDids = new Set((await parseOptionalComponents(oldBlocklet)).map((x) => x.meta.did));
  dynamicComponents = filterDuplicateComponents(dynamicComponents, children);
  dynamicComponents = dynamicComponents
    .filter((x) => !optionalComponentDids.has(x.meta.did))
    .map((x) => ({
      ...x,
      installedAt: x.installedAt || new Date(),
    }));

  children.push(...dynamicComponents);
  // componentDids
  componentDids.push(...dynamicComponents.map((x) => x.meta.did));

  checkVersionCompatibility(children);

  logger.info('blocklet components to upgrade', {
    did,
    componentDids,
    children: children.map((x) => ({ name: x.meta.name, version: x.meta.version })),
  });

  const newBlocklet = { ...oldBlocklet, children };
  await validateBlocklet(newBlocklet);

  const action = INSTALL_ACTIONS.UPGRADE_COMPONENT;

  await manager._rollbackCache.backup({ did, action, oldBlocklet });

  // add to queue
  const ticket = manager.installQueue.push(
    {
      entity: 'blocklet',
      action: 'download',
      id: did,
      oldBlocklet: { ...oldBlocklet },
      blocklet: { ...newBlocklet },
      componentDids: componentDids || [],
      context,
      postAction: action,
      entityId: did,
    },
    did
  );

  ticket.on('failed', async (err) => {
    logger.error('queue failed', { entity: 'blocklet', action, did, error: err });
    await manager._rollback(action, did, oldBlocklet);
    manager.emit(BlockletEvents.componentUpgradeFailed, {
      blocklet: { ...oldBlocklet, componentDids, error: { message: err.message } },
      context: { ...context, createAuditLog: false },
    });

    const upgradeLength = componentDids?.length || 0;

    manager._createNotification(did, {
      title: `${upgradeLength > 1 ? `${upgradeLength} components` : 'Component'} failed to upgrade for ${oldBlocklet.meta.title}`,
      description: `${getComponentNamesWithVersion(oldBlocklet, componentDids)} upgrade failed for ${
        oldBlocklet.meta.title
      }: ${err.message || 'queue exception'}.`,
      entityType: 'blocklet',
      entityId: did,
      severity: 'error',
    });
  });

  return newBlocklet;
};

module.exports = {
  check,
  upgrade,
};
