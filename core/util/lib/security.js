const { BLOCKLET_MODES } = require('@blocklet/constant');
const crypto = require('crypto');
const AES = require('@ocap/mcrypto/lib/crypter/aes-legacy').default;
const semver = require('semver');
const uniq = require('lodash/uniq');
const { dirname, join, sep } = require('path');
const resolve = require('resolve/sync');
const { tmpdir, homedir } = require('os');
const which = require('which');
const { withHttps } = require('ufo');
const { exec } = require('child_process');
const { promisify } = require('util');

const cloneDeep = require('./deep-clone');

// trusted first-party blocklet DIDs; these components can receive extra permissions (such as --allow-worker, --allow-fs-read=*)
const TRUSTED_BLOCKLET_DIDS = [
  'z8iZiDFg3vkkrPwsiba1TLXy3H9XHzFERsP8o', // pages-kit
  'z8iZjMn7Hcyh93rKf8PqcSM94XnS8nRqSrPoP', // arcblock-metrics
];

const encrypt = (m, s, i) => AES.encrypt(m, crypto.pbkdf2Sync(i, s, 256, 32, 'sha512').toString('hex'));
const decrypt = (m, s, i) => AES.decrypt(m, crypto.pbkdf2Sync(i, s, 256, 32, 'sha512').toString('hex'));

const formatEnv = (raw, stringifyObject = true) => {
  let value = raw;

  // ensure no
  if (Array.isArray(value) && value.every((x) => x.originFileObj && x.url)) {
    value = value.map((x) => x.url);
    if (value.length === 1) {
      [value] = value;
    }
  }

  // ensure no objects
  if (stringifyObject) {
    if (value && typeof value === 'object') {
      value = JSON.stringify(value);
    }
  }

  // ensure no line breaks for environment variables
  if (value && typeof value === 'string') {
    value = value.replace(/(\r\n|\n|\r)/gm, ' ');
  }

  return value;
};

// https://github.com/joaquimserafim/base64-url/blob/54d9c9ede66a8724f280cf24fd18c38b9a53915f/index.js#L10
const escape = (str) => str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
const encodeEncryptionKey = (key) => escape(Buffer.from(key).toString('base64'));
const unescape = (str) => (str + '==='.slice((str.length + 3) % 4)).replace(/-/g, '+').replace(/_/g, '/');
const decodeEncryptionKey = (str) => new Uint8Array(Buffer.from(unescape(str), 'base64'));

const SAFE_NODE_VERSION = process.env.NODE_ENV === 'test' ? 'v20.0.0' : 'v21.6.0';
const canUseFileSystemIsolateApi = () => semver.gte(process.version, SAFE_NODE_VERSION);

// Node.js 22.22.0 introduced stricter permission model enforcement for symlink operations
// CVE-2025-55130: Symlink APIs (fs.symlink, fs.readlink, fs.lstat) now require BOTH read AND write permissions
// @see https://nodejs.org/en/blog/vulnerability/january-2025-security-releases
const NODE_SYMLINK_PERMISSION_VERSION = 'v22.22.0';
const requiresSymlinkSafePermissions = () => semver.gte(process.version, NODE_SYMLINK_PERMISSION_VERSION);

const getPm2Path = () => {
  try {
    return resolve('@arcblock/pm2', { basedir: __dirname });
  } catch (error) {
    return null;
  }
};

/**
 *
 * @param {string} executable
 * @returns
 */
function findExecutable(executable) {
  try {
    const fullPath = which.sync(executable);
    return fullPath;
  } catch (error) {
    return null;
  }
}

// cache permission options by Node.js version
const nodeStableOptionCache = new Map();

/**
 *
 * @param {string} optionsKey, example: '--permission'
 * @param {string[]} optionsValues, example: ['--permission', '--experimental-permission']
 * @return {Promise<string>}
 */
async function getNodeStableOption({ optionsKey, optionsValues }) {
  // @note: the frontend loads this whole file, so execAsync must be created here
  const execAsync = promisify(exec);
  const nodeVersion = process.version;
  const key = `${nodeVersion}.${optionsKey}`;

  // check cache
  if (nodeStableOptionCache.has(key)) {
    return nodeStableOptionCache.get(key);
  }

  try {
    const { stdout } = await execAsync('node -h');

    const permissionOption = optionsValues.find((option) => stdout.includes(option));
    if (!permissionOption) {
      throw new Error(`Can not get permission option: ${optionsKey} for this Node.js version: ${nodeVersion}`);
    }

    // cache result
    nodeStableOptionCache.set(key, permissionOption);
    return permissionOption;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * Check if a blocklet is trusted
 * Only the blocklet itself (by BLOCKLET_COMPONENT_DID) is checked.
 * Child blocklets do NOT inherit trust from their parent app.
 * @param {object} blocklet - Current blocklet
 * @returns {boolean}
 */
const isTrustedBlocklet = (blocklet) => {
  return TRUSTED_BLOCKLET_DIDS.includes(blocklet?.environmentObj?.BLOCKLET_COMPONENT_DID);
};

/**
 * @description
 * @see https://github.com/nodejs/node/issues/53621#issuecomment-2196879752
 * @param {import('@blocklet/server-js').BlockletState & { environmentObj: { [key: string]: string } }} blocklet
 * @param {true | false} enableFileSystemIsolation
 * @return {Promise<string>}
 */
const getSecurityNodeOptions = async (blocklet, enableFileSystemIsolation = true) => {
  const nodeOptions = process.env.NODE_OPTIONS ?? '';

  if (
    nodeOptions.includes('--experimental-permission') ||
    nodeOptions.includes('--permission') ||
    nodeOptions.includes('--allow-fs-read') ||
    nodeOptions.includes('--allow-fs-write') ||
    nodeOptions.includes('--allow-addons') ||
    nodeOptions.includes('--allow-child-process') ||
    nodeOptions.includes('--allow-worker')
  ) {
    console.error('getSecurityNodeOptions', {
      nodeOptions,
    });
    throw new Error(
      'process.env.NODE_OPTIONS should not include --experimental-permission or --permission or --allow-fs-read or --allow-fs-write or --allow-addons or --allow-child-process or --allow-worker'
    );
  }
  if (!blocklet) {
    throw new Error('blocklet is not defined');
  }

  // In debug mode, automatically skip the permission model; otherwise debugging cannot work properly. See: https://github.com/microsoft/vscode-js-debug/issues/2245#issuecomment-3045560337
  if (
    nodeOptions.includes('ms-vscode.js-debug/src/bootloader.js') &&
    (blocklet.mode === BLOCKLET_MODES.DEVELOPMENT ||
      blocklet.environmentObj.BLOCKLET_MODE === BLOCKLET_MODES.DEVELOPMENT)
  ) {
    return nodeOptions;
  }

  // trusted blocklets and their child components skip file permission management
  // Trusted blocklets and their children skip file permission management entirely
  if (isTrustedBlocklet(blocklet)) {
    return nodeOptions || '';
  }

  // @note: VS Code debug mode requires certain permissions
  const options = [nodeOptions].filter((x) => Boolean(x) && x !== 'undefined');

  if (!canUseFileSystemIsolateApi() || !enableFileSystemIsolation) {
    return options.join(' ').trim();
  }

  const pm2Path = getPm2Path();

  const meiliSearchPath = findExecutable('meilisearch');
  const meiliSearchPathAlt = '/data/bin/meilisearch';
  const blockletCliPath = findExecutable('blocklet');

  // @see: https://pnpm.io/npmrc#global-dir
  const pnpmGlobalPaths = [
    process.env.XDG_DATA_HOME ? join(process.env.XDG_DATA_HOME, 'pnpm/global/') : '',
    process.env.PNPM_HOME ? join(process.env.PNPM_HOME, 'global/') : '',
  ];

  const permissionOption = await getNodeStableOption({
    optionsKey: '--permission',
    optionsValues: ['--permission', '--experimental-permission'],
  });

  options.push(
    permissionOption,
    ...[
      blocklet.environmentObj.BLOCKLET_DATA_DIR, // allow each component to write it's own data
      blocklet.environmentObj.BLOCKLET_APP_DIR, // allow each component to write it's own source code: for example, to install dependencies
      blocklet.environmentObj.BLOCKLET_LOG_DIR,
      blocklet.environmentObj.BLOCKLET_CACHE_DIR,
      blocklet.environmentObj.BLOCKLET_APP_DATA_DIR
        ? join(blocklet.environmentObj.BLOCKLET_APP_DATA_DIR, '.projects')
        : '', // allow all components to access blocklet studio
      tmpdir(),
    ]
      .filter(Boolean)
      .map((dir) => `--allow-fs-write=${join(dir, '/*')}`),
    // @note: sqlite3 needs this
    '--allow-addons',
    // FIXME: many apps currently rely on child_process to install sqlite, so allow this temporarily; tighten the restriction once @blocklet/db is ready
    '--allow-child-process'
  );

  // @note: users should not be able to change runtime mode in production
  if (
    blocklet.mode === BLOCKLET_MODES.DEVELOPMENT ||
    blocklet.environmentObj.BLOCKLET_MODE === BLOCKLET_MODES.DEVELOPMENT
  ) {
    options.push('--allow-worker', '--allow-fs-read=*');
    options.push(`--allow-fs-write=${join(homedir(), '.npm', '_logs', '/*')}`);
  } else {
    options.push(
      ...[
        blocklet.environmentObj.BLOCKLET_LOG_DIR,
        blocklet.environmentObj.BLOCKLET_CACHE_DIR,
        blocklet.environmentObj.BLOCKLET_APP_DATA_DIR, // allow all components to read blocklet data
        dirname(dirname(blocklet.environmentObj.BLOCKLET_APP_DIR)), // allow all components to read source code
        // @note: without this, @arcblock/pm2.io cannot be found and static server cannot be used
        pm2Path && dirname(dirname(dirname(dirname(pm2Path)))),
        blockletCliPath,
        meiliSearchPath,
        meiliSearchPathAlt,
        dirname(dirname(process.execPath)),
        process.cwd(),
        tmpdir(),
        join(homedir(), '.cursor-server'),
        // @note: compatible with Cursor installation paths on macOS
        '/Applications/Cursor.app',
        ...pnpmGlobalPaths,
      ]
        .filter(Boolean)
        .filter((x) => x !== sep)
        .map((dir) => `--allow-fs-read=${join(dir, '/*')}`)
    );
  }

  return uniq(options).join(' ').trim();
};

const DEFAULT_HELMET_CONFIG = {
  // these defaults override helmet default configuration
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  originAgentCluster: false,
  strictTransportSecurity: true,
  xContentTypeOptions: true,
  xDnsPrefetchControl: false,
  xDownloadOptions: false,
  xPermittedCrossDomainPolicies: false,
  // the following settings can be configured in the service management UI
  contentSecurityPolicy: false,
  referrerPolicy: false,
  xFrameOptions: false,
  xPoweredBy: true, // means whether to remove the powered-by header, so the default should be true
  xXssProtection: false,
};

function patchValueIntoDirectives(directives, key, value) {
  const currentValue = cloneDeep(directives[key] || []);
  currentValue.push(...value);
  return [...new Set(currentValue)];
}

async function patchResponseHeader(rawConfig, { node, blocklet, trustedDomains = [], info }) {
  if (!rawConfig?.contentSecurityPolicy?.directives) {
    return rawConfig;
  }

  const config = cloneDeep(rawConfig);
  config.contentSecurityPolicy.directives['default-src'] = patchValueIntoDirectives(
    config.contentSecurityPolicy.directives,
    'default-src',
    ["'self'"]
  );

  if (process.env.NODE_ENV === 'development') {
    config.contentSecurityPolicy.directives['script-src'] = patchValueIntoDirectives(
      config.contentSecurityPolicy.directives,
      'script-src',
      ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
    );
    config.contentSecurityPolicy.directives['connect-src'] = patchValueIntoDirectives(
      config.contentSecurityPolicy.directives,
      'connect-src',
      [
        "'self'",
        // services rely on this URL for hot reload during development
        'ws://localhost:3040',
      ]
    );
  }

  const nodeInfo = info || (await node.getNodeInfo({ useCache: true }));
  // adding domain aliases requires allowing the .well-known/ping endpoint
  let domainAliases = await node.getBlockletDomainAliases({ blocklet, nodeInfo });
  domainAliases = (domainAliases || []).map((x) => x.value);

  config.contentSecurityPolicy.directives['connect-src'] = patchValueIntoDirectives(
    config.contentSecurityPolicy.directives,
    'connect-src',
    [
      "'self'",
      ...domainAliases.filter((x) => x).map((x) => `https://${x}/.well-known/ping`),

      // the following three domains are Iconify services
      'https://api.simplesvg.com',
      'https://api.iconify.design',
      'https://api.unisvg.com',
    ]
  );

  config.contentSecurityPolicy.directives['script-src'] = patchValueIntoDirectives(
    config.contentSecurityPolicy.directives,
    'script-src',
    [
      "'self'",
      // Stripe service
      'https://js.stripe.com',
    ]
  );
  config.contentSecurityPolicy.directives['frame-src'] = patchValueIntoDirectives(
    config.contentSecurityPolicy.directives,
    'frame-src',
    [
      "'self'",
      // Stripe service
      'https://js.stripe.com',
      ...trustedDomains.filter(Boolean).map((x) => `https://${x}`),
    ]
  );

  config.contentSecurityPolicy.directives['frame-ancestors'] = patchValueIntoDirectives(
    config.contentSecurityPolicy.directives,
    'frame-ancestors',
    [
      "'self'",
      ...(blocklet.settings.userSpaceHosts || []).map((x) => `https://${x}`),
      ...trustedDomains.filter(Boolean).map((x) => `https://${x}`),
    ]
  );

  return config;
}

async function patchCors(rawConfig, { node, blocklet, info }) {
  const config = cloneDeep(rawConfig);
  if (config?.origin?.smart) {
    // get all domain aliases for the current app itself
    const result = [];
    result.push(...(config.origin?.value || []));
    const nodeInfo = info || (await node.getNodeInfo({ useCache: true }));
    let domainAliases = await node.getBlockletDomainAliases({ blocklet, nodeInfo });
    domainAliases = (domainAliases || []).map((x) => x.value);
    result.push(...domainAliases.map((x) => withHttps(x)));
    // get all domain aliases for all federated login sites
    const federated = blocklet.settings.federated || {};
    const sites = (federated?.sites || []).filter((x) => x?.isMaster !== false || x.status === 'approved');
    const siteAlias = [];
    for (const site of sites) {
      siteAlias.push(new URL(site.appUrl).hostname);
      siteAlias.push(...(site.aliasDomain || []));
    }
    result.push(...siteAlias.map((x) => withHttps(x)));
    config.origin.value = [...new Set(result)];
  }
  return config;
}

function cleanConfigOverride(config) {
  const result = cloneDeep(config);
  for (const configKey of Object.keys(result)) {
    result[configKey] = result[configKey]?.value ?? result[configKey];
  }
  return result;
}
function keepConfigOverride(config) {
  const result = cloneDeep(config);
  for (const configKey of Object.keys(result)) {
    result[configKey] = result[configKey]?.override ?? false;
  }
  return result;
}

module.exports = {
  encrypt,
  decrypt,
  formatEnv,
  encodeEncryptionKey,
  decodeEncryptionKey,
  canUseFileSystemIsolateApi,
  requiresSymlinkSafePermissions,
  getSecurityNodeOptions,
  patchResponseHeader,
  patchCors,
  cleanConfigOverride,
  keepConfigOverride,

  DEFAULT_HELMET_CONFIG,
  SAFE_NODE_VERSION,
  NODE_SYMLINK_PERMISSION_VERSION,
};
