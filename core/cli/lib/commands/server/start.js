/* eslint-disable no-await-in-loop */
/* eslint-disable prefer-destructuring */
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('node:path');
const os = require('node:os');
const Table = require('cli-table3');
const inquirer = require('inquirer');
const shelljs = require('shelljs');
const omit = require('lodash/omit');
const get = require('lodash/get');
const isEqual = require('lodash/isEqual');
const isObject = require('lodash/isObject');
const readLastLines = require('read-last-lines');
const pm2 = require('@abtnode/util/lib/pm2/async-pm2');
const { isInServerlessMode } = require('@abtnode/util/lib/serverless');
const ensureEndpointHealthy = require('@abtnode/util/lib/ensure-endpoint-healthy');
const { runMigrationScripts, runSchemaMigrations } = require('@abtnode/core/lib/migrations');
const { clearRouterByConfigKeyword } = require('@abtnode/router-provider');
const yaml = require('js-yaml');
const semver = require('semver');
const { BlockletEvents, ABT_NODE_KERNEL_OR_BLOCKLET_MODE } = require('@blocklet/constant');
const {
  PROCESS_NAME_PROXY,
  PROCESS_NAME_DAEMON,
  PROCESS_NAME_UPDATER,
  PROCESS_NAME_SERVICE,
  PROCESS_NAME_LOG_ROTATE,
  CONFIG_FOLDER_NAME,
  CONFIG_FOLDER_NAME_OLD,
  MAX_UPLOAD_FILE_SIZE,
  DAEMON_MAX_MEM_LIMIT_IN_MB,
  BLOCKLET_MAX_MEM_LIMIT_IN_MB,
  EVENTS,
  NODE_MODES,
  MAX_NGINX_WORKER_CONNECTIONS,
  SERVER_STATUS,
  ORPHAN_CHECK_DELAY,
  PROCESS_NAME_ORPHAN_CLEANUP,
  DEFAULT_WELLKNOWN_PORT,
} = require('@abtnode/constant');

const { canUseFileSystemIsolateApi, SAFE_NODE_VERSION } = require('@abtnode/util/lib/security');
const { ensureDockerRedis } = require('@abtnode/core/lib/util/docker/ensure-docker-redis');
const { ensureDockerPostgres } = require('@abtnode/core/lib/util/docker/ensure-docker-postgres');
const { getDaemonInstanceCount, getServiceInstanceCount } = require('@abtnode/util/lib/pm2/get-instance-number');
const { pm2StartOrReload } = require('@abtnode/util/lib/pm2/pm2-start-or-reload');
const { isPortTaken } = require('@abtnode/util/lib/port');

const { version } = require('../../../package.json');
const debug = require('../../debug')('start');
const util = require('../../util');
const {
  getConfigFileFromAncestors,
  getRunningConfigFile,
  getDaemonLogDir,
  checkRunning,
  getBaseConfigDataDirectory,
  getDataDirectoryByConfigFile,
  getConfigDirFromCurrentDir,
  getConfigFile,
} = require('../../manager');
const { wrapSpinner } = require('../../ui');
const nodeLib = require('../../node');
const { getInternalPort: getPort } = require('../../port');
const { printInvalidModeInfo, isValidMode, prettyAvailableModes } = require('../../util');
const getDockerStatusLog = require('../../util/docker-status-log');

const {
  print,
  printError,
  printInfo,
  printWarning,
  printSuccess,
  getCLIBinaryName,
  getCLICommandName,
  printAccessUrls,
  checkRoutingProvider,
  getCliCwd,
  startEventHub,
  cleanupProcessByName,
} = util;

const ABT_NODE_BINARY_NAME = getCLIBinaryName();
const ABT_NODE_COMMAND_NAME = getCLICommandName();

const parseMemoryLimit = () => {
  // Default to 30% of total memory; minimum 800 MB, maximum 4096 MB
  const totalMemInMB = os.totalmem() / (1024 * 1024);
  const memoryPercent = totalMemInMB * 0.3;
  const calculatedLimit = Math.floor(Math.max(Math.min(memoryPercent, 4096), DAEMON_MAX_MEM_LIMIT_IN_MB));
  if (!calculatedLimit || Number.isNaN(calculatedLimit)) {
    return DAEMON_MAX_MEM_LIMIT_IN_MB;
  }
  return calculatedLimit;
};

const calculatedLimit = parseMemoryLimit();

/**
 * Copy environment variables from config.env to process.env
 * @param {object} configEnv - Environment variables object from config
 */
const copyEnvToProcess = (configEnv) => {
  if (!configEnv || typeof configEnv !== 'object') {
    return;
  }

  Object.keys(configEnv).forEach((key) => {
    const value = configEnv[key];
    if (value !== null && value !== undefined) {
      process.env[key] = String(value);
    }
  });
};

const updateVersionInConfigFileAndState = async (config, configFile, node) => {
  const info = await node.getNodeInfo();
  await node.states.node.updateNodeInfo({
    runtimeConfig: {
      daemonMaxMemoryLimit: calculatedLimit,
      blockletMaxMemoryLimit: get(info, 'runtimeConfig.blockletMaxMemoryLimit', BLOCKLET_MAX_MEM_LIMIT_IN_MB),
    },
  });
  if (semver.neq(config.node.version, version)) {
    const latest = yaml.load(fs.readFileSync(configFile).toString(), { json: true });

    const headers = latest.node.routing.headers;
    if (headers?.['X-Powered-By'] && typeof headers['X-Powered-By'] === 'string') {
      headers['X-Powered-By'] = `"Blocklet Server/${version}"`;
    }

    latest.node.version = version;
    fs.writeFileSync(configFile, yaml.dump(latest));
    printSuccess(`Blocklet Server config updated with version ${chalk.cyan(version)}`);

    try {
      const data = {
        version,
        routing: Object.assign({}, info.routing || {}, {
          headers,
        }),
      };
      await node.states.node.updateNodeInfo(data);
      printSuccess(`Blocklet Server state updated with version ${chalk.cyan(version)}`);
    } catch (err) {
      printError(`Failed to update node state version: ${err.message}`);
    }

    return latest;
  }

  return config;
};

const getDifferentAttributes = (dbInfo, config) => {
  const differentAttributes = [];
  const attributes = [
    { name: 'port', type: Number, required: false },
    { name: 'routing.https', type: Boolean, required: false },
    { name: 'routing.maxUploadFileSize', type: null, required: true },
    { name: 'routing.adminPath', type: null, required: true },
    { name: 'routing.headers', type: null, required: false },
    { name: 'routing.ipWildcardDomain', type: null, required: false },
    { name: 'routing.wildcardCertHost', type: null, required: false },
    { name: 'routing.provider', type: null, required: false },
    { name: 'routing.httpPort', type: Number, required: false },
    { name: 'routing.httpsPort', type: Number, required: false },
    { name: 'routing.enableDefaultServer', type: Boolean, required: false },
    { name: 'routing.enableIpServer', type: Boolean, required: false },
    { name: 'mode', type: String, required: false },
    // { name: 'runtimeConfig.daemonMaxMemoryLimit', type: Number, required: false },
    { name: 'runtimeConfig.blockletMaxMemoryLimit', type: Number, required: false },
    { name: 'registerUrl', type: String, required: false },
    { name: 'didRegistry', type: String, required: true },
    { name: 'didDomain', type: String, required: true },
  ];

  if (isInServerlessMode(config.node)) {
    attributes.push({ name: 'slpDomain', type: String, required: true });
  }

  attributes.forEach(({ name, type, required }) => {
    let dbValue = get(dbInfo, name);
    let configValue = get(config.node, name);

    if (typeof type === 'function') {
      if (typeof configValue !== 'undefined') {
        configValue = type(configValue);
      }

      if (typeof dbValue !== 'undefined') {
        dbValue = type(dbValue);
      }
    }

    let hasChanged = false;
    // If both value are required
    if (required) {
      hasChanged = dbValue && configValue && !isEqual(dbValue, configValue);
    } else {
      hasChanged = !isEqual(dbValue, configValue);
    }

    if (hasChanged) {
      differentAttributes.push({ name, configValue, dbValue });
    }
  });

  return differentAttributes;
};

/**
 * For security reasons, we only allow user to change domain and registry for now
 */
const isConfigDifferentFromDB = (dbInfo, config) => {
  if (!dbInfo) {
    return false;
  }

  const differentAttributes = getDifferentAttributes(dbInfo, config);
  debug('different attributes', differentAttributes);

  const formatValue = (value) => {
    if (Array.isArray(value)) {
      return value.join('\n');
    }

    if (isObject(value)) {
      return Object.keys(value)
        .map((c) => `${c}: ${value[c]}`)
        .join('\n');
    }

    return value;
  };

  if (differentAttributes.length > 0) {
    const tableHead = ['Name', 'Configuration', 'Database'];

    const table = new Table({
      head: tableHead,
      style: { 'padding-left': 1, head: ['cyan', 'bold'] },
    });

    differentAttributes.forEach(({ name, configValue, dbValue }) => {
      table.push([name, formatValue(configValue), formatValue(dbValue)]);
    });

    util.printWarning('We found that there are some differences between config file and database');
    util.print(table.toString());
    return true;
  }

  return false;
};

const startService = async (logDir, maxMemoryRestart, environments) => {
  const servicePort = getPort(PROCESS_NAME_SERVICE);
  debug('start service', { servicePort });
  if (!servicePort) {
    printError('Can not get port for Blocklet Service');
    shelljs.exec(`${ABT_NODE_COMMAND_NAME} stop --force`, { silent: true });
    process.exit(1);
  }

  try {
    const instanceCount = getServiceInstanceCount();
    debug('service instance count', instanceCount);

    await wrapSpinner('Starting blocklet service...', async () => {
      await pm2StartOrReload({
        namespace: 'daemon',
        name: PROCESS_NAME_SERVICE,
        script: './lib/process/service.js',
        max_memory_restart: maxMemoryRestart,
        output: path.join(logDir, 'service.stdout.log'),
        error: path.join(logDir, 'service.stderr.log'),
        cwd: getCliCwd(),
        max_restarts: 3,
        wait_ready: true,
        listen_timeout: 40_000,
        kill_timeout: 10_000,
        execMode: 'cluster',
        shutdown_with_message: true,
        instances: instanceCount,
        time: true,
        pmx: false,
        env: {
          ...environments,
          ABT_NODE_SERVICE_PORT: servicePort,
        },
        mergeLogs: true,
        interpreter_args: environments.ABT_NODE_KERNEL_MODE === ABT_NODE_KERNEL_OR_BLOCKLET_MODE.PERFORMANT ? [] : ['--optimize_for_size'],
      });

      await ensureEndpointHealthy({
        port: servicePort,
        protocol: 'tcp',
        timeout: 5 * 60 * 1000, // wait up to 5 minutes
        minConsecutiveTime: 2000,
      });
    }); // prettier-ignore
  } catch (err) {
    printError(`Blocklet Service start failed: ${err.message}`);
    process.exit(1);
  }

  return servicePort;
};

const checkRunningDaemonInstance = async () => {
  if (!(await checkRunning())) {
    return { status: 'pass' };
  }

  const currentDirectoryFilePath = getConfigFileFromAncestors(process.cwd());
  const runningInstanceConfigFile = await getRunningConfigFile();

  debug('current directory file path', currentDirectoryFilePath);
  debug('running instance config file', runningInstanceConfigFile);

  if (currentDirectoryFilePath && runningInstanceConfigFile && currentDirectoryFilePath !== runningInstanceConfigFile) {
    const newValidDataFolder = getDataDirectoryByConfigFile(currentDirectoryFilePath);
    printWarning(
      'There is a running Blocklet Server instance from:',
      chalk.yellow(getDataDirectoryByConfigFile(runningInstanceConfigFile))
    );
    printInfo('And a valid Blocklet Server config and data directory is found:', chalk.cyan(newValidDataFolder));

    const answer = await inquirer.prompt({
      type: 'confirm',
      name: 'switch',
      message: `Do you want to stop the running instance and start using ${chalk.cyan(newValidDataFolder)} folder?`,
      default: false,
    });

    if (answer.switch === true) {
      return { status: 'switch', from: runningInstanceConfigFile, to: currentDirectoryFilePath };
    }

    return { status: 'exit' };
  }

  return { status: 'pass' };
};

/**
 *
 *
 * @param {string} configVersion
 * @param {string} cliVersion
 * @return {{
 *  matched: boolean,
 *  nextMajorVersion: string | null,
 *  configVersion: string,
 *  cliVersion: string,
 * }}
 */
const isVersionMatched = (configVersion, cliVersion) => {
  if (!semver.valid(configVersion)) {
    throw new Error(`invalid configuration version, got ${configVersion}`);
  }

  if (!semver.valid(cliVersion)) {
    throw new Error(`invalid cli version, got ${cliVersion}`);
  }

  const coercedConfigVersion = semver.coerce(configVersion);
  const coercedCliVersion = semver.coerce(cliVersion);

  const nextMajorVersion = semver.inc(coercedConfigVersion, 'major');

  if (semver.gte(coercedCliVersion, coercedConfigVersion) && semver.lt(cliVersion, nextMajorVersion)) {
    return {
      matched: true,
      nextMajorVersion,
      configVersion,
      cliVersion,
    };
  }

  return {
    matched: false,
    nextMajorVersion,
    configVersion,
    cliVersion,
  };
};

const applyInitialBlocklets = async (node, config) => {
  const tasks = config.initialize.blocklets.map(
    ({ name, resolved }) =>
      wrapSpinner(`Launching blocklet ${name}`, async () => {
        const { meta } = await node.getBlockletMetaFromUrl({ url: resolved })
        if (meta.name !== name) {
          throw new Error(`The blocklet name does not match with config: expected ${name}, received ${meta.name}`);
        }

        const blocklet = await node.installBlocklet({ url: resolved, sync: true });
        await node.handleBlockletEvent(BlockletEvents.installed, { blocklet });
        await node.startBlocklet({ did: blocklet.meta.did, checkHealthImmediately: true, throwOnError: true });
      })
  ); // prettier-ignore

  const results = await Promise.allSettled(tasks);
  const errorResult = results.find((x) => x.status === 'rejected');
  if (errorResult) {
    throw errorResult.reason;
  }
};

const prepareInitialData = async (node, config, dataDir) => {
  // check
  if (!config.initialize || !config.initialize.blocklets || !config.initialize.blocklets.length) {
    return;
  }

  // begin
  const dataDirBak = `${dataDir}~`;
  debug('dataDirBak:', dataDirBak);
  await fs.copy(dataDir, dataDirBak);
  try {
    await applyInitialBlocklets(node, config);
    await fs.remove(dataDirBak);
  } catch (error) {
    await fs.move(dataDirBak, dataDir, { overwrite: true });
    // FIXME: An error here can prevent the node from starting, which may cause it to restart infinitely on EC2
    throw error;
  }
};

const exec = async ({ workingDir, config, dataDir, mode, updateDb, forceIntranet, routing }) => {
  if (!process.env.ABT_NODE_CACHE_SQLITE_PATH) {
    process.env.ABT_NODE_CACHE_SQLITE_PATH = path.join(dataDir, 'core', 'db-cache.db');
  }

  if (!process.env.ABT_NODE_DATA_DIR) {
    process.env.ABT_NODE_DATA_DIR = dataDir;
  }

  const redisUrl = await ensureDockerRedis();
  if (redisUrl) {
    process.env.ABT_NODE_CACHE_REDIS_URL = redisUrl;
    printSuccess(`Using Redis Cache: ${process.env.ABT_NODE_CACHE_REDIS_URL}`);
  }

  if (!process.env.ABT_NODE_POSTGRES_URL) {
    const postgresUrl = await ensureDockerPostgres(dataDir);
    process.env.ABT_NODE_POSTGRES_URL = postgresUrl;
  }
  if (process.env.ABT_NODE_POSTGRES_URL) {
    printSuccess(`Using Postgres: ${process.env.ABT_NODE_POSTGRES_URL}`);
  }

  const configFile = await getConfigFile(workingDir);

  const blockletMaxMemoryLimit = get(config, 'node.runtimeConfig.blockletMaxMemoryLimit', BLOCKLET_MAX_MEM_LIMIT_IN_MB);

  // Ensure the log directory exists before starting pm2; without it pm2 may fail to start.
  // Observed failure on Ubuntu 18.04.4 LTS inside Docker; macOS is unaffected — root cause unknown.
  const logDir = process.env.ABT_NODE_LOG_DIR || getDaemonLogDir(dataDir);
  fs.ensureDirSync(logDir);

  // We need to create node instance after db-proxy started
  const { node, getBaseUrls, publishEvent, wallet } = await nodeLib.getNode({ dir: workingDir });

  // start event-hub
  const [eventHubPort, pm2EventHubPort] = await startEventHub(logDir, blockletMaxMemoryLimit, config.node.sk);

  return new Promise((resolve) => {
    node.onReady(async () => {
      const daemonErrorLogFile = path.join(logDir, 'daemon.stderr.log');
      const startTimeMs = Date.now();
      try {
        if (semver.gt(version, config.node.version)) {
          // Migrate db schema first
          const result = await node.getBlocklets();
          await runSchemaMigrations({ dataDir, printInfo, printSuccess, blocklets: result.blocklets || [] });
        }

        // Migrate application logic later
        const migrationSucceeded = await runMigrationScripts({
          node,
          config,
          configFile,
          dataDir,
          printInfo,
          printError,
          printSuccess,
        });

        if (migrationSucceeded === false) {
          return resolve(1);
        }

        // NOTE: this is a workaround for the blocklet state revert issue after migration
        if (process.env.ABORT_AFTER_MIGRATION) {
          shelljs.exec(`${ABT_NODE_COMMAND_NAME} stop --force`, { silent: true });
          return resolve(0);
        }

        // Ensure version is correct
        const latest = await updateVersionInConfigFileAndState(config, configFile, node);

        let info = await node.getNodeInfo();
        getDockerStatusLog(printInfo, info);

        const isRunning = await checkRunning();

        // Check if DEFAULT_WELLKNOWN_PORT is available or used by current server
        if (!isRunning) {
          const isWellknownPortTaken = await isPortTaken(DEFAULT_WELLKNOWN_PORT);
          if (isWellknownPortTaken) {
            printError(
              `Port ${DEFAULT_WELLKNOWN_PORT} is already in use by another process. This port is required for wellknown routing.`
            );
            printInfo(
              `Please free up port ${DEFAULT_WELLKNOWN_PORT} and try again, or stop the process using this port.`
            );
            return resolve(1);
          }
        }

        // for backward compatibility: info.status may not exist
        const startFromCrash = !isRunning && info.status && info.status !== SERVER_STATUS.STOPPED;

        if (startFromCrash) {
          await node.updateNodeStatus(SERVER_STATUS.START_FROM_CRASH);
        }

        const isProviderAvailable = await checkRoutingProvider(info.routing, { configDir: path.dirname(configFile) });
        if (!isProviderAvailable) {
          printWarning(
            `Routing provider is not available, you can cleanup with ${chalk.cyan(`${ABT_NODE_COMMAND_NAME} stop --force`)}`
          );
          return resolve(1);
        }

        const isConfigChanged = isConfigDifferentFromDB(info, latest);
        if (isConfigChanged) {
          if (updateDb) {
            if (!isValidMode(latest.node.mode)) {
              throw new Error(
                `Invalid server mode, available modes:${prettyAvailableModes()}, current is ${latest.node.mode}.`
              );
            }

            printWarning('And you enabled --update-db flag to update the database');
            const data = {
              port: latest.node.port,
              routing: Object.assign({}, info.routing || {}, {
                https: latest.node.routing.https,
                provider: latest.node.routing.provider,
                adminPath: latest.node.routing.adminPath,
                headers: latest.node.routing.headers,
                ipWildcardDomain: latest.node.routing.ipWildcardDomain,
                wildcardCertHost: latest.node.routing.wildcardCertHost,
                maxUploadFileSize: latest.node.routing.maxUploadFileSize,
                httpPort: latest.node.routing.httpPort,
                httpsPort: latest.node.routing.httpsPort,
                enableDefaultServer: latest.node.routing.enableDefaultServer,
                enableIpServer: latest.node.routing.enableIpServer,
              }),
              mode: latest.node.mode,
              registerUrl: latest.node.registerUrl,
              didRegistry: latest.node.didRegistry,
              didDomain: latest.node.didDomain,
              runtimeConfig: {
                daemonMaxMemoryLimit: get(latest, 'node.runtimeConfig.daemonMaxMemoryLimit', calculatedLimit),
                blockletMaxMemoryLimit: get(
                  latest,
                  'node.runtimeConfig.blockletMaxMemoryLimit',
                  BLOCKLET_MAX_MEM_LIMIT_IN_MB
                ),
              },
            };

            if (isInServerlessMode(latest.node)) {
              data.slpDomain = latest.node.slpDomain;
            }

            info = await node.states.node.updateNodeInfo(data);
            printSuccess('Blocklet Server config was updated to database');
          } else {
            printInfo(`If you want to update the database, restart server with ${chalk.cyan('--update-db')} flag`);
          }
        }

        if (typeof mode !== 'undefined' && info.mode !== mode) {
          if (mode !== NODE_MODES.MAINTENANCE) {
            await node.states.node.updateNodeInfo({ nextVersion: '', upgradeSessionId: '' });
            printSuccess('Cleaned upgrade information');
          }

          await node.states.node.setMode(mode);
          printSuccess(`Blocklet Server mode has been set to ${chalk.cyan(mode)}`);
        }

        if (isInServerlessMode(info)) {
          info = await node.states.node.updateNodeInfo({ enableWelcomePage: false });
          debug(`disable welcome page in ${NODE_MODES.SERVERLESS} mode`);
        }

        await wrapSpinner('Preparing dashboard routing...', async () => {
          await node.ensureDashboardRouting();
        });

        if (isInServerlessMode(info)) {
          await wrapSpinner(
            'Downloading serverless SSL certificates...',
            async () => {
              await node.ensureServerlessCerts();
            },
            { throwOnError: false }
          );
        }

        await wrapSpinner(
          'Updating wildcard certificates...',
          async () => {
            await node.ensureWildcardCerts();
          },
          { throwOnError: false }
        );

        // install initial blocklets
        const initialized = await node.isInitialized();
        if (!initialized) {
          await prepareInitialData(node, latest, dataDir);
        }

        // NOTE: following configurations are required to start the daemon dashboard
        const environments = {
          ABT_NODE_SK: config.node.sk,
          ABT_NODE_DID: config.node.did,
          ABT_NODE_PORT: config.node.port,
          ABT_NODE_SESSION_SECRET: config.node.secret,
          ABT_NODE_DATA_DIR: dataDir,
          ABT_NODE_CACHE_REDIS_URL: process.env.ABT_NODE_CACHE_REDIS_URL,
          ABT_NODE_POSTGRES_URL: process.env.ABT_NODE_POSTGRES_URL,
          ABT_NODE_KERNEL_MODE: process.env.ABT_NODE_KERNEL_MODE,
          ABT_NODE_BLOCKLET_MODE: process.env.ABT_NODE_BLOCKLET_MODE,
          ABT_NODE_CONFIG_FILE: configFile,
          ABT_NODE_BLOCKLET_PORT: config.blocklet.port,
          ABT_NODE_UPDATER_PORT: getPort(PROCESS_NAME_UPDATER),
          ABT_NODE_TEST_DOCKER: process.env.ABT_NODE_TEST_DOCKER,
          MAX_UPLOAD_FILE_SIZE: config.node.routing.maxUploadFileSize || MAX_UPLOAD_FILE_SIZE,
          MAX_NGINX_WORKER_CONNECTIONS: config.node.routing.maxNginxWorkerConnections || MAX_NGINX_WORKER_CONNECTIONS,
          NGINX_MODULES_PATH: process.env.NGINX_MODULES_PATH,
          ABT_NODE_EVENT_PORT: eventHubPort,
          ABT_NODE_PACKAGE_NAME: process.env.ABT_NODE_PACKAGE_NAME,
          ABT_NODE_JOB_NAME: process.env.ABT_NODE_JOB_NAME || '', // used to trigger log analyzing
          ABT_NODE_BINARY_NAME,
          ABT_NODE_COMMAND_NAME,
          ABT_NODE_EVENT_HTTP_PORT: pm2EventHubPort,
          BLOCKLET_SERVER_RUNNING_BEFORE: isRunning ? '1' : '',
          ABT_NODE_ENSURE_RUNNING_CHECK_INTERVAL: process.env.ABT_NODE_ENSURE_RUNNING_CHECK_INTERVAL,
          ABT_NODE_ENSURE_RUNNING_HIGH_LOAD_CPU: process.env.ABT_NODE_ENSURE_RUNNING_HIGH_LOAD_CPU,
          ABT_NODE_ENSURE_RUNNING_HIGH_LOAD_MEMORY: process.env.ABT_NODE_ENSURE_RUNNING_HIGH_LOAD_MEMORY,
          ABT_NODE_ENSURE_RUNNING_HIGH_LOAD_DISK: process.env.ABT_NODE_ENSURE_RUNNING_HIGH_LOAD_DISK,
          ABT_NODE_REDIRECTION_SERVICE_PORTS: process.env.ABT_NODE_REDIRECTION_SERVICE_PORTS,
          ABT_NODE_START_ROUTING: routing || process.env.ABT_NODE_START_ROUTING || 'system',
          ...(config.env || {}),
        };
        if (process.env.DEBUG) {
          environments.DEBUG = process.env.DEBUG;
        }
        debug('environments', omit(environments, ['ABT_NODE_SK']));

        const maxMemoryRestart = `${get(info, 'runtimeConfig.daemonMaxMemoryLimit', calculatedLimit)}M`;
        debug('pm2 daemon max memory restart', maxMemoryRestart);

        // start service
        const servicePort = await startService(logDir, maxMemoryRestart, environments);
        environments.ABT_NODE_SERVICE_PORT = servicePort;

        // clear daemon error log to avoid misleading error messages if start failed
        if (fs.existsSync(daemonErrorLogFile)) {
          fs.truncateSync(daemonErrorLogFile, 0);
        }

        // check localhost listening
        await wrapSpinner('Starting server daemon...', async () => {
          // start daemon
          await pm2StartOrReload({
            namespace: 'daemon',
            name: PROCESS_NAME_DAEMON,
            script: './lib/process/daemon.js',
            max_memory_restart: maxMemoryRestart,
            output: path.join(logDir, 'daemon.stdout.log'),
            error: daemonErrorLogFile,
            cwd: getCliCwd(),
            max_restarts: 3,
            wait_ready: true,
            min_uptime: 15_000,
            listen_timeout: 40_000,
            kill_timeout: 10_000,
            execMode: 'cluster',
            shutdown_with_message: true,
            instances: getDaemonInstanceCount(),
            time: true,
            pmx: false,
            mergeLogs: true,
            env: environments,
            interpreter_args:
              environments.ABT_NODE_KERNEL_MODE === ABT_NODE_KERNEL_OR_BLOCKLET_MODE.PERFORMANT
                ? []
                : ['--optimize_for_size'],
          });
          // check daemon
          await ensureEndpointHealthy({
            protocol: 'tcp',
            port: info.port,
            timeout: 5 * 60 * 1000, // wait up to 5 minutes
            minConsecutiveTime: 2000,
          });
        });

        try {
          await publishEvent(EVENTS.NODE_STARTED, {});
        } catch (err) {
          printError(`Failed to publish start event to socket server: ${err.message}`);
        }

        const accessUrls = await util.getDaemonAccessUrls({ info, wallet, getBaseUrls, forceIntranet });

        printAccessUrls(accessUrls);

        // Schedule orphan process cleanup via PM2 (non-blocking)
        try {
          await pm2.connectAsync();

          // Remove any existing cleanup process first
          try {
            await pm2.deleteAsync(PROCESS_NAME_ORPHAN_CLEANUP);
            debug('Removed existing orphan cleanup process');
          } catch (_err) {
            // Ignore if not exists
          }

          await pm2.startAsync({
            name: PROCESS_NAME_ORPHAN_CLEANUP,
            script: './lib/process/orphan-cleanup-worker.js',
            cwd: getCliCwd(),
            autorestart: false, // Don't restart after exit
            max_restarts: 0, // Never restart
            instances: 1,
            env: {
              ...process.env,
              ORPHAN_CHECK_DELAY: ORPHAN_CHECK_DELAY.toString(),
              ABT_NODE_LOG_DIR: logDir,
            },
          });

          pm2.disconnect();
          printInfo('Orphan cleanup worker started');
        } catch (err) {
          // Cleanup failure should not block server start
          pm2.disconnect();
          debug('Failed to start orphan cleanup worker:', err);
          printWarning('Failed to start orphan cleanup worker');
        }

        return resolve(0);
      } catch (err) {
        debug('start error', err);
        printError(`Blocklet Server start failed due to: ${chalk.red(err.message)}`);
        if (fs.existsSync(daemonErrorLogFile) && fs.statSync(daemonErrorLogFile).ctimeMs > startTimeMs) {
          print(chalk.gray(`${daemonErrorLogFile} last 15 lines:`));
          const lastLogs = await readLastLines.read(daemonErrorLogFile, 15);
          print(lastLogs);
          printWarning(`Check ${daemonErrorLogFile} file for more error messages`);
        }
        printInfo(
          `You can run ${chalk.cyan(`${ABT_NODE_COMMAND_NAME} start`)} again to fix error if it's router related.`
        );
        shelljs.exec(`${ABT_NODE_COMMAND_NAME} stop --force`, { silent: true });

        return resolve(1);
      } finally {
        // ensure log rotator and updater is not global anymore
        await cleanupProcessByName(PROCESS_NAME_PROXY);
        await cleanupProcessByName(PROCESS_NAME_UPDATER);
        await cleanupProcessByName(PROCESS_NAME_LOG_ROTATE);
      }
    });
  });
};

const createStartLock = ({ lockFile, pid }) => fs.writeFileSync(lockFile, pid.toString());

const clearStartLock = ({ pid, lockFile, enforceLock }) => {
  try {
    // If autoInit is enabled, delete the lock file whenever it exists
    if (!enforceLock && fs.existsSync(lockFile)) {
      fs.removeSync(lockFile);
      return;
    }

    if (!enforceLock || !fs.existsSync(lockFile)) {
      return;
    }

    const lockPid = fs.readFileSync(lockFile).toString();
    if (lockPid !== pid.toString()) {
      return;
    }

    fs.removeSync(lockFile);
  } catch (error) {
    debug('clear start log failed', error);
    util.printError(`Clear start lock failed, please delete this file manually ${lockFile}`);
  }
};

/**
 * Normalize routing strategy value
 * @param {string} routing - The routing strategy input
 * @returns {string} Normalized routing strategy
 */
const normalizeRoutingStrategy = (routing) => {
  if (routing === 'all') {
    return 'full';
  }
  return routing;
};

/**
 * start blocklet server
 * @param {object} params
 * @param {boolean} params.updateDb the database from the configuration file or not
 * @param {boolean} params.enforceLock should we enforce start lock
 * @param {string} params.workingDir working directory when start node
 * @param {boolean} params.forceIntranet force server to run in intranet, ignore any external IP
 * @param {string} params.mode server mode
 * @param {string} params.routing routing update strategy: system, all, or full (all is alias for full)
 * @returns {Promise<number>} 0: success, others: failed
 */
const start = async ({ updateDb, enforceLock, forceIntranet, workingDir, mode, routing: rawRouting }) => {
  const routing = normalizeRoutingStrategy(rawRouting);
  const { pid } = process;
  const { config, dataDir } = await nodeLib.readNodeConfig(workingDir);

  // Ensure only one start is running at the same time
  const lockFile = path.join(dataDir, 'start.lock');

  const onExit = (_, code) => {
    try {
      clearStartLock({ pid, enforceLock, lockFile });
    } catch (error) {
      debug('clear start lock failed', error);
    }

    process.exit(code);
  };

  copyEnvToProcess(config.env);

  [
    'SIGINT',
    'SIGTERM',
    'SIGHUP', // the console window is closed
    'SIGBREAK', // <Ctrl>+<Break> (in Windows)
  ].forEach((sig) => {
    process.on(sig, onExit);
  });

  // uncaughtException is handled outside
  process.on('exit', (code) => {
    if (code > 0) {
      clearStartLock({ pid, enforceLock, lockFile });
    }
  });

  util.ensurePermission(dataDir);

  if (!canUseFileSystemIsolateApi()) {
    util.printWarning(
      `The current Node.js version is below ${SAFE_NODE_VERSION}. To enable strict mode, where blocklets are isolated, it is recommended to install Node.js version ${SAFE_NODE_VERSION} or higher.`
    );
  }

  const cliVersion = util.getCLIVersion();
  const matchResult = isVersionMatched(config.node.version, cliVersion);

  const skipVersionCheck = ['true', '1'].includes(process.env.ABT_NODE_SKIP_VERSION_CHECK);
  if (matchResult.matched === false) {
    if (!skipVersionCheck) {
      util.printError(
        // eslint-disable-next-line max-len
        `Your CLI version ${matchResult.cliVersion} does not match the version ${matchResult.configVersion} in server config, please install a version >= ${matchResult.configVersion} and < ${matchResult.nextMajorVersion} `
      );
      return 1;
    }
    util.printWarning(
      chalk.yellow(
        `Your CLI version ${chalk.cyan(matchResult.cliVersion)} lower than the version ${chalk.cyan(matchResult.configVersion)} in server, this is a ${chalk.red('dangerous')} operation, please be responsible for the consequences!`
      )
    );
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        default: false,
        message: 'Are you sure you want to continue?',
      },
    ]);
    if (!confirm) {
      return 1;
    }
  }

  // Ensure db schema and data migrated: only need to run once
  await runSchemaMigrations({ dataDir, printInfo, printSuccess });

  try {
    if (enforceLock) {
      if (fs.existsSync(lockFile)) {
        util.printWarning('Server is starting, please try again later');
        util.printInfo(`Please cleanup with ${chalk.cyan(`rm -f ${dataDir}/start.lock`)} and then try again`);
        return 1;
      }

      createStartLock({ lockFile, pid });
    }

    const code = await exec({ config, dataDir, updateDb, mode, workingDir, forceIntranet, routing });
    return code;
  } catch (error) {
    debug('start error', error);
    printError(`Blocklet Server start failed due to: ${chalk.red(error.message)}`);

    printInfo(`You can run ${chalk.cyan(`${ABT_NODE_COMMAND_NAME} start`)} again to fix error if it's router related.`);
    shelljs.exec(`${ABT_NODE_COMMAND_NAME} stop --force`, { silent: true });

    return 1;
  } finally {
    clearStartLock({ pid, enforceLock, lockFile });
  }
};

const stopDaemon = async () => {
  try {
    await pm2.killDaemonAsync();
    printSuccess('Blocklet Server related processes stopped successfully');
  } catch (err) {
    printError(`Blocklet Server related processes stop failed: ${err.message}`);
  }
};

const stopOriginNode = async () => {
  try {
    await stopDaemon();
    const results = await Promise.all([
      clearRouterByConfigKeyword(CONFIG_FOLDER_NAME),
      clearRouterByConfigKeyword(CONFIG_FOLDER_NAME_OLD),
    ]);
    if (results.some(Boolean)) {
      printSuccess('Routing engine was successfully stopped');
    }

    printSuccess('Stop original node successfully');
  } catch (error) {
    printError('Stop original node failed:', error.message);
  }
};

exports.run = async ({ updateDb, autoInit = false, forceIntranet = false, forceMode: mode, routing }) => {
  if (typeof mode !== 'undefined' && !isValidMode(mode)) {
    printInvalidModeInfo();
    process.exit(1);
  }

  const workingDir = process.cwd();
  if (autoInit) {
    const baseConfigDirectory = getBaseConfigDataDirectory(workingDir);
    if (baseConfigDirectory) {
      print(`Can't initialize Blocklet Server instance inside another instance: ${baseConfigDirectory}`);
      process.exit(1);
    }

    const configDir = getConfigDirFromCurrentDir(workingDir);

    if (configDir) {
      print(`Blocklet Server instance already exists in ${workingDir}, now starting...`);
    } else {
      printInfo(`Initialize new Blocklet Server instance config in ${workingDir}...`);
      const { stderr, code } = shelljs.exec(`${ABT_NODE_COMMAND_NAME} init -f`, { silent: true });
      if (code !== 0) {
        printError(`Failed to initialize Blocklet Server configuration in ${workingDir}: ${stderr}`);
        process.exit(1);
      }
    }
  }

  const result = await checkRunningDaemonInstance();
  if (result.status === 'exit') {
    process.exit(1);
  }

  if (result.status === 'switch') {
    await stopOriginNode();
  }

  util.checkTerminalProxy('Blocklet Server');

  // Skip start lock if we are started using `--auto-init` flag
  const startResult = await start({ updateDb, workingDir, enforceLock: !autoInit, forceIntranet, mode, routing });

  if (startResult !== 0) {
    process.exit(startResult);
  }

  process.exit(0);
};

exports.start = start;
exports.isVersionMatched = isVersionMatched;
exports.clearStartLock = clearStartLock;
exports.createStartLock = createStartLock;
exports.isConfigDifferentFromDB = isConfigDifferentFromDB;
exports.getDifferentAttributes = getDifferentAttributes;
exports.copyEnvToProcess = copyEnvToProcess;
