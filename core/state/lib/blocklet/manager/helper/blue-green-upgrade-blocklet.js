/* eslint-disable no-await-in-loop */
const logger = require('@abtnode/logger')('@abtnode/core:blocklet-manager:upgrade-blue-green');
const { BlockletStatus, BlockletEvents, BlockletInternalEvents } = require('@blocklet/constant');
const { INSTALL_ACTIONS, WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { getDisplayName, hasStartEngine } = require('@blocklet/meta/lib/util');
const { getComponentsInternalInfo } = require('@blocklet/meta/lib/blocklet');
const { getComponentNamesWithVersion, updateBlockletFallbackLogo } = require('../../../util/blocklet');
const { blueGreenStartBlocklet } = require('./blue-green-start-blocklet');

const blueGreenUpgradeBlocklet = async (
  { newBlocklet, oldBlocklet, componentDids, action, shouldCleanUploadFile, url },
  context,
  manager,
  states
) => {
  const { meta, source, deployedFrom, children } = newBlocklet;
  const { did, version, name } = meta;
  const title = getDisplayName(newBlocklet);

  for (const child of newBlocklet.children) {
    for (const child2 of oldBlocklet.children) {
      if (child && child2 && child.meta.did === child2.meta.did) {
        child.status = child2.status;
        child.greenStatus = child2.greenStatus;
        child.ports = child2.ports;
        child.greenPorts = child2.greenPorts;
      }
    }
  }

  let errorBlockletDids = [];

  try {
    await states.blocklet.upgradeBlocklet({ meta, source, deployedFrom, children });
    logger.info('updated blocklet for upgrading', { did, componentDids, source, name });

    await manager._setConfigsFromMeta(did);

    let blocklet = await manager.ensureBlocklet(did);

    await manager._updateBlockletEnvironment(did);
    blocklet = await manager.getBlocklet(did);

    await manager._runUserHook('preInstall', blocklet, context);
    await manager._runUserHook('postInstall', blocklet, context);
    await manager._runUserHook('preFlight', blocklet, context);
    await manager._runMigration({
      parallel: false,
      did,
      blocklet,
      oldBlocklet,
      componentDids,
    });

    const runningDids = [];
    const stoppedDids = [];

    if (action === INSTALL_ACTIONS.INSTALL_COMPONENT) {
      for (const componentDid of componentDids) {
        const component = blocklet.children.find((x) => x.meta.did === componentDid);
        if (!component) {
          continue;
        }
        if (hasStartEngine(component.meta)) {
          stoppedDids.push(componentDid);
        } else {
          runningDids.push(componentDid);
        }
      }
    } else {
      for (const componentDid of componentDids) {
        const oldComponent = oldBlocklet.children.find((x) => x.meta.did === componentDid);
        if (oldComponent?.status === BlockletStatus.running || oldComponent?.greenStatus === BlockletStatus.running) {
          runningDids.push(componentDid);
        } else {
          stoppedDids.push(componentDid);
        }
      }
    }

    const initialized = !!blocklet.settings?.initialized;

    if (runningDids.length) {
      if (initialized) {
        await blueGreenStartBlocklet(
          {
            did,
            componentDids: runningDids,
            operator: context?.user?.did,
            ignoreErrorNotification: true,
            ignoreBlockletStartedEvent: true,
            onError: (dids) => {
              errorBlockletDids = dids;
            },
          },
          context,
          manager,
          states
        );
      } else {
        await states.blocklet.setBlockletStatus(did, BlockletStatus.stopped, {
          componentDids: runningDids,
          isGreenAndBlue: true,
        });
      }
    }

    if (stoppedDids.length) {
      const status = action === INSTALL_ACTIONS.INSTALL_COMPONENT ? BlockletStatus.installed : BlockletStatus.stopped;
      await states.blocklet.setBlockletStatus(did, status, {
        componentDids: stoppedDids,
        isGreenAndBlue: true,
      });
    }

    blocklet = await manager.getBlocklet(did, context);

    await updateBlockletFallbackLogo(blocklet);

    await manager._updateDependents(did);

    manager.refreshListCache();

    manager.configSynchronizer.throttledSyncAppConfig(blocklet);

    try {
      manager.emit(BlockletEvents.upgraded, { blocklet, context });

      const isInstallAction = action === INSTALL_ACTIONS.INSTALL_COMPONENT;
      const notificationEvent = isInstallAction ? BlockletEvents.componentInstalled : BlockletEvents.componentUpgraded;
      const actionName = isInstallAction ? 'installed' : 'upgraded';

      manager.emit(notificationEvent, { ...blocklet, componentDids, oldBlocklet, context });

      const upgradeLength = componentDids?.length || 0;

      manager._createNotification(did, {
        title: `${upgradeLength > 1 ? `${upgradeLength} components` : 'Component'} ${actionName} successfully for ${title}`,
        description: `${getComponentNamesWithVersion(
          newBlocklet,
          componentDids
        )} is ${actionName} successfully for ${title}`,
        action: `/blocklets/${did}/overview`,
        blockletDashboardAction: `${WELLKNOWN_SERVICE_PATH_PREFIX}/admin/blocklets`,
        entityType: 'blocklet',
        entityId: did,
        severity: 'success',
      });

      if (shouldCleanUploadFile && url) {
        manager._cleanUploadFile(url);
      }
    } catch (error) {
      logger.error('emit upgrade notification failed', { name, version, error });
    }

    await manager._ensureDeletedChildrenInSettings(blocklet);

    if (oldBlocklet.status === BlockletStatus.running || oldBlocklet.greenStatus === BlockletStatus.running) {
      manager.emit(
        action === INSTALL_ACTIONS.INSTALL_COMPONENT
          ? BlockletInternalEvents.componentInstalled
          : BlockletInternalEvents.componentUpgraded,
        {
          appDid: blocklet.appDid,
          components: getComponentsInternalInfo(blocklet).filter((c) => componentDids.includes(c.did)),
        }
      );
    }

    return blocklet;
  } catch (err) {
    logger.error('failed to upgrade blocklet', { did, version, name, error: err });
    const nextBlocklet = await manager.ensureBlocklet(did);

    // 提取出错的 blocklet did 列表
    let errorDids = [];
    if (Array.isArray(errorBlockletDids) && errorBlockletDids.length > 0) {
      if (typeof errorBlockletDids[0] === 'string') {
        errorDids = errorBlockletDids;
      } else {
        errorDids = errorBlockletDids.map((x) => x.did);
      }
    }

    const rollbackBlocklet = { ...oldBlocklet };
    for (const child of nextBlocklet.children) {
      const isErrorBlocklet = errorDids.includes(child.meta.did);
      if (isErrorBlocklet) {
        for (const oldChild of oldBlocklet.children) {
          if (child && oldChild && child.meta.did === oldChild.meta.did) {
            const rollbackChild = rollbackBlocklet.children.find((c) => c.meta.did === child.meta.did);
            if (rollbackChild) {
              rollbackChild.status = oldChild.status;
              rollbackChild.greenStatus = oldChild.greenStatus;
              rollbackChild.ports = oldChild.ports;
              rollbackChild.greenPorts = oldChild.greenPorts;
            }
          }
        }
      } else {
        const rollbackChildIndex = rollbackBlocklet.children.findIndex((c) => c.meta.did === child.meta.did);
        if (rollbackChildIndex !== -1) {
          rollbackBlocklet.children[rollbackChildIndex] = child;
        }
      }
    }

    await states.blocklet.upgradeBlocklet({ ...rollbackBlocklet });
    manager.configSynchronizer.throttledSyncAppConfig(rollbackBlocklet);
    await manager._updateDependents(did);
    manager.emit(BlockletEvents.statusChange, { ...rollbackBlocklet, error: { message: err.message } });

    const actionName = action === INSTALL_ACTIONS.INSTALL_COMPONENT ? 'install' : 'upgrade';
    const notificationEvent =
      action === INSTALL_ACTIONS.INSTALL_COMPONENT
        ? BlockletEvents.componentInstallFailed
        : BlockletEvents.componentUpgradeFailed;

    manager.emit(notificationEvent, {
      blocklet: { ...newBlocklet, componentDids, error: { message: err.message } },
      context,
    });
    const upgradeLength = componentDids?.length || 0;
    manager._createNotification(did, {
      title: `${upgradeLength > 1 ? `${upgradeLength} components` : 'Component'} failed to ${actionName} for ${title}`,
      description: `${getComponentNamesWithVersion(newBlocklet, componentDids)} ${actionName} failed for ${title}: ${
        err.message
      }.`,
      entityType: 'blocklet',
      entityId: did,
      severity: 'error',
    });
    throw err;
  }
};

module.exports = {
  blueGreenUpgradeBlocklet,
};
