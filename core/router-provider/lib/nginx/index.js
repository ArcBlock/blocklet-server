/* eslint-disable no-underscore-dangle, global-require */

const { NginxConfFile } = require('nginx-conf');
const fs = require('fs-extra');
const os = require('os');
const fg = require('fast-glob');
const semver = require('semver');
const path = require('path');
const shelljs = require('shelljs');
const kill = require('fkill');
const getPort = require('get-port');
const uniqBy = require('lodash/uniqBy');
const pick = require('lodash/pick');
const camelCase = require('lodash/camelCase');
const toLower = require('lodash/toLower');
const isEmpty = require('lodash/isEmpty');
const objectHash = require('object-hash');
const formatBackSlash = require('@abtnode/util/lib/format-back-slash');
const {
  ROUTING_RULE_TYPES,
  CONFIG_FOLDER_NAME,
  SLOT_FOR_IP_DNS_SITE,
  WELLKNOWN_SERVICE_PATH_PREFIX,
  USER_AVATAR_PATH_PREFIX,
  LOG_RETAIN_IN_DAYS,
  ROUTER_CACHE_GROUPS,
  GATEWAY_RATE_LIMIT_GLOBAL,
  GATEWAY_RATE_LIMIT,
  DOMAIN_FOR_IP_SITE_REGEXP,
  CSP_OFFICIAL_SOURCES,
  CSP_SYSTEM_SOURCES,
  CSP_THIRD_PARTY_SOURCES,
  CSP_ICONIFY_SOURCES,
  DEFAULT_WELLKNOWN_PORT,
} = require('@abtnode/constant');
const { toHex } = require('@ocap/util');
const promiseRetry = require('promise-retry');
const difference = require('lodash/difference');

const logger = require('@abtnode/logger')('router:nginx:controller');

const BaseProvider = require('../base');
const util = require('./util');

const {
  decideHttpPort,
  decideHttpsPort,
  getUsablePorts,
  get404Template,
  get502Template,
  get5xxTemplate,
  getWelcomeTemplate,
  trimEndSlash,
  concatPath,
  findCertificate,
  formatRoutingTable,
} = require('../util');

const getModSecurityConf = require('./templates/security/modsecurity.conf');
const getCoreRuleSetConf = require('./templates/security/crs4/crs-setup.conf');

const {
  addTestServer,
  formatError,
  getNginxLoadModuleDirectives,
  parseNginxConfigArgs,
  rotateNginxLogFile,
  getMissingModules,
  getMainTemplate,
  getUpstreamName,
  joinNginxPath,
  getDynamicModuleDirective,
  CLIENT_MAX_BODY_SIZE,
} = util;

const REQUIRED_MODULES = [{ configName: 'with-stream', moduleBinaryName: 'ngx_stream_module.so' }];

// convert wildcard domain and ipDnsDomain template to regex
const parseServerName = (domain, options = {}) => {
  const { captureSubdomain = false } = options;

  // ipDnsDomain template
  if (domain.includes(SLOT_FOR_IP_DNS_SITE)) {
    const name = domain.replace(/\./g, '\\.').replace(SLOT_FOR_IP_DNS_SITE, '\\d+-\\d+-\\d+-\\d+');
    return `~^${name}$`;
  }

  // wildcard domain
  if (domain.startsWith('*.')) {
    const name = domain.replace('*', '').replace(/\./g, '\\.');

    // For sub-service, capture subdomain as Nginx variable
    if (captureSubdomain) {
      return `~^(?<subdomain>.+)${name}$`;
    }

    // Default wildcard match (existing behavior)
    return `~.+${name}$`;
  }

  // Single domain - return as is
  return domain;
};

const getVersion = (nginxBinPath = '') => {
  let binPath = nginxBinPath;
  if (!binPath) {
    const whichNginx = shelljs.which('nginx');
    binPath = whichNginx ? whichNginx.toString() : '';
  }
  if (!binPath) {
    return '';
  }
  const result = shelljs.exec(`${binPath} -v`, { silent: true });
  let version = '';
  if (result.code === 0) {
    version = semver.coerce((result.stderr || result.stdout).split('/').pop())?.version || '';
  }
  return version;
};

class NginxProvider extends BaseProvider {
  /**
   * @param {object} options
   * @param {string} options.configDir
   * @param {number} options.httpPort
   * @param {number} options.httpsPort
   * @param {boolean} [options.cacheEnabled]
   * @param {boolean} [options.isTest]
   */
  constructor({ configDir, httpPort, httpsPort, cacheEnabled = true, isTest = false }) {
    super('nginx');
    if (!configDir) {
      throw new Error('invalid configDir');
    }

    const whichNginx = shelljs.which('nginx');
    if (whichNginx) {
      this.binPath = whichNginx.toString();
    } else {
      throw new Error('invalid nginx binPath');
    }

    this.isTest = !!isTest;
    this.configDir = configDir;
    this.logDir = path.join(this.configDir, 'log');
    this.accessLog = path.join(this.logDir, 'access.log');
    this.errorLog = path.join(this.logDir, 'error.log');
    this.securityLog = path.join(this.logDir, 'modsecurity.log');
    this.tmpDir = path.join(this.configDir, 'tmp');
    this.certDir = path.join(this.configDir, 'certs');
    this.sitesDir = path.join(this.configDir, 'sites');
    this.cacheDir = path.join(this.configDir, 'cache');
    this.includesDir = path.join(this.configDir, 'includes');
    this.wwwDir = path.join(this.configDir, 'www');

    this.configPath = path.join(this.configDir, 'nginx.conf');

    this.httpPort = decideHttpPort(httpPort);
    this.httpsPort = decideHttpsPort(httpsPort);
    this.cacheEnabled = !!cacheEnabled;

    this.capabilities = this._checkCapabilities();

    this.conf = null; // nginx `conf` object
    this.requestLimit = null;

    // Hash storage for incremental updates
    this.hashFilePath = path.join(this.configDir, 'config-hashes.json');
    this.configHashes = {
      global: null,
      blocklets: new Map(), // blockletDid -> hash
    };
    this._loadHashes();

    logger.info('nginx provider config', {
      configDir,
      httpPort: this.httpPort,
      httpsPort: this.httpsPort,
      cacheEnabled: this.cacheEnabled,
    });

    // ensure directories
    [this.configDir, this.logDir, this.cacheDir, this.tmpDir, this.certDir, this.sitesDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        try {
          fs.mkdirSync(dir, { recursive: true });
        } catch (error) {
          logger.error('mkdirSync error', { dir, error });
        }
      }
    });

    this._copyConfigFiles();
    this._ensureDhparam();
    this._ensureDaemonSecurityHeaders();
    this.updateProxyPolicy({ enabled: false });
    this.initialize();
  }

  getRelativeConfigDir(dir) {
    return path.relative(this.configDir, dir);
  }

  getConfTemplate(proxyPolicy) {
    return getMainTemplate({
      logDir: this.getRelativeConfigDir(formatBackSlash(this.logDir)),
      tmpDir: this.getRelativeConfigDir(formatBackSlash(this.tmpDir)),
      cacheDir: this.getRelativeConfigDir(formatBackSlash(this.cacheDir)),
      workerProcess: this.getWorkerProcess(),
      nginxLoadModules: getNginxLoadModuleDirectives(REQUIRED_MODULES, this.readNginxConfigParams()).join(os.EOL),
      capabilities: this.capabilities,
      proxyPolicy,
    });
  }

  // eslint-disable-next-line require-await
  async update({
    routingTable = [],
    certificates = [],
    commonHeaders,
    services = [],
    nodeInfo = {},
    requestLimit,
    blockPolicy,
    proxyPolicy,
    wafPolicy,
    cacheEnabled,
    wafDisabledBlocklets = [],
    noIndexOverrides = {},
    enableDefaultServer = false,
    enableIpServer = false,
    skipBlockletSites = false,
  } = {}) {
    const effectiveCommonHeaders = process.env.ABT_NODE_NO_INDEX
      ? { ...(commonHeaders || {}), 'X-Robots-Tag': '"noindex, nofollow"' }
      : commonHeaders;

    logger.info('update nginx config', {
      enableDefaultServer,
      enableIpServer,
      cacheEnabled,
      skipBlockletSites,
    });

    if (!Array.isArray(routingTable)) {
      throw new Error('routingTable must be an array');
    }

    if (typeof cacheEnabled !== 'undefined') {
      this.cacheEnabled = !!cacheEnabled;
    }

    this._addWwwFiles(nodeInfo);

    // eslint-disable-next-line consistent-return
    return new Promise((resolve, reject) => {
      const confTemplate = this.getConfTemplate(proxyPolicy);

      NginxConfFile.createFromSource(confTemplate, async (err, conf) => {
        if (err) {
          logger.error('createFromSource error', { err });
          reject(new Error(err.message));
          return;
        }

        try {
          this.conf = conf;

          conf.on('flushed', () => resolve());
          conf.live(this.configPath);

          const { sites } = formatRoutingTable(routingTable);

          // Cache zones are now defined statically in the main template (blockletProxy)
          // No need to add per-blocklet cache zones dynamically
          conf.nginx.http._add('server_tokens', 'off');
          this._addCommonResHeaders(conf.nginx.http, effectiveCommonHeaders);
          this._addExposeServices(conf, services);

          if (requestLimit) {
            this.requestLimit = requestLimit;
            this.addRequestLimiting(conf.nginx.http, requestLimit);
          }
          if (blockPolicy) {
            this.updateBlacklist(blockPolicy.enabled ? blockPolicy.blacklist : []);
          } else {
            this.updateBlacklist([]);
          }

          this.updateWhitelist();

          this.updateProxyPolicy(proxyPolicy);

          const allRules = sites.reduce((acc, site) => {
            acc.push(...(site.rules || []));
            return acc;
          }, []);

          this.ensureUpstreamServers(allRules);

          this._addModSecurity(conf, wafPolicy, wafDisabledBlocklets);

          // Group sites by blockletDid for separate conf files
          const blockletSitesMap = new Map(); // blockletDid -> sites[]
          const systemSites = []; // sites without blockletDid

          // eslint-disable-next-line no-restricted-syntax
          for (const site of sites) {
            if (site.blockletDid && site.blockletDid !== nodeInfo.did) {
              if (!blockletSitesMap.has(site.blockletDid)) {
                blockletSitesMap.set(site.blockletDid, []);
              }
              blockletSitesMap.get(site.blockletDid).push(site);
            } else {
              systemSites.push(site);
            }
          }

          // Process system sites in main conf
          // eslint-disable-next-line no-restricted-syntax
          for (const site of systemSites) {
            const { domain, port, rules, blockletDid, type } = site;
            const certificate = findCertificate(certificates, domain);

            // For sub-service sites, enable subdomain capture in server_name
            const parsedServerName = parseServerName(domain, {
              captureSubdomain: type === ROUTING_RULE_TYPES.SUB_SERVICE,
            });
            if (!parsedServerName) {
              logger.warn('invalid site, empty server name:', { site: JSON.stringify(site), domain, parsedServerName });
              // eslint-disable-next-line no-continue
              continue;
            }

            if (certificate) {
              // HTTPS configurations
              // update all certs to disk
              certificates.forEach((item) => {
                const crtPath = `${path.join(this.certDir, item.domain.replace('*', '-'))}.crt`;
                const keyPath = `${path.join(this.certDir, item.domain.replace('*', '-'))}.key`;
                fs.writeFileSync(crtPath, item.certificate);
                fs.writeFileSync(keyPath, item.privateKey);
              });

              // if match certificate, then add https server
              this._addHttpsServer({
                conf,
                serviceType: site.serviceType,
                locations: rules,
                certificateFileName: certificate.domain,
                serverName: parsedServerName,
                daemonPort: nodeInfo.port,
                commonHeaders: effectiveCommonHeaders,
                blockletDid,
              });
            } else {
              this._addHttpServer({
                conf,
                serviceType: site.serviceType,
                locations: rules,
                serverName: parsedServerName,
                port,
                daemonPort: nodeInfo.port,
                commonHeaders: effectiveCommonHeaders,
                blockletDid,
              });
            }
          }

          // Clean up old site conf files and generate new ones (skip when skipBlockletSites is true)
          if (!skipBlockletSites) {
            this._cleanupSiteConfFiles([...blockletSitesMap.keys()]);

            // Generate separate conf files for each blocklet
            const blockletConfPromises = [...blockletSitesMap.entries()].map(([blockletDid, blockletSites]) => {
              const blockletHeaders = this._getEffectiveCommonHeaders(
                effectiveCommonHeaders,
                blockletDid,
                noIndexOverrides
              );
              return this._generateBlockletSiteConfFile({
                blockletDid,
                sites: blockletSites,
                certificates,
                nodeInfo,
                commonHeaders: blockletHeaders,
              });
            });
            await Promise.all(blockletConfPromises);
          }

          conf.nginx.http._add('include', `${this.getRelativeConfigDir(this.sitesDir)}/*.conf`);

          if (!enableIpServer) {
            this._addIpBlackHoleServer(conf);
            logger.info('add ip blackhole server success');
          }

          if (process.env.ABT_NODE_DOMAIN_BLACKLIST) {
            this._addUnknownHostBlackHoleServer(conf, process.env.ABT_NODE_DOMAIN_BLACKLIST);
            logger.info('add unknown host blacklist server success');
          }

          if (enableDefaultServer) {
            const existDefaultServer = !!sites.find((x) => x.domain === '_');
            if (existDefaultServer) {
              logger.info('default server is declared by blocklet server');
            } else {
              this._addDefaultServer(conf, nodeInfo.port);
              logger.info('add default server success');
            }
          } else {
            this._addDefaultBlackHoleServer(conf);
            logger.info('add default blackhole server success');
          }

          this._addStubStatusLocation(conf);

          // Compute and save hashes for incremental updates
          this._updateHashesAfterFullRegeneration({
            nodeInfo,
            requestLimit,
            blockPolicy,
            proxyPolicy,
            wafPolicy,
            cacheEnabled,
            enableDefaultServer,
            enableIpServer,
            certificates,
            services,
            systemSites,
            blockletSitesMap,
            wafDisabledBlocklets,
            skipBlockletSites,
          });

          conf.flush();
        } catch (error) {
          logger.error('update nginx config error', { error });
          reject(error);
        }
      });
    });
  }

  /**
   * Update hashes after a full regeneration
   * @private
   */
  _updateHashesAfterFullRegeneration(params) {
    const {
      nodeInfo,
      requestLimit,
      blockPolicy,
      proxyPolicy,
      wafPolicy,
      cacheEnabled,
      enableDefaultServer,
      enableIpServer,
      certificates,
      services,
      systemSites,
      blockletSitesMap,
      wafDisabledBlocklets,
      skipBlockletSites = false,
    } = params;

    // Compute and store global hash
    this.configHashes.global = this._computeGlobalConfigHash({
      nodeInfo,
      requestLimit,
      blockPolicy,
      proxyPolicy,
      wafPolicy,
      cacheEnabled,
      enableDefaultServer,
      enableIpServer,
      certificates,
      services,
      systemSites,
    });

    // Compute and store hashes for each blocklet (skip when skipBlockletSites is true)
    if (!skipBlockletSites) {
      this.configHashes.blocklets.clear();
      // eslint-disable-next-line no-restricted-syntax
      for (const [did, blockletSites] of blockletSitesMap) {
        const wafDisabled = wafDisabledBlocklets.some((b) => b.did === did);
        const hash = this._computeBlockletConfigHash(did, blockletSites, certificates, wafDisabled);
        this.configHashes.blocklets.set(did, hash);
      }
    }

    // Persist to disk
    this._saveHashes();

    logger.info('updated hashes after full regeneration', {
      global: this.configHashes.global?.substring(0, 8),
      blockletCount: this.configHashes.blocklets.size,
    });
  }

  /**
   * Clean up old site conf files that are no longer needed
   * @param {string[]} keepDids - list of blockletDids to keep
   */
  _cleanupSiteConfFiles(keepDids = []) {
    try {
      if (!fs.existsSync(this.sitesDir)) {
        return;
      }
      const existingFiles = fs.readdirSync(this.sitesDir).filter((f) => f.endsWith('.conf'));
      // eslint-disable-next-line no-restricted-syntax
      for (const file of existingFiles) {
        const did = file.replace('.conf', '');
        if (!keepDids.includes(did)) {
          fs.unlinkSync(path.join(this.sitesDir, file));
          logger.info('removed old site conf file', { file });
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup site conf files', { error });
    }
  }

  /**
   * Generate a separate nginx conf file for a blocklet's server blocks
   * @param {object} options
   * @param {string} options.blockletDid - the blocklet DID
   * @param {Array} options.sites - sites belonging to this blocklet
   * @param {Array} options.certificates - available certificates
   * @param {object} options.nodeInfo - node info containing daemonPort
   * @param {object} options.commonHeaders - common response headers
   */
  // eslint-disable-next-line require-await
  async _generateBlockletSiteConfFile({ blockletDid, sites, certificates, nodeInfo, commonHeaders }) {
    const confPath = path.join(this.sitesDir, `${blockletDid}.conf`);
    // Minimal template with http block - we'll extract just the server blocks
    const template = 'events {}\nhttp {}\n';

    return new Promise((resolve, reject) => {
      NginxConfFile.createFromSource(template, (err, conf) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          // eslint-disable-next-line no-restricted-syntax
          for (const site of sites) {
            const { domain, rules, port, serviceType, type } = site;
            const certificate = findCertificate(certificates, domain);

            // For sub-service sites, enable subdomain capture in server_name
            const parsedServerName = parseServerName(domain, {
              captureSubdomain: type === ROUTING_RULE_TYPES.SUB_SERVICE,
            });

            if (!parsedServerName) {
              logger.warn('invalid site, empty server name:', { site: JSON.stringify(site), domain, parsedServerName });
              // eslint-disable-next-line no-continue
              continue;
            }

            if (certificate) {
              // Write certificates to disk
              certificates.forEach((item) => {
                const crtPath = `${path.join(this.certDir, item.domain.replace('*', '-'))}.crt`;
                const keyPath = `${path.join(this.certDir, item.domain.replace('*', '-'))}.key`;
                fs.writeFileSync(crtPath, item.certificate);
                fs.writeFileSync(keyPath, item.privateKey);
              });

              this._addHttpsServer({
                conf,
                serviceType,
                locations: rules,
                certificateFileName: certificate.domain,
                serverName: parsedServerName,
                daemonPort: nodeInfo.port,
                commonHeaders,
                blockletDid,
              });
            } else {
              this._addHttpServer({
                conf,
                serviceType,
                locations: rules,
                serverName: parsedServerName,
                port,
                daemonPort: nodeInfo.port,
                commonHeaders,
                blockletDid,
              });
            }
          }

          // Extract server blocks from http { } wrapper
          const fullConfText = conf.toString();
          const serverBlocksMatch = fullConfText.match(/http\s*\{([\s\S]*)\}/);
          const serverBlocks = serverBlocksMatch?.[1]?.trim() || '';

          if (serverBlocks) {
            fs.writeFileSync(confPath, serverBlocks);
            logger.info('generated blocklet site conf', { blockletDid, confPath });
          }

          resolve();
        } catch (error) {
          logger.error('Failed to generate blocklet site conf', { blockletDid, error });
          reject(error);
        }
      });
    });
  }

  async reload() {
    const nginxStatus = await util.getNginxStatus(this.configPath);
    if (nginxStatus.managed) {
      try {
        const result = this._exec('reload');
        logger.info('reload:reload', { result: result.stdout, command: 'reload' });

        return result;
      } catch (error) {
        // If reload fails (e.g., PID file not found), try to start nginx instead
        logger.warn('reload failed, trying to start nginx', { error });
        const result = this._exec();
        logger.info('reload:fallback-start', { result: result.stdout });
        return result;
      }
    }

    const result = this._exec();
    logger.info('reload:start', { result: result.stdout });
    return result;
  }

  start() {
    logger.info('start');
    return this.reload();
  }

  restart() {
    logger.info('restart');
    return this.reload();
  }

  stop() {
    logger.info('stop');

    return this._exec('stop');
  }

  // FIXME: 这个函数可以不暴露出去？
  initialize() {
    if (!fs.existsSync(this.configPath)) {
      fs.writeFileSync(this.configPath, this.getConfTemplate());
    }
  }

  // eslint-disable-next-line require-await
  async validateConfig() {
    const command = `${this.binPath} -t -c ${this.configPath} -p ${this.configDir}`; // eslint-disable-line no-param-reassign
    const result = shelljs.exec(command, { silent: true });

    if (result.code !== 0) {
      logger.error(`exec ${command} error`, {
        binPath: this.binPath,
        configPath: this.configPath,
        configDir: this.configDir,
        errorMessage: result.stderr,
        code: result.code,
      });
      throw new Error(`${formatError(result.stderr)}`);
    }
  }

  async rotateLogs({ retain = LOG_RETAIN_IN_DAYS } = {}) {
    const nginxStatus = await util.getNginxStatus(this.configDir);
    if (!nginxStatus.managed) {
      logger.warn('nginx is not running');
      return;
    }

    logger.info('start rotate nginx log files');
    const files = [this.accessLog, this.errorLog, this.securityLog];
    const rotateTasks = files.map(
      (file) => rotateNginxLogFile({ file, nginxPid: nginxStatus.pid, cwd: this.logDir, retain })
      // eslint-disable-next-line function-paren-newline
    );
    await Promise.all(rotateTasks);
    logger.info('rotate nginx log files finished');
  }

  /**
   * execute nginx command, default is to start nginx
   * @param {string} param param of nginx -s {param}
   */
  _exec(param = '') {
    logger.info('exec', { param });
    let command = `${this.binPath} -c ${this.configPath} -p ${formatBackSlash(this.configDir)}`; // eslint-disable-line no-param-reassign
    if (param) {
      command = `${command} -s ${param}`;
    }

    logger.info('exec command:', { command });

    const result = shelljs.exec(command, { silent: true });
    if (result.code !== 0) {
      logger.error(`exec ${command} error`, { error: result.stderr });
      throw new Error(`exec ${command} error: ${formatError(result.stderr)}`);
    }

    return result;
  }

  _checkCapabilities() {
    const config = this.readNginxConfigParams();

    const capabilities = ['http_v2', 'http_geoip', 'http_stub_status'].reduce((acc, key) => {
      const arg = `with-${key}_module`;
      const capability = camelCase(key);

      if (config[arg] === '') {
        acc[capability] = 'static';
      } else if (config[arg] === 'dynamic') {
        acc[capability] = 'dynamic';
      } else {
        acc[capability] = false;
      }

      return acc;
    }, {});

    capabilities.modulesPath = config['modules-path'] || process.env.NGINX_MODULES_PATH || '';
    if (capabilities.modulesPath && getDynamicModuleDirective('httpBrotli', capabilities.modulesPath)) {
      capabilities.httpBrotli = 'dynamic';
    } else {
      capabilities.httpBrotli = false;
    }

    if (config['add-module']) {
      const modulePaths = Array.isArray(config['add-module']) ? config['add-module'] : [config['add-module']];
      capabilities.modsecurity = modulePaths.some((x) => toLower(x).includes('modsecurity'));
    }

    const version = getVersion(this.binPath);
    if (version) {
      capabilities.version = version;
    }

    return capabilities;
  }

  readNginxConfigParams() {
    const result = shelljs.exec(`${this.binPath} -V`, { silent: true });

    if (result.code !== 0) {
      logger.error('read nginx configure arguments error', result);
      throw new Error(`read nginx configure arguments error: ${formatError(result.stderr)}`);
    }

    const stdOutResult = parseNginxConfigArgs(result.stdout);
    if (!isEmpty(stdOutResult)) {
      return stdOutResult;
    }

    // 很奇怪，在 amazon linux 上信息会出现在 stderr 里
    return parseNginxConfigArgs(result.stderr);
  }

  _addReverseProxy(args) {
    const { type } = args;

    if (type === ROUTING_RULE_TYPES.REDIRECT) {
      this._addRedirectTypeLocation(args);
      return;
    }

    if (type === ROUTING_RULE_TYPES.GENERAL_REWRITE) {
      this._addRewriteTypeLocation(args);
      return;
    }

    if (type === ROUTING_RULE_TYPES.GENERAL_PROXY) {
      this._addGeneralProxyLocation(args);
      return;
    }

    if (type === ROUTING_RULE_TYPES.DIRECT_RESPONSE) {
      this._addDirectResponseLocation(args);
      return;
    }

    if (type === ROUTING_RULE_TYPES.NONE) {
      this._addNotFoundLocation(args);
      return;
    }

    // Check for sub-service type (dynamic subdomain static serving)
    if (type === ROUTING_RULE_TYPES.SUB_SERVICE) {
      this._addSubServiceLocation(args);
      return;
    }

    // Check for static serving (public static blocklets served directly by Nginx)
    if (type === ROUTING_RULE_TYPES.BLOCKLET && args.staticRoot) {
      this._addStaticLocation(args);
      return;
    }

    this._addBlockletTypeLocation(args);
  }

  addUpstreamServer(port, keepalive = '2') {
    this.conf.nginx.http._add('upstream', getUpstreamName(port));
    const upstream = this.conf.nginx.http.upstream.length
      ? this.conf.nginx.http.upstream[this.conf.nginx.http.upstream.length - 1]
      : this.conf.nginx.http.upstream;

    upstream._add('server', `127.0.0.1:${port} max_fails=1 fail_timeout=2s`);
    upstream._add('keepalive', keepalive);
  }

  ensureUpstreamServers(rules) {
    const upstreamMap = new Map();

    const servicePort = process.env.ABT_NODE_SERVICE_PORT;

    if (!upstreamMap.has(servicePort)) {
      this.addUpstreamServer(servicePort, '16');
      upstreamMap.set(servicePort, 1);
    }

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];

      if (
        [ROUTING_RULE_TYPES.DAEMON, ROUTING_RULE_TYPES.SERVICE].includes(rule.type) &&
        rule.port &&
        !upstreamMap.has(String(rule.port))
      ) {
        this.addUpstreamServer(rule.port, '16');
        upstreamMap.set(String(rule.port), 1);
      } else if (rule.port === DEFAULT_WELLKNOWN_PORT && !upstreamMap.has(String(rule.port))) {
        this.addUpstreamServer(rule.port, '16');
        upstreamMap.set(String(rule.port), 1);
      }
    }
  }

  _addSecurityHeaders(location, serviceType) {
    if (serviceType === 'daemon') {
      if (fs.existsSync(path.join(this.includesDir, 'daemon', 'security'))) {
        location._add('include', 'includes/daemon/security');
      }

      location._add('include', 'includes/daemon/ssl');
    }
  }

  /**
   * Returns:
   * server /flash/ {
   *     rewrite ^/flash/(.*) /$1  break;
   *     proxy_pass http://127.0.0.1:8090;
   * }
   */
  _addBlockletTypeLocation({
    server,
    port,
    root,
    prefix,
    groupPrefix,
    suffix,
    did,
    componentId,
    target,
    targetPrefix, // used to strip prefix from target
    ruleId,
    type,
    proxyBehavior,
    cacheGroup,
    pageGroup,
    serviceType,
    commonHeaders,
  }) {
    server._add('location', concatPath(prefix, suffix, root));

    const location = this._getLastLocation(server);

    if (!cacheGroup && !suffix) {
      this._addTailSlashRedirection(location, prefix); // Note: 末尾 "/" 的重定向要放在 CORS(OPTIONS) 响应之后, 这样不会影响 OPTIONS 的响应
    }

    if (did) {
      location._add('proxy_set_header', `X-Blocklet-Did "${did}"`);
      if (componentId) {
        location._add('proxy_set_header', `X-Blocklet-Component-Id "${componentId}"`);
      }
    }

    location._add('include', 'includes/proxy');
    if (pageGroup) {
      location._add('proxy_set_header', `X-Page-Group "${pageGroup}"`);
    }

    // kill cache
    if (this.cacheEnabled === false) {
      location._add('expires', '-1');
    } else if (cacheGroup) {
      location._add('proxy_cache', cacheGroup);
      location._add('proxy_cache_valid', `200 ${ROUTER_CACHE_GROUPS.blockletProxy.period}`);
      location._add('include', 'includes/cache');
      // includes/cache adds add_header (X-Cache-Status), which breaks nginx's server-level
      // add_header inheritance. Re-add common headers at location level to ensure they're present.
      this._addCommonResHeaders(location, commonHeaders);
    }

    this._addSecurityHeaders(location, serviceType);

    // Redirect blocklet traffic
    if (type === ROUTING_RULE_TYPES.BLOCKLET) {
      // FIXME: logic related to server gateway should not in provider
      let rewritePathPrefix = prefix.replace(WELLKNOWN_SERVICE_PATH_PREFIX, '').replace(USER_AVATAR_PATH_PREFIX, '');

      // Add header
      if (targetPrefix) {
        rewritePathPrefix = rewritePathPrefix.replace(targetPrefix, '');
      }

      location._add('proxy_set_header', `X-Path-Prefix "${rewritePathPrefix}"`);
      if (groupPrefix) {
        location._add('proxy_set_header', `X-Group-Path-Prefix "${groupPrefix}"`);
      }

      if (ruleId) {
        location._add('proxy_set_header', `X-Routing-Rule-Id "${ruleId}"`);
      }

      if (target && target !== '/') {
        location._add('proxy_set_header', `X-Routing-Rule-Path-Prefix "${target}"`);
      }

      // Rewrite path
      location._add('rewrite', `^${rewritePathPrefix}/?(.*) /$1  break`);
      if (proxyBehavior === 'direct') {
        location._add('proxy_pass', `http://127.0.0.1:${port}`);
      } else {
        location._add('proxy_pass', `http://${getUpstreamName(process.env.ABT_NODE_SERVICE_PORT)}`);
      }

      return;
    }

    // Redirect daemon traffic
    location._add('proxy_set_header', `X-Path-Prefix "${prefix}"`);
    if (!suffix && prefix !== target) {
      location._add('rewrite', `^${prefix}/?(.*) ${`${target}/`.replace(/\/\//g, '/')}$1  break`);
    }

    if (port === DEFAULT_WELLKNOWN_PORT) {
      location._add('proxy_pass', `http://${getUpstreamName(port)}`);
    } else {
      location._add('proxy_pass', `http://127.0.0.1:${port}`);
    }
  }

  /**
   * Add a static location block for serving files directly from Nginx
   * Used for public static blocklets to bypass blocklet-service
   *
   * Generated config:
   * location /app-path {
   *     alias /path/to/static/files/;
   *     try_files $uri $uri/ /app-path/index.html;
   *     add_header Cache-Control "no-cache";
   * }
   */
  _addStaticLocation({ server, prefix, staticRoot, commonHeaders, serviceType }) {
    server._add('location', prefix);
    const location = this._getLastLocation(server);

    // Serve static files from blocklet directory
    // Use alias to map the location to the static root directory
    location._add('alias', `${staticRoot}/`);

    // SPA fallback - try file, then directory, then fallback to index.html
    // For paths like /app-path/some/route, if no file exists, serve index.html
    location._add('try_files', `$uri $uri/ ${prefix === '/' ? '' : prefix}/index.html`);

    // Cache control: use negotiated caching (ETag/Last-Modified) to ensure updates are reflected immediately
    location._add('add_header', 'Cache-Control "no-cache"');

    // Security headers
    location._add('add_header', 'X-Content-Type-Options "nosniff"');

    // Add common response headers
    this._addCommonResHeaders(location, commonHeaders);
    this._addSecurityHeaders(location, serviceType);
  }

  _addSubServiceLocation({ server, prefix, staticRoot, serverName, commonHeaders, serviceType }) {
    // Check if this is a wildcard domain (starts with *.）
    // For wildcard domains: use $subdomain variable from server_name regex capture
    // For single domains: serve files directly from staticRoot
    const isWildcardDomain = serverName && serverName.includes('(?<subdomain>.+)');

    if (isWildcardDomain) {
      // For wildcard sub-service, use root with $subdomain variable
      // The $subdomain variable comes from server_name ~^(?<subdomain>.+)\.domain$
      server._add('root', `${staticRoot}/$subdomain`);
    } else {
      // For single domain sub-service, serve files directly from staticRoot
      server._add('root', staticRoot);
    }

    server._add('location', prefix);
    const location = this._getLastLocation(server);

    // Static site support: try exact file, then with .html extension, then directory, then SPA fallback
    location._add('try_files', '$uri $uri.html $uri/ /index.html =404');

    // Cache control: use negotiated caching (ETag/Last-Modified) to ensure updates are reflected immediately
    location._add('add_header', 'Cache-Control "no-cache"');

    // Security headers
    location._add('add_header', 'X-Content-Type-Options "nosniff"');

    // Add common response headers
    this._addCommonResHeaders(location, commonHeaders);
    this._addSecurityHeaders(location, serviceType);
  }

  _addRedirectTypeLocation({
    server,
    url,
    redirectCode,
    prefix,
    suffix,
    serviceType,
    preservePath = true,
    preserveQuery = true,
  }) {
    const cleanUrl = trimEndSlash(url);
    server._add('location', `${concatPath(prefix, suffix)}`);
    const location = this._getLastLocation(server);

    // always allow cors here since we are doing a redirect
    location._add('include', 'includes/cors');
    this._addSecurityHeaders(location, serviceType);

    // Case 1: no path, no query → redirect to target URL directly
    if (!preservePath && !preserveQuery) {
      location._add('return', `${redirectCode} ${cleanUrl}`);
      return;
    }

    // Prepare query string variable when needed
    if (preserveQuery) {
      location._add('set $abt_query_string', '""');
      location._addVerbatimBlock('if ($query_string)', 'set $abt_query_string "?$query_string";');
    }

    // Case 2: no path, keep query
    if (!preservePath && preserveQuery) {
      location._add('return', `${redirectCode} ${cleanUrl}$abt_query_string`);
      return;
    }

    // Case 3 & 4: keep path (with or without query)
    // $request_uri includes both path and query, $uri includes only path
    if (prefix === '/') {
      if (preserveQuery) {
        // 如果 prefix 是根路径，则不需要重写，直接将当前的请求附加到设置的重定向地址后面
        location._add('return', `${redirectCode} ${cleanUrl}$request_uri`);
      } else {
        location._add('return', `${redirectCode} ${cleanUrl}$uri`);
      }
    } else {
      const querySuffix = preserveQuery ? '$abt_query_string' : '';
      // 如果当前请求的 path 和 prefix 一样，则不需要重写，直接返回重定向地址就可以了
      location._addVerbatimBlock(`if ($uri = ${prefix})`, `return ${redirectCode} ${cleanUrl}${querySuffix};`);
      // 将当前请求中的 prefix 去掉，然后拼接对应的重定地址
      location._add('rewrite', `^${prefix}(.*) $1`);
      location._add('return', `${redirectCode} ${cleanUrl === '/' ? '' : cleanUrl}$1${querySuffix}`);
    }
  }

  _addRewriteTypeLocation({ server, url, prefix, suffix, serviceType }) {
    server._add('location', concatPath(prefix, suffix));
    const location = this._getLastLocation(server);

    this._addSecurityHeaders(location, serviceType);
    location._add('rewrite', `^${prefix}(.*) ${url}$1 last`);
  }

  _addNotFoundLocation({ server, prefix, suffix, serviceType }) {
    server._add('location', concatPath(prefix, suffix));
    const location = this._getLastLocation(server);

    this._addSecurityHeaders(location, serviceType);
    this._addTailSlashRedirection(location, prefix);
    location._add('try_files', '$uri /404.html break');
  }

  _addGeneralProxyLocation({ server, port, prefix, suffix, blockletDid, targetPrefix, serviceType }) {
    server._add('location', concatPath(prefix, suffix));
    const location = this._getLastLocation(server);
    this._addCommonHeader(location);
    this._addSecurityHeaders(location, serviceType);
    location._add('include', 'includes/proxy');
    if (blockletDid) {
      location._add('proxy_set_header', `X-Blocklet-Did ${blockletDid}`);
    }

    if (targetPrefix && targetPrefix !== '/') {
      location._add('rewrite', `^${targetPrefix}/?(.*) /$1  break`);
    }

    if (port === DEFAULT_WELLKNOWN_PORT) {
      location._add('proxy_pass', `http://${getUpstreamName(port)}`);
    } else {
      location._add('proxy_pass', `http://127.0.0.1:${port}`);
    }
  }

  _addDirectResponseLocation({ server, response, prefix, suffix }) {
    server._add('location', concatPath(prefix, suffix));
    const location = this._getLastLocation(server);
    this._addCommonHeader(location);
    if (response.contentType) {
      location._add('default_type', response.contentType);
    }

    location._add('return', `${response.status} "${response.body}"`);
  }

  /**
   * The main purpose is to add a slash(/) suffix to the address.
   * @param {object} location nginx-conf location object
   * @param {string} prefix path prefix
   */
  _addTailSlashRedirection(location, prefix = '') {
    if (prefix !== '/' && prefix[prefix.length - 1] !== '/') {
      this._addCommonHeader(location);
      location._add('set', '$tail_slash_redirect_flag ""');
      location._addVerbatimBlock(
        'if ($request_method = GET)',
        // eslint-disable-next-line no-template-curly-in-string
        'set $tail_slash_redirect_flag "${tail_slash_redirect_flag}1";'
      );
      location._addVerbatimBlock(
        `if ($uri = ${prefix})`,
        // eslint-disable-next-line no-template-curly-in-string
        'set $tail_slash_redirect_flag "${tail_slash_redirect_flag}2";'
      );
      location._addVerbatimBlock('if ($tail_slash_redirect_flag = 12)', `return 307 ${prefix}/$abt_query_string;`);
    }
  }

  _addCommonHeader(location) {
    location._add('set', '$abt_query_string ""');
    location._addVerbatimBlock('if ($query_string)', 'set $abt_query_string "?$query_string";');
  }

  _addDefaultLocations({ server, daemonPort, serverName, skipDefaultRoot = false }) {
    if (!server) {
      throw new Error('server is required');
    }

    if (!daemonPort) {
      throw new Error('daemonPort is required');
    }

    // For sub-service sites, skip default root as it will be set with $subdomain variable
    if (!skipDefaultRoot) {
      server._add('root', this.getRelativeConfigDir(this.wwwDir));
    }
    server._addVerbatimBlock('if ($access_blocked)', 'return 403;');

    this._addHostBlockWhitelistServer({ server, serverName });

    server._add('error_page', '404 =404 /_abtnode_404');
    server._add('error_page', '502 =502 /_abtnode_502');
    server._add('error_page', '500 502 503 504 =500 /_abtnode_5xx');

    server._add('location', '/_abtnode_404');
    const location404 = server.location.length ? server.location[server.location.length - 1] : server.location;
    location404._add('internal');
    location404._add('try_files', '$uri /404.html break');

    server._add('location', '/_abtnode_502');
    const location502 = server.location[server.location.length - 1];
    location502._add('internal');
    location502._add('proxy_pass', `http://127.0.0.1:${daemonPort}/error/502`);

    server._add('location', '/_abtnode_5xx');
    const location5xx = server.location[server.location.length - 1];
    location5xx._add('internal');
    location5xx._add('try_files', '$uri /5xx.html break');
  }

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

  _copyConfigFiles() {
    fs.copySync(path.join(__dirname, 'includes'), this.includesDir, { overwrite: true });
    fs.copySync(path.join(__dirname, '..', 'www'), this.wwwDir, { overwrite: true });
  }

  _ensureDhparam() {
    const targetFile = path.join(this.includesDir, 'dhparam.pem');
    if (fs.existsSync(targetFile)) {
      this._isDhparamGenerated = true;
      return;
    }

    if (this.isTest || process.env.NODE_ENV === 'test') {
      fs.copySync(path.join(__dirname, 'includes', 'dhparam.pem'), targetFile, { overwrite: true });
      this._isDhparamGenerated = true;
      return;
    }

    const binPath = shelljs.which('openssl');
    if (!binPath) {
      throw new Error('invalid openssl binPath');
    }

    const command = `${binPath} dhparam -out ${targetFile} 2048`;
    const result = shelljs.exec(command, { silent: true });
    if (result.code !== 0) {
      logger.error(`exec ${command} error`, { error: result.stderr });
      throw new Error(`${formatError(result.stderr)}`);
    } else {
      logger.info(`dhparam generated ${targetFile}`);
      this._isDhparamGenerated = true;
    }
  }

  _ensureDaemonSecurityHeaders() {
    const securityFilePath = path.join(this.includesDir, 'daemon', 'security');

    const cspImgSources = [
      ...CSP_OFFICIAL_SOURCES,
      ...CSP_SYSTEM_SOURCES,
      ...CSP_THIRD_PARTY_SOURCES,
      ...CSP_ICONIFY_SOURCES,
      'data:',
      'blob:',
    ];
    const cspConnectSources = [
      ...CSP_OFFICIAL_SOURCES,
      ...CSP_SYSTEM_SOURCES,
      ...CSP_THIRD_PARTY_SOURCES,
      ...CSP_ICONIFY_SOURCES,
      '*/__blocklet__.js',
      '*/.well-known/ping',
    ];

    const cspFrameSources = [...CSP_OFFICIAL_SOURCES, ...CSP_SYSTEM_SOURCES];

    const cspPolicy = `default-src 'self'; frame-src 'self' ${cspFrameSources.join(' ')}; frame-ancestors 'self'; script-src 'self' 'unsafe-inline' ${CSP_THIRD_PARTY_SOURCES.join(' ')}; style-src 'self' 'unsafe-inline'; img-src 'self' ${cspImgSources.join(' ')}; font-src 'self' data:; connect-src 'self' ${cspConnectSources.join(' ')} */.well-known/ping; base-uri 'self'; object-src 'none'`;
    const cspLine = `add_header Content-Security-Policy "${cspPolicy}" always;`;

    try {
      if (fs.existsSync(securityFilePath)) {
        logger.info('security include file already exists', { path: securityFilePath });
        return;
      }

      const baseContent = [
        '## Global HTTP security headers (safe baseline)',
        '',
        '# MIME sniffing protection',
        'add_header X-Content-Type-Options "nosniff" always;',
        '# --- Secure Headers Baseline ---',
        '# Hide headers from upstream (in case the upstream app sets them).',
        '# This prevents duplicate values which may cause overly strict policies.',
        'proxy_hide_header Content-Security-Policy;',
        'proxy_hide_header Referrer-Policy;',
        'proxy_hide_header Permissions-Policy;',
        '# Referrer-Policy:',
        '# Controls how much referrer information is included with requests.',
        '# "strict-origin-when-cross-origin" is a balanced choice: full referrer',
        '# for same-origin, origin only for cross-origin, nothing on downgrade.',
        '# Use "no-referrer" if you want the strictest setting.',
        'add_header Referrer-Policy "strict-origin-when-cross-origin" always;',
        'add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=(), usb=(), bluetooth=(), fullscreen=(), xr-spatial-tracking=(), magnetometer=(), gyroscope=(), accelerometer=(), browsing-topics=()" always;',
        'add_header X-Frame-Options "SAMEORIGIN" always;',
        '# Content-Security-Policy (CSP):',
        '# Mitigates XSS by restricting resource loading.',
        '# This baseline only allows self-hosted resources, blocks framing,',
        '# disallows <base> tag overrides, and disables legacy plugins.',
        '# Adjust sources (script-src, style-src, img-src, etc.) if you need CDNs.',
        cspLine,
      ].join('\n');

      fs.writeFileSync(securityFilePath, baseContent);
      logger.info('security include file updated', { path: securityFilePath });
    } catch (error) {
      logger.error('Failed to update security include file', { error, path: securityFilePath });
    }
  }

  /**
   * Compute effective common headers for a specific blocklet or system site
   * @param {object} commonHeaders - base common headers
   * @param {string} [blockletDid] - blocklet DID (undefined for system sites)
   * @param {object} [noIndexOverrides={}] - per-blocklet noIndex overrides { [did]: boolean }
   * @returns {object} effective common headers
   */
  // eslint-disable-next-line class-methods-use-this
  _getEffectiveCommonHeaders(commonHeaders, blockletDid, noIndexOverrides = {}) {
    const headers = { ...(commonHeaders || {}) };
    if (blockletDid && blockletDid in noIndexOverrides) {
      if (noIndexOverrides[blockletDid]) {
        headers['X-Robots-Tag'] = '"noindex, nofollow"';
      } else {
        delete headers['X-Robots-Tag'];
      }
    }

    return headers;
  }

  _addCommonResHeaders(block, headers) {
    if (!headers || Object.prototype.toString.call(headers) !== '[object Object]') {
      return;
    }

    block._add('add_header', 'X-Request-ID $request_id');
    Object.keys(headers).forEach((key) => {
      block._add('add_header', `${key} ${headers[key]}`);
    });
  }

  _addUnknownHostBlackHoleServer(conf, blacklist) {
    let blacklistDomains = blacklist.split(',');
    if (blacklistDomains.length === 0) {
      logger.info('unknown host blacklist is empty');
      return;
    }

    blacklistDomains = blacklistDomains.filter((domain) => domain.trim() !== '').join(' ');

    conf.nginx.http._add('server');
    const server = this._getLastServer(conf);
    server._add('server_name', blacklistDomains);
    server._add('listen', this.httpPort);

    const certPath = `${joinNginxPath(this.certDir, 'abtnode_dummy.crt')}`;
    const keyPath = `${joinNginxPath(this.certDir, 'abtnode_dummy.key')}`;

    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      server._add('ssl_certificate', certPath);
      server._add('ssl_certificate_key', keyPath);
      server._add('listen', `${this.httpsPort} ssl`);
    }

    server._add('return', '444');

    logger.info('add unknown host blacklist server success');
  }

  _addDefaultServer(conf, daemonPort) {
    conf.nginx.http._add('server');
    const server = this._getLastServer(conf);
    const serverName = '_';

    server._add('server_name', serverName);
    server._add('listen', `${this.httpPort} default_server`);

    this._addDefaultLocations({ server, daemonPort, serverName });
    server._add('location', '/');
    const location = server.location[server.location.length - 1];
    location._add('try_files', '$uri /404.html break');
    location._add('add_header', 'X-Request-ID $request_id');
  }

  _addDefaultBlackHoleServer(conf) {
    conf.nginx.http._add('server');
    const server = this._getLastServer(conf);
    server._add('server_name', '_');
    server._add('listen', `${this.httpPort} default_server`);

    const certPath = `${joinNginxPath(this.certDir, 'abtnode_dummy.crt')}`;
    const keyPath = `${joinNginxPath(this.certDir, 'abtnode_dummy.key')}`;

    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      server._add('ssl_certificate', certPath);
      server._add('ssl_certificate_key', keyPath);
      server._add('listen', `${this.httpsPort} ssl default_server`);
    }

    server._add('return', '444');
  }

  _addIpBlackHoleServer(conf) {
    conf.nginx.http._add('server');
    const server = this._getLastServer(conf);
    server._add('server_name', DOMAIN_FOR_IP_SITE_REGEXP);
    server._add('listen', this.httpPort);

    const certPath = `${joinNginxPath(this.certDir, 'abtnode_dummy.crt')}`;
    const keyPath = `${joinNginxPath(this.certDir, 'abtnode_dummy.key')}`;

    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      server._add('ssl_certificate', certPath);
      server._add('ssl_certificate_key', keyPath);
      server._add('listen', `${this.httpsPort} ssl`);
    }

    if (process.env.ABT_NODE_IP_WHITELIST) {
      server._addVerbatimBlock('if ($access_trusted = 0)', 'return 444;');
      server._add('return', '200');
    } else {
      server._add('return', '444');
    }
  }

  _addStubStatusLocation(conf) {
    if (!conf?.nginx?.http?.server) {
      return;
    }

    if (!this.capabilities?.httpStubStatus) {
      return;
    }

    const servers = Array.isArray(conf.nginx.http.server) ? conf.nginx.http.server : [conf.nginx.http.server];
    const server = servers.find((x) => x.server_name._value === '127.0.0.1');
    if (!server) {
      return;
    }

    server._add('location', '/__nginx_status');
    const location = this._getLastLocation(server);
    location._add('stub_status', 'on');
    location._add('access_log', 'off');
    location._add('allow', '127.0.0.1');
    location._add('deny', 'all');
  }

  _getLastServer(conf) {
    return conf.nginx.http.server.length
      ? conf.nginx.http.server[conf.nginx.http.server.length - 1]
      : conf.nginx.http.server;
  }

  _getLastLocation(server) {
    const location = server.location.length ? server.location[server.location.length - 1] : server.location;
    if (location && this.requestLimit?.enabled && !location.toString().includes('limit_req')) {
      location._add(
        'limit_req',
        `zone=ip_rate_limit burst=${this.requestLimit.burst} ${this.requestLimit.burstDelay > 0 ? `delay=${this.requestLimit.burstDelay}` : 'nodelay'}`
      );
      location._add('limit_req', `zone=global_rate_limit burst=${this.requestLimit.burstGlobal} nodelay`);
    }

    return location;
  }

  _getLastStreamServer(conf) {
    return conf.nginx.stream.server.length
      ? conf.nginx.stream.server[conf.nginx.stream.server.length - 1]
      : conf.nginx.stream.server;
  }

  _addHttpServer({ locations = [], serverName, conf, port, daemonPort, commonHeaders, blockletDid, serviceType }) {
    const httpServerUnit = this._addHttpServerUnit({ conf, serverName, port });
    this._addCommonResHeaders(httpServerUnit, commonHeaders);
    // Skip default root for subService sites
    const skipDefaultRoot = locations.some((x) => x.type === ROUTING_RULE_TYPES.SUB_SERVICE);
    this._addDefaultLocations({ server: httpServerUnit, daemonPort, serverName, skipDefaultRoot });
    // eslint-disable-next-line max-len
    locations.forEach((x) => this._addReverseProxy({ server: httpServerUnit, ...x, serverName, commonHeaders, blockletDid, serviceType })); // prettier-ignore
  }

  _addHttpsServer({
    conf,
    locations,
    certificateFileName,
    serverName,
    serviceType,
    daemonPort,
    commonHeaders,
    blockletDid,
  }) {
    const httpsServerUnit = this._addHttpsServerUnit({ conf, serverName, certificateFileName });
    this._addCommonResHeaders(httpsServerUnit, commonHeaders);

    this._addSecurityHeaders(httpsServerUnit, serviceType);
    httpsServerUnit._addVerbatimBlock('if ($has_multi_origin)', 'return 400;');

    const httpServerUnit = this._addHttpServerUnit({ conf, serverName });
    httpServerUnit._add('return', '307 https://$host$request_uri'); // redirect to https if has https

    // Check if any location is SUB_SERVICE type, if so skip default root
    const hasSubService = locations.some((x) => x.type === ROUTING_RULE_TYPES.SUB_SERVICE);
    this._addDefaultLocations({ server: httpsServerUnit, daemonPort, serverName, skipDefaultRoot: hasSubService });
    // eslint-disable-next-line max-len
    locations.forEach((x) => this._addReverseProxy({ server: httpsServerUnit, ...x, serverName, commonHeaders, blockletDid, serviceType })); // prettier-ignore
  }

  _addHttpServerUnit({ conf, serverName, port = '' }) {
    let listen = port || this.httpPort;
    if (serverName === '_') {
      listen = `${listen} default_server`;
    }

    conf.nginx.http._add('server');
    const httpServerUnit = this._getLastServer(conf);
    httpServerUnit._add('server_name', serverName);
    httpServerUnit._add('listen', listen);

    return httpServerUnit;
  }

  _addHostBlockWhitelistServer({ server, serverName }) {
    if (
      process.env.ABT_NODE_DOMAIN_WHITELIST &&
      toLower(process.env.ABT_NODE_DOMAIN_WHITELIST).includes(toLower(serverName)) &&
      process.env.ABT_NODE_DOMAIN_WHITELIST_HEADERS
    ) {
      let whitelistHeaders = [];
      try {
        whitelistHeaders = JSON.parse(process.env.ABT_NODE_DOMAIN_WHITELIST_HEADERS);
        if (whitelistHeaders && !Array.isArray(whitelistHeaders) && typeof whitelistHeaders === 'object') {
          whitelistHeaders = [whitelistHeaders];
        }
      } catch (e) {
        logger.warn('invalid ABT_NODE_DOMAIN_WHITELIST_HEADERS env, should be JSON array', {
          error: e,
          env: process.env.ABT_NODE_DOMAIN_WHITELIST_HEADERS,
        });

        return;
      }

      if (!Array.isArray(whitelistHeaders) || whitelistHeaders.length === 0) {
        logger.warn('ABT_NODE_DOMAIN_WHITELIST_HEADERS env is empty');
        return;
      }

      for (let i = 0; i < whitelistHeaders.length; i++) {
        const h = whitelistHeaders[i];
        if (!h.name || typeof h.value === 'undefined') {
          // skip invalid header config
          logger.warn('invalid header config', { header: h });
        } else {
          server._addVerbatimBlock(
            `if ($http_${h.name.toLowerCase().replace(/-/g, '_')} != ${h.value})`,
            'return 444;'
          );
          logger.info('add host block whitelist server with multi-header success', { header: h });
        }
      }
    }
  }

  _addHttpsServerUnit({ conf, serverName, certificateFileName }) {
    // assignment the `server`segment just created to httpServerUnit
    conf.nginx.http._add('server');
    const httpsServerUnit = this._getLastServer(conf);

    const crtPath = `${joinNginxPath(this.certDir, certificateFileName.replace('*', '-'))}.crt`;
    const keyPath = `${joinNginxPath(this.certDir, certificateFileName.replace('*', '-'))}.key`;

    // Handle HTTP/2 configuration based on Nginx version
    let listen = `${this.httpsPort} ssl`;
    let http2Config = '';
    if (this.capabilities.httpV2) {
      if (this.capabilities.version && semver.gte(this.capabilities.version, '1.25.1')) {
        http2Config = 'http2 on';
      } else {
        listen += ' http2';
      }
    }
    if (serverName === '_') {
      listen = `${listen} default_server`;
    }
    httpsServerUnit._add('server_name', serverName);
    httpsServerUnit._add('listen', listen);
    if (http2Config) {
      httpsServerUnit._add('http2', 'on');
    }
    httpsServerUnit._add('ssl_certificate', crtPath);
    httpsServerUnit._add('ssl_certificate_key', keyPath);
    httpsServerUnit._add('include', 'includes/ssl');
    if (this._isDhparamGenerated) {
      httpsServerUnit._add('include', 'includes/ssl-dhparam');
    }

    return httpsServerUnit;
  }

  _addModSecurity(conf, wafPolicy = {}, wafDisabledBlocklets = []) {
    if (!wafPolicy.enabled) {
      return;
    }

    if (!this.capabilities.modsecurity) {
      logger.warn('modsecurity is not supported');
      return;
    }

    const maxBodySize = 1024 * 1024 * 5; // 5MB
    const minBodySize = 1024 * 1024 * 1; // 1MB

    const variables = {
      ...pick(wafPolicy, ['mode', 'inboundAnomalyScoreThreshold', 'outboundAnomalyScoreThreshold', 'logLevel']),
      tmpDir: this.tmpDir,
      logDir: this.logDir,
      maxUploadSize: Math.floor(+CLIENT_MAX_BODY_SIZE * 1024 * 1024),
      maxBodySize: Math.max(minBodySize, Math.min(Math.floor((+CLIENT_MAX_BODY_SIZE * 1024 * 1024) / 10), maxBodySize)),
    };

    logger.info('modsecurity variables', variables);

    const modSecurityConfPath = path.join(this.includesDir, 'security/modsecurity.conf');
    const coreRuleSetConfPath = path.join(this.includesDir, 'security/crs4/crs-setup.conf');

    fs.writeFileSync(modSecurityConfPath, getModSecurityConf(variables));
    fs.writeFileSync(coreRuleSetConfPath, getCoreRuleSetConf(variables));

    this.syncCustomCRSFiles({ wafDisabledBlocklets });

    conf.nginx.http._add('modsecurity', 'on');
    conf.nginx.http._add('modsecurity_transaction_id', '$request_id');
    conf.nginx.http._add('modsecurity_rules_file', modSecurityConfPath);
    conf.nginx.http._add('modsecurity_rules_file', coreRuleSetConfPath);
    const entries = fg.sync(path.join(this.includesDir, 'security/crs4/rules/*.conf'), { absolute: false });
    entries.forEach((entry) => conf.nginx.http._add('modsecurity_rules_file', entry));
  }

  _addExposeServices(conf, services = []) {
    const validServices = uniqBy(services, 'port').filter((service) => {
      if (!service.port || !service.upstreamPort || !service.protocol) {
        logger.error('invalid expose service', { service });
        return false;
      }

      return true;
    });

    logger.info('_addExposeServices', { services, validServices });

    if (validServices.length > 0) {
      conf.nginx._add('stream');
      validServices.forEach((service) => {
        conf.nginx.stream._add('server');
        const server = this._getLastStreamServer(conf);
        let protocol = '';
        if (service.protocol === 'udp') {
          protocol = ` ${service.protocol}`;
          server._add('proxy_responses', 1);
          server._add('proxy_timeout', '1s');
        }

        server._add('listen', `${service.port}${protocol}`);
        server._add('proxy_pass', `127.0.0.1:${service.upstreamPort}`);
      });
    }
  }

  addRequestLimiting(block, limit) {
    if (!limit?.enabled) {
      return;
    }

    const resourceExts =
      'jpg|jpeg|png|gif|webp|svg|ico|css|js|jsx|ts|tsx|mjs|woff|woff2|ttf|eot|otf|json|bmp|avif|wasm|xml|txt';

    // limit by global
    block._addVerbatimBlock(
      'map $request_uri $global_rate_limit_key',
      `${os.EOL}${[`~*\\.(${resourceExts})$ "";`, 'default global_rate_limit;'].join(os.EOL)}${os.EOL}`
    );

    // limit by ip
    block._addVerbatimBlock(
      'map $request_uri:$request_method $ip_rate_limit_key',
      `${os.EOL}${[`~*\\.(${resourceExts})(\\?.*)?: "";`, `~*:(${limit.methods.join('|')})$ ip_rate_limit;`, 'default "";'].join(os.EOL)}${os.EOL}`
    );

    // link: https://nginx.org/en/docs/http/ngx_http_limit_req_module.html#limit_req_zone
    block._add(
      'limit_req_zone',
      `$global_rate_limit_key zone=global_rate_limit:128k rate=${limit.global || GATEWAY_RATE_LIMIT_GLOBAL.min}r/s`
    );
    block._add(
      'limit_req_zone',
      `$ip_rate_limit_key zone=ip_rate_limit:5m rate=${limit.rate || GATEWAY_RATE_LIMIT.min}r/s`
    );
    block._add('limit_req_status', 429);
  }

  updateBlacklist(blacklist) {
    const blacklistFile = path.join(this.includesDir, 'blacklist');
    fs.writeFileSync(blacklistFile, blacklist.map((x) => `${x} 1;`).join(os.EOL));
  }

  updateWhitelist() {
    try {
      const whitelistFile = path.join(this.includesDir, 'whitelist');
      let whitelist = process.env.ABT_NODE_IP_WHITELIST?.split(',') || []; // IP 地址列表，支持 CIDR 格式
      whitelist = whitelist.map((x) => x.trim()).filter(Boolean);

      fs.writeFileSync(whitelistFile, whitelist.map((x) => `${x} 1;`).join(os.EOL));
    } catch (error) {
      logger.error('Failed to update whitelist', { error, env: process.env.ABT_NODE_IP_WHITELIST });
    }
  }

  updateProxyPolicy(proxyPolicy) {
    const proxyRaw = fs.readFileSync(path.join(this.includesDir, 'proxy.raw'), 'utf8');
    const proxyPolicyFile = path.join(this.includesDir, 'proxy');

    // Note: Response headers (add_header) are NOT included here.
    // They are set at the server block level via _addCommonResHeaders() instead.
    // This avoids the nginx add_header inheritance issue where location-level add_header
    // directives (from this include) would override ALL server-level add_header directives,
    // preventing per-blocklet headers (like X-Robots-Tag) from reaching clients.
    if (proxyPolicy?.enabled) {
      fs.writeFileSync(
        proxyPolicyFile,
        [proxyRaw, 'proxy_set_header X-Forwarded-For "$http_x_forwarded_for,$realip_remote_addr";'].join(os.EOL)
      );
    } else {
      fs.writeFileSync(
        proxyPolicyFile,
        [proxyRaw, 'proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;'].join(os.EOL)
      );
    }
  }

  getLogFilesForToday() {
    return {
      access: this.accessLog,
      error: this.errorLog,
      security: this.securityLog,
    };
  }

  _didToNumber(did) {
    return parseInt(toHex(Buffer.from(did)).slice(-8), 16);
  }

  _getBlockletWAFTemplateConf({ domainAliases, wafPolicy, defaultWAF = 'On', did = '' }) {
    if (!Array.isArray(domainAliases) || domainAliases.length === 0) return '';

    const headerComment = [
      '# ------------------------------------------------------------------------',
      '# Blocklet WAF Exclusion Rules',
      '#',
      `# This file is generated for Blocklet DID: ${did || '[unknown]'} .`,
      '#',
      '# The rules below control ModSecurity WAF behavior for specific domains associated with this DID.',
      '# Each rule disables or enables the WAF engine for requests matching the Host header.',
      '#',
      '# DO NOT EDIT THIS FILE MANUALLY.',
      '# ------------------------------------------------------------------------',
      '',
    ].join('\n');

    const baseId = 9000000 + (this._didToNumber(did) % 10000);

    const rules = domainAliases
      .map((domain, idx) => {
        let rule;
        if (domain.includes(SLOT_FOR_IP_DNS_SITE)) {
          // 只匹配 did- 前缀
          const didPrefix = `${domain.split('-')[0]}-`;
          rule = `SecRule REQUEST_HEADERS:Host "@contains ${didPrefix}" \\`;
        } else {
          rule = `SecRule REQUEST_HEADERS:Host "@streq ${domain}" \\`;
        }

        return `${rule}
"id:${baseId + idx},\\
phase:1,\\
pass,\\
nolog,\\
tag:'SERVER_WAF',\\
tag:'did:${did}',\\
ctl:ruleEngine=${wafPolicy?.enabled ? defaultWAF : 'Off'}"`;
      })
      .join('\n\n');
    return `${headerComment}${rules}`;
  }

  addCustomWAFConf({ did, domainAliases, wafPolicy, defaultWAF }) {
    if (!Array.isArray(domainAliases) || domainAliases.length === 0) return;

    const customDIDConfigPath = path.join(this.includesDir, `security/crs4/rules/REQUEST-900-CUSTOM-RULES-${did}.conf`);

    const confContent = this._getBlockletWAFTemplateConf({
      domainAliases: domainAliases.map((x) => x.value),
      defaultWAF,
      wafPolicy,
      did,
    });
    fs.writeFileSync(customDIDConfigPath, confContent);
  }

  syncCustomCRSFiles({ wafDisabledBlocklets = [] }) {
    const wafDisabledBlockletsDIDs = wafDisabledBlocklets.map((x) => x.did);
    const rulesDir = path.join(this.includesDir, 'security/crs4/rules');
    const prefix = 'REQUEST-900-CUSTOM-RULES-';
    const files = fs.readdirSync(rulesDir).filter((f) => f.startsWith(prefix));
    const localWafBlockletsDIDs = files.map((x) => x.replace(prefix, '').replace('.conf', ''));

    const removeList = difference(localWafBlockletsDIDs, wafDisabledBlockletsDIDs);
    const addList = difference(wafDisabledBlockletsDIDs, localWafBlockletsDIDs);

    logger.info('syncCustomCRSFiles', { removeList, addList });

    if (removeList.length) {
      const removeFiles = removeList.map((x) => path.join(rulesDir, `${prefix}${x}.conf`));
      for (const file of removeFiles) {
        try {
          fs.rmSync(file, { recursive: true, force: true });
        } catch (err) {
          logger.error('Failed to remove custom CRS file', { file, error: err });
        }
      }
    }

    if (addList.length) {
      for (const did of addList) {
        try {
          const blocklet = wafDisabledBlocklets.find((x) => x.did === did);
          const domainAliases = blocklet?.site?.domainAliases || [];
          this.addCustomWAFConf({ did, domainAliases, wafPolicy: { enabled: false }, defaultWAF: 'On' });
        } catch (error) {
          logger.error('Failed to add custom CRS file', { did, error });
        }
      }
    }
  }

  getLogDir() {
    return this.logDir;
  }

  /**
   * Search cached files by group and pattern
   * @param {string} pattern
   * @param {string} group
   * @returns {string[]} list of files cached match the pattern
   */
  searchCache(pattern, group = '') {
    if (!pattern) {
      return [];
    }

    const cacheDir = group ? path.join(this.cacheDir, group) : this.cacheDir;
    const result = shelljs.exec(`grep -rl '^KEY:.*${pattern}' ${cacheDir}`, { silent: true });
    logger.info('search nginx cache', { pattern, result });
    if (result.stderr) {
      console.error('Failed to search nginx cache', result.stderr);
      return [];
    }

    return result.stdout.split(os.EOL).filter(Boolean);
  }

  /**
   * Clear cache by group, if group is empty, clear all cache
   * @param {string} group
   * @returns {string[]} cleared cache files
   */
  clearCache(group = '') {
    try {
      const cacheDir = group ? path.join(this.cacheDir, group) : this.cacheDir;
      fs.rmSync(cacheDir, { recursive: true, force: true });
      fs.ensureDirSync(cacheDir);
      logger.info('nginx cache cleared', { group });
      return [cacheDir];
    } catch (err) {
      console.error('Failed to clear nginx cache', err);
      return [];
    }
  }

  // ============================================================================
  // Hash-based incremental update methods
  // ============================================================================

  /**
   * Load config hashes from file on startup
   */
  _loadHashes() {
    try {
      if (fs.existsSync(this.hashFilePath)) {
        const data = JSON.parse(fs.readFileSync(this.hashFilePath, 'utf8'));
        this.configHashes.global = data.global || null;
        this.configHashes.blocklets = new Map(Object.entries(data.blocklets || {}));
        logger.info('loaded config hashes', {
          global: !!this.configHashes.global,
          blockletCount: this.configHashes.blocklets.size,
        });
      }
    } catch (error) {
      logger.warn('failed to load config hashes, will regenerate all', { error: error.message });
      this.configHashes = { global: null, blocklets: new Map() };
    }
  }

  /**
   * Check if hash file exists (indicates non-first startup)
   * @returns {boolean}
   */
  hasHashFile() {
    return fs.existsSync(this.hashFilePath) && this.configHashes.global !== null;
  }

  /**
   * Persist config hashes to file
   */
  _saveHashes() {
    try {
      const data = {
        global: this.configHashes.global,
        blocklets: Object.fromEntries(this.configHashes.blocklets),
        savedAt: new Date().toISOString(),
      };
      fs.writeFileSync(this.hashFilePath, JSON.stringify(data, null, 2));
      logger.debug('saved config hashes');
    } catch (error) {
      logger.warn('failed to save config hashes', { error: error.message });
    }
  }

  /**
   * Compute hash for global config (main nginx.conf settings)
   * @param {object} params - Update parameters
   * @returns {string} Hash of global config
   */
  _computeGlobalConfigHash(params) {
    const {
      nodeInfo = {},
      requestLimit,
      blockPolicy,
      proxyPolicy,
      wafPolicy,
      cacheEnabled,
      enableDefaultServer,
      enableIpServer,
      certificates = [],
      services = [],
      systemSites = [],
    } = params;

    const hashInput = {
      requestLimit: requestLimit?.enabled ? requestLimit : { enabled: false },
      blockPolicy: blockPolicy?.enabled
        ? { enabled: true, blacklistCount: blockPolicy.blacklist?.length || 0 }
        : { enabled: false },
      proxyPolicy,
      wafPolicy: wafPolicy?.enabled ? wafPolicy : { enabled: false },
      cacheEnabled,
      enableDefaultServer,
      enableIpServer,
      headers: nodeInfo?.routing?.headers || {},
      certDomains: certificates.map((c) => c.domain).sort(),
      services: services.map((s) => ({ port: s.port, protocol: s.protocol })),
      systemSites: systemSites.map((s) => ({
        domain: s.domain,
        rulesHash: objectHash(s.rules || []),
      })),
      httpPort: this.httpPort,
      httpsPort: this.httpsPort,
    };

    return objectHash(hashInput);
  }

  /**
   * Compute hash for a specific blocklet's config
   * @param {string} blockletDid - Blocklet DID
   * @param {Array} blockletSites - Sites for this blocklet
   * @param {Array} certificates - All certificates
   * @param {boolean} wafDisabled - Whether WAF is disabled for this blocklet
   * @returns {string} Hash of blocklet config
   */
  _computeBlockletConfigHash(blockletDid, blockletSites, certificates, wafDisabled) {
    const relevantCerts = certificates.filter((c) =>
      blockletSites.some((s) => findCertificate(certificates, s.domain)?.domain === c.domain)
    );

    const hashInput = {
      blockletDid,
      sites: blockletSites.map((s) => ({
        domain: s.domain,
        domainAliases: (s.domainAliases || []).map((a) => (typeof a === 'string' ? a : a.value)).sort(),
        rulesHash: objectHash(s.rules || []),
        port: s.port,
      })),
      certDomains: relevantCerts.map((c) => c.domain).sort(),
      wafDisabled,
    };

    return objectHash(hashInput);
  }

  /**
   * Update a single blocklet's config file
   * @param {string} blockletDid - The blocklet DID
   * @param {object} params - Update parameters
   */
  async updateSingleBlocklet(blockletDid, params) {
    const {
      routingTable = [],
      certificates = [],
      commonHeaders,
      nodeInfo = {},
      wafDisabledBlocklets = [],
      noIndexOverrides = {},
    } = params;

    const serverCommonHeaders = process.env.ABT_NODE_NO_INDEX
      ? { ...(commonHeaders || {}), 'X-Robots-Tag': '"noindex, nofollow"' }
      : commonHeaders;
    const effectiveCommonHeaders = this._getEffectiveCommonHeaders(serverCommonHeaders, blockletDid, noIndexOverrides);

    const { sites } = formatRoutingTable(routingTable);
    const blockletSites = sites.filter((s) => s.blockletDid === blockletDid);

    if (blockletSites.length === 0) {
      logger.warn('updateSingleBlocklet: no sites found for blocklet', { blockletDid });
      return false;
    }

    await this._generateBlockletSiteConfFile({
      blockletDid,
      sites: blockletSites,
      certificates,
      nodeInfo,
      commonHeaders: effectiveCommonHeaders,
    });

    // Update hash
    const wafDisabled = wafDisabledBlocklets.some((b) => b.did === blockletDid);
    const hash = this._computeBlockletConfigHash(blockletDid, blockletSites, certificates, wafDisabled);
    this.configHashes.blocklets.set(blockletDid, hash);
    this._saveHashes();

    logger.info('updated single blocklet config', { blockletDid });
    return true;
  }

  /**
   * Remove a blocklet's config file
   * @param {string} blockletDid - The blocklet DID
   */
  _removeBlockletConfig(blockletDid) {
    const confPath = path.join(this.sitesDir, `${blockletDid}.conf`);
    try {
      if (fs.existsSync(confPath)) {
        fs.unlinkSync(confPath);
        logger.info('removed blocklet config', { blockletDid, confPath });
      }
      this.configHashes.blocklets.delete(blockletDid);
    } catch (error) {
      logger.error('failed to remove blocklet config', { blockletDid, error: error.message });
    }
  }

  /**
   * Remove a blocklet and trigger reload
   * @param {string} blockletDid - The blocklet DID
   */
  async removeBlockletAndReload(blockletDid) {
    this._removeBlockletConfig(blockletDid);
    this._saveHashes();
    await this.reload();
    logger.info('removed blocklet and reloaded nginx', { blockletDid });
  }

  getStatus() {
    return util.getNginxStatus(this.configDir);
  }
}

NginxProvider.describe = async ({ configDir = '' } = {}) => {
  const meta = {
    name: 'nginx',
    description:
      'Use nginx to provide a flexible and high performance routing layer with path prefix and domain support',
  };

  try {
    // Use retry as a workaround for race-conditions between check and normal start
    const result = await promiseRetry((retry) => NginxProvider.check({ configDir }).catch(retry), { retries: 3 });
    return { ...meta, ...result };
  } catch (err) {
    return { ...meta, error: err.message, available: false, running: false };
  }
};

/**
 * Nginx provider prerequisite check
 * @param {object} param
 * @param {string} param.configDir nginx config directory
 */
NginxProvider.check = async ({ configDir = '' } = {}) => {
  logger.info('check formal config directory', { configDir });
  const binPath = shelljs.which('nginx');
  const result = {
    binPath,
    available: true,
    running: false,
    error: '',
  };

  if (!binPath) {
    result.available = false;
    result.error =
      'Nginx is not detected, to have nginx installed you can checkout: https://nginx.org/en/docs/install.html.';
    return result;
  }

  const nginxStatus = await util.getNginxStatus(configDir);
  if (nginxStatus.running && !nginxStatus.managed) {
    result.available = false;
    result.error =
      'Seems a nginx daemon already running, a controlled nginx is required by Blocklet Server to work properly, please terminate the running nginx daemon before try again.';

    return result;
  }

  if (nginxStatus.managed) {
    const pidFile = path.join(configDir, 'nginx', 'nginx.pid');
    if (fs.existsSync(pidFile)) {
      const diskPid = Number(fs.readFileSync(pidFile).toString().trim());
      // If we have the pid lock file, but not the same as running nginx pid, nginx should be killed
      if (diskPid !== nginxStatus.pid) {
        await kill(nginxStatus.pid);
      } else {
        result.running = true;
      }
    } else {
      // If we do not have the pid lock file, the nginx process should be stopped
      await kill(nginxStatus.pid);
    }
  }

  const testDir = path.join(os.tmpdir(), `test_nginx_provider-${Date.now()}-${Math.ceil(Math.random() * 10000)}`);
  try {
    const tempConfDir = path.join(testDir, CONFIG_FOLDER_NAME);
    fs.mkdirSync(tempConfDir, { recursive: true });

    const provider = new NginxProvider({ configDir: tempConfDir, isTest: true });
    provider.initialize();

    logger.info('check:addTestServer', { configPath: provider.configPath });
    await addTestServer({
      configPath: provider.configPath,
      port: await getPort(),
      upstreamPort: await getPort(),
    });

    const missingModules = getMissingModules(provider.readNginxConfigParams());

    if (missingModules.length > 0) {
      result.available = false;
      result.error = `Blocklet Server depends on some modules of Nginx that are not compiled: ${missingModules.join(
        ', '
      )}`;
      return result;
    }

    await provider.start();
    await provider.stop();

    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }

    return result;
  } catch (error) {
    if (process.env.DEBUG) {
      console.error(error);
    }
    result.available = false;
    result.error = error.message;
    logger.error('check nginx failed', { error });
    return result;
  }
};

const hasPortPermission = async (port) => {
  const configDir = path.join(
    os.tmpdir(),
    `test_nginx_provider-${Date.now()}-${Math.ceil(Math.random() * 10000)}`,
    CONFIG_FOLDER_NAME
  );
  try {
    fs.mkdirSync(configDir, { recursive: true });

    const provider = new NginxProvider({ configDir, isTest: true });
    provider.initialize();

    await addTestServer({ configPath: provider.configPath, port });
    await provider.start();
    await provider.stop();

    return true;
  } catch (err) {
    return false;
  } finally {
    fs.rmSync(configDir, { recursive: true, force: true });
  }
};

NginxProvider.getStatus = util.getNginxStatus;
NginxProvider.exists = () => !!shelljs.which('nginx');

NginxProvider.getUsablePorts = () => getUsablePorts('nginx', hasPortPermission);
NginxProvider.hasPortPermission = hasPortPermission;
NginxProvider.version = getVersion();

module.exports = NginxProvider;
