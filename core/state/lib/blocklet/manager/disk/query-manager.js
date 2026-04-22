/* eslint-disable no-await-in-loop */
const flat = require('flat');
const get = require('lodash/get');
const groupBy = require('lodash/groupBy');
const isEmpty = require('lodash/isEmpty');
const logger = require('@abtnode/logger')('@abtnode/core:blocklet:manager:query');
const { BLOCKLET_SITE_GROUP_SUFFIX, STATIC_SERVER_ENGINE_DID } = require('@abtnode/constant');
const { MONITOR_RECORD_INTERVAL_SEC } = require('@abtnode/constant');
const {
  BlockletStatus,
  forEachBlocklet,
  forEachBlockletSync,
  forEachChildSync,
  forEachComponentV2,
  hasStartEngine,
  isBeforeInstalled,
  getComponentId,
  findComponentByIdV2,
  isInProgress,
} = require('@blocklet/meta/lib/util');
const { getBlockletEngine } = require('@blocklet/meta/lib/engine');
const { toBlockletDid } = require('@blocklet/meta/lib/did');
const { isCustomDomain, isDidDomain } = require('@abtnode/util/lib/url-evaluation');
const { get: getEngine } = require('../engine');

const states = require('../../../states');
const util = require('../../../util');
const { getFromCache: getAccessibleExternalNodeIp } = require('../../../util/get-accessible-external-node-ip');
const getHistoryList = require('../../../monitor/get-history-list');
const { getBackupList } = require('../../storage/utils/disk');
const {
  getAppSystemEnvironments,
  getComponentSystemEnvironments,
  getAppOverwrittenEnvironments,
  pruneBlockletBundle,
  getProcessState,
  getBlockletStatus,
  shouldSkipComponent,
  getDiskInfo,
} = require('../../../util/blocklet');

const { formatEnvironments } = util;

/**
 * Get blocklet detail
 */
async function detail(
  manager,
  {
    domain,
    did,
    attachConfig = true,
    attachRuntimeInfo = false,
    attachDiskInfo = false,
    useCache = false,
    getOptionalComponents = false,
  },
  context
) {
  let targetDid = did;
  if (domain) {
    const aliasDomainSite = await states.site.findByDomainAlias(domain);
    if (!aliasDomainSite) {
      return null;
    }
    targetDid = (aliasDomainSite.domain || '').replace(BLOCKLET_SITE_GROUP_SUFFIX, '');
  }

  if (!targetDid) {
    throw new Error('did should not be empty');
  }

  if (!attachConfig) {
    return states.blocklet.getBlocklet(targetDid);
  }

  if (attachRuntimeInfo) {
    return _attachRuntimeInfo(manager, { did: targetDid, diskInfo: !!attachDiskInfo, context, getOptionalComponents });
  }

  try {
    return manager.getBlocklet(targetDid, { throwOnNotExist: false, getOptionalComponents, useCache });
  } catch (e) {
    logger.error('get blocklet detail error', { error: e });
    return states.blocklet.getBlocklet(targetDid);
  }
}

/**
 * List blocklets
 */
async function list(manager, { includeRuntimeInfo = true, query, paging, search, external, sort } = {}, context) {
  if (sort && typeof sort !== 'object') {
    throw new Error('sort must be an object with field and direction properties');
  }

  if (!isEmpty(paging)) {
    const result = await states.blocklet.findPaginated({ search, external, paging, sort });

    if (includeRuntimeInfo) {
      result.list = await _attachBlockletListRuntimeInfo(manager, { blocklets: result.list }, context);
    }

    return {
      blocklets: result.list,
      paging: result.paging,
    };
  }

  const condition = { ...flat(query || {}) };
  const blocklets = await states.blocklet.getBlocklets(condition);
  if (includeRuntimeInfo) {
    return {
      blocklets: await _attachBlockletListRuntimeInfo(manager, { blocklets }, context),
      paging: { total: blocklets.length },
    };
  }

  return { blocklets, paging: { total: blocklets.length } };
}

/**
 * List backups
 */
function listBackups(manager) {
  return getBackupList(manager.dataDirs.data);
}

/**
 * Get blocklet status
 */
async function status(manager, did, { forceSync = false, componentDids } = {}) {
  const blocklet = await manager.getBlocklet(did);

  if (!blocklet.structVersion) {
    return blocklet;
  }

  const updates = new Map();
  const addToUpdates = (componentDid, statusValue) => {
    if (updates.has(statusValue)) {
      updates.get(statusValue).push(componentDid);
    } else {
      updates.set(statusValue, [componentDid]);
    }
  };

  await forEachComponentV2(
    blocklet,
    async (component) => {
      if (!forceSync && !util.shouldUpdateBlockletStatus(component.status)) {
        return;
      }

      if (shouldSkipComponent(component.meta.did, componentDids)) {
        return;
      }

      if (!hasStartEngine(component.meta)) {
        return;
      }

      if (getBlockletEngine(component.meta)?.interpreter === 'blocklet') {
        return;
      }

      try {
        const statusValue = await getProcessState(component.env.processId);
        const oldStatus = component.status;
        if (!isInProgress(statusValue) && component.status !== statusValue) {
          component.status = statusValue;
          addToUpdates(component.meta.did, statusValue);
          logger.info('will sync status from pm2', {
            did,
            status: statusValue,
            oldStatus,
            componentDid: component.meta.did,
          });
        }
      } catch (error) {
        if (
          ![
            BlockletStatus.added,
            BlockletStatus.waiting,
            BlockletStatus.downloading,
            BlockletStatus.installing,
            BlockletStatus.installed,
            BlockletStatus.upgrading,
          ].includes(component.status) &&
          (error.code !== 'BLOCKLET_PROCESS_404' ||
            ![BlockletStatus.stopped, BlockletStatus.error].includes(component.status))
        ) {
          const oldStatus = component.status;
          const statusValue = BlockletStatus.stopped;
          component.status = statusValue;
          addToUpdates(component.meta.did, statusValue);
          logger.info('will sync status from pm2', {
            did,
            status: statusValue,
            oldStatus,
            componentDid: component.meta.did,
            error: error.message,
          });
        }
      }
    },
    { parallel: true }
  );

  if (updates.size > 0) {
    for (const [statusValue, dids] of updates) {
      logger.info('sync status from pm2', { did, status: statusValue, componentDids: dids });
      await states.blocklet.setBlockletStatus(did, statusValue, { componentDids: dids });
    }
  }

  blocklet.status = getBlockletStatus(blocklet);

  return blocklet;
}

/**
 * Get runtime history
 */
async function getRuntimeHistory(manager, { did, hours }) {
  const metaDid = await states.blocklet.getBlockletMetaDid(did);
  const history = await manager.runtimeMonitor.getHistory(metaDid, hours);

  const groupedHistory = groupBy(
    history.map((x) => ({
      ...x,
      did: x.did.includes('/') ? x.did.split('/').pop() : x.did,
    })),
    'did'
  );

  const historyList = Object.entries(groupedHistory).map(([key, value]) => ({
    key,
    value: getHistoryList({
      history: value,
      hours,
      recordIntervalSec: MONITOR_RECORD_INTERVAL_SEC,
      props: ['date', 'cpu', 'mem'],
    }),
  }));

  return historyList;
}

/**
 * Refresh list cache
 */
function refreshListCache(manager) {
  list(manager, { useCache: false }).catch((err) => {
    logger.error('refresh blocklet list failed', { error: err });
  });
}

/**
 * Update all blocklet environment
 */
async function updateAllBlockletEnvironment(manager) {
  const blocklets = await states.blocklet.getBlocklets();
  for (let i = 0; i < blocklets.length; i++) {
    const blocklet = blocklets[i];
    await _updateBlockletEnvironment(manager, blocklet.meta.did);
  }
}

/**
 * Prune blocklet bundles
 */
async function prune(manager) {
  const blocklets = await states.blocklet.getBlocklets();
  const settings = await states.blockletExtras.listSettings();
  await pruneBlockletBundle({
    installDir: manager.dataDirs.blocklets,
    blocklets,
    blockletSettings: settings.filter((x) => x.settings.children && x.settings.children.length).map((x) => x.settings),
  });
}

/**
 * Get blocklet environments
 */
async function getBlockletEnvironments(manager, did) {
  const blockletWithEnv = await manager.getBlocklet(did);
  const nodeInfo = await states.node.read();
  const appSystemEnvironments = {
    ...getAppSystemEnvironments(blockletWithEnv, nodeInfo, manager.dataDirs),
    ...getAppOverwrittenEnvironments(blockletWithEnv, nodeInfo),
  };

  return {
    all: formatEnvironments({
      ...getComponentSystemEnvironments(blockletWithEnv),
      ...appSystemEnvironments,
    }),
    appSystemEnvironments,
  };
}

/**
 * Update blocklet environment
 */
async function _updateBlockletEnvironment(manager, did) {
  const blockletWithEnv = await manager.getBlocklet(did);
  const blocklet = await states.blocklet.getBlocklet(did);

  const { all, appSystemEnvironments } = await getBlockletEnvironments(manager, did);
  blocklet.environments = all;

  const envMap = {};
  forEachBlockletSync(blockletWithEnv, (child, { ancestors }) => {
    const id = getComponentId(child, ancestors);
    envMap[id] = child;
  });
  forEachChildSync(blocklet, (child, { ancestors }) => {
    const id = getComponentId(child, ancestors);
    const childWithEnv = envMap[id];
    if (childWithEnv) {
      child.environments = formatEnvironments({
        ...getComponentSystemEnvironments(childWithEnv),
        ...appSystemEnvironments,
      });
    }
  });

  blocklet.appDid = appSystemEnvironments.BLOCKLET_APP_ID;
  if (!Array.isArray(blocklet.migratedFrom)) {
    blocklet.migratedFrom = [];
  }
  if (!blocklet.appPid) {
    blocklet.appPid = appSystemEnvironments.BLOCKLET_APP_PID;
  }

  await states.blockletExtras.updateByDid(did, { appDid: blocklet.appDid });
  return states.blocklet.updateBlocklet(did, blocklet);
}

/**
 * Attach runtime info to blocklet list
 */
async function _attachBlockletListRuntimeInfo(manager, { blocklets }, context) {
  const nodeInfo = await states.node.read();
  return (
    await Promise.all(
      blocklets.map((x) => {
        if (isBeforeInstalled(x.status)) {
          return x;
        }

        return _attachRuntimeInfo(manager, {
          did: x.meta.did,
          nodeInfo,
          diskInfo: false,
          context,
        });
      })
    )
  ).filter(Boolean);
}

/**
 * Get domain aliases
 */
async function getDomainAliases(manager, { blocklet, nodeInfo }, context = {}) {
  if (blocklet?.site?.domainAliases?.length) {
    const nodeIp = await getAccessibleExternalNodeIp(nodeInfo || (await states.node.read()));
    return blocklet.site.domainAliases.map((x) => ({
      ...x,
      value: util.replaceDomainSlot({ domain: x.value, context, nodeIp }),
    }));
  }

  return [];
}

/**
 * Attach runtime info to blocklet
 */
async function _attachRuntimeInfo(manager, { did, nodeInfo, diskInfo = false, context, getOptionalComponents }) {
  if (!did) {
    throw new Error('did should not be empty');
  }

  try {
    const blocklet = await manager.getBlocklet(did, { throwOnNotExist: false, getOptionalComponents });

    if (!blocklet) {
      return null;
    }

    if (blocklet.site) {
      blocklet.site.domainAliases = await getDomainAliases(
        manager,
        { blocklet, nodeInfo: nodeInfo || (await states.node.read()) },
        context
      );
    }

    // app runtime info, app status
    const cpus = manager.nodeAPI.getRealtimeData().cpu?.cpus || [];
    blocklet.appRuntimeInfo = {
      cpus,
      ...manager.runtimeMonitor.getRuntimeInfo(did),
    };

    forEachBlockletSync(blocklet, (component) => {
      if (component.meta.did === did) {
        return;
      }

      component.appRuntimeInfo = {
        cpus,
        ...manager.runtimeMonitor.getRuntimeInfo(did, `${did}/${component.meta.did}`),
      };
    });

    // app disk info, component runtime info, component engine
    await forEachBlocklet(blocklet, async (component, { level }) => {
      const engine = getBlockletEngine(component.meta);
      if (engine.interpreter === 'blocklet') {
        const engineId = toBlockletDid(engine.source.name);
        const engineComponent = findComponentByIdV2(blocklet, [engineId]);
        if (engineComponent) {
          component.engine = {
            name: engineComponent.meta.did,
            displayName: engineComponent.meta.title,
            description: engineComponent.meta.description,
            version: engineComponent.meta.version,
            available: true,
            visible: true,
            // FIXME: this should be dynamic
            logo: '',
          };
        } else if (engineId !== STATIC_SERVER_ENGINE_DID) {
          // Note: the component maybe in dev mode or removed
          logger.warn(`engine component ${engineId} not found for ${did}`);
        }
      } else {
        component.engine = getEngine(engine.interpreter)?.describe();
      }

      if (level === 0) {
        component.diskInfo = await getDiskInfo(component, {
          useFakeDiskInfo: !diskInfo || isBeforeInstalled(component.status),
        });
      }

      component.runtimeInfo = manager.runtimeMonitor.getRuntimeInfo(blocklet.meta.did, component.env.id);
    });

    return blocklet;
  } catch (err) {
    const simpleState = await states.blocklet.getBlocklet(did);
    logger.error('failed to get blocklet info', {
      did,
      name: get(simpleState, 'meta.name'),
      status: get(simpleState, 'status'),
      error: err,
    });
    return simpleState;
  }
}

/**
 * Update blocklet certificate
 */
async function _updateBlockletCertificate(manager, did) {
  const blocklet = await manager.getBlocklet(did);
  const domainAliases = get(blocklet, 'site.domainAliases') || [];
  const customAliases = domainAliases.filter((x) => isCustomDomain(x.value));
  const cnameDomain = domainAliases.find((item) => isDidDomain(item.value));

  const issueCert = (alias) =>
    manager.certManager
      .issue({
        domain: alias.value,
        did,
        siteId: blocklet.site.id,
        inBlockletSetup: false,
      })
      .catch((error) => {
        logger.error('cron update issue cert for domain alias failed', { error });
      });

  await Promise.all(
    customAliases.map(async (alias) => {
      const dns = await manager.routerManager.checkDomainDNS(alias.value, cnameDomain?.value);
      logger.info('dns info', { dns });
      if (!dns.isDnsResolved || !dns.isCnameMatch) {
        return;
      }

      const foundCert = await manager.routerManager.getHttpsCert({ domain: alias.value });
      logger.info('cron check dns global certificate', { foundCert: !!foundCert, domain: alias.value });
      if (foundCert) {
        return;
      }

      if (!alias.certificateId) {
        logger.info('cron check dns no certificate');
        await issueCert(alias);
        return;
      }

      const cert = await manager.certManager.manager.getByDomain(alias.value);
      logger.info('cron check dns certificate', { status: cert?.status, domain: alias.value });
      if (cert?.status === 'error') {
        await issueCert(alias);
      }
    })
  );
}

/**
 * Update certificates for all blocklets in batches
 * Memory-efficient: processes 100 blocklets at a time
 */
async function updateAllBlockletCertificate(manager) {
  await states.blocklet.forEachBatch({
    projection: { appPid: 1 },
    batchSize: 100,
    onBatch: async (blocklets) => {
      try {
        await Promise.all(
          blocklets.filter(({ appPid }) => appPid).map(({ appPid }) => _updateBlockletCertificate(manager, appPid))
        );
      } catch (error) {
        logger.error('Failed to update certificate for blocklet', { error: error.message });
      }
    },
  });
}

module.exports = {
  detail,
  list,
  listBackups,
  status,
  getRuntimeHistory,
  refreshListCache,
  updateAllBlockletEnvironment,
  prune,
  getBlockletEnvironments,
  _updateBlockletEnvironment,
  _attachBlockletListRuntimeInfo,
  getDomainAliases,
  _attachRuntimeInfo,
  _updateBlockletCertificate,
  updateAllBlockletCertificate,
};
