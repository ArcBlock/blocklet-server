const { isInServerlessMode } = require('@abtnode/util/lib/serverless');
const { BLOCKLET_INSTALL_TYPE, INSTALL_ACTIONS } = require('@abtnode/constant');
const { BlockletStatus, BLOCKLET_CONFIGURABLE_KEY } = require('@blocklet/constant');

const logger = require('@abtnode/logger')('@abtnode/core:install-app-general');
const { getApplicationWallet } = require('@blocklet/meta/lib/wallet');
const { installBlockletTitleSchema, installBlockletDescriptionSchema } = require('@blocklet/meta/lib/schema');

const StoreUtil = require('../../../util/store');
const { getBlockletMetaFromUrl, ensureMeta, validateStore, validateInServerless } = require('../../../util/blocklet');

/**
 *
 * @param {{
 *  manager: import('../disk'),
 *  states: import('../../../states/index')
 * }} param0
 * @returns
 */
const installApplicationFromGeneral = async ({
  type,
  appSk,
  skSource,
  sync,
  delay,
  controller,
  title,
  description,
  did: bundleDid,
  storeUrl,
  url: inputUrl,
  context = {},
  states,
  manager,
  onlyRequired,
} = {}) => {
  const nodeInfo = await states.node.read();

  let componentSourceUrl;
  if (type === BLOCKLET_INSTALL_TYPE.STORE) {
    if (!storeUrl) {
      throw new Error('store url should not be empty');
    }
    componentSourceUrl = StoreUtil.getBlockletMetaUrl({ did: bundleDid, storeUrl });
    await validateStore(nodeInfo, componentSourceUrl);
  } else if (type === BLOCKLET_INSTALL_TYPE.URL) {
    componentSourceUrl = inputUrl;
    await validateStore(nodeInfo, componentSourceUrl);
  } else if (type === BLOCKLET_INSTALL_TYPE.CREATE) {
    await installBlockletTitleSchema.validateAsync(title);
    await installBlockletDescriptionSchema.validateAsync(description);
  } else {
    throw new Error(`Should not be here: unknown type ${type}`);
  }

  let blockletWalletType;

  // create component
  let component;
  let requirements;
  if (componentSourceUrl) {
    const meta = await getBlockletMetaFromUrl(componentSourceUrl);

    // 确定是否来自 store
    let inStore = type === BLOCKLET_INSTALL_TYPE.STORE;
    let registryUrl = storeUrl;
    if (type === BLOCKLET_INSTALL_TYPE.URL) {
      const { inStore: _inStore, registryUrl: _registryUrl } = await StoreUtil.getStoreInfo(componentSourceUrl);
      if (_inStore) {
        inStore = _inStore;
        registryUrl = _registryUrl;
      }
    }

    const blockletWalletTypeEnv = (meta.environments || []).find((x) => x.name === 'CHAIN_TYPE');
    if (blockletWalletTypeEnv) {
      blockletWalletType = blockletWalletTypeEnv.default;
    }

    if (isInServerlessMode(nodeInfo)) {
      validateInServerless({ blockletMeta: meta });
    }

    component = {
      meta: ensureMeta(meta),
      mountPoint: '/',
      bundleSource: inStore
        ? {
            store: registryUrl,
            name: meta.bundleName || meta.name,
            // FIXME: version should be specified
            version: 'latest',
          }
        : { url: componentSourceUrl },
    };
    requirements = meta.requirements;
  }

  // app wallet
  const wallet = getApplicationWallet(appSk, undefined, blockletWalletType);
  const did = wallet.address;
  const name = wallet.address;

  // check exist
  const exist = await states.blocklet.hasBlocklet(did);
  if (exist) {
    throw new Error(`blocklet ${did} already exists`);
  }

  // remove dirty data
  const oldExtraState = await states.blockletExtras.findOne({ did });
  if (oldExtraState) {
    logger.error('find dirty data in blocklet extra', { did });
    await states.blockletExtras.remove({ did });
  }

  // create app
  const blocklet = await manager._addBlocklet({
    component,
    name,
    did,
    title,
    description,
    skSource,
    onlyRequired,
    requirements,
    context,
  });
  logger.info('blocklet added to database', { did: blocklet.meta.did });

  // create config
  try {
    await states.blockletExtras.addMeta({ did, meta: { did, name }, controller });
    await manager._setConfigsFromMeta(did);
    if (context.bindDomainCap && context.domainNftDid) {
      await states.blockletExtras.setSettings(did, {
        bindDomainCap: context.bindDomainCap,
        domainNftDid: context.domainNftDid,
      });

      logger.info('set domain cap and nft did in blocklet extras', {
        did,
        bindDomainCap: context.bindDomainCap,
        domainNftDid: context.domainNftDid,
      });
    }

    await states.blockletExtras.setConfigs(did, [
      {
        key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SK,
        value: appSk,
        secure: true,
      },
    ]);
  } catch (err) {
    const componentDid = component?.meta?.did;
    logger.error('failed to create blocklet extras', { did, componentDid, error: err });

    try {
      await manager._rollback(INSTALL_ACTIONS.INSTALL, did, {});
    } catch (e) {
      logger.error('failed to remove blocklet on create extras error', { did, componentDid, error: e });
    }

    manager._createNotification(did, {
      title: 'Blocklet Install Failed',
      description: `Blocklet ${title || component?.meta?.title} install failed with error: ${err.message}`,
      entityType: 'blocklet',
      entityId: did,
      severity: 'error',
    });

    throw err;
  }

  if (!blocklet.children.length) {
    return manager._installBlocklet({ did, context });
  }

  try {
    const blocklet1 = await states.blocklet.setBlockletStatus(did, BlockletStatus.waiting);
    const action = INSTALL_ACTIONS.INSTALL;
    const downloadParams = {
      blocklet: { ...blocklet1 },
      context,
      postAction: action,
    };

    // backup rollback data
    await manager._rollbackCache.backup({ did, action });

    if (sync) {
      await manager._downloadAndInstall({ ...downloadParams, throwOnError: true });
      return states.blocklet.getBlocklet(did);
    }

    setTimeout(() => {
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
        const componentDid = component?.meta?.did;
        logger.error('failed to install blocklet', { did, componentDid, error: err });
        try {
          await manager._rollback(INSTALL_ACTIONS.INSTALL, did, {});
        } catch (e) {
          logger.error('failed to remove blocklet on install error', { did, componentDid, error: e });
        }

        manager._createNotification(did, {
          title: 'Blocklet Install Failed',
          description: `Blocklet ${title || component?.meta?.title} install failed with error: ${
            err.message || 'queue exception'
          }`,
          entityType: 'blocklet',
          entityId: did,
          severity: 'error',
        });
      });
    }, delay || 0);

    return blocklet1;
  } catch (err) {
    const componentDid = component?.meta?.did;
    logger.error('failed to install blocklet', { did, componentDid, error: err });

    try {
      await manager._rollback(INSTALL_ACTIONS.INSTALL, did, {});
    } catch (e) {
      logger.error('failed to remove blocklet on install error', { did, componentDid, error: e });
    }

    throw err;
  }
};

module.exports = { installApplicationFromGeneral };
