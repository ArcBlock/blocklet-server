const fs = require('fs-extra');
const path = require('path');
const omit = require('lodash/omit');
const toLower = require('lodash/toLower');

const { forEachBlockletSync, getBlockletAppIdList } = require('@blocklet/meta/lib/util');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');

const { BLOCKLET_CONFIGURABLE_KEY, BlockletEvents, BlockletStatus } = require('@blocklet/constant');
const { INSTALL_ACTIONS } = require('@abtnode/constant');

const logger = require('@abtnode/logger')('@abtnode/core:install-app-backup');

const { validateBlocklet, checkDuplicateAppSk, getAppDirs } = require('../../../util/blocklet');
const { dockerRestorePgBlockletDb } = require('../../../util/docker/docker-backup-pg-blocklet-db');

/**
 * backup 目录结构
 *  /blocklets/<name1>version>
 *  /blocklets/<name2>version>
 *  /blocklets/<name3>version>
 *  /data
 *  /blocklet.json
 *  /blocklet-extras.json
 * @see Blocklet 端到端备份方案的设计与实现（一期） https://team.arcblock.io/comment/discussions/e62084d5-fafa-489e-91d5-defcd6e93223
 * @param {{ url: string, appSk: string, moveDir: boolean, manager: import('../disk'), states: import('../../../states/index'), context: Record<string, string> }}
 * @return {Promise<any>}
 */
const installApplicationFromBackup = async ({
  url,
  appSk,
  moveDir,
  context = {},
  states,
  manager,
  sync = true,
  controller,
} = {}) => {
  // TODO: support more url schema feature (http, did-spaces)
  if (!url.startsWith('file://')) {
    throw new Error('url must starts with file://');
  }

  const dir = url.replace('file://', '');

  if (!dir || !fs.existsSync(dir)) {
    throw new Error(`dir(${dir}) does not exist`);
  }

  if (context.startImmediately === undefined) {
    context.startImmediately = true;
  }

  // parse data from source dir
  const srcBundleDirs = await getAppDirs(path.join(dir, 'blocklets'));

  const srcDataDir = path.join(dir, 'data');

  /** @type {import('@blocklet/server-js').BlockletState} */
  const blockletState = omit(fs.readJSONSync(path.join(dir, 'blocklet.json')), [
    '_id',
    'createdAt',
    'updatedAt',
    'installedAt',
    'startedAt',
  ]);

  if (!blockletState.structVersion) {
    throw new Error(
      'Only application of structVersion 2 can be restored on this server. Please migrate you application and re-backup your application on your previous server.'
    );
  }

  /** @type {import('@blocklet/server-js').RoutingSite} */
  const routingSite = omit(fs.readJSONSync(path.join(dir, 'routing_rule.json')));

  const { meta } = blockletState;
  const { did, name: appName } = meta;

  const extra = omit(fs.readJSONSync(path.join(dir, 'blocklet-extras.json')), [
    '_id',
    'createdAt',
    'updatedAt',
    'controller',
    'expiredAt',
  ]);

  if (blockletState.meta.did !== extra.did) {
    throw new Error(
      `did does not match in blocklet.json (${blockletState.meta.did}) and blocklet_extra.json ${extra.did}`
    );
  }

  forEachBlockletSync(blockletState, (component) => {
    delete component.status;
    delete component.ports;
    delete component.environments;
  });

  await validateBlocklet({ meta });

  const existState = await states.blocklet.hasBlocklet(did);

  if (existState) {
    logger.error('blocklet is already exist', { did });
    throw new Error(`blocklet is already exist. did: ${did}`);
  }

  if (appSk) {
    extra.configs = extra.configs || [];
    const skConfig = extra.configs.find((x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SK);
    if (skConfig) {
      skConfig.value = appSk;
      skConfig.secure = true;
      skConfig.shared = false;
    } else {
      extra.configs.push({
        key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SK,
        value: appSk,
        secure: true,
        shared: false,
      });
    }
  }

  // validate appDid
  const nodeInfo = await states.node.read();
  const appIdList = getBlockletAppIdList(blockletState);
  const { wallet } = getBlockletInfo(
    { meta: blockletState.meta, configs: extra.configs, environments: [] },
    nodeInfo.sk
  );
  if (appIdList.includes(wallet.address) === false) {
    throw new Error('blocklet appDid is different from the previous one');
  }
  await checkDuplicateAppSk({ sk: wallet.secretKey, states });

  states.blockletExtras.encryptSecurityData({ data: extra, rootDid: extra.did });

  logger.info('installFromBackup', { srcBundleDirs, srcDataDir });

  let blocklet = null;

  try {
    // 还原 routing rule
    await states.site.remove({ id: routingSite.id });

    // slpDomain 的生成方式是 serverDid + appPid, 所以是和 serverDid 相关的
    // 因此在恢复时，需要将 slpDomain 从 domainAliases 中移除
    let { domainAliases } = routingSite;
    domainAliases = domainAliases
      .filter((item) => !toLower(item.value).endsWith(toLower(nodeInfo.slpDomain)))
      .map((item) => {
        delete item.certificateId; // 目前暂不支持备份和恢复 HTTPS 证书，所以恢复的时候删除相关的数据
        return item;
      });
    routingSite.domainAliases = domainAliases;

    await states.site.insert(routingSite);

    // copy extra
    const existExtra = await states.blockletExtras.find({ did });
    if (existExtra) {
      // 如果数据存在, 当前视为脏数据, 直接删除
      logger.error('old extra state exists and will be force removed', { existExtra });
      await states.blockletExtras.remove({ did });
    }
    if (controller) {
      extra.controller = controller;
    }

    // 在旧版本中安装的 Blocklet 不存在 extra.meta 字段，这里补充一下
    extra.meta = extra.meta || { did, name: appName };

    await states.blockletExtras.insert(extra);
    logger.info('blocklet extra is copied successfully');

    // add blocklet
    blocklet = await states.blocklet.addBlocklet(blockletState);
    logger.info('blocklet state is added successfully');

    // copy bundle
    // 假设相同名称的应用，肯定是同一个应用
    // 假设版本号相同时, 应用不会变更
    // FIXME: blocklet bundle name/did 不是唯一的. 修改 blocklet bundle name/did 生成方式 使 name/bundle 唯一
    await Promise.all(
      srcBundleDirs.map(async ({ key: bundleName, dir: srcDir }) => {
        const installDir = path.join(manager.dataDirs.blocklets, bundleName);
        if (fs.existsSync(installDir)) {
          logger.info(`${bundleName} is already exist`);
          return;
        }

        fs.mkdirSync(installDir, { recursive: true });
        if (moveDir) {
          await fs.move(srcDir, installDir, { overwrite: true });
        } else {
          await fs.copy(srcDir, installDir);
        }
        logger.info(`bundle  is ${moveDir ? 'moved' : 'copied'} successfully`, { installDir });
      })
    );

    // copy data
    const dataDir = path.join(manager.dataDirs.data, appName);
    if (fs.existsSync(dataDir)) {
      logger.error('old data exists and will be force removed', { dataDir });
      await fs.remove(dataDir);
    }
    fs.mkdirSync(dataDir, { recursive: true });
    if (fs.existsSync(srcDataDir)) {
      if (moveDir) {
        await fs.move(srcDataDir, dataDir, { overwrite: true });
      } else {
        await fs.copy(srcDataDir, dataDir);
      }
      logger.info(`data is ${moveDir ? 'moved' : 'copied'} successfully`);
    }

    const dbPath = path.join(dataDir, 'blocklet.db');
    await dockerRestorePgBlockletDb(dbPath);
  } catch (error) {
    logger.error('installFromBackup failed', { did, error });

    await manager._rollback(INSTALL_ACTIONS.INSTALL, did);

    throw error;
  }

  if (sync) {
    try {
      logger.info('start download blocklet', { did });
      // 从 store 下载 blocklet
      await manager.blockletDownloader.download(blockletState, {
        skipCheckIntegrity: true,
        onProgress: (data) => {
          manager.emit(BlockletEvents.downloadBundleProgress, { appDid: wallet.address, meta: { did }, ...data });
        },
      });
    } catch (error) {
      logger.error('download blocklet failed', { did, error });

      await manager._rollback(INSTALL_ACTIONS.INSTALL, did);

      throw error;
    }
    logger.info('start install blocklet', { did });

    const state = await states.blocklet.setBlockletStatus(did, BlockletStatus.installing);
    manager.emit(BlockletEvents.statusChange, state);

    return manager._onInstall({ blocklet, did, context });
  }

  try {
    const blocklet1 = await states.blocklet.setBlockletStatus(did, BlockletStatus.waiting);
    manager.emit(BlockletEvents.added, blocklet1);

    const downloadParams = {
      blocklet: { ...blocklet1 },
      skipCheckIntegrity: true,
      context,
      postAction: INSTALL_ACTIONS.INSTALL,
    };

    // backup rollback data
    await manager._rollbackCache.backup({ did, action: INSTALL_ACTIONS.INSTALL });

    const ticket = manager.installQueue.push(
      {
        entity: 'blocklet',
        action: 'download',
        id: did,
        entityId: did,
        ...downloadParams,
      },
      did
    );
    ticket.on('failed', async (err) => {
      logger.error('failed to install blocklet', { did, error: err });
      try {
        await manager._rollback(INSTALL_ACTIONS.INSTALL, did, {});
      } catch (e) {
        logger.error('failed to remove blocklet on install error', { did, error: e });
      }

      manager._createNotification(did, {
        title: 'Blocklet Install Failed',
        description: `Blocklet ${blockletState?.meta?.title} install failed with error: ${
          err.message || 'queue exception'
        }`,
        entityType: 'blocklet',
        entityId: did,
        severity: 'error',
      });
    });

    return blocklet1;
  } catch (err) {
    logger.error('failed to install blocklet', { did, error: err });

    try {
      await manager._rollback(INSTALL_ACTIONS.INSTALL, did, {});
    } catch (e) {
      logger.error('failed to remove blocklet on install error', { did, error: e });
    }

    throw err;
  }
};

module.exports = { installApplicationFromBackup };
