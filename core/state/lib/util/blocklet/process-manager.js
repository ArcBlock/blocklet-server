/* eslint-disable camelcase */
/* eslint-disable no-await-in-loop */

const path = require('node:path');
const os = require('node:os');
const get = require('lodash/get');
const omit = require('lodash/omit');
const shelljs = require('shelljs');
const fs = require('fs-extra');
const logger = require('@abtnode/logger')('@abtnode/core:util:blocklet:process-manager');
const pm2 = require('@abtnode/util/lib/pm2/async-pm2');
const getPm2ProcessInfo = require('@abtnode/util/lib/get-pm2-process-info');
const { getSecurityNodeOptions } = require('@abtnode/util/lib/security');
const { killProcessOccupiedPorts } = require('@abtnode/util/lib/port');
const fetchPm2 = require('@abtnode/util/lib/pm2/fetch-pm2');
const { DBCache, getAbtNodeRedisAndSQLiteUrl } = require('@abtnode/db-cache');
const { BLOCKLET_MAX_MEM_LIMIT_IN_MB } = require('@abtnode/constant');
const {
  BlockletStatus,
  BlockletGroup,
  BLOCKLET_MODES,
  BLOCKLET_DEFAULT_PORT_NAME,
  STATIC_SERVER_ENGINE_DID,
} = require('@blocklet/constant');
const { forEachBlocklet, hasStartEngine, isExternalBlocklet } = require('@blocklet/meta/lib/util');
const { getBlockletEngine } = require('@blocklet/meta/lib/engine');
const { validateBlockletEntry } = require('@blocklet/meta/lib/entry');

const promiseSpawn = require('@abtnode/util/lib/promise-spawn');

const parseDockerOptionsFromPm2 = require('../docker/parse-docker-options-from-pm2');
const dockerRemoveByName = require('../docker/docker-remove-by-name');
const { createDockerNetwork } = require('../docker/docker-network');
const parseDockerName = require('../docker/parse-docker-name');
const { ensureBun } = require('../ensure-bun');
const { installExternalDependencies } = require('../install-external-dependencies');

const SCRIPT_ENGINES_WHITE_LIST = ['npm', 'npx', 'pnpm', 'yarn'];

const startLock = new DBCache(() => ({
  ...getAbtNodeRedisAndSQLiteUrl(),
  prefix: 'blocklet-start-locks2',
  ttl: 1000 * 60 * 3,
}));

const statusMap = {
  online: BlockletStatus.running,
  launching: BlockletStatus.starting,
  errored: BlockletStatus.error,
  stopping: BlockletStatus.stopping,
  stopped: BlockletStatus.stopped,
  'waiting restart': BlockletStatus.restarting,
};

const noop = () => {
  //
};
const noopAsync = async () => {
  //
};

const isUsefulError = (err) =>
  err &&
  err.message !== 'process or namespace not found' &&
  !/id unknown/.test(err.message) &&
  !/^Process \d+ not found$/.test(err.message);

/**
 * @param {*} processId
 * @returns {BlockletStatus}
 */
const getProcessState = async (processId) => {
  // eslint-disable-next-line no-use-before-define
  const info = await getProcessInfo(processId);
  if (!statusMap[info.pm2_env.status]) {
    logger.error('Cannot find the blocklet status for pm2 status mapping', {
      pm2Status: info.pm2_env.status,
    });

    return BlockletStatus.error;
  }

  return statusMap[info.pm2_env.status];
};

const getProcessInfo = (processId, { throwOnNotExist = true, timeout = 10_000 } = {}) =>
  getPm2ProcessInfo(processId, { printError: logger.error.bind(logger), throwOnNotExist, timeout });

const deleteProcess = (processId) => {
  return new Promise((resolve, reject) => {
    pm2.delete(processId, async (err) => {
      if (isUsefulError(err)) {
        logger.error('blocklet process delete failed', { processId, error: err });
        return reject(err);
      }
      await dockerRemoveByName(processId);
      return resolve(processId);
    });
  });
};

const reloadProcess = (processId) =>
  new Promise((resolve, reject) => {
    pm2.reload(processId, (err) => {
      if (err) {
        if (isUsefulError(err)) {
          logger.error('blocklet reload failed', { processId, error: err });
        }
        return reject(err);
      }
      return resolve(processId);
    });
  });

const shouldSkipComponent = (componentDid, whiteList) => {
  if (!whiteList || !Array.isArray(whiteList)) {
    return false;
  }

  const arr = whiteList.filter(Boolean);

  if (!arr.length) {
    return false;
  }

  return !arr.includes(componentDid);
};

/**
 * Start all precesses of a blocklet
 * @param {*} blocklet should contain env props
 * @param {object} options Start options
 * @param {object} options.getComponentStartEngine Function to get component start engine
 * @param {object} options.getRuntimeEnvironments Function to get runtime environments
 */
const startBlockletProcess = async (
  blocklet,
  {
    preFlight = noop,
    preStart = noop,
    postStart = noopAsync,
    nodeEnvironments,
    nodeInfo,
    e2eMode,
    skippedProcessIds = [],
    componentDids,
    configSynchronizer,
    onlyStart = false,
    isGreen = false,
    getComponentStartEngine,
    getRuntimeEnvironments,
  } = {}
) => {
  if (!blocklet) {
    throw new Error('blocklet should not be empty');
  }

  const dockerNetworkName = parseDockerName(blocklet?.meta?.did, 'docker-network');
  await createDockerNetwork(dockerNetworkName);

  blocklet.children.forEach((component) => {
    if (!componentDids.includes(component.meta.did)) {
      return;
    }
    for (const envItem of component.environments) {
      const envKey = envItem.key || envItem.name;
      if (envKey !== 'BLOCKLET_PORT') {
        continue;
      }
      if (isGreen) {
        if (component.greenPorts?.BLOCKLET_PORT) {
          envItem.value = component.greenPorts.BLOCKLET_PORT;
        }
      } else if (component.ports?.BLOCKLET_PORT) {
        envItem.value = component.ports.BLOCKLET_PORT;
      }
    }
  });

  const startBlockletTask = async (b, { ancestors }) => {
    // 需要在在这里传入字符串类型，否则进程中如法转化成 Date 对象
    const now = `${new Date()}`;
    if (b.meta.group === BlockletGroup.gateway) {
      return;
    }

    if (!hasStartEngine(b.meta)) {
      return;
    }

    const { processId, logsDir, appDir } = b.env;

    if (skippedProcessIds.includes(processId)) {
      logger.info('skip start skipped process', { processId });
      return;
    }

    if (shouldSkipComponent(b.meta.did, componentDids)) {
      logger.info('skip start process not selected', { processId });
      return;
    }

    if (b.mode !== BLOCKLET_MODES.DEVELOPMENT) {
      validateBlockletEntry(appDir, b.meta);
    }

    const { cwd, script, args, environmentObj, interpreter, interpreterArgs } = getComponentStartEngine(b, {
      e2eMode,
    });
    if (!script) {
      logger.info('skip start process without script', { processId });
      return;
    }

    // get env
    const env = getRuntimeEnvironments(b, nodeEnvironments, ancestors, isGreen);
    const startedAt = Date.now();

    await installExternalDependencies({ appDir: env?.BLOCKLET_APP_DIR, nodeInfo });
    await preFlight(b, { env: { ...env } });
    await preStart(b, { env: { ...env } });

    // kill process if port is occupied
    try {
      const { ports, greenPorts } = b;
      await killProcessOccupiedPorts({
        ports: isGreen ? greenPorts : ports,
        pm2ProcessId: processId,
        printError: logger.error.bind(logger),
      });
    } catch (error) {
      logger.error('Failed to killProcessOccupiedPorts', { error });
    }

    // start process
    const maxMemoryRestart = get(nodeInfo, 'runtimeConfig.blockletMaxMemoryLimit', BLOCKLET_MAX_MEM_LIMIT_IN_MB);
    const processIdName = isGreen ? `${processId}-green` : processId;
    /**
     * @type {pm2.StartOptions}
     */
    const options = {
      namespace: 'blocklets',
      name: processIdName,
      cwd,
      log_date_format: '(YYYY-MM-DD HH:mm:ss)',
      output: path.join(logsDir, 'output.log'),
      error: path.join(logsDir, 'error.log'),
      // wait_ready: process.env.NODE_ENV !== 'test',
      wait_ready: false,
      listen_timeout: 3000,
      max_memory_restart: `${maxMemoryRestart}M`,
      max_restarts: b.mode === BLOCKLET_MODES.DEVELOPMENT ? 0 : 3,
      min_uptime: 10_000,
      exp_backoff_restart_delay: 300,
      env: omit(
        {
          ...environmentObj,
          ...env,
          NODE_ENV: 'production',
          BLOCKLET_START_AT: now,
          NODE_OPTIONS: await getSecurityNodeOptions(b, nodeInfo.enableFileSystemIsolation),
        },
        // should only inject appSk and appPsk to the blocklet environment when unsafe mode enabled
        ['1', 1].includes(env.UNSAFE_MODE) ? [] : ['BLOCKLET_APP_SK', 'BLOCKLET_APP_PSK']
      ),
      script,
      args,
      interpreter,
      interpreterArgs,
    };

    const clusterMode = get(b.meta, 'capabilities.clusterMode', false);
    if (clusterMode && b.mode !== BLOCKLET_MODES.DEVELOPMENT) {
      const clusterSize = Number(blocklet.configObj.BLOCKLET_CLUSTER_SIZE) || +process.env.ABT_NODE_MAX_CLUSTER_SIZE;
      options.execMode = 'cluster';
      options.mergeLogs = true;
      options.instances = Math.max(Math.min(os.cpus().length, clusterSize), 1);
      options.env.BLOCKLET_CLUSTER_SIZE = options.instances;
      if (options.instances !== clusterSize) {
        logger.warn(`Fallback cluster size to ${options.instances} for ${processId}, ignore custom ${clusterSize}`);
      }
    } else {
      delete options.env.BLOCKLET_CLUSTER_SIZE;
    }

    if (b.mode === BLOCKLET_MODES.DEVELOPMENT) {
      options.env.NODE_ENV = e2eMode ? 'e2e' : 'development';
      options.env.IS_E2E = e2eMode ? '1' : undefined;
      options.env.BROWSER = 'none';
      options.env.PORT = options.env[BLOCKLET_DEFAULT_PORT_NAME];

      if (process.platform === 'win32') {
        const [cmd, ...argList] = options.script.split(' ').filter(Boolean);

        if (!SCRIPT_ENGINES_WHITE_LIST.includes(cmd)) {
          throw new Error(`${cmd} script is not supported, ${SCRIPT_ENGINES_WHITE_LIST.join(', ')} are supported`);
        }

        const { stdout: nodejsBinPath } = shelljs.which('node');

        const cmdPath = path.join(path.dirname(nodejsBinPath), 'node_modules', cmd);

        const pkg = JSON.parse(fs.readFileSync(path.join(cmdPath, 'package.json'), 'utf8'));
        const cmdBinPath = pkg.bin[cmd];

        options.script = path.resolve(cmdPath, cmdBinPath);
        options.args = [...argList].join(' ');
      }
    }

    await configSynchronizer.syncComponentConfig(b.meta.did, blocklet.meta.did, {
      serverSk: nodeEnvironments.ABT_NODE_SK,
    });

    if (options.interpreter === 'bun') {
      options.exec_interpreter = await ensureBun();
      options.exec_mode = 'fork';
      delete options.instances;
      delete options.mergeLogs;
    }

    let nextOptions;
    if (b.mode === BLOCKLET_MODES.DEVELOPMENT) {
      nextOptions = options;
    } else {
      nextOptions = await parseDockerOptionsFromPm2({
        options,
        nodeInfo,
        isExternal: isExternalBlocklet(b),
        meta: b.meta,
        ports: isGreen ? b.greenPorts : b.ports,
        onlyStart,
        dockerNetworkName,
        rootBlocklet: blocklet,
      });
    }

    await fetchPm2({ ...nextOptions, pmx: false }, nodeEnvironments.ABT_NODE_SK);

    const status = await getProcessState(processIdName);
    if (status === BlockletStatus.error) {
      throw new Error(`process ${processIdName} is not running within 3 seconds`);
    }
    logger.info('done start blocklet', { processId: processIdName, status, time: Date.now() - startedAt });

    if (nextOptions.env.connectInternalDockerNetwork) {
      try {
        await promiseSpawn(nextOptions.env.connectInternalDockerNetwork, { mute: true });
      } catch (err) {
        logger.warn('blocklet connect internal docker network failed', { processId: processIdName, error: err });
      }
    }

    // run hook
    postStart(b, { env }).catch((err) => {
      logger.error('blocklet post start failed', { processId: processIdName, error: err });
    });
  };

  await forEachBlocklet(
    blocklet,
    /**
     *
     * @param {import('@blocklet/server-js').BlockletState} b
     * @param {*} param1
     * @returns
     */
    async (b, { ancestors }) => {
      const lockName = `${blocklet.meta.did}-${b.meta.did}`;

      // 如果锁存在，则跳过执行
      if (!(await startLock.hasExpired(lockName))) {
        return;
      }
      await startLock.acquire(lockName);

      try {
        await startBlockletTask(b, { ancestors });
      } finally {
        startLock.releaseLock(lockName);
      }
    },
    { parallel: true, concurrencyLimit: 3 }
  );
};

/**
 * Stop all precesses of a blocklet
 * @param {*} blocklet should contain env props
 */
const stopBlockletProcess = (
  blocklet,
  { preStop = noop, skippedProcessIds = [], componentDids, isGreen = false, isStopGreenAndBlue = false } = {}
) => {
  // eslint-disable-next-line no-use-before-define
  return deleteBlockletProcess(blocklet, {
    preDelete: preStop,
    skippedProcessIds,
    componentDids,
    isGreen,
    isStopGreenAndBlue,
  });
};

/**
 * Delete all precesses of a blocklet
 * @param {*} blocklet should contain env props
 */
const deleteBlockletProcess = async (
  blocklet,
  { preDelete = noop, skippedProcessIds = [], componentDids, isGreen = false, isStopGreenAndBlue = false } = {}
) => {
  await forEachBlocklet(
    blocklet,
    async (b, { ancestors }) => {
      // NOTICE: 如果不判断 group, 在 github action 中测试 disk.spec.js 时会报错, 但是在 mac 中跑测试不会报错
      if (b.meta?.group === BlockletGroup.gateway) {
        return;
      }

      if (skippedProcessIds.includes(b.env.processId)) {
        logger.info(`skip delete skipped process ${b.env.processId}`);
        return;
      }

      if (shouldSkipComponent(b.meta?.did, componentDids)) {
        logger.info(`skip delete process not selected: ${b.meta.did}`, { processId: b.env.processId });
        return;
      }

      if (!hasStartEngine(b.meta)) {
        return;
      }

      // Skip deleting static-server engine processes since they were never started
      if (b.meta?.group === 'static') {
        return;
      }
      const engine = getBlockletEngine(b.meta);
      if (engine.interpreter === 'blocklet' && engine.source?.name === STATIC_SERVER_ENGINE_DID) {
        return;
      }

      await preDelete(b, { ancestors });
      if (isStopGreenAndBlue) {
        await deleteProcess(`${b.env.processId}-green`);
        await deleteProcess(b.env.processId);
        return;
      }
      const processId = isGreen ? `${b.env.processId}-green` : b.env.processId;
      await deleteProcess(processId);
    },
    { parallel: true }
  );
};

/**
 * Reload all precesses of a blocklet
 * @param {*} blocklet should contain env props
 */
const reloadBlockletProcess = (blocklet, { componentDids } = {}) =>
  forEachBlocklet(
    blocklet,
    async (b) => {
      if (b.meta.group === BlockletGroup.gateway) {
        return;
      }

      if (shouldSkipComponent(b.meta.did, componentDids)) {
        logger.info('skip reload process', { processId: b.env.processId });
        return;
      }

      // Skip reloading static-server engine processes since they were never started
      if (b.meta?.group === 'static') {
        return;
      }
      const engine = getBlockletEngine(b.meta);
      if (engine.interpreter === 'blocklet' && engine.source?.name === STATIC_SERVER_ENGINE_DID) {
        return;
      }

      await reloadProcess(b.env.processId);
      logger.info('done reload process', { processId: b.env.processId });
    },
    { parallel: false }
  );

module.exports = {
  startBlockletProcess,
  stopBlockletProcess,
  deleteBlockletProcess,
  reloadBlockletProcess,
  getProcessState,
  getProcessInfo,
  deleteProcess,
  reloadProcess,
  shouldSkipComponent,
  startLock,
  statusMap,
  noop,
  noopAsync,
  isUsefulError,
};
