const fs = require('fs-extra');
const path = require('path');
const http = require('http');
const shelljs = require('shelljs');
const get = require('lodash/get');
const omit = require('lodash/omit');
const sortBy = require('lodash/sortBy');
const objectHash = require('object-hash');
const promiseRetry = require('promise-retry');
const pm2 = require('@abtnode/util/lib/pm2/async-pm2');
const { PROCESS_NAME_ROUTER, DAEMON_MAX_MEM_LIMIT_IN_MB } = require('@abtnode/constant');

const logger = require('@abtnode/logger')('router:default:controller', { filename: 'engine' });

const BaseProvider = require('../base');
const {
  decideHttpPort,
  decideHttpsPort,
  getUsablePorts,
  get404Template,
  get502Template,
  get5xxTemplate,
  getWelcomeTemplate,
  formatRoutingTable,
} = require('../util');

class DefaultProvider extends BaseProvider {
  constructor({ configDir, httpPort, httpsPort, isTest }) {
    super('default');

    this.isTest = !!isTest;
    this.configDir = configDir;

    this.logDir = path.join(this.configDir, 'log');
    this.wwwDir = path.join(this.configDir, 'www');

    this.engineLog = path.join(this.logDir, 'engine.log'); // should be symbol link created by winston
    this.errorLog = path.join(this.logDir, 'engine-error.log'); // should be symbol link created by winston
    this.ctrlLog = path.join(this.logDir, 'controller.log'); // managed by pm2

    this.configPath = path.join(this.configDir, 'config.json');

    this.httpPort = decideHttpPort(httpPort);
    this.httpsPort = decideHttpsPort(httpsPort);

    // ensure directories
    [this.configDir, this.logDir, this.wwwDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        try {
          fs.mkdirSync(dir);
        } catch {
          // Do nothing
        }
      }
    });

    this.initialize();
  }

  // Services are not supported by default provider
  update({ routingTable = [], certificates = [], nodeInfo = {} } = {}) {
    this.info = nodeInfo;

    logger.info('update routing table');
    this._addWwwFiles(nodeInfo);
    const { sites: rawSites } = formatRoutingTable(routingTable);
    const sites = sortBy(rawSites, (x) => -x.domain.length);
    sites.forEach((site) => {
      site.rules.forEach((rule) => {
        // NOTE: we generate uniq hash from rule, because there are duplicate ruleId across different rules
        rule.id = objectHash(rule);
      });
    });

    fs.outputJSONSync(this.configPath, { sites, certificates, info: this.info }, { spaces: 2 });
  }

  async reload() {
    if (process.env.NODE_ENV === 'development') {
      return this.start();
    }

    // ensure daemon is live
    let [info] = await pm2.describeAsync(PROCESS_NAME_ROUTER);
    if (!info) {
      await this.start();
      [info] = await pm2.describeAsync(PROCESS_NAME_ROUTER);
      logger.info('start daemon because not running', omit(info, ['pm2_env']));
    } else {
      logger.info('daemon already running', omit(info, ['pm2_env']));
    }

    // send signal to daemon
    return new Promise((resolve) => {
      pm2.sendDataToProcessId(info.pm2_env.pm_id, { type: 'process:msg', data: 'reload', topic: 'reload' }, (err) => {
        if (err) {
          logger.error('failed to reload', { error: err });
        }

        resolve();
      });
    });
  }

  async start() {
    await pm2.startAsync({
      namespace: 'daemon',
      name: PROCESS_NAME_ROUTER,
      script: path.join(__dirname, 'daemon.js'),
      max_memory_restart: `${get(this.info, 'runtimeConfig.daemonMaxMemoryLimit', DAEMON_MAX_MEM_LIMIT_IN_MB)}M`,
      output: this.ctrlLog,
      error: this.ctrlLog,
      cwd: __dirname,
      max_restarts: 1,
      time: true,
      pmx: false,
      mergeLogs: true,
      execMode: 'fork', // Note: there are some issues with reloading when run in cluster mode
      env: {
        ABT_NODE_LOG_DIR: this.logDir, // Note: this tells logger module to write log to router log
        ABT_NODE_ROUTER_CONFIG: this.configPath,
        ABT_NODE_ROUTER_HTTP_PORT: this.httpPort,
        ABT_NODE_ROUTER_HTTPS_PORT: this.httpsPort,
      },
    });
  }

  async restart() {
    await pm2.restartAsync(PROCESS_NAME_ROUTER, { updateEnv: true });
  }

  async stop() {
    const [info] = await pm2.describeAsync(PROCESS_NAME_ROUTER);
    if (!info) {
      return null;
    }

    const proc = await pm2.deleteAsync(PROCESS_NAME_ROUTER);
    return proc;
  }

  initialize() {}

  validateConfig() {}

  rotateLogs() {}

  _addWwwFiles(nodeInfo) {
    const welcomePage = nodeInfo.enableWelcomePage ? getWelcomeTemplate(nodeInfo) : get404Template(nodeInfo);
    fs.writeFileSync(`${this.wwwDir}/index.html`, welcomePage); // disable index.html
    fs.writeFileSync(`${this.wwwDir}/404.html`, get404Template(nodeInfo));
    fs.writeFileSync(`${this.wwwDir}/502.html`, get502Template(nodeInfo));
    fs.writeFileSync(`${this.wwwDir}/5xx.html`, get5xxTemplate(nodeInfo));
    // 将 @abtnode/router-templates/lib/styles (font 相关样式) 复制到 www/router-template-styles 中
    fs.copySync(
      `${path.dirname(require.resolve('@abtnode/router-templates/package.json'))}/lib/styles`,
      `${this.wwwDir}/router-template-styles`
    );
  }

  getLogFilesForToday() {
    return {
      access: fs.realpathSync(this.engineLog),
      error: fs.realpathSync(this.errorLog),
    };
  }

  getLogDir() {
    return this.logDir;
  }

  searchCache() {
    return [];
  }

  clearCache() {
    return [];
  }
}

DefaultProvider.describe = async ({ configDir = '' } = {}) => {
  const meta = {
    name: 'default',
    description: 'Use default to provide a lightweight routing layer for development purpose',
  };

  try {
    // Use retry as a workaround for race-conditions between check and normal start
    const result = await promiseRetry((retry) => DefaultProvider.check({ configDir }).catch(retry), { retries: 3 });
    return { ...meta, ...result };
  } catch (err) {
    return { ...meta, error: err.message, available: false, running: false };
  }
};

const getRouterStatus = async (configDir) => {
  const result = {
    managed: false,
    pid: 0,
    running: false,
  };

  const [info] = await pm2.describeAsync(PROCESS_NAME_ROUTER);
  if (!info) {
    return result;
  }

  result.running = true;
  if (info.pm2_env.ABT_NODE_ROUTER_CONFIG.indexOf(configDir) > -1) {
    result.managed = true;
    result.pid = info.pid;
  }

  return result;
};

DefaultProvider.exists = () => true;
DefaultProvider.getStatus = getRouterStatus;
DefaultProvider.check = async ({ configDir = '' } = {}) => {
  logger.info('check default provider', { configDir });
  const binPath = shelljs.which('node').stdout;
  const result = {
    binPath,
    available: true,
    running: false,
    managed: false,
    error: '',
  };

  const status = await getRouterStatus(configDir);
  result.managed = status.managed;
  result.running = status.running;

  if (status.running && !status.managed) {
    result.available = false;
    result.error = 'Seems the default routing engine is running, please terminate the process before try again.';
  }

  return result;
};
DefaultProvider.version = '';

DefaultProvider.getUsablePorts = () =>
  getUsablePorts(
    'default',
    (port) =>
      new Promise((resolve) => {
        try {
          const server = http.createServer();

          server.once('error', () => {
            server.close();
            resolve(false);
          });

          server.listen(port, (err) => {
            server.close();
            resolve(!err);
          });
        } catch (err) {
          resolve(false);
        }
      })
  );

module.exports = DefaultProvider;
