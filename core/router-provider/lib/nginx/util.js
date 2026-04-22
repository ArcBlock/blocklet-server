/* eslint-disable no-underscore-dangle, global-require */

const os = require('os');
const path = require('path');
const tar = require('tar');
const fs = require('fs-extra');
const { NginxConfFile } = require('nginx-conf');
const shelljs = require('shelljs');
const findProcess = require('find-process');
const dayjs = require('@abtnode/util/lib/dayjs');
const { MAX_UPLOAD_FILE_SIZE, MAX_NGINX_WORKER_CONNECTIONS, ROUTER_CACHE_GROUPS } = require('@abtnode/constant');
const formatBackSlash = require('@abtnode/util/lib/format-back-slash');
const { deleteOldLogfiles } = require('@abtnode/logger');

const logger = require('@abtnode/logger')('router:nginx:util');

const MAX_WORKER_CONNECTIONS = process.env.MAX_NGINX_WORKER_CONNECTIONS
  ? Number(process.env.MAX_NGINX_WORKER_CONNECTIONS)
  : MAX_NGINX_WORKER_CONNECTIONS;
const CLIENT_MAX_BODY_SIZE = process.env.MAX_UPLOAD_FILE_SIZE || MAX_UPLOAD_FILE_SIZE;

const formatError = (errStr) => {
  if (!errStr) {
    return errStr;
  }

  const logLevels = ['warn', 'error', 'crit', 'alert', 'emerg'];
  const lines = errStr
    .split('\n')
    .map((line) => {
      const logLevel = logLevels.find((level) => line.indexOf(`[${level}]`) > 0);
      if (logLevel) {
        return line.split(`[${logLevel}]`).pop();
      }

      return null;
    })
    .filter(Boolean)
    .map((x) => x.trim());

  return Object.keys(
    lines.reduce((acc, line) => {
      acc[line] = true;
      return acc;
    }, {})
  ).join(';');
};

const addTestServer = ({ configPath, port, upstreamPort }) =>
  new Promise((resolve, reject) => {
    // eslint-disable-next-line consistent-return
    NginxConfFile.create(configPath, (err, conf) => {
      if (err) {
        return reject(err);
      }

      conf.nginx.http._addVerbatimBlock(
        'server',
        `
        listen ${port};

        location / {
          return 200 'Hello Blocklet Server!';
        }
    `
      );

      if (upstreamPort && os.platform() !== 'win32') {
        conf.nginx._addVerbatimBlock(
          'stream',
          `
        server {
            listen ${upstreamPort} udp;
            proxy_responses 1;
            proxy_timeout 1s;
            proxy_pass 127.0.0.1:${port};
        }
    `
        );
      }

      conf.on('flushed', () => resolve());
      conf.live(configPath);
      conf.flush();
    });
  });

const parseNginxConfigArgs = (confArgString) => {
  if (!confArgString) {
    return null;
  }

  const configsArray = confArgString
    .split(new RegExp(`\\s+|${os.EOL}`))
    .filter((s) => s.startsWith('--'))
    .map((x) => x.substr(2));

  return configsArray.reduce((acc, cur) => {
    const firstEqualCharIndex = cur.indexOf('=');
    if (firstEqualCharIndex < 0) {
      acc[cur] = '';
      return acc;
    }

    const key = cur.substring(0, firstEqualCharIndex);
    acc[key] = cur.substring(firstEqualCharIndex + 1).trim();

    return acc;
  }, {});
};

const getNginxLoadModuleDirectives = (requiredModules, configArgs) => {
  if (!Array.isArray(requiredModules) || requiredModules.length === 0) {
    return [];
  }

  const nginxLoadModuleDirectives = [];
  if (configArgs && configArgs['modules-path']) {
    requiredModules.forEach((m) => {
      if (configArgs[m.configName] === 'dynamic') {
        nginxLoadModuleDirectives.push(`load_module ${path.join(configArgs['modules-path'], m.moduleBinaryName)};`);
      }
    });
  }

  return nginxLoadModuleDirectives;
};

const getUserGroup = (username) => {
  if (!username) {
    throw new Error('username param is required');
  }

  const res = shelljs.exec(`id -g -n ${username}`, { silent: true });
  return res.stdout.trim();
};

const getWorkerConnectionCount = (maxWorkerConnections, workerProcess) => {
  const { stdout, code } = shelljs.exec('ulimit -n', { silent: true });
  if (code !== 0) {
    return maxWorkerConnections;
  }

  const ulimitStr = stdout.trim();
  // Handle 'unlimited' case which returns NaN when parsed
  if (ulimitStr === 'unlimited') {
    return maxWorkerConnections;
  }

  const ulimit = Number(ulimitStr);
  if (Number.isNaN(ulimit)) {
    return maxWorkerConnections;
  }

  return Math.min(maxWorkerConnections, Math.floor(ulimit / workerProcess));
};

const getDynamicModuleDirective = (moduleName, modulesPath) => {
  const mapping = {
    httpGeoip: ['ngx_http_geoip_module.so', 'ngx_stream_geoip_module.so'],
    httpBrotli: ['ngx_http_brotli_filter_module.so', 'ngx_http_brotli_static_module.so'],
  };

  return mapping[moduleName]
    .filter((x) => fs.existsSync(path.join(modulesPath, x)))
    .map((x) => `load_module ${modulesPath}/${x};`)
    .join(os.EOL);
};

const getDynamicModulesDirective = (capabilities) => {
  return Object.keys(capabilities)
    .filter((x) => capabilities[x] === 'dynamic')
    .map((x) => getDynamicModuleDirective(x, capabilities.modulesPath))
    .join(os.EOL);
};

const getCachePathDirective = (cacheDir, group) => {
  if (!ROUTER_CACHE_GROUPS[group]) {
    return '';
  }

  const config = ROUTER_CACHE_GROUPS[group];
  return `proxy_cache_path ${cacheDir}/${group} levels=1:2 keys_zone=${group}:${config.minSize} inactive=${config.period} max_size=${config.maxSize};`;
};

const getMainTemplate = ({
  logDir,
  tmpDir,
  cacheDir,
  nginxLoadModules = '',
  workerProcess,
  maxBodySize = CLIENT_MAX_BODY_SIZE,
  capabilities = {},
  proxyPolicy = {},
}) =>
  `${nginxLoadModules}
${getDynamicModulesDirective(capabilities)}
worker_processes  ${workerProcess};
worker_shutdown_timeout 30s;
error_log /dev/null crit;
user ${os.userInfo().username} ${getUserGroup(os.userInfo().username)};
pid nginx.pid;

events {
    worker_connections  ${getWorkerConnectionCount(MAX_WORKER_CONNECTIONS, workerProcess)};
    multi_accept on;
}

http {
    ${
      proxyPolicy?.enabled
        ? `${(proxyPolicy?.trustedProxies || ['0.0.0.0/0']).map((x) => `set_real_ip_from ${x};`).join(os.EOL)}
real_ip_header ${proxyPolicy?.realIpHeader || 'X-Forwarded-For'};
real_ip_recursive ${proxyPolicy?.trustRecursive ? 'on' : 'off'};`
        : ''
    }
    geo $access_blocked {
      default 0;
      include includes/blacklist;
    }
    geo $access_trusted {
      default 0;
      include includes/whitelist;
    }
    map $http_upgrade $connection_upgrade {
      default upgrade;
      '' "";
    }
    map $http_origin $has_multi_origin {
      default 0;
      ~*, 1;
    }

    client_body_temp_path ${path.join(tmpDir, 'client_body')};
    proxy_temp_path ${path.join(tmpDir, 'proxy')};
    fastcgi_temp_path ${path.join(tmpDir, 'fastcgi')};
    uwsgi_temp_path ${path.join(tmpDir, 'uwsgi')};
    scgi_temp_path ${path.join(tmpDir, 'scgi')};
    client_max_body_size ${maxBodySize}m;
    variables_hash_max_size 2048;
    variables_hash_bucket_size 128;

    absolute_redirect off;

    log_format compression '$remote_addr - $remote_user [$time_iso8601] $request_id '
                          '"$host" "$request" $status $body_bytes_sent '
                          '"$http_referer" "$http_user_agent" "${proxyPolicy?.enabled ? '$realip_remote_addr' : '$http_x_forwarded_for'}" '
                          'rt="$request_time" uid="$cookie_connected_did" uos="$cookie_connected_wallet_os" '
                          'uct="$upstream_connect_time" uht="$upstream_header_time" urt="$upstream_response_time"';
    access_log ${path.join(logDir, 'access.log')} compression;
    error_log ${path.join(logDir, 'error.log')} error;

    include includes/params;
    include includes/mime.types;
    include includes/compression;
    ${capabilities.httpBrotli ? 'include includes/brotli;' : ''}

    ${Object.keys(ROUTER_CACHE_GROUPS)
      .map((x) => getCachePathDirective(cacheDir, x))
      .join(os.EOL)}
}
`;

const getNginxStatus = async (configPath) => {
  const list = await findProcess('name', /nginx:/);
  const result = {
    managed: false,
    pid: 0,
    running: false,
  };

  if (list.length) {
    const abtnodeNginxProcess = list.find((x) => x.cmd.indexOf(configPath) > 0);
    result.running = true;

    if (abtnodeNginxProcess) {
      result.managed = true;
      result.pid = abtnodeNginxProcess.pid;
    }

    return result;
  }

  return result;
};

const compressFile = ({ sourceFile, targetFile, options = {} }) => {
  if (fs.existsSync(targetFile)) {
    fs.truncateSync(targetFile, 0);
    fs.rmSync(targetFile, { force: true });
  }

  const stream = tar.c(options, [sourceFile]).pipe(fs.createWriteStream(targetFile));
  return new Promise((resolve, reject) => {
    stream.on('error', (err) => reject(err));
    stream.on('finish', () => resolve(true));
  });
};

/**
 * rotate log files: access file and access log
 * refer: https://www.nginx.com/resources/wiki/start/topics/examples/logrotation/
 */
const rotateNginxLogFile = async ({ file, cwd, nginxPid, retain }) => {
  const dateStr = dayjs().subtract(1, 'days').format('YYYY-MM-DD');
  const uncompressedTargetLogfile = path.join(cwd, `${path.basename(file, '.log')}-${dateStr}.log`);
  const targetLogfile = path.join(cwd, `${path.basename(file, '.log')}-${dateStr}.log.gz`);

  if (fs.existsSync(file) && !fs.existsSync(targetLogfile)) {
    try {
      if (fs.existsSync(uncompressedTargetLogfile)) {
        fs.truncateSync(uncompressedTargetLogfile, 0);
        fs.rmSync(uncompressedTargetLogfile, { force: true });
      }

      fs.moveSync(file, uncompressedTargetLogfile);
      process.kill(nginxPid, 'SIGUSR1');

      await compressFile({
        sourceFile: path.basename(uncompressedTargetLogfile),
        targetFile: targetLogfile,
        options: { gzip: true, cwd },
      });

      logger.info(`log file ${targetLogfile} is rotated`);
    } catch (error) {
      throw new Error(error);
    } finally {
      if (fs.existsSync(uncompressedTargetLogfile)) {
        fs.truncateSync(uncompressedTargetLogfile, 0);
        fs.rmSync(uncompressedTargetLogfile, { force: true });
      }
    }
  }

  deleteOldLogfiles(file, retain);
};

const getMissingModules = (configParams) => {
  const requiredModules = {
    'with-http_realip_module': 'ngx_http_realip_module',
    'with-stream': 'ngx_stream_proxy_module',
    'with-http_ssl_module': 'ngx_http_ssl_module',
  };

  const missingModules = [];
  Object.keys(requiredModules).forEach((key) => {
    if (typeof configParams[key] === 'undefined') {
      missingModules.push(requiredModules[key]);
    }
  });

  return missingModules;
};

const getUpstreamName = (port) => `server_${port}`;

const joinNginxPath = (...args) => {
  const result = path.join(...args);
  return formatBackSlash(result);
};

module.exports = {
  addTestServer,
  formatError,
  getMainTemplate,
  getNginxLoadModuleDirectives,
  getMissingModules,
  parseNginxConfigArgs,
  getNginxStatus,
  rotateNginxLogFile,
  getUserGroup,
  getWorkerConnectionCount,
  getCachePathDirective,
  getDynamicModuleDirective,
  getDynamicModulesDirective,
  getUpstreamName,
  joinNginxPath,
  CLIENT_MAX_BODY_SIZE,
};
