/* eslint-disable no-await-in-loop */
const fs = require('fs-extra');
const path = require('path');
const omit = require('lodash/omit');
const logger = require('@abtnode/logger')('@abtnode/core:blocklet:manager:install-core');
const { generateRandomString } = require('@abtnode/models/lib/util');
const { sign } = require('@arcblock/jwt');
const { BLOCKLET_INSTALL_TYPE, INSTALL_ACTIONS, WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { BlockletStatus, BlockletEvents, fromBlockletSource } = require('@blocklet/constant');
const { isGatewayBlocklet } = require('@blocklet/meta/lib/util');
const {
  BlockletGroup,
  BlockletSource,
  BLOCKLET_MODES,
  BLOCKLET_INTERFACE_TYPE_WEB,
  BLOCKLET_INTERFACE_PUBLIC,
  BLOCKLET_DYNAMIC_PATH_PREFIX,
  BLOCKLET_DEFAULT_PORT_NAME,
  BLOCKLET_INTERFACE_PROTOCOL_HTTP,
  BLOCKLET_DEFAULT_PATH_REWRITE,
  BLOCKLET_DEFAULT_VERSION,
  BLOCKLET_LATEST_SPEC_VERSION,
  BLOCKLET_META_FILE,
  BLOCKLET_CONFIGURABLE_KEY,
} = require('@blocklet/constant');
const { update: updateMetaFile } = require('@blocklet/meta/lib/file');
const { validateBlocklet, filterRequiredComponents, getBundleDir } = require('../../../util/blocklet');

const states = require('../../../states');
const launcher = require('../../../util/launcher');
const {
  ensureAppLogo,
  updateBlockletFallbackLogo,
  getPackConfig,
  getPackComponent,
  copyPackImages,
  getTypeFromInstallParams,
} = require('../../../util/blocklet');
const { removeBackup } = require('../../storage/utils/disk');
const { getWalletAppNotification } = require('../../../util/wallet-app-notification');
const { installApplicationFromBackup } = require('../helper/install-application-from-backup');
const { installApplicationFromGeneral } = require('../helper/install-application-from-general');
const util = require('../../../util');

/**
 * On install callback
 */
async function _onInstall(manager, { blocklet, componentDids, context, oldBlocklet }) {
  const { meta } = blocklet;
  const { did, version } = meta;
  logger.info('do install blocklet', { did, version });
  try {
    const installedBlocklet = await _installBlocklet(manager, {
      did,
      componentDids,
      context,
      oldBlocklet,
    });

    if (context.startImmediately && installedBlocklet?.settings.initialized) {
      try {
        logger.info('start blocklet after installed', { did });
        await manager.start({ did, checkHealthImmediately: true, componentDids });
      } catch (error) {
        logger.warn('attempt to start immediately failed', { did, error });
      }
    }

    return installedBlocklet;
  } catch (error) {
    console.error(`blocklet onInstall error: ${did}`, error);
    logger.error('blocklet onInstall error', { did, error });
    return null;
  }
}

/**
 * Install blocklet
 */
async function _installBlocklet(manager, { did, oldBlocklet, componentDids, context, createNotification = true }) {
  try {
    // should ensure blocklet integrity
    let blocklet = await manager.ensureBlocklet(did);
    const { meta, source, deployedFrom } = blocklet;

    // ensure delete process
    try {
      await manager.deleteProcess({ did, shouldUpdateBlockletStatus: false }, context);
      logger.info('ensure delete blocklet process for installing', { did, name: meta.name });
    } catch (err) {
      logger.error('ensure delete blocklet process failed for installing', { did, name: meta.name, error: err });
    }

    // Add environments
    await manager._updateBlockletEnvironment(meta.did);
    blocklet = await manager.getBlocklet(did);

    // Add initialize authentication settings
    await manager.migrateBlockletAuthentication({ did });

    if (!context.skipHooks) {
      // pre install
      await manager._runUserHook('preInstall', blocklet, context);

      // post install
      await manager._runUserHook('postInstall', blocklet, context);

      // pre flight
      await manager._runUserHook('preFlight', blocklet, context);
    }

    await states.blocklet.setInstalledAt(did);

    await states.blocklet.setBlockletStatus(did, BlockletStatus.installed, { componentDids });
    blocklet = await manager.getBlocklet(did);
    logger.info('blocklet installed', { source, did: meta.did });

    // logo
    await ensureAppLogo(blocklet, manager.installDir);
    await updateBlockletFallbackLogo(blocklet);

    // Init db
    await manager.teamManager.initTeam(blocklet.meta.did);

    // Update dependents
    await manager._updateDependents(did);
    blocklet = await manager.getBlocklet(did);

    // Inject pack configs
    const packConfig = await getPackConfig(blocklet);
    if (packConfig) {
      const packComponent = getPackComponent(blocklet);

      // 同步图片资源
      await copyPackImages({
        appDataDir: path.join(manager.dataDirs.data, blocklet.meta.name),
        packDir: packComponent.env.appDir,
        packConfig,
      });

      // 同步 App 导航配置
      await manager.configNavigations({ did, navigations: packConfig.navigations });

      // 同步 App 品牌相关图片配置
      const configObj = packConfig.configObj || {};
      for (const key of util.APP_CONFIG_IMAGE_KEYS) {
        const value = configObj[key];
        if (value) {
          await manager.config({
            did: [blocklet.meta.did],
            configs: [{ key, value }],
            skipHook: true,
            skipDidDocument: true,
            skipEmitEvents: true,
          });
        }
      }

      // 同步各子组件配置
      for (const { did: componentDid, configs } of packConfig.components || []) {
        if (blocklet.children.some((x) => x.meta.did === componentDid)) {
          await manager.config({
            did: [blocklet.meta.did, componentDid],
            configs,
            skipHook: true,
            skipDidDocument: true,
            skipEmitEvents: true,
          });
        } else {
          logger.error('component not found', { did: componentDid });
        }
      }
    }

    manager.emit(BlockletEvents.installed, { blocklet, context });

    // Update dynamic component meta in blocklet settings
    await _ensureDeletedChildrenInSettings(manager, blocklet);

    if (context?.downloadTokenList?.length) {
      await states.blocklet.updateBlocklet(did, {
        tokens: {
          downloadTokenList: context.downloadTokenList,
        },
      });
    }

    if (blocklet.controller && !blocklet.controller.consumedAt && process.env.NODE_ENV !== 'test') {
      let isNFTConsumed = false;
      if (blocklet.controller.launcherSessionId && blocklet.controller.launcherUrl) {
        await launcher.consumeLauncherSession({ params: blocklet.controller, blocklet });
        isNFTConsumed = true;
      } else if (blocklet.controller.nftId) {
        await launcher.consumeServerlessNFT({ nftId: blocklet.controller.nftId, blocklet });
        isNFTConsumed = true;
      }

      if (isNFTConsumed) {
        await states.blockletExtras.updateByDid(did, {
          controller: { ...blocklet.controller, consumedAt: new Date().toISOString() },
        });
        manager.emit(BlockletEvents.nftConsumed, { blocklet, context });
      }
    }

    if (createNotification) {
      // 发送通知不阻塞后续安装流程
      try {
        const walletExtra = await getWalletAppNotification(blocklet);

        manager._createNotification(did, {
          title: 'Blocklet Installed',
          description: `Blocklet ${meta.title} is installed successfully. (Source: ${
            deployedFrom || fromBlockletSource(source)
          })`,
          action: `/blocklets/${did}/overview`,
          blockletDashboardAction: `${WELLKNOWN_SERVICE_PATH_PREFIX}/admin/blocklets`,
          entityType: 'blocklet',
          entityId: did,
          severity: 'success',
          extra: { wallet: walletExtra },
        });
      } catch (error) {
        logger.error('create installed notification failed', { error, did });
      }
    }

    await manager._rollbackCache.remove({ did: blocklet.meta.did });
    removeBackup(manager.dataDirs.data, blocklet.appDid);
    return blocklet;
  } catch (err) {
    const { meta } = await states.blocklet.getBlocklet(did);
    const { name, version } = meta;
    logger.error('failed to install blocklet', { name, did, version, error: err });
    try {
      await manager._rollback(INSTALL_ACTIONS.INSTALL, did, oldBlocklet);
      manager.emit(BlockletEvents.installFailed, {
        meta: { did },
        error: {
          message: err.message,
        },
      });
      manager._createNotification(did, {
        title: 'Blocklet Install Failed',
        description: `Blocklet ${meta.title} install failed with error: ${err.message}`,
        entityType: 'blocklet',
        entityId: did,
        severity: 'error',
      });
    } catch (e) {
      logger.error('failed to remove blocklet on install error', { did: meta.did, error: e });
    }

    throw err;
  }
}

/**
 * Ensure deleted children in settings (imported from install-upgrade-manager)
 */
async function _ensureDeletedChildrenInSettings(manager, blocklet) {
  const { did } = blocklet.meta;

  // TODO 不从 settings 中取值, 直接存在 extra 中
  let deletedChildren = await states.blockletExtras.getSettings(did, 'children', []);
  deletedChildren = deletedChildren.filter(
    (x) => x.status === BlockletStatus.deleted && !blocklet.children.some((y) => y.meta.did === x.meta.did)
  );

  await states.blockletExtras.setSettings(did, { children: deletedChildren });
}

/**
 * Add blocklet
 */
async function _addBlocklet(
  manager,
  {
    component,
    mode = BLOCKLET_MODES.PRODUCTION,
    name,
    did,
    title,
    description,
    skSource = '',
    folder,
    onlyRequired,
    requirements,
    context,
  }
) {
  const environments = component?.meta?.environments || [];

  const meta = {
    name,
    did,
    title: title || component?.meta?.title || '',
    description: description || component?.meta?.description || '',
    version: BLOCKLET_DEFAULT_VERSION,
    group: BlockletGroup.gateway,
    interfaces: [
      {
        type: BLOCKLET_INTERFACE_TYPE_WEB,
        name: BLOCKLET_INTERFACE_PUBLIC,
        path: BLOCKLET_DEFAULT_PATH_REWRITE,
        prefix: BLOCKLET_DYNAMIC_PATH_PREFIX,
        port: BLOCKLET_DEFAULT_PORT_NAME,
        protocol: BLOCKLET_INTERFACE_PROTOCOL_HTTP,
      },
    ],
    specVersion: BLOCKLET_LATEST_SPEC_VERSION,
    environments,
    timeout: {
      start: process.env.NODE_ENV === 'test' ? 10 : 60,
    },
    ...(requirements ? { requirements } : {}),
  };

  let children;
  if (mode === BLOCKLET_MODES.DEVELOPMENT) {
    children = isGatewayBlocklet(component.meta) ? [] : [component];
  } else {
    children = component ? await manager._getChildrenForInstallation(component) : [];
    if (onlyRequired) {
      children = filterRequiredComponents(component, children);
    }
  }

  // FIXME:
  // 当应用本身是容器时, 下载这个容器, 因为容器可能除 blocklet.yml 额外的文件
  // 本身就是容器的应用, 在容器中添加额外文件可能不是合理的做法
  // 容器只在安装时有效, 安装后容器无法升级
  const containerSourceUrl =
    component && component.meta.group === BlockletGroup.gateway && component.meta.dist && component.bundleSource?.url;

  if (containerSourceUrl) {
    meta.bundleDid = component.meta.did;
    meta.bundleName = component.meta.name;
    meta.version = component.meta.version;
    meta.dist = component.meta.dist;
    meta.logo = component.meta.logo;
  } else if (children[0]?.meta?.logo) {
    meta.logo = children[0].meta.logo;
  } else if (mode === BLOCKLET_MODES.DEVELOPMENT && isGatewayBlocklet(component.meta)) {
    meta.logo = component.meta.logo;
  }

  await validateBlocklet({ meta, children });

  // fake install bundle
  if (!containerSourceUrl) {
    const bundleDir = getBundleDir(manager.installDir, meta);
    fs.mkdirSync(bundleDir, { recursive: true });
    updateMetaFile(path.join(bundleDir, BLOCKLET_META_FILE), meta);
  }

  // add blocklet to db
  const params = {
    meta,
    source: BlockletSource.custom,
    children,
    mode,
    externalSkSource: skSource,
  };

  if (containerSourceUrl) {
    params.source = BlockletSource.url;
    params.deployedFrom = containerSourceUrl;
  }

  if (mode === BLOCKLET_MODES.DEVELOPMENT && isGatewayBlocklet(component.meta)) {
    params.source = BlockletSource.local;
    params.deployedFrom = folder;
  }

  const blocklet = await states.blocklet.addBlocklet(params);

  // set chain type
  const chainTypeEnv = {
    key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_CHAIN_TYPE,
    value: 'arcblock',
    shared: true,
  };
  const customChainType = environments.find((x) => x.name === 'CHAIN_TYPE')?.default;
  if (['eth', 'ethereum'].includes(customChainType)) {
    chainTypeEnv.value = 'ethereum';
  }

  await states.blockletExtras.setConfigs(blocklet.meta.did, [chainTypeEnv]);
  await states.blockletExtras.setSettings(blocklet.meta.did, { session: { salt: generateRandomString(16) } });

  manager.emit(BlockletEvents.added, { blocklet, context });

  return blocklet;
}

/**
 * Install blocklet
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params - Install parameters
 * @param {Object} context - Context
 * @returns {Promise<Object>}
 */
async function install(manager, params, context = {}) {
  const type = getTypeFromInstallParams(params);
  logger.info('install blocklet', { type, params: omit(params, ['appSk']), user: context.user });

  const { appSk } = params;
  if (!appSk) {
    throw new Error('appSk is required');
  }

  if (!params.controller && context?.user?.controller) {
    params.controller = context.user.controller;
  }

  const info = await states.node.read();

  // Note: if you added new header here, please change core/state/lib/blocklet/downloader/bundle-downloader.js to use that header
  context.headers = Object.assign(context?.headers || {}, {
    'x-server-did': info.did,
    'x-server-public-key': info.pk,
    'x-server-signature': await sign(info.did, info.sk, {
      exp: (Date.now() + 5 * 60 * 1000) / 1000,
    }),
  });
  context.downloadTokenList = params.downloadTokenList || [];

  if (typeof context.startImmediately === 'undefined') {
    context.startImmediately = !!params.startImmediately;
  }

  if (type === BLOCKLET_INSTALL_TYPE.RESTORE) {
    const { url } = params;
    return installApplicationFromBackup({ url, appSk, context, manager, states });
  }

  if ([BLOCKLET_INSTALL_TYPE.URL, BLOCKLET_INSTALL_TYPE.STORE, BLOCKLET_INSTALL_TYPE.CREATE].includes(type)) {
    return installApplicationFromGeneral({ ...params, type, context, manager, states });
  }

  // should not be here
  throw new Error(`install from ${type} is not supported`);
}

module.exports = {
  _onInstall,
  _installBlocklet,
  _addBlocklet,
  install,
};
