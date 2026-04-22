const path = require('path');
const chalk = require('chalk');
const toLower = require('lodash/toLower');
const get = require('lodash/get');
const os = require('os');
const rc = require('rc');
const updateNotifier = require('update-notifier');
const { filesize } = require('filesize');
const fs = require('fs-extra');
const git = require('git-rev-sync');
const uniq = require('lodash/uniq');
const pRetry = require('p-retry');
const { joinURL } = require('ufo');
const getNodeWallet = require('@abtnode/util/lib/get-app-wallet');
const isDocker = require('@abtnode/util/lib/is-docker');
const isGitpod = require('@abtnode/util/lib/is-gitpod');
const pm2 = require('@abtnode/util/lib/pm2/async-pm2');
const getIP = require('@abtnode/util/lib/get-ip');
const sleep = require('@abtnode/util/lib/sleep');
const axios = require('@abtnode/util/lib/axios');
const cloud = require('@abtnode/util/lib/cloud');
const { formatError } = require('@blocklet/error');
const { updateServerDocument } = require('@abtnode/util/lib/did-document');
const { getProvider } = require('@abtnode/router-provider');
const portUsed = require('port-used');
const { decideHttpPort, decideHttpsPort } = require('@abtnode/router-provider/lib/util');
const codespaces = require('@abtnode/util/lib/codespaces');
const ensureEndpointHealthy = require('@abtnode/util/lib/ensure-endpoint-healthy');
const { isProcessRunningByPm2 } = require('@abtnode/util/lib/pm2/pm2-start-or-reload');

const {
  PROCESS_NAME_EVENT_HUB,
  DEFAULT_DESCRIPTION,
  DEFAULT_HTTP_PORT,
  NODE_MODES,
  DEFAULT_HTTPS_PORT,
  PROCESS_NAME_PM2_EVENT_HUB,
  BLOCKLET_MAX_MEM_LIMIT_IN_MB,
} = require('@abtnode/constant');
const gitUserName = require('git-user-name');

const pkg = require('../../package.json');
const { symbols, wrapSpinner } = require('../ui');
const { getInternalPort } = require('../port');
const debug = require('../debug')('util');
const getCLIBinaryName = require('./get-cli-binary-name');
const printError = require('./print-error');
const { print } = require('./print');

const { version } = require('../../package.json');
const { HELP_DOCS_GITHUB_CODESPACES_URL } = require('../constant');

function printInfo(...args) {
  print.apply(null, [symbols.info, ...args]);
}

function printSuccess(...args) {
  print.apply(null, [symbols.success, ...args]);
}

function printWarning(...args) {
  print.apply(null, [symbols.warning, ...args]);
}

const isValidYamlFileName = (filePath) => ['.yml', '.yaml'].includes(toLower(path.extname(filePath)));

function getNPMConfig(key) {
  const conf = rc('npm');
  return get(conf, key, '');
}

function getUserName(author) {
  return author || gitUserName() || os.userInfo().username;
}

function checkUpdate() {
  debug('check update');
  const UPDATE_CHECK_INTERVAL = 1000 * 60 * 60 * 24; // one day
  const notifier = updateNotifier({
    pkg: { name: pkg.name, version: pkg.version },
    updateCheckInterval: UPDATE_CHECK_INTERVAL,
  });
  if (notifier && notifier.update) {
    notifier.notify({
      message:
        // eslint-disable-next-line
        'New version available! ' +
        chalk.dim(notifier.update.current) +
        chalk.reset(' → ') +
        chalk.green(notifier.update.latest) +
        ' \nRun ' +
        chalk.cyan('blocklet server upgrade') +
        ' to get latest version',
    });
  }
}

const cleanupProcessByName = async (name) => {
  try {
    const [info] = await pm2.describeAsync(name);
    if (info) {
      await pm2.deleteAsync(name);
    }
  } catch {
    // ignore
  }
};

/**
 * @param {string} info.provider routing provider name
 * @param {number} info.httpPort
 * @param {number} info.httpsPort
 */
const checkRoutingProvider = async (info, { configDir } = {}) => {
  const Provider = getProvider(info.provider);
  if (!Provider) {
    return true;
  }

  const isHasRunning = await isProcessRunningByPm2(PROCESS_NAME_EVENT_HUB);
  if (isHasRunning) {
    return true;
  }

  const result = await Provider.check({ configDir });
  if (!result.available) {
    printError(result.error);
    printError('For more info on how to solve the problem: https://developer.blocklet.io/docs');
    return false;
  }

  // ensure ports are available for the routing engine
  if (!result.running && result.managed === false) {
    const httpPort = decideHttpPort(info.httpPort);
    if (await portUsed.check(httpPort)) {
      printError(
        `Port ${chalk.cyan(httpPort)} is required by routing engine ${chalk.cyan(
          info.provider
        )}, but already in use, please free the port before retry.`
      );
      return false;
    }

    const httpsPort = decideHttpsPort(info.httpsPort);
    if (await portUsed.check(httpsPort)) {
      printError(
        `Port ${chalk.cyan(httpsPort)} is required by routing engine ${chalk.cyan(
          info.provider
        )}, but already in use, please free the port before retry.`
      );
      return false;
    }
  }

  return true;
};

const stopRouting = async ({ info, routerDir }) => {
  const providerName = get(info, 'routing.provider', '');
  const Provider = getProvider(providerName);
  if (!Provider) {
    return;
  }

  const httpPort = info.routing.httpPort || DEFAULT_HTTP_PORT;
  const httpsPort = info.routing.httpsPort || DEFAULT_HTTPS_PORT;

  const provider = new Provider({ configDir: path.join(routerDir, providerName), httpPort, httpsPort });
  await provider.stop();
};

const getFileSize = (file) => {
  try {
    const stats = fs.statSync(file);
    return filesize(stats.size, { base: 2 });
  } catch (err) {
    return 'NaN';
  }
};

const getCLICommandName = () => {
  const binaryName = getCLIBinaryName();
  const [, , action] = process.argv;

  if (action === 'server') {
    return `${binaryName} ${action}`;
  }

  return binaryName;
};

const getCLIVersion = () => {
  return version;
};

function formatGQLError(error) {
  const err = error?.response?.data ?? error;
  if (Array.isArray(err?.errors)) {
    return err.errors.map((x) => x.message).join(', ');
  }

  return err.message;
}

/**
 * @param {Array} url[<url>]
 * @param {String} url[].url
 * @param {String} url[].type
 */
const printAccessUrls = (urls, indent = 0) => {
  const paddingLeft = Array.from(Array(indent).keys()).reduce((s) => `${s} `, '');
  const httpUrls = urls.filter((x) => x.url.startsWith('http://'));
  const httpsUrls = urls.filter((x) => x.url.startsWith('https://'));

  if (httpsUrls.length) {
    print(`\n${paddingLeft}Secure URLs (Recommended):\n`);
    httpsUrls.forEach((x) => print(chalk.cyan(`${paddingLeft}- ${x.url}`.padStart(10))));
  }

  if (httpUrls.length) {
    print(`\n${paddingLeft}HTTP URLs:\n`);
    httpUrls.forEach((x) => print(chalk.cyan(`${paddingLeft}- ${x.url}`.padStart(10))));
    print('');
  }
};

const getGitHash = (dir) => git.long(dir);

const getCliCwd = () => path.dirname(path.dirname(__dirname));

const startEventHub = async (logDir, maxMemoryRestart = BLOCKLET_MAX_MEM_LIMIT_IN_MB, ABT_NODE_SK = '') => {
  const port = getInternalPort(PROCESS_NAME_EVENT_HUB);
  const pm2EventHubPort = getInternalPort(PROCESS_NAME_PM2_EVENT_HUB);
  debug('start event hub', { port });

  const tryStartEventHub = async () => {
    try {
      await wrapSpinner('Starting event hub...', async () => {
        await pm2.startAsync({
          // Due to a pm2 bug, child processes inherit the namespace and many other parameters,
          // so the namespace here is intentionally set to 'blocklets' to be inherited by blocklet processes.
          namespace: 'blocklets',
          name: PROCESS_NAME_EVENT_HUB,
          script: './lib/process/event-hub.js',
          max_memory_restart: `${maxMemoryRestart}M`,
          output: path.join(logDir, 'event.output.log'),
          error: path.join(logDir, 'event.error.log'),
          wait_ready: false,
          listen_timeout: 3000,
          exec_mode: 'cluster',
          max_restarts: 3,
          cwd: getCliCwd(),
          time: true,
          pmx: false,
          env: {
            ABT_NODE_EVENT_PORT: port,
            ABT_NODE_EVENT_HTTP_PORT: pm2EventHubPort,
            ABT_NODE_SK,
          },
        });
        await ensureEndpointHealthy({
          protocol: 'tcp',
          port,
          timeout: 5 * 60 * 1000, // wait up to 5 minutes
          minConsecutiveTime: 2000,
        });
      });

      process.env.ABT_NODE_EVENT_PORT = port;
    } catch (err) {
      debug('Blocklet Event Hub start failed: ', err);
      printError(`Blocklet Event Hub start failed: ${err.message}`);
    }
  };

  await tryStartEventHub();

  return [port, pm2EventHubPort];
};

const killPm2Process = async (name) => {
  const [info] = await pm2.describeAsync(name);
  if (!info) {
    printWarning(`${name} is not running`);
    return null;
  }

  const proc = await pm2.deleteAsync(name);
  return proc;
};

const fixFiles = (meta, dir) => {
  const files = meta.files || ['blocklet.md', 'screenshots'];
  const packageFile = path.join(dir, 'package.json');
  let packageFiles = [];
  if (fs.existsSync(packageFile)) {
    try {
      const packageJson = JSON.parse(fs.readdirSync(packageFile).toString());
      if (Array.isArray(packageJson.files)) {
        packageFiles = packageJson.files.filter((x) => typeof x === 'string');
      }
    } catch (err) {
      // Do nothing
    }
  }

  const uniqFiles = uniq([...files, ...packageFiles]).filter((file) => {
    return !(!file || typeof file !== 'string');
  });

  meta.files = uniqFiles;
};

const getDevUrl = async ({
  isGitpod: _isGitpod = isGitpod,
  gitpodWorkspaceURL = process.env.GITPOD_WORKSPACE_URL,
  abtnodeHttpPort = process.env.ABT_NODE_HTTP_PORT,
  isDocker: _isDocker = isDocker,
  getUrl = () => '',
}) => {
  // Gitpod
  if (_isGitpod()) {
    const gitpodURL = gitpodWorkspaceURL;
    return gitpodURL.replace(/^https?:\/\//g, (p) => `${p}${abtnodeHttpPort}-`);
  }

  // Docker
  if (_isDocker() && !process.env.ABT_NODE_HOST) {
    return 'http://127.0.0.1';
  }

  // Local
  const url = await getUrl();
  return url || '';
};

const readInitInfoFromEc2 = () => {
  try {
    const info = fs.readFileSync(path.join(os.homedir(), '.arcblock/abtnode/user-data')).toString().trim();
    return JSON.parse(info);
  } catch {
    return {
      ownerDid: null,
      issuerDid: null,
      initialBlocklets: [],
    };
  }
};

const getVersionInfo = () => `${getCLIBinaryName()} ${process.argv[2]} v${version}`;

const printVersionTip = () => {
  print(chalk.bold(getVersionInfo()));
  debug(`Nodejs: ${process.version}`);
};

const checkTerminalProxy = (name) => {
  const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy || '';
  const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy || '';
  if (httpsProxy) {
    printWarning(
      chalk.black(chalk.bgYellow(`HTTPS_PROXY detected: ${httpsProxy}, which may cause ${name} not working properly.`))
    );
    printWarning(
      chalk.black(chalk.bgYellow(`If that happens, please clear the environment variable and restart ${name}.`))
    );
  } else if (httpProxy) {
    printWarning(
      chalk.black(chalk.bgYellow(`HTTP_PROXY detected: ${httpProxy}, which may cause ${name} not working properly.`))
    );
    printWarning(
      chalk.black(chalk.bgYellow(`If that happens, please clear the environment variable and restart ${name}.`))
    );
  }
};

const getIpDescription = async () => {
  let defaultIP = '';
  let nodeDescription = '';
  const ips = await getIP({ timeout: 1000 });

  if (isDocker()) {
    nodeDescription = 'Blocklet Server on docker';
  } else if (await cloud.isInCloud()) {
    defaultIP = ips.external || ips.internal; // use external ip by default on AWS EC2
    nodeDescription = `Blocklet Server on cloud [${defaultIP}]`;
  } else {
    defaultIP = ips.internal || ips.external; // use internal ip by default on local
    nodeDescription = `Blocklet Server on [${defaultIP}]`;
  }

  return { ip: defaultIP, description: nodeDescription };
};

const getDefaultName = () => `Blocklet Server [${os.userInfo().username}]`;

const getDefaultDescription = async () => {
  try {
    // eslint-disable-next-line no-use-before-define
    const { description } = await lib.getIpDescription(); // module.exports.getIpDescription is for unit test
    return description;
  } catch {
    // do nothing
    return DEFAULT_DESCRIPTION;
  }
};

const isDaemonIpAccessible = async ({ ip, port, adminPath }) => {
  try {
    const urlObj = new URL(`http://${ip}`);
    urlObj.port = port;
    urlObj.pathname = joinURL(adminPath, '/api/gql');

    const url = urlObj.href;

    const ping = async () => {
      debug(`ping daemon(${ip}:${port}), url: ${url}`);
      const { data } = await axios.post(
        url,
        JSON.stringify({
          query: `{
            getNodeInfo {
              code
              info {
                did
              }
            }
          }`,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 3 * 1000,
        }
      );

      const ok = !!get(data, 'data.getNodeInfo.info.did');
      if (!ok) {
        await sleep(1000);
        throw new Error('Daemon is unavailable');
      }
    };

    // Retry 2 times, 3 total ping attempts
    await pRetry(ping, { retries: 2 });
    return true;
  } catch (error) {
    debug(`check daemon ip(${ip}:${port}) is accessible failed`, error.message);
    return false;
  }
};

const getAccessibleIps = async (info, forceIntranet = false) => {
  const nodeHttpPort = info.routing.httpPort;

  const ips = await getIP({ includeExternal: !forceIntranet });
  const getDaemonPort = (port, defaultPort) => (port && port !== defaultPort ? `${port}` : '');
  const port = getDaemonPort(nodeHttpPort, DEFAULT_HTTP_PORT);
  const result = { internal: ips.internal };

  // In a cloud environment, fully trust the retrieved IP information
  if ((await cloud.isInCloud()) === true) {
    result.external = ips.external;
    return result;
  }

  // eslint-disable-next-line no-use-before-define
  if (await lib.isDaemonIpAccessible({ ip: ips.external, port, adminPath: info.routing.adminPath })) {
    result.external = ips.external;
  }

  return result;
};

const prettyAvailableModes = () =>
  Object.values(NODE_MODES)
    .map((d) => `"${d}"`)
    .join(', ');

const printInvalidModeInfo = () => {
  printError('Invalid mode');
  printInfo(`Valid mode should be ${prettyAvailableModes()}`);
};

const wrapDefaultStoreUrl =
  (url) =>
  ({ source: { name } }) => {
    printInfo(`Using store ${chalk.cyan(url)} to download component ${chalk.cyan(name)}`);
    return url;
  };

const isValidMode = (mode) => Object.values(NODE_MODES).includes(mode);

const ensurePermission = (dataDir) => {
  try {
    // eslint-disable-next-line no-bitwise
    fs.accessSync(dataDir, fs.constants.R_OK | fs.constants.W_OK);
  } catch (err) {
    printError(`Can not access directory ${chalk.cyan(dataDir)}, please check the permission`);
    process.exit(1);
  }
};

/**
 * if index.html or index.htm in not in folder meta.main (cwd: dir), throw error
 */
const checkEntryFileForStaticBlocklet = (meta, dir) => {
  const main = meta.main || '.';
  const mainDir = path.join(dir, main);
  const hasEntryFile =
    fs.existsSync(path.join(mainDir, 'index.html')) || fs.existsSync(path.join(mainDir, 'index.htm'));

  if (!hasEntryFile) {
    throw new Error(`Can not find index.html or index.htm in ${mainDir}`);
  }
};

const updateDidDocument = async (...args) => {
  try {
    await updateServerDocument(...args);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: formatError(err) };
  }
};

const getDaemonAccessUrls = async ({ info, wallet, getBaseUrls, forceIntranet }) => {
  let accessUrls = [];

  if (codespaces.isCodespaces()) {
    const url = codespaces.getAccessUrl({ port: info.routing.httpsPort, pathName: info.routing.adminPath });
    accessUrls.push({ url });
  } else {
    const accessibleIps = [];
    if (process.env.ABT_NODE_HOST) {
      accessibleIps.push(process.env.ABT_NODE_HOST);
    } else {
      const ips = await wrapSpinner(
        `Fetching accessible IPs (forceIntranet: ${JSON.stringify(forceIntranet)})...`,
        () => getAccessibleIps(info, forceIntranet),
        {
          throwOnError: false,
          printErrorFn: printError,
        }
      );

      if (ips.external) {
        accessibleIps.push(ips.external); // If public IP is accessible, it is the first element of accessibleIps
      }

      if (ips.internal) {
        accessibleIps.push(ips.internal);
      }
    }

    debug('accessible ips', accessibleIps);

    if (accessibleIps.length > 0) {
      if (wallet) {
        await wrapSpinner(
          'Updating DID Domain...',
          async () => {
            const result = await updateDidDocument({
              ips: [accessibleIps[0]],
              didRegistryUrl: info.didRegistry,
              wallet,
              domain: info.didDomain,
              blockletServerVersion: version,
            });

            if (result.status === 'success') {
              return;
            }

            throw new Error(result.message);
          },
          { throwOnError: false, printErrorFn: printError }
        );
      }

      printSuccess('You can access your Blocklet Server with either of the following URLs');
      accessUrls = await getBaseUrls(accessibleIps);
    }
  }

  return accessUrls;
};

const getProcessInfo = (name) =>
  new Promise((resolve, reject) => {
    pm2.describe(name, (err, [info]) => {
      if (err) {
        return reject(err);
      }

      return resolve(info);
    });
  });

const printCodespacesDevelopmentGuide = () => {
  printInfo(
    `For detailed guidance on developing blocklets in GitHub Codespaces, please visit: ${chalk.cyan(HELP_DOCS_GITHUB_CODESPACES_URL)}`
  );
};

const printBlockletDevelopmentGuide = () => {
  if (codespaces.isCodespaces()) {
    printCodespacesDevelopmentGuide();
  }
};

const lib = {
  checkRoutingProvider,
  checkTerminalProxy,
  print,
  printError,
  printInfo,
  printSuccess,
  printWarning,
  printBlockletDevelopmentGuide,
  isValidYamlFileName,
  getNPMConfig,
  checkUpdate,
  stopRouting,
  getFileSize,
  getCLIBinaryName,
  getCLICommandName,
  getCLIVersion,
  getAccessibleIps,
  formatGQLError,
  printAccessUrls,
  getGitHash,
  getCliCwd,
  startEventHub,
  killPm2Process,
  getUserName,
  fixFiles,
  getDevUrl,
  getWallet: getNodeWallet,
  readInitInfoFromEc2,
  getVersionInfo,
  printVersionTip,
  printInvalidModeInfo,
  getIpDescription,
  getDefaultName,
  getDefaultDescription,
  wrapDefaultStoreUrl,
  isValidMode,
  prettyAvailableModes,
  isDaemonIpAccessible,
  ensurePermission,
  checkEntryFileForStaticBlocklet,
  cleanupProcessByName,
  getDaemonAccessUrls,
  getProcessInfo,
};

module.exports = lib;
