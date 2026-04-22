const get = require('lodash/get');
const { EventEmitter } = require('events');
const { wipeSensitiveData, getDisplayName } = require('@blocklet/meta/lib/util');
const logger = require('@abtnode/logger')('@abtnode/core:event');
const {
  BlockletStatus,
  BlockletSource,
  BlockletEvents,
  BlockletInternalEvents,
  TeamEvents,
  BLOCKLET_CONFIGURABLE_KEY,
} = require('@blocklet/constant');
const {
  EVENT_BUS_EVENT,
  EVENTS,
  BACKUPS,
  NODE_MODES,
  DEFAULT_DID_DOMAIN,
  WELLKNOWN_BLOCKLET_ADMIN_PATH,
  TEST_STORE_URL,
  WELLKNOWN_SERVICE_PATH_PREFIX,
} = require('@abtnode/constant');
const { joinURL } = require('ufo');
const { encode } = require('@abtnode/util/lib/base32');
const dayjs = require('@abtnode/util/lib/dayjs');
const { deleteBlockletCache, clearBlockletInfoCache } = require('@abtnode/util/lib/blocklet-cache');
const { isWorkerInstance } = require('@abtnode/util/lib/pm2/is-instance-worker');
const { isInServerlessMode } = require('@abtnode/util/lib/serverless');
const { NodeMonitSender } = require('../monitor/node-monit-sender');
const { isCLI } = require('../util');

const eventHub =
  process.env.NODE_ENV === 'test'
    ? require('@arcblock/event-hub/single').default
    : require('@arcblock/event-hub').default;

const states = require('../states');
const { getBackupEndpoint, getBackupFilesUrlFromEndpoint, getDIDSpacesUrlFromEndpoint } = require('../util/spaces');
const { autoBackupHandlerFactory, autoBackupHandler } = require('./auto-backup-handler');

const eventBusHandler = require('../blocklet/webhook/event-bus');
const { isDevelopmentMode, updateDidDocument, updateDidDocumentStateOnly } = require('../util/blocklet');

const { backupBlockletSites, cleanBlockletSitesBackup, rollbackBlockletSites } = require('./util');
const { ensureBlockletHasMultipleInterfaces } = require('../router/helper');
const { sendServerlessHeartbeat } = require('../util/launcher');

/**
 *
 * @param {{
 *  blockletManager: import('../blocklet/manager/disk'),
 *  node: import('../index')
 * }} param0
 * @returns
 */
// Initialize the event queue: this will make events across process
module.exports = ({
  blockletManager,
  ensureBlockletRouting,
  ensureBlockletRoutingForUpgrade,
  removeBlockletRouting,
  handleBlockletRouting,
  handleSystemRouting,
  handleBlockletWafChange,
  domainStatus,
  teamAPI,
  securityAPI,
  nodeAPI,
  teamManager,
  certManager,
  routerManager,
  node,
  nodeRuntimeMonitor,
  daemon,
  webhookManager,
}) => {
  const nodeState = states.node;
  const nodeMonitSender = new NodeMonitSender({ node });

  const events = new EventEmitter();
  events.setMaxListeners(0);

  // Throttle serverless heartbeat: only call once every 30 seconds
  let lastServerlessHeartbeatTime = 0;
  const SERVERLESS_HEARTBEAT_THROTTLE_MS = 30000;

  let eventHandler = null;
  events.setEventHandler = (handler) => {
    if (typeof handler === 'function') {
      eventHandler = handler;
    }
  };

  /**
   * 缓存清除事件列表，所有进程（master + workers）都必须处理
   * 触发场景：
   * - blocklet.upgraded: configTheme, blocklet.componentRemoved, blocklet.componentInstalled, installed, removed, spaceConnected
   * - blocklet.blueOrGreenStarted: started，单个和多个的启动
   */
  [
    BlockletEvents.started,
    BlockletEvents.updated,
    BlockletEvents.upgraded,
    BlockletEvents.blueOrGreenStarted,
    BlockletEvents.stopped,
    BlockletEvents.appDidChanged,
  ].forEach((name) => {
    eventHub.on(name, (data) => {
      const did = get(data, 'meta.did');
      if (did) {
        logger.info(`delete blocklet cache on ${name}`, { did });
        deleteBlockletCache(did, logger);
        clearBlockletInfoCache(did, logger);
      }
    });
  });

  // Listen events from eventHub and call eventHandler
  // Only master/primary process handles full event processing to avoid redundant operations
  [...Object.values(BlockletEvents), ...Object.values(TeamEvents), ...Object.values(EVENTS)].forEach((name) => {
    if (isWorkerInstance()) {
      return;
    }
    eventHub.on(name, (data) => {
      if (process.env.TEST_LOG === 'true') {
        // eslint-disable-next-line no-console
        console.log('eventHub.on', name);
      }

      if (name === BlockletEvents.removed) {
        // Cleanup cache in teamManager for every node instance
        teamManager.deleteTeam(data?.meta?.did).catch((error) => {
          logger.error('Failed to delete team', { error });
        });
      }

      // When receiving installed event from CLI (e.g. blocklet import), set up routing
      // in the daemon. The router deduplicates queued changes, so this is safe even if
      // handleBlockletEvent already processed routing for this blocklet.
      if (name === BlockletEvents.installed) {
        const blocklet = data?.blocklet || data;
        if (blocklet?.meta?.did) {
          ensureBlockletRouting(blocklet, data?.context || {})
            .then((changed) => {
              if (changed) {
                return handleBlockletRouting({
                  did: blocklet.meta.did,
                  message: 'Install blocklet (eventHub)',
                });
              }
              return null;
            })
            .catch((error) => {
              logger.error('routing setup from eventHub failed', { event: name, did: blocklet?.meta?.did, error });
            });
        }
      }

      if (typeof eventHandler === 'function') {
        eventHandler({ name, data });
      }
    });
  });

  eventHub.on(EVENTS.NODE_UPDATED, () => {
    if (isWorkerInstance()) {
      return;
    }
    logger.info('node update');
    nodeAPI.deleteCache();
  });

  // Wipe sensitive data
  // Emit events to event hub
  // Emit events to node listener
  const onEvent = (name, data, disabledNodeListener = false) => {
    let safeData = data;
    if (get(data, 'meta.did', '')) {
      safeData = wipeSensitiveData(data);
    }

    if (get(safeData, 'blocklet.meta.did', '')) {
      safeData.blocklet = wipeSensitiveData(safeData.blocklet);
    }

    if (name === BlockletInternalEvents.appSettingChanged) {
      handleBlockletRouting({
        did: data.appDid,
        message: 'App setting changed',
      });
    }

    logger.debug('proxy event to event hub', { name });
    eventHub.broadcast(name, safeData); // 广播到所有节点
    if (!disabledNodeListener) {
      events.emit(name, safeData);
    }
  };

  // Emit events to node listener
  // Call eventHandler
  // NOT emit events to event hub
  const onInternalEvent = async (name, data) => {
    events.emit(name, data);
    if (typeof eventHandler === 'function') {
      eventHandler({ name, data });
    }

    if (name === EVENTS.NODE_RUNTIME_INFO) {
      const info = await node.getNodeInfo();

      if (info.mode === NODE_MODES.SERVERLESS) {
        return;
      }

      nodeMonitSender.sendToWallet(data);
    }
  };

  const handleBlockletBlueOrGreenStarted = async (name, { blocklet, componentDids, context }) => {
    try {
      // 只有某些 children 有多个接口时, 才需要更新路由
      const hasMultipleInterfaces = ensureBlockletHasMultipleInterfaces(blocklet, componentDids);
      if (!hasMultipleInterfaces) {
        return false;
      }
      const changed = await ensureBlockletRouting(blocklet, context);
      if (changed) {
        await handleBlockletRouting({
          did: blocklet.meta.did,
          message: 'Blue or green start blocklet',
        });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('create.url.mapping.error', { event: name, error });
      teamManager.createNotification({
        title: 'Blocklet URL Mapping Error',
        // eslint-disable-next-line max-len
        description: `Failed to create URL mapping for blocklet ${blocklet.meta.title}, due to: ${error.message}`,
        entityType: 'blocklet',
        entityId: blocklet.meta.did,
        severity: 'error',
      });
      return false;
    }
  };

  /**
   * Handle BlockletEvents.added - set up routing early for DNS warm-up
   * This is called as soon as blocklet is added to database, before download/install completes
   */
  const handleBlockletAdded = async (name, { blocklet, context }) => {
    try {
      const changed = await ensureBlockletRouting(blocklet, context);
      if (changed) {
        await handleBlockletRouting({
          did: blocklet.meta.did,
          message: 'Added blocklet (early routing setup)',
        });
        logger.info('early routing setup completed after added', { did: blocklet.meta.did });
      }
    } catch (error) {
      // Non-blocking - don't fail the install if early routing setup fails
      // It will be retried at installed event
      logger.error('early routing setup failed after added', { event: name, did: blocklet.meta.did, error });
    }
  };

  const handleBlockletInstall = async (name, { blocklet, context }) => {
    try {
      // Routing is already set up at 'added' event, but ensure it's complete
      // This handles cases where 'added' handler failed or was skipped
      const changed = await ensureBlockletRouting(blocklet, context);
      if (changed) {
        await handleBlockletRouting({
          did: blocklet.meta.did,
          message: 'Install blocklet',
        });
      }

      await teamAPI.refreshBlockletInterfacePermissions(blocklet.meta);
      logger.info('refreshed blocklet interface permissions after installed', { did: blocklet.meta.did });

      // Send full DID document update after install to capture any info populated during installation
      // The 'added' event sends an early document for DNS warm-up, but some metadata may be incomplete
      try {
        await updateDidDocument({ did: blocklet.appPid, nodeInfo: await node.getNodeInfo(), teamManager, states });
        logger.info('updated blocklet DID document after install', { did: blocklet.meta.did });
      } catch (error) {
        logger.error('update blocklet DID document state failed after install', { did: blocklet.meta.did, error });
      }
    } catch (error) {
      logger.error('create.url.mapping.error', { event: name, error });
      teamManager.createNotification({
        title: 'Blocklet URL Mapping Error',
        // eslint-disable-next-line max-len
        description: `Failed to create URL mapping for blocklet ${blocklet.meta.title}, due to: ${error.message}`,
        entityType: 'blocklet',
        entityId: blocklet.meta.did,
        severity: 'error',
      });
    }
  };

  const handleBlockletRemove = async (name, { blocklet, context }) => {
    if (context?.skipAll) {
      return;
    }

    try {
      const changed = await removeBlockletRouting(blocklet, context);
      if (changed) {
        await handleBlockletRouting({
          did: blocklet.meta.did,
          message: 'Remove blocklet',
          isRemoval: true,
        });
        logger.info('remove blocklet routing rules', { event: name, did: blocklet.meta.did });
      }
    } catch (error) {
      logger.error('remove blocklet routing rules error', { event: name, error });
    }

    try {
      await updateDidDocumentStateOnly({
        did: blocklet.appPid,
        blocklet,
        state: 'deleted',
        nodeInfo: await node.getNodeInfo(),
      });
      logger.info('updated blocklet DID document state to deleted', { did: blocklet.meta.did });
    } catch (error) {
      logger.error('update blocklet DID document failed after remove', { did: blocklet.meta.did, error });
    }

    try {
      await blockletManager.prune();
    } catch (error) {
      logger.error('prune blocklet app folder error', { event: name, error });
    }
  };

  const handleBlockletUpgrade = async (name, { blocklet, context }) => {
    let sites;
    let backupFile = null;
    try {
      ({ sites, backupFile } = await backupBlockletSites(blocklet));
      logger.info('sites before update blocklet routing', { event: name, did: blocklet.meta.did, sites });

      const changed = await ensureBlockletRoutingForUpgrade(blocklet, context);
      if (changed) {
        await handleBlockletRouting({
          did: blocklet.meta.did,
          message: 'Upgrade blocklet',
        });
      }

      await teamAPI.refreshBlockletInterfacePermissions(blocklet.meta);

      // clean backup sites after success
      sites = null;
      cleanBlockletSitesBackup(backupFile);
    } catch (error) {
      logger.error('upgrade blocklet routing rules error', { event: name, error });

      rollbackBlockletSites({ blocklet, sites, backupFile, handleBlockletRouting, context })
        .then(() => {
          logger.info('rollback blocklet routing rules success', { event: name, did: blocklet.meta.did });
        })
        .catch((err) => {
          logger.error('rollback blocklet routing rules error', { event: name, error: err });
        });

      teamManager.createNotification({
        title: 'Blocklet URL Mapping Error',
        // eslint-disable-next-line max-len
        description: `Failed to upgrade URL mapping for blocklet ${blocklet.meta.title}, due to: ${error.message}`,
        entityType: 'blocklet',
        entityId: blocklet.meta.did,
        severity: 'error',
      });
    }

    try {
      await blockletManager.prune();
    } catch (error) {
      logger.error('prune blocklet app folder error', { event: name, error });
    }
  };

  const handleServerEvent = (eventName) => {
    const [, status] = eventName.split('.');
    onEvent(eventName, {
      title: `Blocklet Server ${status}`,
      description: `Blocklet Server is ${status} successfully`,
      entityType: 'node',
      status: 'success',
      source: 'system',
    });
  };

  /**
   *
   * @description 事件必须注册在这里才能被发布出去
   * @param {string} eventName
   * @param {any} payload
   */
  const handleBlockletEvent = async (eventName, payload) => {
    /**
     * @type {import('@blocklet/server-js').BlockletState} payload
     */
    const blocklet = payload?.blocklet || payload;

    if (!blocklet) {
      logger.error('blocklet is not found', { eventName, payload });
      return;
    }

    if (isCLI() && process.env.NODE_ENV !== 'test') {
      if (payload.blocklet && !payload.meta) {
        onEvent(eventName, payload.blocklet);
      } else {
        onEvent(eventName, payload);
      }
      return;
    }

    if ([BlockletEvents.blueOrGreenStarted].includes(eventName)) {
      await handleBlockletBlueOrGreenStarted(eventName, payload);
    } else if ([BlockletEvents.added].includes(eventName)) {
      // Non-blocking - don't await to avoid slowing down install flow
      handleBlockletAdded(eventName, payload);
    } else if ([BlockletEvents.installed].includes(eventName)) {
      await handleBlockletInstall(eventName, payload);

      try {
        await node.createAuditLog({
          action: 'installBlocklet',
          args: {
            did: blocklet.meta.did,
          },
          context: payload.context || {},
          result: blocklet,
        });
      } catch (error) {
        logger.error('Failed to createAuditLog for installBlocklet', { error });
      }
    } else if ([BlockletEvents.upgraded].includes(eventName)) {
      await handleBlockletUpgrade(eventName, payload);
    } else if ([BlockletEvents.removed, BlockletEvents.dataCleaned].includes(eventName)) {
      await handleBlockletRemove(eventName, payload);
    } else if (
      [
        BlockletEvents.componentInstalled,
        BlockletEvents.componentInstallFailed,
        BlockletEvents.componentUpgradeFailed,
        BlockletEvents.componentUpgraded,
      ].includes(eventName)
    ) {
      if (payload?.context?.createAuditLog !== false) {
        const resultStatus = [BlockletEvents.componentInstallFailed, BlockletEvents.componentUpgradeFailed].includes(eventName) ? 'failed' : 'success'; // prettier-ignore
        const action = [BlockletEvents.componentInstalled, BlockletEvents.componentInstallFailed].includes(eventName) ? 'installed' : 'upgraded'; // prettier-ignore
        try {
          await node.createAuditLog({
            action: 'upgradeBlocklet',
            args: {
              did: blocklet.meta.did,
            },
            context: payload.context || {},
            result: {
              ...blocklet,
              resultStatus,
              action,
            },
          });
        } catch (error) {
          logger.error('Failed to createAuditLog for upgradeBlocklet failed', { error });
        }
      }
    } else if (BlockletEvents.appDidChanged === eventName) {
      await handleBlockletRouting({
        did: blocklet.meta.did,
        message: 'Update blocklet appDid',
      });
    } else if (BlockletEvents.spaceConnected === eventName) {
      await handleBlockletRouting({
        did: blocklet.meta.did,
        message: 'Connect blocklet to DID Spaces',
      });
    } else if (BlockletEvents.gatewayConfigChanged === eventName) {
      await handleBlockletRouting({
        did: blocklet.meta.did,
        message: 'Update blocklet gateway config',
      });
    } else if (BlockletEvents.backupProgress === eventName && payload?.completed) {
      try {
        const backupEndpoint = getBackupEndpoint(blocklet?.environments);
        const args = {
          did: blocklet.meta.did,
          url: getDIDSpacesUrlFromEndpoint(backupEndpoint),
          backupUrl: getBackupFilesUrlFromEndpoint(backupEndpoint),
          success: payload?.progress === 100,
          errorMessage: payload?.message,
          strategy: payload.backup.strategy,
        };

        if (payload.backup.strategy === BACKUPS.STRATEGY.MANUAL) {
          await node.createAuditLog({
            action: 'backupToSpaces',
            args,
            context: payload?.context ?? {},
          });
        }

        if (payload?.progress !== 100) {
          const nodeInfo = await node.getNodeInfo();
          const appUrl = blocklet?.environments.find((x) => x.key === 'BLOCKLET_APP_URL')?.value;
          /**
           *
           * @type {import('@blocklet/sdk/lib/types/notification').TNotificationInput | import('@blocklet/sdk/lib/types/notification').TNotification]} param
           */
          const param = {
            title: 'App Backup Failed',
            description: `Failed to backup ${getDisplayName(blocklet)} to ${args.url}, due to: ${args.errorMessage}`,
            entityType: 'blocklet',
            entityId: args.did,
            severity: 'error',
            sticky: true,
            actions: [
              {
                name: 'View in server',
                title: 'View in server',
                link: joinURL(
                  `https://${encode(nodeInfo.did)}.${DEFAULT_DID_DOMAIN}`,
                  nodeInfo.routing.adminPath,
                  `/blocklets/${blocklet.appPid}/didSpaces`
                ),
              },
              {
                name: 'View in app',
                title: 'View in app',
                link: joinURL(appUrl, WELLKNOWN_BLOCKLET_ADMIN_PATH, 'did-spaces'),
              },
            ],
          };

          await node.createNotification({ ...param, teamDid: nodeInfo.did });
          await node.createNotification({ ...param, teamDid: args.did });
        }
      } catch (error) {
        logger.error('Failed to createAuditLog for backupToSpaces failed', { error });
      }
    } else if (BlockletEvents.disableAutoBackup === eventName) {
      try {
        // 禁用自动备份时记录审计日志
        await node.createAuditLog({
          action: 'disableAutoBackup',
          args: payload.args,
          context: payload.context || {},
          result: payload.result,
        });
      } catch (error) {
        logger.error('Failed to createAuditLog for disableAutoBackup', { error });
      }
    } else if (BlockletEvents.configTheme === eventName) {
      try {
        // 修改主题时记录审计日志
        await node.createAuditLog({
          action: 'configTheme',
          args: payload.args,
          context: payload.context || {},
          result: payload.result,
        });
      } catch (error) {
        logger.error('Failed to createAuditLog for configTheme', { error });
      }
    }

    if ([BlockletEvents.started, BlockletEvents.startFailed, BlockletEvents.stopped].includes(eventName)) {
      try {
        await blockletManager.runtimeMonitor.monit(blocklet.meta.did);
      } catch (error) {
        logger.error('monit runtime info failed', { eventName, error });
      }

      // Use state-only update for started/stopped - no need to send full document
      if ([BlockletEvents.started, BlockletEvents.stopped].includes(eventName)) {
        updateDidDocument({ did: blocklet.appPid, nodeInfo: await node.getNodeInfo(), teamManager, states })
          .then(() => {
            logger.info(`updated blocklet DID document on ${eventName}`, {
              did: blocklet.meta.did,
              event: eventName,
            });
          })
          .catch((error) => {
            logger.error(`update blocklet DID document failed on ${eventName}`, {
              did: blocklet.meta.did,
              event: eventName,
              error,
            });
          });
      }
    }

    if ([BlockletEvents.statusChange].includes(eventName) && isDevelopmentMode(blocklet)) {
      try {
        const nodeInfo = await node.getNodeInfo();
        const storeParams = {
          teamDid: nodeInfo.did,
          url: TEST_STORE_URL,
          scope: '',
        };
        const exist = await blockletManager.teamAPI.existsStore(storeParams, {});
        if (!exist) {
          await blockletManager.teamAPI.addStore(storeParams, {});
        }
      } catch (error) {
        logger.error('Failed to add test store', { error });
      }
    }

    if (payload.blocklet && !payload.meta) {
      onEvent(eventName, payload.blocklet);
    } else {
      onEvent(eventName, payload);
    }

    if (
      [
        BlockletEvents.started,
        BlockletEvents.removed,
        BlockletEvents.statusChange,
        BlockletEvents.installed,
        BlockletEvents.componentInstalled,
        BlockletEvents.componentRemoved,
      ].includes(eventName)
    ) {
      const now = Date.now();
      const remainingMs = SERVERLESS_HEARTBEAT_THROTTLE_MS - (now - lastServerlessHeartbeatTime);
      if (remainingMs <= 0) {
        lastServerlessHeartbeatTime = now;
        node
          .getNodeInfo()
          .then((nodeInfo) => {
            if (isInServerlessMode({ mode: nodeInfo.mode })) {
              logger.info('send serverless heartbeat', { eventName });
              sendServerlessHeartbeat();
            }
          })
          .catch((error) => {
            logger.error('Failed to get node info to send serverless heartbeat', { error, eventName });
          });
      } else {
        logger.debug('serverless heartbeat throttled', {
          eventName,
          remainingMs,
        });
      }
    }
  };

  const downloadAddedBlocklet = async () => {
    try {
      const blocklets = await states.blocklet.find({
        status: BlockletStatus.added,
        source: { $in: [BlockletSource.registry, BlockletSource.url] },
      });
      // eslint-disable-next-line no-restricted-syntax
      for (const blocklet of blocklets) {
        // eslint-disable-next-line no-await-in-loop
        await blockletManager.download(blocklet.meta.did, blocklet);
      }
    } catch (error) {
      logger.error('add owner failed', { error });
    }
  };

  const updateBlockletAPPURL = async (event, data) => {
    if (data?.metadata?.inBlockletSetup === true && data?.metadata?.blockletDid) {
      await blockletManager.config({
        did: data?.metadata?.blockletDid,
        configs: [{ key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_URL, value: `https://${data.domain}` }],
        skipDidDocument: true,
        skipHook: true,
      });

      logger.info(`update blocklet app url on ${event}`, { domain: data.domain, did: data?.metadata?.blockletDid });
    }
  };

  /**
   *
   *
   * @param {*} subject
   * @param {string} event
   * @param {(event: string, data: any) => Promise<void> | void} handler
   */
  const listen = (subject, event, handler) => {
    return subject.on(event, (data) => handler(event, data));
  };

  [
    BlockletEvents.added,
    BlockletEvents.downloadFailed,
    BlockletEvents.installed,
    BlockletEvents.installFailed,
    BlockletEvents.upgraded,
    BlockletEvents.updated,
    BlockletEvents.statusChange,
    BlockletEvents.removed,
    BlockletEvents.started,
    BlockletEvents.startFailed,
    BlockletEvents.stopped,
    BlockletEvents.appDidChanged,

    BlockletEvents.componentInstalled,
    BlockletEvents.componentInstallFailed,
    BlockletEvents.componentUpgraded,
    BlockletEvents.componentUpgradeFailed,
    BlockletEvents.componentRemoved,

    BlockletEvents.disableAutoBackup,
    BlockletEvents.backupProgress,
    BlockletEvents.restoreProgress,
    BlockletEvents.downloadBundleProgress,

    BlockletEvents.spaceConnected,
    BlockletEvents.gatewayConfigChanged,
    BlockletEvents.nftConsumed,

    BlockletEvents.configTheme,
    BlockletEvents.blueOrGreenStarted,
  ].forEach((eventName) => {
    listen(blockletManager, eventName, handleBlockletEvent);
  });

  [
    BlockletEvents.componentInstalled,
    BlockletEvents.componentUpgraded,
    BlockletEvents.componentRemoved,
    BlockletEvents.updated,
  ].forEach((eventName) => {
    listen(
      blockletManager,
      eventName,
      /**
       *
       * @param {string} eventName
       * @param {import('@blocklet/server-js').BlockletState & {context: {}} } payload
       * @returns
       */
      (_eventName, payload, ...args) => {
        if (payload.context) {
          const id = payload.meta.did;
          autoBackupHandlerFactory(id, autoBackupHandler)(eventName, payload, blockletManager, ...args);
        }
      }
    );
  });

  Object.keys(BlockletInternalEvents).forEach((key) => {
    listen(blockletManager, BlockletInternalEvents[key], onEvent);
  });

  listen(teamManager, EVENTS.NOTIFICATION_CREATE, (name, data) => {
    onEvent(name, data, true);
  });

  listen(teamAPI, EVENTS.NOTIFICATION_BLOCKLET_UPDATE, (name, data) => {
    onEvent(name, data, true);
  });

  listen(teamManager, EVENTS.NOTIFICATION_CREATE_QUEUED, (name, data) => {
    eventHub.broadcast(name, data);
  });
  listen(blockletManager, EVENTS.NOTIFICATION_CREATE_QUEUED, (name, data) => {
    eventHub.broadcast(name, data);
  });

  listen(webhookManager, EVENTS.WEBHOOK_ATTEMPT, (name, data) => {
    onEvent(name, data, true);
  });

  listen(nodeState, BlockletEvents.purchaseChange, onEvent);
  nodeState.on(EVENTS.ROUTING_UPDATED, (nodeInfo) => onEvent(EVENTS.ROUTING_UPDATED, { routing: nodeInfo.routing }));
  nodeState.once(EVENTS.NODE_ADDED_OWNER, () => downloadAddedBlocklet());
  nodeState.on(EVENTS.NODE_UPDATED, (nodeInfo, oldInfo) => {
    onEvent(EVENTS.NODE_UPDATED, { did: nodeInfo.did });

    // We need update router on some fields change
    const fields = ['enableWelcomePage'];
    const shouldUpdateRouter = fields.some((x) => nodeInfo[x] !== oldInfo[x]);
    if (shouldUpdateRouter) {
      handleSystemRouting({ message: 'Server settings updated' }).catch((err) => {
        logger.error('Handle routing failed on node.updated', { error: err });
      });
    }
  });

  listen(nodeState, EVENTS.NODE_MAINTAIN_PROGRESS, onEvent);
  nodeState.on(EVENTS.RELOAD_GATEWAY, () => {
    handleSystemRouting({ message: 'Reload gateway' }).catch((err) => {
      logger.error('Handle routing failed on reload gateway', { error: err });
    });
  });

  routerManager.on(EVENTS.UPDATE_DOMAIN_ALIAS, async (did) => {
    if (did) {
      updateDidDocument({ did, nodeInfo: await node.getNodeInfo(), teamManager, states })
        .then(() => {
          logger.info('Update did document successfully on update domain alias', { did });
        })
        .catch((err) => {
          logger.error('Update did document failed on update domain alias', { did, error: err });
        });

      blockletManager
        .detail({ did })
        .then((blocklet) => {
          if (blocklet?.settings?.gateway?.wafPolicy?.enabled === false) {
            handleBlockletWafChange({ teamDid: did, wafPolicy: blocklet?.settings?.gateway?.wafPolicy }).catch(
              (err) => {
                logger.error('Update blocklet wafPolicy failed on add domain alias', { error: err });
              }
            );
          }
        })
        .catch((err) => logger.error('Update blocklet wafPolicy failed on update domain alias', { error: err }));
    }
  });

  [EVENTS.DOMAIN_STATUS, BlockletEvents.domainStatus].forEach((eventName) => {
    domainStatus.on(eventName, (data) => {
      if (data) {
        onEvent(eventName, data);
      }
    });
  });

  listen(securityAPI, BlockletEvents.securityConfigUpdated, onEvent);

  // Refresh router when security config changes to update static serving rules
  // When access policy changes from/to PUBLIC, nginx config needs to be updated
  listen(securityAPI, BlockletEvents.securityConfigUpdated, (eventName, data) => {
    if (daemon) {
      handleBlockletRouting({ did: data?.did, message: 'Security config changed' }).catch((err) => {
        logger.error('Failed to refresh router after security config change', { error: err, did: data?.did });
      });
    }
  });

  Object.keys(TeamEvents).forEach((key) => {
    listen(teamAPI, TeamEvents[key], onEvent);
  });

  listen(teamAPI, BlockletInternalEvents.appConfigChanged, onEvent);
  listen(teamAPI, BlockletEvents.updated, onEvent);

  listen(teamManager, BlockletEvents.storeChange, onEvent);

  [EVENTS.NOTIFICATION_BLOCKLET_READ, EVENTS.NOTIFICATION_READ].forEach((eventName) => {
    listen(teamManager, eventName, onEvent);
  });

  listen(certManager, EVENTS.CERT_ISSUED, onEvent);
  listen(certManager, EVENTS.CERT_ERROR, onEvent);
  listen(certManager, BlockletEvents.certIssued, updateBlockletAPPURL);
  listen(certManager, BlockletEvents.certIssued, onEvent);
  listen(certManager, BlockletEvents.certError, onEvent);

  listen(routerManager, BlockletEvents.updated, onEvent);

  listen(nodeRuntimeMonitor, EVENTS.NODE_RUNTIME_INFO, onInternalEvent);
  listen(blockletManager.runtimeMonitor, EVENTS.BLOCKLETS_RUNTIME_INFO, onInternalEvent);

  events.handleServerEvent = handleServerEvent;
  events.handleBlockletEvent = handleBlockletEvent;

  if (daemon) {
    const { handleEventBusEvent } = eventBusHandler({ states, teamManager, teamAPI });
    eventHub.on(EVENT_BUS_EVENT, (data) => {
      if (isWorkerInstance()) {
        return null;
      }
      return handleEventBusEvent(data);
    });
  }

  // 更新会话时，暂不做任何操作
  // listen(teamAPI, BlockletEvents.updateUserSession, noop);
  listen(teamAPI, BlockletEvents.addUserSession, async (eventName, eventData) => {
    const { teamDid, userDid, userSession, locale = 'en', skipNotification = false, origin } = eventData;
    if (skipNotification || !userSession.ua) {
      return;
    }
    const translations = {
      en: {
        title: 'You are logged in on a new device',
        body: `You are logged in on a new device: ${userSession.ua}. \n\nIf this is not you, please click "View Your Account" button to view details`,
        loginIp: 'Login IP',
        loginAt: 'Login At',
        viewYourAccount: 'View Your Account',
      },
      zh: {
        title: '你在一个新的设备上登录了',
        loginIp: '登录 IP',
        loginAt: '登录时间',
        body: `你在一个新的设备上登录了: ${userSession.ua}。\n\n如果这不是你本人在登录，请点击“查看您的账户”按钮查看详情`,
        viewYourAccount: '查看您的账户',
      },
    };

    const translation = translations[locale] || translations.en;
    const notification = {
      title: translation.title,
      body: translation.body,
      severity: 'warning',
      attachments: [
        {
          type: 'section',
          fields: [
            {
              type: 'text',
              data: { type: 'plain', color: '#9397A1', text: translation.loginIp },
            },
            {
              type: 'text',
              data: { type: 'plain', text: userSession.lastLoginIp },
            },
            {
              type: 'text',
              data: { type: 'plain', color: '#9397A1', text: translation.loginAt },
            },
            {
              type: 'text',
              data: { type: 'plain', text: dayjs(userSession.updatedAt).utc().format('YYYY-MM-DD HH:mm:ss [UTC]') },
            },
          ],
        },
      ],
      actions: [
        {
          name: translation.viewYourAccount,
          link: joinURL(origin, `${WELLKNOWN_SERVICE_PATH_PREFIX}/user/settings`),
        },
      ],
    };
    logger.info(`create notification on ${eventName}`, { teamDid, receiver: userDid, notification });
    const { count: userSessionCount } = await teamAPI.getUserSessionsCount({
      teamDid,
      query: {
        userDid,
        appPid: teamDid,
        status: null, // 查询所有 userSession 的总数
      },
    });

    // 如果只有一个,代表是刚创建的账户,此时不发送新设备通知
    if (userSessionCount > 1) {
      teamManager.createNotification({
        teamDid,
        receiver: userDid,
        // NOTICE: createNotification 如果传递 notification 对象，就必须加上 pushOnly 选项，否则会调用失败
        // 目前先改为使用 payload 的形式传递通知内容
        // notification,
        ...notification,
        extraData: {
          userSession,
        },
        source: 'component',
        template: 'new-user-session',
      });
    }
  });

  return events;
};
