const { mock } = require('bun:test');
const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const detectPort = require('detect-port');
const md5 = require('@abtnode/util/lib/md5');
const { fromRandom } = require('@ocap/wallet');
const { clearRouterByConfigKeyword } = require('@abtnode/router-provider');
const CertManager = require('@abtnode/certificate-manager/sdk/manager');
const { getServerModels, setupModels, createSequelize, getBlockletModels } = require('@abtnode/models');

const { NODE_MODES, WEB_WALLET_URL } = require('@abtnode/constant');

const RouterManager = require('../lib/router/manager');
const getRouterHelpers = require('../lib/router/helper');
const BlockletManager = require('../lib/blocklet/manager/disk');
const TeamManager = require('../lib/team/manager');
const createEvents = require('../lib/event');
const WebhookAPI = require('../lib/blocklet/webhook');

const TeamAPI = require('../lib/api/team');
const NodeAPI = require('../lib/api/node');

const states = require('../lib/states');
const createQueue = require('../lib/util/queue');
const { getDataDirs } = require('../lib/util');
const { runSchemaMigrations } = require('../lib/migrations');
const SecurityAPI = require('../lib/blocklet/security');

const noop = () => {};

const getBlocklets = () => {
  const [b1, b2] = [fromRandom(), fromRandom()];
  return [
    {
      name: b1.address,
      description: 'a static dapp that supports connecting to any forge powered blockchain',
      group: 'dapp',
      version: '1.2.5',
      main: 'app.js',
      author: 'test-user <test-user@example.com>',
      community: 'https://gitter.im/ArcBlock/community',
      documentation: 'https://docs.arcblock.io',
      homepage: 'https://github.com/ArcBlock/forge-webapp#readme',
      keywords: ['arcblock', 'dapp', 'blocklet'],
      repository: { type: 'git', url: 'git+https://github.com/ArcBlock/forge-webapp.git' },
      support: 'support@arcblock.io',
      screenshots: [
        '/static/9e03cc32176b500b3302721428eee96b/2-txs.png',
        '/static/8f95b6efb34b114d76ab48d52767d58d/4-asset.png',
        '/static/6f7bcdbe646e60bc063140b97a682f74/5-account.png',
        '/static/47081656285468f83c62c8b80c023bf4/1-switcher.png',
        '/static/3f019c91d3c16977e33b372d3a61001f/3-blocks.png',
        '/static/19d0c771775c2a27ea0740328c57d66c/0-dashboard.png',
      ],
      path: '/dapp/@arcblock/block-explorer',
      payment: { price: [] },
      did: b1.address,
      stats: { downloads: 102 },
      environments: [],
      interfaces: [{ type: 'web', name: 'publicUrl', path: '/', prefix: '/does-not-support-dynamic' }],
    },
    {
      name: b2.address,
      description: 'A static dapp that supports connecting to any graphql endpoint',
      group: 'dapp',
      version: '1.2.5',
      main: 'app.js',
      author: 'test-user <test-user@example.com>',
      community: 'https://gitter.im/ArcBlock/community',
      documentation: 'https://docs.arcblock.io',
      homepage: 'https://github.com/ArcBlock/forge-webapp#readme',
      keywords: ['arcblock', 'dapp', 'blocklet'],
      repository: { type: 'git', url: 'git+https://github.com/ArcBlock/forge-webapp.git' },
      support: 'support@arcblock.io',
      screenshots: [
        '/static/5287240f771ec997cc9ae0396f1054d6/3-docs.png',
        '/static/31478dbec2d514958583ad0d73334168/4-history.png',
        '/static/62844893a0a2dfd6a26349948dfbe266/0-composer.png',
        '/static/73f0e0f5caf11f5c949bb3308d596b1c/2-exporter.png',
        '/static/a787ec69f0bcb8dd0cd872d6ca1294d3/1-switcher.png',
      ],
      path: '/dapp/@arcblock/graphql-playground',
      payment: { price: [] },
      did: b2.address,
      stats: { downloads: 101 },
      environments: [],
      interfaces: [{ type: 'web', name: 'publicUrl', path: '/', prefix: '*' }],
    },
  ];
};

const setupInstance = async (instanceId = '') => {
  const node = fromRandom();
  const owner = fromRandom();

  // Use instanceId to create unique data directories for concurrent tests
  const dataDirSuffix = instanceId ? `-${instanceId}` : '';
  const dataDir = path.join(os.tmpdir(), `${node.address}${dataDirSuffix}`);
  const dataDirs = getDataDirs(dataDir);

  Object.keys(dataDirs).forEach((x) => fs.mkdirSync(dataDirs[x], { recursive: true }));

  const ekFile = path.join(dataDir, '.sock');
  if (!fs.existsSync(ekFile)) {
    fs.writeFileSync(ekFile, crypto.randomBytes(32), { encoding: 'binary', mode: '0600' });
  }

  // Use instanceId to offset ports for concurrent tests
  const portOffset = instanceId
    ? parseInt(crypto.createHash('md5').update(instanceId).digest('hex').substring(0, 4), 16) % 1000
    : 0;
  const baseHttpPort = 8080 + portOffset;
  const baseHttpsPort = 8443 + portOffset;
  const basePort = 8089 + portOffset;

  const httpPort = await detectPort(baseHttpPort);
  const httpsPort = await detectPort(baseHttpsPort);
  const options = {
    name: 'test node',
    description: 'test node',
    port: await detectPort(basePort),
    version: 'latest',
    dataDir,
    nodeSk: node.secretKey,
    nodePk: node.publicKey,
    nodeDid: node.address,
    routing: {
      https: true,
      provider: 'default',
      adminPath: '/admin/',
      wildcardCertHost: 'https://releases.arcblock.io/certs/',
      ipWildcardDomain: '*.ip.abtnet.io',
      httpPort,
      httpsPort,
    },
    mode: NODE_MODES.PRODUCTION,
    runtimeConfig: {
      blockletMaxMemoryLimit: 300,
      daemonMaxMemoryLimit: 300,
    },
    autoUpgrade: true,
    registerUrl: 'https://launcher.arcblock.io/',
    nodeOwner: {
      did: owner.address,
      pk: owner.publicKey,
    },
    didRegistry: 'https://registry.abtnet.io',
    didDomain: 'did.abtnet.io',
    webWalletUrl: WEB_WALLET_URL,
    dek: fs.readFileSync(ekFile),
    enableFileSystemIsolation: false,
  };

  await runSchemaMigrations({ dataDir, blocklets: [] });
  states.init(dataDirs, options);

  // Initialize the start queue
  const startQueue = createQueue({
    daemon: true,
    name: 'jobs',
    model: states.job,
    onJob: async (job) => {
      // eslint-disable-next-line no-use-before-define
      if (typeof blockletManager.onJob === 'function') {
        // eslint-disable-next-line no-use-before-define
        await blockletManager.onJob(job);
      }
    },
    options: {
      id: (job) => (job ? md5(`${job.entity}-${job.action}-${job.id}`) : ''),
    },
  });

  // Initialize the install queue
  const installQueue = createQueue({
    daemon: true,
    name: 'install_queue',
    model: states.job,
    onJob: async (job) => {
      // eslint-disable-next-line no-use-before-define
      if (typeof blockletManager.onJob === 'function') {
        // eslint-disable-next-line no-use-before-define
        await blockletManager.onJob(job);
      }
    },
    options: {
      maxRetries: 3,
      retryDelay: 5000, // retry after 5 seconds
      maxTimeout: 60 * 1000 * 15, // throw timeout error after 5 minutes
      id: (job) => (job ? md5(`${job.entity}-${job.action}-${job.id}`) : ''),
    },
  });

  const certManager = new CertManager({
    maintainerEmail: 'test-no-abc@arcblock.test',
    dataDir: dataDirs.certManagerModule,
  });

  await certManager.start();

  const teamManager = new TeamManager({ nodeDid: node.address, dataDirs, states });
  await teamManager.init();
  const teamAPI = new TeamAPI({
    states,
    teamManager,
    dataDirs,
    passportAPI: {
      createPassportLog: mock().mockResolvedValue({}),
    },
  });
  const routerManager = new RouterManager({ certManager, dataDirs });
  const nodeAPI = new NodeAPI(states, options.nodeDid);
  const webhookAPI = new WebhookAPI({ states, teamManager, teamAPI });

  const backupQueue = createQueue({
    daemon: options.daemon,
    model: states.job,
    name: 'backup_queue',
    onJob: async (job) => {
      // eslint-disable-next-line no-use-before-define
      if (typeof blockletManager.onJob === 'function') {
        // eslint-disable-next-line no-use-before-define
        await blockletManager.onJob(job);
      }
    },
    options: {
      // 备份自带重试机制
      maxRetries: 0,
      retryDelay: 10000, // retry after 10 seconds
      maxTimeout: 60 * 1000 * 60, // throw timeout error after 60 minutes
      id: (job) => (job ? md5(`${job.entity}-${job.action}-${job.id}`) : ''),
      enableScheduledJob: true,
    },
  });
  backupQueue.on = mock(() => {
    return { on: mock() };
  });

  const checkUpdateQueue = createQueue({
    daemon: options.daemon,
    model: states.job,
    name: 'check_update_queue',
    onJob: async (job) => {
      // eslint-disable-next-line no-use-before-define
      if (typeof blockletManager.onJob === 'function') {
        // eslint-disable-next-line no-use-before-define
        await blockletManager.onJob(job);
      }
    },
    options: {
      maxRetries: 0,
      retryDelay: 10000, // retry after 10 seconds
      maxTimeout: 60 * 1000 * 60, // throw timeout error after 60 minutes
      id: (job) => (job ? md5(`${job.entity}-${job.action}-${job.id}`) : ''),
      enableScheduledJob: true,
    },
  });
  checkUpdateQueue.on = mock(() => {
    return { on: mock() };
  });

  const blockletManager = new BlockletManager({
    dataDirs,
    startQueue,
    installQueue,
    backupQueue,
    checkUpdateQueue,
    daemon: true,
    teamManager,
    nodeAPI,
    teamAPI,
  });

  const securityAPI = new SecurityAPI({ teamManager, blockletManager });

  const { ensureBlockletRouting, ensureBlockletRoutingForUpgrade, removeBlockletRouting, resetSiteByDid } =
    getRouterHelpers({ dataDirs, routerManager, blockletManager, certManager, teamManager });

  blockletManager.resetSiteByDid = resetSiteByDid;

  const nodeEvents = createEvents({
    blockletManager,
    ensureBlockletRouting,
    ensureBlockletRoutingForUpgrade,
    removeBlockletRouting,
    routerManager,
    handleSystemRouting: noop, // mock
    handleBlockletRouting: noop, // mock
    handleAllRouting: noop, // mock
    domainStatus: { on: noop }, // mock
    teamAPI: {
      on: teamAPI.on.bind(teamAPI),
      refreshBlockletInterfacePermissions: noop, // mock
    },
    securityAPI,
    nodeAPI,
    teamManager,
    certManager,
    nodeRuntimeMonitor: nodeAPI.runtimeMonitor,
    node: {
      createAuditLog: noop,
      getNodeInfo: mock().mockResolvedValue({
        did: 'z1dbGkDpW93Hh7YYKSGBDu9QS4C4AFgSRNp',
      }),
    },
    handleBlockletWafChange: noop, // mock
    webhookManager: webhookAPI,
  });

  await states.node.read();

  return Object.assign(nodeEvents, {
    options,
    dataDir,
    dataDirs,
    states,
    routerManager,
    teamManager,
    blockletManager,
    teamAPI,
    nodeAPI,
    certManager,
    getSessionSecret: () => '1234567890',
  });
};

const tearDownInstance = async (instance) => {
  if (instance && instance.dataDir) {
    await clearRouterByConfigKeyword(instance.dataDir);
    fs.removeSync(instance.dataDir);
  }
};

const setupInMemoryModels = async () => {
  const models = getServerModels();
  const sequelize = createSequelize(`/core/state/${Math.random().toString()}::memory:`);
  setupModels(models, sequelize);
  await sequelize.sync({ force: true });
  return models;
};

const setupInMemoryBlockletModels = async () => {
  const models = getBlockletModels();
  const sequelize = createSequelize(`/core/state/${Math.random().toString()}::memory:`);
  setupModels(models, sequelize);
  await sequelize.sync({ force: true });
  return models;
};

module.exports = { setupInstance, tearDownInstance, getBlocklets, setupInMemoryModels, setupInMemoryBlockletModels };
