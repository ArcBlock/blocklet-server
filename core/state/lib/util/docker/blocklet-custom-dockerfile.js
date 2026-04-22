const path = require('path');
const fs = require('fs');
const md5 = require('@abtnode/util/lib/md5');
const { dockerArgsToCamelCase, isVolumePath } = require('@abtnode/docker-utils');
const debianDockerfile = require('./debian-dockerfile');
const debianChmodDockerfile = require('./debian-chmod-dockerfile');

function getBlockletCustomDockerfile({ appDir, dataDir, meta, ports, env, doChown = false }) {
  const dockerMeta = meta.docker || {};
  if (!dockerMeta.image && !dockerMeta.dockerfile) {
    return doChown ? debianChmodDockerfile : debianDockerfile;
  }
  let file = '';
  if (dockerMeta.dockerfile) {
    // 为了安全性, 默认不允许 build custom dockerfile
    if (!process.env.CAN_BUILD_DOCKER_FILE) {
      throw new Error('Cannot build dockerfile');
    }
    const dockerfilePath = path.join(appDir, dockerMeta.dockerfile);
    if (!fs.existsSync(dockerfilePath)) {
      throw new Error('Dockerfile not found');
    }
    file = fs.readFileSync(dockerfilePath, 'utf8').trim();
  }

  const hash = md5(file);
  let shell;
  if (dockerMeta.shell) {
    shell = dockerMeta.shell;
  } else if (/su-exec/.test(file)) {
    shell = 'su-exec';
  } else if (/gosu/.test(file)) {
    shell = 'gosu';
  } else {
    shell = 'sh';
  }
  const interfaceMeta = (meta.interfaces || [])
    .map((item) => (item.containerPort ? item : null))
    .filter((item) => item !== null);

  let baseDir = '/var/lib/blocklet';
  if (dockerMeta.workdir) {
    baseDir = dockerMeta.workdir;
  } else {
    const workDir = file.match(/WORKDIR\s+(.+)/)?.[1];
    if (workDir) {
      baseDir = workDir;
    }
  }

  const volumes = (dockerMeta.volume || [])
    .map((volume) => {
      if (!isVolumePath(volume)) {
        return ` -v ${dataDir}/${volume} `;
      }
      const [a, b] = volume.split(':');
      const hostDir = a.replace('$BLOCKLET_DATA_DIR', dataDir).replace('$BLOCKLET_APP_DIR', appDir);
      return ` -v ${hostDir}:${b} `;
    })
    .join('');

  let network = '';
  if (interfaceMeta.length > 0) {
    network = interfaceMeta
      .map((item) => {
        const port = ports[item.port];
        return port ? ` -p ${item.hostIP || '127.0.0.1'}:${port}:${item.containerPort}` : '';
      })
      .join('')
      .trim();
  }

  if (!network.length) {
    network = `--network ${dockerMeta.network || 'host'}`;
  }

  // 防止 dockerImage 和 docker args, dockerScript 会注入 -v 等命令
  const dockerArgs = [dockerMeta.command, dockerMeta.script, dockerMeta.image].filter(Boolean).join(' ');
  if (/(\s|^)-v\s/.test(dockerArgs)) {
    throw new Error('Detected forbidden volume mount (-v) in docker args');
  }

  const otherRunParams = {
    '--attach': dockerMeta.attach || '',
    '--quiet': dockerMeta.quiet || '',
    '--user': dockerMeta.user || '',
    '--workdir': dockerMeta.workdir || '',
    '--entrypoint': dockerMeta.entrypoint || '',
    '--cidfile': dockerMeta.cidfile || '',
    '--detach-keys': dockerMeta.detachKeys || '',
    '--disable-content-trust': dockerMeta.disableContentTrust || '',
    '--domainname': dockerMeta.domainname || '',
    '--expose': dockerMeta.expose || '',
    '--ip': dockerMeta.ip || '',
    '--link-local-ip': dockerMeta.linkLocalIp || '',
    '--platform': dockerMeta.platform || '',
  };
  Object.entries(otherRunParams).forEach(([key, value]) => {
    if (value === `$${dockerArgsToCamelCase(key)}`) {
      otherRunParams[key] = env[dockerArgsToCamelCase(key)] || '';
    }
  });

  const runParamString = Object.entries(otherRunParams)
    .filter(([, value]) => value !== '')
    .map(([key, value]) => `${key} ${value}`)
    .join(' ');

  return {
    dockerfile: file,
    image: dockerMeta.image || `blocklet_custom_${hash.slice(0, 16)}`,
    shell,
    baseDir,
    volumes,
    network,
    runBaseScript: !!dockerMeta.runBaseScript,
    command: dockerMeta.command || '',
    script: dockerMeta.script || dockerMeta.installNodeModules ? '' : 'tail -f /dev/null',
    installNodeModules: !!dockerMeta.installNodeModules,
    runParamString,
    dockerMeta,
  };
}

module.exports = getBlockletCustomDockerfile;
