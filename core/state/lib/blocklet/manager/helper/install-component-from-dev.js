const crypto = require('crypto');
const logger = require('@abtnode/logger')('@abtnode/core:install-component-dev');

const { BlockletStatus, BlockletSource, BLOCKLET_MODES, fromBlockletStatus } = require('@blocklet/constant');
const { isInProgress, isGatewayBlocklet } = require('@blocklet/meta/lib/util');
const formatName = require('@abtnode/util/lib/format-name');
const {
  parseComponents,
  filterDuplicateComponents,
  ensureMeta,
  checkVersionCompatibility,
  validateBlocklet,
} = require('../../../util/blocklet');

const needParseDependents = (meta, app) => {
  const dependents = (meta.components || []).map((x) => x.source.name);
  if (meta.engine?.interpreter === 'blocklet') {
    dependents.push(meta.engine.source.name);
  }
  return !dependents.filter(Boolean).every((name) => app.children.some((x) => x.meta.name === name));
};

const installComponentFromDev = async ({ folder, meta, rootDid, mountPoint, manager, states, skipParseDependents }) => {
  const { did, version } = meta;

  const existRoot = await states.blocklet.getBlocklet(rootDid);
  if (!existRoot) {
    throw new Error('Root blocklet does not exist');
  }

  const exist = existRoot.children.find((x) => x.meta.did === meta.did);
  if (exist) {
    const status = fromBlockletStatus(exist.status);
    if (isInProgress(status)) {
      throw new Error(`The blocklet component is on ${status}, please stop it before developing`);
    }

    logger.info('remove blocklet component for dev', { did, rootDid, version });

    await manager.deleteComponent({ did, rootDid });
  }

  let defaultPath = formatName(meta.title) || formatName(meta.name);
  if (!existRoot.children.map((x) => x.mountPoint).includes('/')) {
    defaultPath = '';
  }

  const component = {
    meta: ensureMeta(meta),
    mountPoint: (mountPoint || `/${defaultPath}`).toLowerCase(),
    source: BlockletSource.local,
    deployedFrom: folder,
    status: BlockletStatus.installed,
    mode: BLOCKLET_MODES.DEVELOPMENT,
    appEk: `0x${crypto.randomBytes(64).toString('hex')}`,
  };

  const needParse = !skipParseDependents && needParseDependents(component.meta, existRoot);
  let children = [];
  if (needParse) {
    const { dynamicComponents } = await parseComponents(component);
    children = filterDuplicateComponents(
      dynamicComponents,
      existRoot.children.filter((x) => x.meta.did !== component.meta.did)
    ).map((x) => ({
      ...x,
      installedAt: x.installedAt || new Date(),
      appEk: x.appEk || `0x${crypto.randomBytes(64).toString('hex')}`,
    }));
  }

  if (!isGatewayBlocklet(meta)) {
    children.unshift(component);
  }

  if (children.length <= 0) {
    return manager.getBlocklet(rootDid);
  }

  checkVersionCompatibility([...children, ...existRoot.children]);

  const componentDids = children.map((x) => x.meta.did);

  const { BLOCKLET_PORT } = process.env;
  await states.blocklet.addChildren(rootDid, children, {
    manualPorts: BLOCKLET_PORT ? [{ did: component.meta.did, ports: { BLOCKLET_PORT } }] : null,
  });

  const newBlocklet = await states.blocklet.getBlocklet(rootDid);
  await validateBlocklet(newBlocklet);

  if (needParse) {
    const childrenToDownload = (newBlocklet.children || []).filter((x) => {
      return componentDids.includes(x.meta.did);
    });
    await manager._downloadBlocklet({
      ...newBlocklet,
      childrenToDownload,
    });
  }

  await states.blocklet.setBlockletStatus(rootDid, BlockletStatus.installed, {
    componentDids,
  });

  // Add Config
  await manager._setConfigsFromMeta(rootDid);

  // should ensure blocklet integrity
  let blocklet = await manager.ensureBlocklet(rootDid);

  // pre install
  await manager._runUserHook('preInstall', blocklet);

  // Add environments
  await manager._updateBlockletEnvironment(rootDid);
  blocklet = await manager.getBlocklet(rootDid);

  // post install
  await manager._runUserHook('postInstall', blocklet);

  // pre flight
  await manager._runUserHook('preFlight', blocklet);

  logger.info('add blocklet component for dev', { did, version, meta });

  blocklet = await manager.getBlocklet(rootDid);

  blocklet.componentDids = componentDids;

  return blocklet;
};

module.exports = { installComponentFromDev };
