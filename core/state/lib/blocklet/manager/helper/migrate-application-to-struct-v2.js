const path = require('path');
const fs = require('fs-extra');
const pick = require('lodash/pick');
const get = require('lodash/get');
const pRetry = require('p-retry');
const Lock = require('@abtnode/util/lib/lock');
const { getChainClient } = require('@abtnode/util/lib/get-chain-client');
const { getIpDnsDomainForBlocklet } = require('@abtnode/util/lib/get-domain-for-blocklet');
const { convertToMoniker } = require('@abtnode/util/lib/transfer-to-moniker');

const logger = require('@abtnode/logger')('@abtnode/core:migrate-application-to-struct-v2');

const { forEachBlockletSync, getBlockletChainInfo, isInProgress } = require('@blocklet/meta/lib/util');
const { SLOT_FOR_IP_DNS_SITE, MAIN_CHAIN_ENDPOINT } = require('@abtnode/constant');

const {
  BlockletStatus,
  BlockletSource,
  BlockletEvents,
  BlockletGroup,
  BLOCKLET_DEFAULT_PORT_NAME,
  BLOCKLET_INTERFACE_TYPE_WEB,
  BLOCKLET_INTERFACE_PUBLIC,
  BLOCKLET_DYNAMIC_PATH_PREFIX,
  BLOCKLET_INTERFACE_PROTOCOL_HTTP,
  BLOCKLET_DEFAULT_PATH_REWRITE,
  BLOCKLET_DEFAULT_VERSION,
  BLOCKLET_LATEST_SPEC_VERSION,
  BLOCKLET_CONFIGURABLE_KEY,
  BLOCKLET_META_FILE,
  BLOCKLET_UPLOADS_DIR,
  CHAIN_PROP_MAP,
} = require('@blocklet/constant');
const { update: updateMetaFile } = require('@blocklet/meta/lib/file');
const { getApplicationWallet: getBlockletWallet } = require('@blocklet/meta/lib/wallet');
const cloneDeep = require('@abtnode/util/lib/deep-clone');

const { getBlockletDomainGroupName } = require('../../../util/router');
const { getBundleDir } = require('../../../util/blocklet');

const sortMoveListBySrc = (list) => {
  return list.sort((a, b) => (a.src.length > b.src.length ? -1 : 1));
};

const lock = new Lock('migrate-application-to-struct-v2');

const validateDataMoveList = (list) => {
  const srcList = list.map((x) => x.src);
  const distList = list.map((x) => x.dist);

  // find duplicate element in src
  const duplicateInSrc = srcList.filter((x, i) => srcList.indexOf(x) !== i);
  if (duplicateInSrc.length) {
    throw new Error(`Duplicate element in src of dataMoveList: ${duplicateInSrc}`);
  }

  // find duplicate element in list
  const duplicateInDist = distList.filter((x, i) => distList.indexOf(x) !== i);
  if (duplicateInDist.length) {
    throw new Error(`Duplicate element in dist of dataMoveList: ${duplicateInDist}`);
  }
};

const fillBlockletData = (data, app, id) => {
  Object.assign(data, {
    meta: {
      name: id,
      did: id,
      bundleDid: id,
      bundleName: id,
      title: app.meta.title || '',
      description: app.meta.description || '',
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
      environments: [],
    },
    source: BlockletSource.custom,
    status: BlockletStatus.stopped,
  });

  if (app.meta.logo) {
    data.meta.logo = app.meta.logo;
  }
};

const appSystemFiles = ['logo.svg', 'rbac.db', 'session.db', 'user.db', '.assets', BLOCKLET_UPLOADS_DIR];

const getChainHost = (blocklet) => {
  return getBlockletChainInfo(blocklet).host;
};

const ensureAccountOnMainChain = async (blocklet, newWallet) => {
  // ensure new account on main chain
  const mainChainClient = getChainClient(MAIN_CHAIN_ENDPOINT);
  const newResultOnMainChain = await mainChainClient.getAccountState({ address: newWallet.address });
  if (!newResultOnMainChain.state) {
    logger.info('declare account on main chain', { address: newWallet.address, did: blocklet.meta.did });
    const hash = await mainChainClient.declare({
      moniker: convertToMoniker(blocklet.meta.title || blocklet.meta.name),
      wallet: newWallet,
    });
    logger.info('declare account on main chain done', { did: blocklet.meta.did, hash });
  }
};

const migrateAppOnChain = async (blocklet, oldSk, newSk) => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  logger.info('Preparing for on-chain migration', { did: blocklet.meta.did });
  if (!oldSk) {
    // should not be here
    logger.info('on-chain migration aborted because oldSk is empty', { did: blocklet.meta.did });
    return;
  }

  if (!newSk) {
    // should not be here
    logger.info('on-chain migration aborted because newSk is empty', { did: blocklet.meta.did });
    return;
  }

  // ensure account changed
  // 2023.04.26 eth type application need not be supported
  const type = blocklet.configObj?.BLOCKLET_WALLET_TYPE;
  const oldWallet = getBlockletWallet(oldSk, undefined, type);
  const newWallet = getBlockletWallet(newSk, undefined, type);
  if (oldWallet.address === newWallet.address) {
    // should not be here
    logger.info('on-chain migration aborted because newSk same with oldSk', { did: blocklet.meta.did });
    await ensureAccountOnMainChain(blocklet, newWallet);
    return;
  }

  // ensure chain host
  const chainHost = getChainHost(blocklet);
  if (!chainHost || chainHost === 'none') {
    logger.info('on-chain migration aborted because CHAIN_HOST is empty', { did: blocklet.meta.did });
    await ensureAccountOnMainChain(blocklet, newWallet);
    return;
  }

  // migrate on chain
  logger.info('on-chain migration for chain ', { did: blocklet.meta.did, host: chainHost });
  const client = getChainClient(chainHost);
  const oldResult = await client.getAccountState({ address: oldWallet.address });
  const newResult = await client.getAccountState({ address: newWallet.address });

  if (oldResult.state && !newResult.state) {
    logger.info('on-chain migration for wallets', { oldAddress: oldWallet.address, newAddress: newWallet.address });

    // migrate old account to new account
    const tx = await client.signAccountMigrateTx({
      tx: {
        itx: {
          address: newWallet.address,
          pk: newWallet.publicKey,
        },
      },
      wallet: oldWallet,
    });
    const hash = await client.sendAccountMigrateTx({ tx, wallet: oldWallet });
    logger.info('on-chain migration done', { did: blocklet.meta.did, hash });
  } else {
    if (!oldResult.state) {
      logger.info('on-chain migration aborted because oldSk not declared on chain', { did: blocklet.meta.did });
    }

    if (newResult.state) {
      logger.info('on-chain migration aborted because newSk declared on chain', { did: blocklet.meta.did });
    }
  }

  // should not throw error because signAccountMigrateTx is already happened
  try {
    await ensureAccountOnMainChain(blocklet, newWallet);
  } catch (error) {
    logger.error('ensureAccountOnMainChain failed', { error });
  }
};

const migrateApplicationToStructV2 = async ({ did, appSk: newAppSk, context = {}, manager, states }) => {
  logger.info('Preparing data for migration', { did });

  if (!newAppSk) {
    throw new Error('New key pair is required when migrate application');
  }

  const oldBlocklet = await manager.getBlocklet(did, { throwOnNotExist: true, ensureIntegrity: true });
  if (oldBlocklet.structVersion) {
    throw new Error('Blocklet already migrated', pick(oldBlocklet, ['structVersion', 'externalSk']));
  }

  if (isInProgress(oldBlocklet.status) || oldBlocklet.status === BlockletStatus.running) {
    throw new Error('Please stop blocklet before migration');
  }

  const extraData = await states.blockletExtras.findOne({ did: oldBlocklet.meta.did });
  const siteData = await states.site.findOneByBlocklet(oldBlocklet.meta.did);

  const backupBlocklet = await states.blocklet.findOne({ 'meta.did': oldBlocklet.meta.did });
  const backupExtra = cloneDeep(extraData);
  const backupSite = await states.site.findOne({ id: siteData.id });

  const { appPid } = oldBlocklet;

  // change index of extraData
  extraData.did = appPid;
  if (extraData.meta) {
    extraData.meta.did = appPid;
    extraData.meta.name = appPid;
  }
  // fork root component's configs to container
  // FIXME: should configs in container be managed in dashboard?
  extraData.configs = (extraData.configs || []).filter((x) => x.key !== BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SK);

  // If appSk not configured before, then set derived appSk as permanent appSk
  extraData.configs.push({
    key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SK,
    value: oldBlocklet.environmentObj.BLOCKLET_APP_SK,
    secure: true,
    shared: false,
  });

  // clean children configs
  extraData.children = [];
  // clean dirty data in settings
  if (extraData.settings) {
    extraData.settings.children = [];
    delete extraData.settings.navigation;
  }

  // delete system generated rules in siteData
  siteData.rules = siteData.rules.filter((rule) => !rule.isProtected && rule.to.did !== oldBlocklet.meta.did);
  // change index of siteData
  siteData.domain = getBlockletDomainGroupName(appPid);

  const blockletData = {
    appPid,
    children: [],
    migratedFrom: Array.isArray(oldBlocklet.migratedFrom) ? cloneDeep(oldBlocklet.migratedFrom) : [],
  };

  const dataDirSrc = path.join(oldBlocklet.env.dataDir);
  const dataDirDist = path.join(manager.dataDirs.data, appPid);
  if (fs.existsSync(dataDirDist)) {
    throw new Error(`blocklet data dir already exist: ${dataDirDist}`);
  }
  const dataMoveList = [];
  let currentMoveIndex = -1; // for rollback
  appSystemFiles.forEach((file) => {
    const src = path.join(dataDirSrc, file);
    const dist = path.join(dataDirDist, file);
    if (fs.existsSync(src)) {
      dataMoveList.push({ src, dist });
    }
  });

  forEachBlockletSync(oldBlocklet, (component, { level, ancestors }) => {
    // if have duplicate component, user should fix it manually
    if (blockletData.children.some((x) => x.meta.bundleDid === component.meta.bundleDid)) {
      throw new Error(
        `Find duplicate component ${component.meta.title}, please delete useless components and migrate again`
      );
    }

    // If old root component is a container, just skip it
    if (level === 0 && component.meta.group === BlockletGroup.gateway) {
      fillBlockletData(blockletData, component, appPid);
      return;
    }

    // If old root component is a blocklet, make it to be level one component
    if (level === 0 && component.meta.group !== BlockletGroup.gateway) {
      fillBlockletData(blockletData, component, appPid);

      // add root component to blockletData
      const { source, deployedFrom } = component;
      let bundleSource;
      if (source === BlockletSource.registry && deployedFrom && component.meta.bundleName) {
        bundleSource = {
          store: component.deployedFrom,
          name: component.meta.bundleName,
          version: 'latest',
        };
      } else if (source === BlockletSource.url) {
        bundleSource = {
          url: component.deployedFrom,
        };
      }

      blockletData.children.push({
        ...pick(component, ['mode', 'status']),
        mountPoint: component.mountPoint || '/',
        meta: {
          ...component.meta,
          // change index of component
          did: component.meta.bundleDid,
          name: component.meta.bundleName,
        },
        bundleSource,
        source,
        deployedFrom,
        children: [],
      });

      // add root component to extraData
      extraData.children.push({
        // change index of component
        did: component.meta.bundleDid,
        // filter application configs in root component
        configs: (component.configs || []).filter((x) => !x.key.startsWith('BLOCKLET_')),
      });

      // move root component data by file
      const componentFolders = (component.children || []).map((x) => x.meta.name.split('/')[0]);
      const files = fs.readdirSync(dataDirSrc);
      for (const file of files) {
        if (!componentFolders.includes(file) && !appSystemFiles.includes(file)) {
          dataMoveList.push({
            src: path.join(dataDirSrc, file),
            dist: path.join(dataDirDist, component.meta.bundleName, file),
          });
        }
      }

      return;
    }

    // add component to blockletData
    blockletData.children.push({
      ...pick(component, ['mode', 'status', 'bundleSource', 'source', 'deployedFrom']),
      meta: {
        ...component.meta,
        // change index of component
        did: component.meta.bundleDid,
        name: component.meta.bundleName,
      },
      // keep pathPrefix of the component remains the same as before
      mountPoint: path.join('/', ...ancestors.slice(1).map((x) => x.mountPoint || ''), component.mountPoint || '/'),
      children: [],
    });

    // add component to extraData
    extraData.children.push({
      did: component.meta.bundleDid,
      configs: component.configs || [],
    });

    const getSharedConfigObj = () => {
      const res = {};

      if (!ancestors || !ancestors.length) {
        return res;
      }

      for (let i = ancestors.length - 1; i >= 0; i--) {
        const ancestor = ancestors[i];

        if (Array.isArray(ancestor.configs)) {
          // eslint-disable-next-line no-loop-func
          ancestor.configs.forEach(({ key, value, secure, shared }) => {
            if (res[key]) {
              return;
            }
            if (!value || secure !== false || shared === false || BLOCKLET_CONFIGURABLE_KEY[key]) {
              return;
            }
            const config = (component.configs || []).find((x) => x.key === key);

            if (config && config.value) {
              return;
            }
            res[key] = get(ancestor, `configObj.${key}`) || value;
          });
        }
      }

      // share blocklet app chain config
      const ancestor = ancestors[0];
      (ancestor.configs || []).forEach(({ key, value }) => {
        if (
          ![
            BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_CHAIN_HOST,
            BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_CHAIN_ID,
            BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_CHAIN_TYPE,
          ].includes(key)
        ) {
          return;
        }

        res[CHAIN_PROP_MAP[key]] = value;
      });

      return res;
    };

    const sharedConfigObj = getSharedConfigObj();
    if (sharedConfigObj) {
      Object.entries(sharedConfigObj).forEach(([key, value]) => {
        if (!extraData.configs.some((x) => x.key === key)) {
          logger.info('add shared config to container configs', { did, key, value });
          extraData.configs.push({ key, value, secure: false, shared: true });
        }
      });
    }

    // move component data dir
    const src = component.env.dataDir;
    const dist = path.join(dataDirDist, component.meta.bundleName);
    if (fs.existsSync(src)) {
      dataMoveList.push({ src, dist });
    }
  });

  // ensure the deepest component is moved first
  const sortedDataMoveList = sortMoveListBySrc(dataMoveList);
  validateDataMoveList(sortedDataMoveList);

  // encrypt data in extras
  states.blockletExtras.encryptSecurityData({ data: extraData });

  // refresh ip dns domain
  siteData.domainAliases = siteData.domainAliases.filter(
    (x) => !x.value.includes(SLOT_FOR_IP_DNS_SITE) || !x.isProtected
  );
  siteData.domainAliases.push({ value: getIpDnsDomainForBlocklet(blockletData), isProtected: true });

  await lock.acquire();
  // check if blocklet already migrated
  try {
    const checkBlocklet = await manager.getBlocklet(did, { throwOnNotExist: true, ensureIntegrity: false });
    if (checkBlocklet.structVersion) {
      throw new Error('Blocklet already migrated in a few seconds', pick(oldBlocklet, ['structVersion', 'externalSk']));
    }
  } catch (error) {
    lock.release();
    throw error;
  }

  // update state
  let newBlocklet;
  try {
    logger.info('Start migrate application state', { did, appPid });
    // delete old db in db proxy
    await manager.teamManager.deleteTeam(oldBlocklet.meta.did);

    // re create blocklet
    await states.blocklet.remove({ appPid });
    await states.blocklet.addBlocklet(blockletData);
    await states.blocklet.updateStructV1Did(appPid, oldBlocklet.meta.did);

    // fake install bundle
    const bundleDir = getBundleDir(manager.installDir, blockletData.meta);
    fs.mkdirSync(bundleDir, { recursive: true });
    updateMetaFile(path.join(bundleDir, BLOCKLET_META_FILE), blockletData.meta);

    if (oldBlocklet.meta.logo) {
      const fileName = oldBlocklet.meta.logo;
      const src = path.join(getBundleDir(manager.installDir, oldBlocklet.meta), fileName);
      const dist = path.join(bundleDir, fileName);

      await fs.copy(src, dist);
    }

    // update
    await states.blockletExtras.update({ did: oldBlocklet.meta.did }, extraData);

    // update environment, generate appDid and appPid
    await manager._updateBlockletEnvironment(appPid);

    // rotate to newAppSk
    await manager.config({
      did: appPid,
      configs: [{ key: 'BLOCKLET_APP_SK', value: newAppSk, secure: true }],
      skipHook: true,
      skipDidDocument: true,
    });

    // update routing
    await states.site.update(
      { id: siteData.id },
      { $set: { domain: siteData.domain, domainAliases: siteData.domainAliases, rules: siteData.rules } }
    );

    newBlocklet = await manager.getBlocklet(appPid);

    logger.info('Start migrate application data', { sortedDataMoveList });

    // move data
    fs.mkdirSync(dataDirDist, { recursive: true });
    for (let i = 0; i < sortedDataMoveList.length; i++) {
      const { src, dist } = sortedDataMoveList[i];
      fs.moveSync(src, dist);
      currentMoveIndex = i;
    }

    // migrate on-chain account
    await pRetry(() => migrateAppOnChain(oldBlocklet, oldBlocklet.environmentObj.BLOCKLET_APP_SK, newAppSk), {
      retries: 3,
      onFailedAttempt: console.error,
    });
    lock.release();
  } catch (error) {
    logger.error('Migrate application state failed: ', { did, error });

    try {
      await states.blocklet.remove({ id: backupBlocklet.id });
      await states.blocklet.remove({ 'meta.did': blockletData.meta.did });
      await states.blocklet.insert(backupBlocklet);
      await states.blockletExtras.remove({ id: backupExtra.id });
      await states.blockletExtras.insert(backupExtra);
      await states.site.remove({ id: backupSite.id });
      await states.site.insert(backupSite);

      logger.info('Rollback application state');

      // rollback data
      fs.ensureDirSync(dataDirSrc);
      for (let i = currentMoveIndex; i >= 0; i--) {
        const { src, dist } = sortedDataMoveList[i];
        fs.moveSync(dist, src);
      }
      fs.removeSync(dataDirDist);

      logger.info('Rollback application data');
    } catch (err) {
      logger.error('Rollback application failed', { error, err });
    }

    lock.release();

    throw error;
  }

  // 通过 event 触发 ensureBlockletRouting
  manager.emit(BlockletEvents.installed, { blocklet: newBlocklet, context });
  manager.emit(BlockletEvents.removed, {
    blocklet: { meta: { did: oldBlocklet.meta.did } },
    context: { skipAll: true },
  });
};

module.exports = { migrateApplicationToStructV2, sortMoveListBySrc, getChainHost };
