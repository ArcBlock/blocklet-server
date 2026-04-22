/* eslint-disable no-await-in-loop */
const omit = require('lodash/omit');
const logger = require('@abtnode/logger')('@abtnode/core:blocklet:manager:env-config');
const { sanitizeTag } = require('@abtnode/util/lib/sanitize');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const { sendToUser } = require('@blocklet/sdk/lib/util/send-notification');
const { encrypt } = require('@blocklet/sdk/lib/security');
const { getComponentApiKey } = require('@abtnode/util/lib/blocklet');
const { environmentNameSchema } = require('@blocklet/meta/lib/schema');
const {
  BlockletEvents,
  BlockletInternalEvents,
  BLOCKLET_CONFIGURABLE_KEY,
  BLOCKLET_PREFERENCE_PREFIX,
} = require('@blocklet/constant');
const { isPreferenceKey } = require('@blocklet/meta/lib/util');
const { shouldSyncFederated } = require('@abtnode/auth/lib/util/federated');

const states = require('../../../states');
const {
  getRuntimeEnvironments,
  isExternalBlocklet,
  validateAppConfig,
  isRotatingAppSk,
  getConfigsFromInput,
  getHookArgs,
} = require('../../../util/blocklet');
const hooks = require('../../hooks');
const launcher = require('../../../util/launcher');
const checkNeedRunDocker = require('../../../util/docker/check-need-run-docker');
const { dockerExec } = require('../../../util/docker/docker-exec');
const { getWalletAppNotification } = require('../../../util/wallet-app-notification');

/**
 * Config blocklet environment
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function config(manager, { did, configs: newConfigs, skipHook, skipDidDocument, skipEmitEvents }, context) {
  // todo: skipDidDocument will be deleted
  if (!Array.isArray(newConfigs)) {
    throw new Error('configs list is not an array');
  }

  // 对用户输入的配置进行 XSS 清理
  const sanitizedConfigs = newConfigs
    .map((c) => ({
      ...c,
      value: sanitizeTag(c.value),
    }))
    .filter((x) => (x.key.startsWith(BLOCKLET_PREFERENCE_PREFIX) ? omit(x, 'shared') : x));

  const tmpDids = Array.isArray(did) ? did : [did];
  const [rootDid, childDid] = tmpDids;
  const rootMetaDid = await states.blocklet.getBlockletMetaDid(rootDid);

  logger.info('config blocklet', { rootDid, rootMetaDid, childDid });

  const ancestors = [];
  let blocklet = await manager.getBlocklet(rootDid);
  if (childDid) {
    ancestors.push(blocklet);
    blocklet = blocklet.children.find((x) => x.meta.did === childDid);
    if (!blocklet) {
      throw new Error('Child blocklet does not exist', { rootDid, childDid });
    }
  }

  const configObj = {};
  const ignoredKeys = [];
  for (const x of sanitizedConfigs) {
    if (['CHAIN_TYPE', 'BLOCKLET_APP_CHAIN_TYPE'].includes(x.key)) {
      throw new Error(`${x.key} should not be changed`);
    } else if (x.custom === true) {
      // custom key
      await environmentNameSchema.validateAsync(x.key);
    } else if (BLOCKLET_CONFIGURABLE_KEY[x.key] && x.key.startsWith('BLOCKLET_')) {
      // app key
      if (childDid) {
        logger.error(`Cannot set ${x.key} to child blocklet`, { rootDid, childDid });
        throw new Error(`Cannot set ${x.key} to child blocklet`);
      }
      await validateAppConfig(x, states);
    } else if (!BLOCKLET_CONFIGURABLE_KEY[x.key] && !isPreferenceKey(x)) {
      const hasEnvInMeta = (b) => (b.meta.environments || []).some((y) => y.name === x.key);
      if (!hasEnvInMeta(blocklet)) {
        // forbid unknown environment items
        if (
          // config should in component.meta.environments
          childDid ||
          // config should in app.meta.environments and or in one of component.meta.environments
          !(blocklet.children || []).some(hasEnvInMeta)
        ) {
          logger.warn(`unknown environment item: ${x.key}`, { rootDid, childDid, config: x });
          ignoredKeys.push(x.key);
          continue;
        }
      }
    }

    configObj[x.key] = x.value;
  }

  const finalConfigs = sanitizedConfigs.filter((x) => !ignoredKeys.includes(x.key));
  const willAppSkChange = isRotatingAppSk(finalConfigs, blocklet.configs, blocklet.externalSk);

  // NOTICE: cannot use appDid as did param because appDid will become old appDid in alsoKnownAs and cannot get blocklet by the old appDid
  if (willAppSkChange && rootDid !== rootMetaDid) {
    throw new Error(`Please use app meta did (${rootMetaDid}) as did param when config appSk`);
  }

  // run hook
  if (!skipHook) {
    // FIXME: we should also call preConfig for child blocklets
    const nodeInfo = await states.node.read();
    const nodeEnvironments = await states.node.getEnvironments(nodeInfo);
    const nextEnv = { ...getRuntimeEnvironments(blocklet, nodeEnvironments, ancestors), ...configObj };
    const needRunDocker = await checkNeedRunDocker(blocklet.meta, nextEnv, nodeInfo, isExternalBlocklet(blocklet));
    const hookArgs = getHookArgs(blocklet);
    if (needRunDocker) {
      if (blocklet.meta.scripts?.preConfig) {
        await dockerExec({
          blocklet: {
            status: blocklet.status,
            meta: {
              did: rootDid,
            },
          },
          meta: blocklet.meta,
          nodeInfo,
          env: nextEnv,
          script: blocklet.meta.scripts.preConfig,
          retry: 0,
          hookName: 'preConfig',
          ...hookArgs,
        });
      }
    } else {
      await hooks.preConfig(blocklet.meta.title, {
        appDir: blocklet.env.appDir,
        hooks: Object.assign(blocklet.meta.hooks || {}, blocklet.meta.scripts || {}),
        exitOnError: true,
        env: nextEnv,
        did,
        context,
        teamManager: manager.teamManager,
        ...hookArgs,
      });
    }
  }

  Object.assign(blocklet.configObj, configObj);

  // update db
  if (childDid) {
    const { sharedConfigs, selfConfigs } = getConfigsFromInput(finalConfigs, blocklet.configs);

    if (sharedConfigs.length) {
      await states.blockletExtras.setConfigs([rootMetaDid], sharedConfigs);
    }
    if (selfConfigs.length) {
      await states.blockletExtras.setConfigs([rootMetaDid, childDid], selfConfigs);
    }
  } else {
    await states.blockletExtras.setConfigs([rootMetaDid], finalConfigs);
  }

  if (willAppSkChange) {
    const info = await states.node.read();
    const { wallet } = getBlockletInfo(blocklet, info.sk);
    const migratedFrom = Array.isArray(blocklet.migratedFrom) ? blocklet.migratedFrom : [];
    await states.blocklet.updateBlocklet(rootDid, {
      migratedFrom: [
        ...migratedFrom,
        { appSk: wallet.secretKey, appDid: wallet.address, at: new Date().toISOString() },
      ],
    });
  }

  // Reload nginx to make sure did-space can embed content from this app
  if (finalConfigs.find((x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_BACKUP_ENDPOINT)?.value) {
    manager.emit(BlockletEvents.spaceConnected, blocklet);
  }

  // Reload nginx when APP_NO_INDEX changes to update X-Robots-Tag header
  if (finalConfigs.find((x) => x.key === 'APP_NO_INDEX')) {
    manager.emit(BlockletEvents.gatewayConfigChanged, blocklet);
  }

  // update blocklet meta
  if (blocklet.structVersion && !childDid) {
    const changedTitle = finalConfigs.find((x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_NAME)?.value;
    const changedDescription = finalConfigs.find(
      (x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_DESCRIPTION
    )?.value;

    if (changedTitle || changedDescription) {
      await states.blocklet.updateBlocklet(rootDid, {
        meta: {
          ...blocklet.meta,
          title: changedTitle || blocklet.meta.title,
          description: changedDescription || blocklet.meta.description,
        },
      });
    }
  }

  // chain config
  await manager._ensureAppChainConfig(rootMetaDid, finalConfigs);

  await manager._updateBlockletEnvironment(rootDid);

  // response
  const newState = await manager.getBlocklet(rootDid);

  if (willAppSkChange && !skipDidDocument) {
    await manager._updateDidDocument(newState);
  }

  if (!skipEmitEvents) {
    if (!childDid && !finalConfigs.some((x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SK)) {
      await manager.configSynchronizer.throttledSyncAppConfig(blocklet.meta.did);
      manager.emit(BlockletInternalEvents.appConfigChanged, {
        appDid: rootDid,
        configs: finalConfigs.map((x) => ({ key: x.key, value: x.value })),
      });
    }

    const serverSk = (await states.node.read()).sk;
    if (childDid) {
      const configs = JSON.stringify(finalConfigs.map((x) => ({ key: x.key, value: x.value })));
      await manager.configSynchronizer.syncComponentConfig(childDid, rootDid, { serverSk });

      manager.emit(BlockletInternalEvents.componentConfigChanged, {
        appDid: rootDid,
        componentDid: childDid,
        configs: encrypt(configs, getComponentApiKey({ serverSk, app: ancestors[0], component: blocklet }), childDid),
      });

      // broadcast shared configs to all components through app channel
      const sharedConfigs = finalConfigs.filter((x) => x.shared);
      if (sharedConfigs.length) {
        manager.emit(BlockletInternalEvents.appConfigChanged, {
          appDid: rootDid,
          configs: sharedConfigs.map((x) => ({ key: x.key, value: x.value })),
        });
      }
    }

    manager.emit(BlockletEvents.updated, { ...newState, context });

    try {
      const observableConfigs = [
        BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_URL,
        BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_NAME,
        BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_DESCRIPTION,
        BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO,
        BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_SQUARE,
        BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_SQUARE_DARK,
        BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_RECT,
        BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_RECT_DARK,
        BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_FAVICON,
      ];

      const shouldSendWalletNotification = observableConfigs.some((x) => finalConfigs.some((y) => y.key === x));

      if (shouldSendWalletNotification) {
        // notify launcher config changed
        launcher.notifyBlockletUpdated(blocklet);
        if (shouldSyncFederated(blocklet)) {
          try {
            // 通知站点群更新信息
            manager.syncFederatedConfig({ did });
          } catch (err) {
            logger.error('Failed to sync federated config after updated config', { did, error: err });
          }
        }
      }

      const receiverUsers = await manager.teamManager.getOwnerAndAdminUsers(newState.appPid, true);
      const receivers = receiverUsers.map((x) => x.did);

      if (shouldSendWalletNotification && receivers.length) {
        const nodeInfo = await states.node.read();
        const blockletInfo = getBlockletInfo(newState, nodeInfo.sk);
        const { actions, attachments } = await getWalletAppNotification(newState, blockletInfo);

        const sender = {
          appDid: blockletInfo.wallet.address,
          appSk: blockletInfo.wallet.secretKey,
        };

        await sendToUser(
          receivers,
          {
            title: 'Blocklet Config Changed',
            body: `Blocklet ${blockletInfo.name} config changed`,
            attachments,
            actions,
          },
          sender
        );
      }
    } catch (error) {
      logger.error('Failed to send wallet notification after updated config', { did, error });
    }
  }

  return newState;
}

module.exports = {
  config,
};
