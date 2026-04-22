const crypto = require('crypto');
const { sign } = require('@arcblock/jwt');

const logger = require('@abtnode/logger')('@abtnode/core:install-component-url');
const uniq = require('lodash/uniq');
const { isFreeBlocklet } = require('@blocklet/meta/lib/util');
const { hasMountPoint, hasStartEngine } = require('@blocklet/meta/lib/engine');
const { titleSchema, updateMountPointSchema } = require('@blocklet/meta/lib/schema');
const { hasReservedKey } = require('@blocklet/meta/lib/has-reserved-key');
const formatName = require('@abtnode/util/lib/format-name');

const { BlockletStatus, BlockletEvents, BlockletGroup, BlockletSource } = require('@blocklet/constant');
const { INSTALL_ACTIONS } = require('@abtnode/constant');
const {
  getBlockletMetaFromUrl,
  parseComponents,
  filterDuplicateComponents,
  ensureMeta,
  checkStructVersion,
  checkVersionCompatibility,
  validateBlocklet,
  filterRequiredComponents,
  getComponentNamesWithVersion,
  resolveMountPointConflict,
} = require('../../../util/blocklet');
const StoreUtil = require('../../../util/store');

const installComponentFromUrl = async ({
  rootDid,
  mountPoint: tmpMountPoint,
  url,
  context,
  title,
  configs,
  downloadTokenList,
  sync,
  manager,
  states,
  onlyRequired,
  isUploadFile,
}) => {
  const blocklet = await states.blocklet.getBlocklet(rootDid);
  if (!blocklet) {
    throw new Error('Root blocklet does not exist');
  }

  checkStructVersion(blocklet);

  const { inStore, registryUrl } = await StoreUtil.getStoreInfo(url);

  const meta = await getBlockletMetaFromUrl(url);

  if (meta.group === BlockletGroup.gateway) {
    throw new Error('Cannot add gateway component');
  }

  // 如果是一个付费的blocklet,并且url来源为Store, 需要携带token才能下载成功
  if (!isFreeBlocklet(meta) && inStore) {
    const info = await states.node.read();

    // eslint-disable-next-line no-param-reassign
    context = {
      ...context,
      headers: {
        'x-server-did': info.did,
        'x-server-public-key': info.pk,
        'x-server-signature': await sign(info.did, info.sk, {
          exp: (Date.now() + 5 * 60 * 1000) / 1000,
        }),
      },
      downloadTokenList: downloadTokenList || [],
    };
  }

  if (title) {
    meta.title = await titleSchema.validateAsync(title);
  }

  const newChildMeta = ensureMeta(meta);

  // children
  // eslint-disable-next-line no-nested-ternary
  const source = isUploadFile ? BlockletSource.upload : inStore ? BlockletSource.registry : BlockletSource.url;
  const newChild = {
    meta: newChildMeta,
    source,
    bundleSource: inStore
      ? {
          store: registryUrl,
          name: meta.bundleName || meta.name,
          // FIXME: version should be specified
          version: 'latest',
        }
      : { url },
    appEk: `0x${crypto.randomBytes(64).toString('hex')}`,
  };

  if (hasStartEngine(newChildMeta) || hasMountPoint(newChildMeta)) {
    const mountPoint = tmpMountPoint
      ? await updateMountPointSchema.validateAsync(tmpMountPoint)
      : formatName(newChildMeta.title) || formatName(newChildMeta.name);
    newChild.mountPoint = mountPoint;
  }

  const { dynamicComponents } = await parseComponents(newChild);

  const index = blocklet.children.findIndex((child) => child.meta.did === meta.did);

  if (index >= 0) {
    // if upgrade, do not update mountPoint and title
    newChild.mountPoint =
      blocklet.children[index].mountPoint || formatName(newChildMeta.title) || formatName(newChildMeta.name);
    // 更新版本时, title 应该更新
    // newChild.meta.title = blocklet.children[index].meta.title;
    newChild.installedAt = blocklet.children[index].installedAt;
    newChild.appEk = blocklet.children[index].appEk || newChild.appEk;
    blocklet.children.splice(index, 1, newChild);
  } else {
    dynamicComponents.unshift(newChild);
  }

  // 检查不存在的 blocklet mountPoint 是否冲突
  dynamicComponents.forEach((comp) => resolveMountPointConflict(comp, blocklet));

  let newChildren = filterDuplicateComponents(dynamicComponents, blocklet.children).map((x) => ({
    ...x,
    installedAt: x.installedAt || new Date(),
    appEk: x.appEk || `0x${crypto.randomBytes(64).toString('hex')}`,
    ...(isUploadFile ? { bundleSource: null } : {}),
  }));

  if (onlyRequired) {
    newChildren = filterRequiredComponents(newChild, newChildren);
  }
  blocklet.children.push(...newChildren);

  checkVersionCompatibility(blocklet.children);

  const oldBlocklet = await manager._getBlockletForInstallation(rootDid);
  const action = index >= 0 ? INSTALL_ACTIONS.UPGRADE_COMPONENT : INSTALL_ACTIONS.INSTALL_COMPONENT;
  try {
    // add component to db
    await states.blocklet.addChildren(rootDid, newChildren);

    // update configs
    if (action === INSTALL_ACTIONS.INSTALL_COMPONENT && Array.isArray(configs)) {
      if (hasReservedKey(configs)) {
        throw new Error('Component key of environments can not start with `ABT_NODE_` or `BLOCKLET_`');
      }

      await states.blockletExtras.setConfigs([blocklet.meta.did, newChild.meta.did], configs);

      // chain config
      await manager._ensureAppChainConfig(blocklet.meta.did, configs);
    }
  } catch (err) {
    logger.error('Add component failed', err);
    await manager._rollback(action, rootDid, oldBlocklet);
    throw err;
  }

  const componentDids = uniq([newChild.meta.did, ...newChildren.map((x) => x.meta.did)]);

  // new blocklet
  const newBlocklet = await states.blocklet.setBlockletStatus(rootDid, BlockletStatus.waiting, { componentDids });

  newBlocklet.children = blocklet.children;
  await validateBlocklet(newBlocklet);

  manager.emit(BlockletEvents.statusChange, newBlocklet);
  const shouldCleanUploadFile = isUploadFile && url.includes(process.env.ABT_NODE_DATA_DIR);

  const downloadParams = {
    oldBlocklet: { ...oldBlocklet },
    blocklet: { ...newBlocklet },
    componentDids,
    addedComponentDids: componentDids,
    context,
    postAction: action,
    shouldCleanUploadFile,
    url,
  };

  // backup rollback data
  await manager._rollbackCache.backup({ did: rootDid, action, oldBlocklet });

  logger.info('install component from url', { rootDid, url, mountPoint: tmpMountPoint, sync, componentDids });

  if (sync) {
    await manager._downloadAndInstall({ ...downloadParams, throwOnError: true });
    return states.blocklet.getBlocklet(rootDid);
  }

  // add to queue
  const ticket = manager.installQueue.push(
    {
      entity: 'blocklet',
      action: 'download',
      id: rootDid,
      entityId: rootDid,
      ...downloadParams,
    },
    rootDid
  );

  ticket.on('failed', async (err) => {
    logger.error('queue failed', { entity: 'blocklet', action, did: rootDid, error: err });
    await manager._rollback(action, rootDid, oldBlocklet);

    const notificationEvent =
      action === INSTALL_ACTIONS.INSTALL_COMPONENT
        ? BlockletEvents.componentInstallFailed
        : BlockletEvents.componentUpgradeFailed;
    const actionName = action === INSTALL_ACTIONS.INSTALL_COMPONENT ? 'install' : 'upgrade';

    manager.emit(notificationEvent, {
      blocklet: { ...newBlocklet, componentDids, error: { message: err.message } },
      context: { ...context, createAuditLog: false },
    });

    const installLength = componentDids.length;
    manager._createNotification(rootDid, {
      title: `${installLength > 1 ? `${installLength} components` : 'Component'} failed to ${actionName} for ${newBlocklet.meta.title}`,
      description: `${getComponentNamesWithVersion(newBlocklet, componentDids)} ${actionName} failed for ${
        newBlocklet.meta.title
      }: ${err.message || 'queue exception'}.`,
      entityType: 'blocklet',
      entityId: rootDid,
      severity: 'error',
    });
  });
  return newBlocklet;
};

module.exports = { installComponentFromUrl };
