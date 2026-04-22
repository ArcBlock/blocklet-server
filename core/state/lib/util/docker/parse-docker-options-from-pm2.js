require('./docker-container-prune');

const { COMPONENT_DOCKER_ENV_FILE_NAME, ABT_NODE_KERNEL_OR_BLOCKLET_MODE } = require('@blocklet/constant');
const { stringify: stringifyEnvFile } = require('envfile');
const path = require('path');
const fsp = require('fs/promises');
const fs = require('fs');
const os = require('os');
const logger = require('@abtnode/logger')('@abtnode/docker');
const { existsSync, writeFileSync } = require('fs-extra');
const { NODE_MODES } = require('@abtnode/constant');
const promiseSpawn = require('@abtnode/util/lib/promise-spawn');
const getLocalIPAddress = require('@abtnode/util/lib/get-local-ip-address');
const { dockerCmdValidator } = require('@abtnode/docker-utils');
const { getBlockletEngine } = require('@blocklet/meta/lib/engine');
const { isExternalBlocklet } = require('@blocklet/meta/lib/util');

const { isNumber } = require('lodash');
const parseDockerName = require('./parse-docker-name');
const { createDockerImage } = require('./create-docker-image');
const checkNeedRunDocker = require('./check-need-run-docker');
const replaceEnvValue = require('./replace-env-value');
const parseDockerCpVolume = require('./parse-docker-cp-volume');
const generateClusterNodeScript = require('./generate-cluster-node-script');
const { parseTmpfs } = require('./parse-tmpfs');

const getSystemResources = (() => {
  let cachedResources = null;

  return () => {
    if (!cachedResources) {
      try {
        const maxCPUs = os.cpus().length;
        const maxMemory = Math.floor(os.totalmem() / 1024 ** 3); // 转换为 GB
        cachedResources = { maxCPUs, maxMemory };
      } catch (error) {
        logger.error('Failed to get system resources', error);
        cachedResources = { maxCPUs: 2, maxMemory: 2 };
      }
    }
    return cachedResources;
  };
})();

async function parseDockerOptionsFromPm2({
  options,
  nodeInfo,
  meta,
  ports,
  rootBlocklet,
  overrideScript,
  dockerNamePrefix = 'blocklet',
  eventName,
  dockerNetworkName,
}) {
  const isExternal = isExternalBlocklet(rootBlocklet);
  if (!(await checkNeedRunDocker(meta, options.env, nodeInfo, isExternal))) {
    return options;
  }
  const nextOptions = { ...options };

  const isServerless = nodeInfo.mode === NODE_MODES.SERVERLESS;

  if (isServerless && isExternal) {
    if (nextOptions.env.SKIP_DOCKER_NETWORK) {
      throw new Error('Serverless mode does not support skipping Docker network');
    }
    if (nextOptions.env.ALLOW_DOCKER_HOST_ACCESS) {
      throw new Error('Serverless mode does not support allowing Docker host access');
    }
  }

  const dockerInfo = {
    ...(await createDockerImage({
      appDir: options.env.BLOCKLET_APP_DIR,
      dataDir: options.env.BLOCKLET_DATA_DIR,
      meta,
      ports,
      env: options.env,
    })),
  };

  nextOptions.env = { ...nextOptions.env };
  const name = parseDockerName(options.name, dockerNamePrefix);

  if (nextOptions.env.DOCKER_CMD) {
    dockerInfo.command = nextOptions.env.DOCKER_CMD;
  }

  const { tmpfs } = dockerInfo;
  delete dockerInfo.tmpfs;

  try {
    dockerCmdValidator(dockerInfo.image);
  } catch (error) {
    throw new Error(`Docker Image is invalid: ${dockerInfo.image}`);
  }

  try {
    dockerCmdValidator(dockerInfo.command);
  } catch (error) {
    throw new Error(`Docker CMD is invalid: ${dockerInfo.command}`);
  }

  options.interpreter = 'none';
  const defaultCpus = '2';
  const defaultMemory = '1.5g';
  const defaultDiskSize = '0g';
  const defaultTmpfsSize = '4g';

  const cpus = isServerless
    ? process.env.ABT_NODE_DOCKER_CPUS
    : options.env.DOCKER_CPUS || process.env.ABT_NODE_DOCKER_CPUS;

  const memory = isServerless
    ? process.env.ABT_NODE_DOCKER_MEMORY
    : options.env.DOCKER_MEMORY || process.env.ABT_NODE_DOCKER_MEMORY;

  const diskSize = isServerless
    ? process.env.ABT_NODE_DOCKER_DISK_SIZE
    : options.env.DOCKER_DISK_SIZE || process.env.ABT_NODE_DOCKER_DISK_SIZE;

  const tmpfsSize = isServerless
    ? process.env.ABT_NODE_DOCKER_TMPFS_SIZE
    : options.env.DOCKER_TMPFS_SIZE || process.env.ABT_NODE_DOCKER_TMPFS_SIZE;

  const tmpfsOption = parseTmpfs(tmpfs, tmpfsSize || defaultTmpfsSize);

  // Ensure environment variables are properly set within the Docker container
  const envDefaults = {
    BLOCKLET_DOCKER_CPUS: cpus || defaultCpus,
    BLOCKLET_DOCKER_MEMORY: memory || defaultMemory,
    BLOCKLET_DOCKER_DISK_SIZE: diskSize || defaultDiskSize,
    BLOCKLET_DOCKER_NAME: name,
    INTERNAL_HOST: 'host.docker.internal',
    NODE_MODES: options.env.NODE_MODES || (isServerless ? NODE_MODES.SERVERLESS : NODE_MODES.PRODUCTION),
    HTTP_PROXY: process.env.DOCKER_HTTP_PROXY || '',
    HTTPS_PROXY: process.env.DOCKER_HTTPS_PROXY || '',
    BUN_INSTALL_CACHE_DIR: '/var/lib/blocklet/bun-cache',
  };

  nextOptions.env = { ...nextOptions.env, ...envDefaults };

  const dockerEnv = { ...nextOptions.env };

  // 获取系统 CPU 数量和内存大小 (以 GB 为单位)
  const { maxCPUs, maxMemory } = getSystemResources();

  dockerEnv.BLOCKLET_DOCKER_CPUS = `${Math.min(Number(dockerEnv.BLOCKLET_DOCKER_CPUS), maxCPUs)}`;
  dockerEnv.BLOCKLET_DOCKER_MEMORY = `${Math.min(Number(dockerEnv.BLOCKLET_DOCKER_MEMORY.replace('g', '')), maxMemory)}g`;
  dockerEnv.BLOCKLET_DOCKER_DISK_SIZE = `${Math.min(Number(dockerEnv.BLOCKLET_DOCKER_DISK_SIZE.replace('g', '')), 20)}g`;
  dockerEnv.BLOCKLET_DOCKER_TMPFS_SIZE = tmpfsOption.size;

  const { baseDir } = dockerInfo;
  const serverDir = process.env.ABT_NODE_DATA_DIR;
  const replaceDir = (dir) => dir.replace(serverDir, baseDir);

  const uid = process.getuid();
  const gid = process.getgid();

  dockerEnv.DOCKER_CONTAINER_SERVER_DIR = baseDir;
  dockerEnv.BLOCKLET_APP_DATA_DIR = replaceDir(nextOptions.env.BLOCKLET_APP_DATA_DIR);
  dockerEnv.BLOCKLET_APP_DIR = replaceDir(nextOptions.env.BLOCKLET_APP_DIR);
  dockerEnv.BLOCKLET_DATA_DIR = replaceDir(nextOptions.env.BLOCKLET_DATA_DIR);
  dockerEnv.BLOCKLET_LOG_DIR = path.join(baseDir, 'logs');
  dockerEnv.BLOCKLET_CACHE_DIR = path.join(baseDir, 'cache');
  dockerEnv.BLOCKLET_TMPFS_DIR = tmpfsOption.fullDir;
  dockerEnv.BLOCKLET_APP_SHARE_DIR = replaceDir(nextOptions.env.BLOCKLET_APP_SHARE_DIR);
  dockerEnv.BLOCKLET_SHARE_DIR = replaceDir(nextOptions.env.BLOCKLET_SHARE_DIR);
  dockerEnv.BLOCKLET_HOST = getLocalIPAddress();
  dockerEnv.USING_DOCKER = 'true';
  dockerEnv.LOCAL_USER_ID = process.getuid();

  if (meta.egress === undefined) {
    meta.egress = true;
  }
  if (nodeInfo.enableDockerNetwork && dockerNetworkName && !nextOptions.env.SKIP_DOCKER_NETWORK) {
    const network = meta.egress === true ? dockerNetworkName : `${dockerNetworkName}-internal`;
    dockerInfo.network = `--network ${network}`;
    let primaryPort = 0;
    Object.keys(ports).forEach((key) => {
      const port = ports[key];
      const inter = meta.interfaces?.find((x) => x.port === key);
      dockerInfo.network += ` -p ${inter?.hostIP || '127.0.0.1'}:${port}:${inter?.containerPort || port}`;
      if (inter) {
        if (primaryPort === 0) {
          primaryPort = inter.containerPort || port;
        }
        if (inter.type === 'web') {
          primaryPort = inter.containerPort || port;
        }
      }
    });
    if (nextOptions.env.ALLOW_DOCKER_HOST_ACCESS) {
      dockerInfo.network += ' --add-host=host.docker.internal:host-gateway';
    }
    dockerEnv.BLOCKLET_DOCKER_NETWORK = network;
    if (primaryPort) {
      dockerEnv.BLOCKLET_DOCKER_PRIMARY_PORT = primaryPort;
      dockerEnv.BLOCKLET_PORT = primaryPort;
    }
  }

  replaceEnvValue(dockerEnv, rootBlocklet, dockerNamePrefix);

  // Replace all occurrences of serverDir with baseDir in dockerEnv
  let dockerEnvString = JSON.stringify(dockerEnv).replace(new RegExp(serverDir, 'g'), baseDir);
  if (dockerEnv.BLOCKLET_DOCKER_NETWORK) {
    dockerEnvString = dockerEnvString
      .replace(/127\.0\.0\.1/g, dockerEnv.BLOCKLET_HOST)
      .replace(/localhost/g, dockerEnv.BLOCKLET_HOST)
      .replace(/0\.0\.0\.0/g, dockerEnv.BLOCKLET_HOST);
  }
  const updatedDockerEnv = JSON.parse(dockerEnvString);

  updatedDockerEnv.DOCKER_HOST_SERVER_DIR = serverDir;
  const envVars = stringifyEnvFile(updatedDockerEnv);
  const dockerTempDir = path.join(serverDir, 'tmp', 'docker', nextOptions.env.BLOCKLET_REAL_NAME);
  const dockerEnvFile = path.join(dockerTempDir, `${COMPONENT_DOCKER_ENV_FILE_NAME}-${name}`);
  mkdirpWithPermissions(path.dirname(dockerEnvFile));
  await fsp.writeFile(dockerEnvFile, envVars);

  let runScript = dockerInfo.script || '';

  if (!runScript && dockerInfo.installNodeModules) {
    if (!overrideScript && nextOptions.script && isNumber(nextOptions.instances) && nextOptions.instances > 1) {
      createClusterScripts({
        appDir: nextOptions.env.BLOCKLET_APP_DIR,
        scriptPath: nextOptions.script.replace(/(npm|yarn|pnpm|bun)/, '').trim(),
        instances: nextOptions.instances,
      });
      nextOptions.script = 'index-cluster.js';
    }

    const maxOldSpaceSize = Math.floor(Number(dockerEnv.BLOCKLET_DOCKER_MEMORY.replace('g', '')) * 0.85 * 1024);
    const nodeInterpreter = `node ${process.env.ABT_NODE_BLOCKLET_MODE === ABT_NODE_KERNEL_OR_BLOCKLET_MODE.PERFORMANT ? '' : '--optimize_for_size'} --max-old-space-size=${maxOldSpaceSize} --max-http-header-size=16384 ${nextOptions.script} -- BLOCKLET_NAME=${options.name}`;

    const bunInterpreter = `bun run ${nextOptions.script} -- BLOCKLET_NAME=${options.name}`;
    const engine = getBlockletEngine(meta);
    const runCommand = engine.interpreter === 'bun' ? bunInterpreter : nodeInterpreter;
    runScript = /(npm|yarn|pnpm|bun)/g.test(nextOptions.script) ? nextOptions.script : runCommand;
  }

  const runScripts = ['preInstall', 'postInstall', 'preFlight', 'preStart', '--runScript--']
    .map((key) => {
      if (key === '--runScript--') {
        return overrideScript || runScript;
      }
      if (overrideScript) {
        return '';
      }
      return meta.scripts?.[key] || '';
    })
    .filter(Boolean);

  const diskSizeOption =
    nextOptions.env.BLOCKLET_DOCKER_DISK_SIZE !== '0g'
      ? `--storage-opt size=${nextOptions.env.BLOCKLET_DOCKER_DISK_SIZE}`
      : '';

  nextOptions.args = [];
  nextOptions.namespace = 'blocklets_docker';

  const targetDirs = new Set();

  const bindMounts = [
    {
      source: path.join(serverDir, 'blocklets'),
      target: path.join(baseDir, 'blocklets'),
      canEdit: false,
    },
    {
      source: nextOptions.env.BLOCKLET_APP_SHARE_DIR,
      target: dockerEnv.BLOCKLET_APP_SHARE_DIR,
      canEdit: false,
    },
    {
      source: path.join(nextOptions.env.BLOCKLET_APP_DATA_DIR, '.config'),
      target: path.join(dockerEnv.BLOCKLET_APP_DATA_DIR, '.config'),
      canEdit: false,
    },
    {
      source: path.join(nextOptions.env.BLOCKLET_APP_DATA_DIR, '.assets'),
      target: path.join(dockerEnv.BLOCKLET_APP_DATA_DIR, '.assets'),
      canEdit: false,
    },
    options.env.SHARE_DOCKER_APP_DATA_DIR
      ? {
          source: nextOptions.env.BLOCKLET_APP_DATA_DIR,
          target: dockerEnv.BLOCKLET_APP_DATA_DIR,
          canEdit: false,
        }
      : null,
    { source: nextOptions.env.BLOCKLET_APP_DIR, target: dockerEnv.BLOCKLET_APP_DIR, canEdit: true },
    { source: nextOptions.env.BLOCKLET_DATA_DIR, target: dockerEnv.BLOCKLET_DATA_DIR, canEdit: true },
    { source: nextOptions.env.BLOCKLET_LOG_DIR, target: dockerEnv.BLOCKLET_LOG_DIR, canEdit: true },
    { source: nextOptions.env.BLOCKLET_CACHE_DIR, target: dockerEnv.BLOCKLET_CACHE_DIR, canEdit: true },
    {
      source: path.join(nextOptions.env.BLOCKLET_APP_DIR, 'node_modules'),
      target: path.join(dockerEnv.BLOCKLET_APP_DIR, 'node_modules'),
      // 因为要共享 node_modules，而每个 node_modules 在 bin 和 pnpm 里都是硬链接, 编辑会有安全问题
      // 上个版本能编辑是因为每个组件的 pnpm-store 都是独立的, 但是这样也使得每个组件首次安装的时间无法得到优化, 只有二次启动时才能用到缓存
      canEdit: false,
    },
    {
      source: path.join(nextOptions.env.BLOCKLET_APP_DATA_DIR, '.projects'),
      target: path.join(dockerEnv.BLOCKLET_APP_DATA_DIR, '.projects'),
      canEdit: true,
    },
    {
      source: nextOptions.env.BLOCKLET_SHARE_DIR,
      target: dockerEnv.BLOCKLET_SHARE_DIR,
      canEdit: true,
    },
  ].filter((v) => {
    if (!v) {
      return false;
    }
    if (targetDirs.has(v.target)) {
      return false;
    }
    targetDirs.add(v.target);
    return true;
  });

  // Ensure necessary directories exist
  for (const bindMount of bindMounts) {
    if (!existsSync(bindMount.source)) {
      // eslint-disable-next-line no-await-in-loop
      mkdirpWithPermissions(bindMount.source);
    }
  }
  mkdirpWithPermissions(path.join(nextOptions.env.BLOCKLET_APP_DIR, 'node_modules'));

  // Construct volume arguments
  const volumes = bindMounts
    .map(({ source, target, canEdit }) => `-v ${source}:${target}:${canEdit ? 'rw' : 'ro'}`)
    .join(' ');

  await parseDockerCpVolume(name, nextOptions.env.BLOCKLET_DATA_DIR, dockerInfo);

  createScripts({
    rootCommands: [
      `echo "start ${meta.name} in docker: ${dockerInfo.network}, ${eventName || 'start'}"`,
      `mkdir -p ${baseDir} || :`,
      `mkdir -p ${path.join(baseDir, 'blocklets')} || :`,
      `mkdir -p ${dockerEnv.BLOCKLET_APP_DIR} || :`,
      `mkdir -p ${dockerEnv.BLOCKLET_APP_DATA_DIR} || :`,
      `mkdir -p ${dockerEnv.BLOCKLET_LOG_DIR} || :`,
      `mkdir -p ${dockerEnv.BLOCKLET_CACHE_DIR} || :`,
      `mkdir -p ${path.join(baseDir, '.npm')} || :`,
    ],
    name,
    userCommands: [`cd ${dockerEnv.BLOCKLET_APP_DIR}`, ...runScripts],
    baseDir,
    scriptDir: dockerTempDir,
  });

  let user = '';
  if (meta.docker?.image && !!meta.docker?.useUidGid) {
    user = `-u ${uid}:${gid}`;
  }

  nextOptions.script = `
  docker rm -f ${name} > /dev/null 2>&1 || true && \
  docker run --rm --name ${name} \
  ${user} \
  ${volumes} \
  ${dockerInfo.volumes || ''} \
  -v ${dockerTempDir}:${path.join(baseDir, 'dockerTemp')}:rw \
  ${diskSizeOption} \
  --cpus="${dockerEnv.BLOCKLET_DOCKER_CPUS}" \
  --memory="${dockerEnv.BLOCKLET_DOCKER_MEMORY}" \
  --memory-swap="${dockerEnv.BLOCKLET_DOCKER_MEMORY}" \
  --oom-kill-disable=false \
  --env-file ${dockerEnvFile} \
  ${tmpfsOption.tmpfs} \
  ${dockerInfo.network} \
  ${dockerInfo.runParamString || ''} \
  ${dockerInfo.image} ${dockerInfo.command || ''} \
  ${!dockerInfo.command && dockerInfo.runBaseScript ? `sh ${path.join(baseDir, 'dockerTemp', `root-script-${name}.sh`)}` : ''}
  `;

  nextOptions.exec_mode = 'fork_mode';
  nextOptions.env.dockerName = name;

  // 如果设置了 network 并且不是 internal，则需要连接 internal network
  if (dockerEnv.BLOCKLET_DOCKER_NETWORK && meta.egress === true) {
    nextOptions.env.connectInternalDockerNetwork = `docker network connect ${dockerNetworkName}-internal ${name}`;
  }

  if (process.env.DEBUG_BLOCKLET_DOCKER) {
    writeFileSync(path.join(dockerTempDir, `debug-docker-script-${name}.sh`), nextOptions.script, { mode: 0o755 });
    writeFileSync(
      path.join(dockerTempDir, `debug-docker-params-${name}.sh`),
      JSON.stringify(
        {
          options,
          nodeInfo,
          meta,
          ports,
          overrideScript,
          dockerNamePrefix,
          dockerNetworkName,
        },
        null,
        2
      ),
      { mode: 0o755 }
    );
  }

  if (meta.docker?.image) {
    await promiseSpawn(`docker pull ${meta.docker.image}`, {}, { timeout: 120 * 1000, retry: 0 });
  }

  delete nextOptions.instances;

  return nextOptions;
}

function mkdirpWithPermissions(dir, mode = 0o755) {
  try {
    fs.mkdirSync(dir, { recursive: true, mode });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

// 函数用于生成 root_script.sh 和 user_script.sh
function createScripts({ name, rootCommands, userCommands, scriptDir, baseDir }) {
  const userScriptPath = path.join(scriptDir, `user-script-${name}.sh`);
  const rootScriptPath = path.join(scriptDir, `root-script-${name}.sh`);
  const containerUserScriptPath = path.join(baseDir, 'dockerTemp', `user-script-${name}.sh`);
  // 生成 root_script.sh 内容
  const rootScriptContent = `
#!/bin/sh
${rootCommands.filter(Boolean).join('\n')}
sh ${containerUserScriptPath}
  `.trim();

  const userScriptContent = `
#!/bin/sh

${userCommands.filter(Boolean).join('\n')}
  `.trim();

  writeFileSync(rootScriptPath, rootScriptContent, { mode: 0o755 });
  writeFileSync(userScriptPath, userScriptContent, { mode: 0o755 });
}

function createClusterScripts({ appDir, scriptPath, instances }) {
  const clusterScriptPath = path.join(appDir, 'index-cluster.js');
  const rootScriptContent = generateClusterNodeScript(scriptPath, instances);
  writeFileSync(clusterScriptPath, rootScriptContent, { mode: 0o755 });
  return clusterScriptPath;
}

module.exports = parseDockerOptionsFromPm2;
