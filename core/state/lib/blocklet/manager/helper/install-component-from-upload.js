const crypto = require('crypto');
const path = require('path');

const logger = require('@abtnode/logger')('@abtnode/core:install-component-upload');
const uniq = require('lodash/uniq');
const { getComponentProcessId } = require('@blocklet/meta/lib/get-component-process-id');
const { isInProgress, hasStartEngine } = require('@blocklet/meta/lib/util');

const { BlockletSource, BlockletGroup, fromBlockletStatus } = require('@blocklet/constant');
const { INSTALL_ACTIONS } = require('@abtnode/constant');
const { updateMountPointSchema } = require('@blocklet/meta/lib/schema');
const {
  parseComponents,
  filterDuplicateComponents,
  getDiffFiles,
  getBundleDir,
  ensureMeta,
  checkStructVersion,
  checkVersionCompatibility,
  getBlockletStatus,
  resolveMountPointConflict,
} = require('../../../util/blocklet');
const { resolveDownload, resolveDiffDownload, downloadFromUpload } = require('../../downloader/resolve-download');

const installComponentFromUpload = async ({
  rootDid,
  mountPoint: tmpMountPoint,
  file,
  did,
  diffVersion,
  deleteSet,
  context = {},
  manager,
  states,
  dist,
}) => {
  logger.info('install component', { from: 'upload file' });

  const oldBlocklet = await manager._getBlockletForInstallation(rootDid);
  if (!oldBlocklet) {
    throw new Error('Root blocklet does not exist');
  }

  checkStructVersion(oldBlocklet);

  // download
  const { tarFile } = await downloadFromUpload(file, { downloadDir: path.join(manager.dataDirs.tmp, 'download') });

  const appStatus = getBlockletStatus(oldBlocklet);
  if (isInProgress(appStatus)) {
    logger.error(`Can not deploy blocklet when it is ${fromBlockletStatus(appStatus)}`);
    throw new Error(`Can not deploy blocklet when it is ${fromBlockletStatus(appStatus)}`);
  }

  let meta;
  // diff upload
  if (did && diffVersion) {
    const oldChild = oldBlocklet.children.find((x) => x.meta.did === did);
    if (!oldChild) {
      throw new Error(`Blocklet ${did} not found when diff deploying`);
    }
    if (oldChild.meta.version !== diffVersion) {
      logger.error('Diff deploy: Blocklet version changed', {
        preVersion: diffVersion,
        changedVersion: oldChild.meta.version,
        name: oldChild.meta.name,
        did: oldChild.meta.did,
      });
      throw new Error('Blocklet version changed when diff deploying');
    }

    meta = (await resolveDiffDownload(tarFile, manager.installDir, { deleteSet, meta: oldChild.meta, dist })).meta;
  } else {
    // full deploy
    meta = (await resolveDownload(tarFile, manager.installDir, { dist })).meta;
  }

  if (meta.did === rootDid) {
    // should not be here
    throw new Error('Cannot add self as a component');
  }

  if (meta.group === BlockletGroup.gateway) {
    throw new Error('Cannot add gateway component');
  }

  const newBlocklet = await states.blocklet.getBlocklet(rootDid);

  const newChild = {
    meta: ensureMeta(meta),
    source: BlockletSource.upload,
    deployedFrom: `Upload by ${context.user.fullName}`,
    bundleSource: null,
    appEk: `0x${crypto.randomBytes(64).toString('hex')}`,
  };
  if (hasStartEngine(newChild.meta)) {
    const mountPoint = await updateMountPointSchema.validateAsync(tmpMountPoint);
    newChild.mountPoint = mountPoint;
  }

  const index = newBlocklet.children.findIndex((child) => child.meta.did === meta.did);
  if (index >= 0) {
    // if upgrade, do not update mountPoint
    newChild.mountPoint = newBlocklet.children[index].mountPoint;
    newChild.installedAt = newBlocklet.children[index].installedAt || new Date();
    newChild.appEk = newBlocklet.children[index].appEk || newChild.appEk;
    newBlocklet.children.splice(index, 1, newChild);
  } else {
    newChild.installedAt = new Date();
    resolveMountPointConflict(newChild, oldBlocklet);
    newBlocklet.children.push(newChild);
  }

  const action = index >= 0 ? INSTALL_ACTIONS.UPGRADE_COMPONENT : INSTALL_ACTIONS.INSTALL_COMPONENT;

  const { dynamicComponents } = await parseComponents(newChild);
  dynamicComponents.forEach((comp) => resolveMountPointConflict(comp, newBlocklet));

  const newChildren = filterDuplicateComponents(dynamicComponents, newBlocklet.children).map((x) => ({
    ...x,
    installedAt: x.installedAt || new Date(),
    appEk: x.appEk || `0x${crypto.randomBytes(64).toString('hex')}`,
  }));

  newBlocklet.children.push(...newChildren);

  checkVersionCompatibility(newBlocklet.children);

  // backup rollback data
  await manager._rollbackCache.backup({ did: newBlocklet.meta.did, action, oldBlocklet });

  const componentDids = uniq([newChild.meta.did, ...newChildren.map((x) => x.meta.did)]);

  await manager._downloadAndInstall({
    blocklet: newBlocklet,
    oldBlocklet,
    context: { ...context, forceStartProcessIds: [getComponentProcessId(newChild, [newBlocklet])] },
    throwOnError: true,
    postAction: action,
    skipCheckStatusBeforeDownload: true,
    componentDids,
  });
  return manager.getBlocklet(newBlocklet.meta.did);
};

const diff = async ({ did, hashFiles: clientFiles, rootDid: inputRootDid, states, manager }) => {
  if (!did) {
    throw new Error('did is empty');
  }

  if (!clientFiles || !clientFiles.length) {
    throw new Error('hashFiles is empty');
  }

  const rootDid = inputRootDid || did;
  const childDid = inputRootDid ? did : '';

  if (childDid === rootDid) {
    throw new Error('Cannot add self as a component');
  }

  logger.info('Get blocklet diff', { rootDid, childDid, clientFilesNumber: clientFiles.length });

  const rootBlocklet = await states.blocklet.getBlocklet(rootDid);
  if (childDid && !rootBlocklet) {
    throw new Error(`Root blocklet does not exist: ${rootDid}`);
  }

  const state = childDid ? await (rootBlocklet.children || []).find((x) => x.meta.did === childDid) : rootBlocklet;

  if (!state) {
    return {
      hasBlocklet: false,
    };
  }

  if (state.source === BlockletSource.local) {
    throw new Error(`Blocklet ${state.meta.name} is already deployed from local, can not deployed from remote.`);
  }

  const { version } = state.meta;
  const bundleDir = getBundleDir(manager.installDir, state.meta);

  const { addSet, changeSet, deleteSet } = await getDiffFiles(clientFiles, bundleDir);

  logger.info('Diff files', {
    name: state.meta.name,
    did: state.meta.did,
    version: state.meta.version,
    addNum: addSet.length,
    changeNum: changeSet.length,
    deleteNum: deleteSet.length,
  });

  return {
    hasBlocklet: true,
    version,
    addSet,
    changeSet,
    deleteSet,
  };
};

module.exports = {
  installComponentFromUpload,
  diff,
};
