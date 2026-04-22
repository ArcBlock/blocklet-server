const fs = require('fs');
const crypto = require('crypto');
const chalk = require('chalk');
const yaml = require('js-yaml');
const { types, getRandomBytes } = require('@ocap/mcrypto');
const { fromRandom, fromSecretKey, WalletType } = require('@ocap/wallet');
const inquirer = require('inquirer');
const isUrl = require('is-url');
const security = require('@abtnode/util/lib/security');
const isValidPort = require('@abtnode/util/lib/is-valid-port');
const normalizePathPrefix = require('@abtnode/util/lib/normalize-path-prefix');
const { getProviderNames, findExistsProvider, getProvider } = require('@abtnode/router-provider');
const {
  DEFAULT_DAEMON_PORT,
  BLOCKLET_MAX_MEM_LIMIT_IN_MB,
  DAEMON_MAX_MEM_LIMIT_IN_MB,
  WELLKNOWN_SERVER_ADMIN_PATH,
  DEFAULT_WILDCARD_CERT_HOST,
  DEFAULT_IP_DOMAIN,
  MAX_UPLOAD_FILE_SIZE,
  NODE_MODES,
  DEFAULT_DID_REGISTRY,
  DEFAULT_DID_DOMAIN,
  DEFAULT_SLP_DOMAIN,
  BLOCKLET_LAUNCHER_URL,
} = require('@abtnode/constant');

const debug = require('../../debug')('init');
const {
  print,
  printInfo,
  printError,
  printSuccess,
  printWarning,
  getCLICommandName,
  readInitInfoFromEc2,
  getDefaultName,
  getDefaultDescription,
  isValidMode,
  prettyAvailableModes,
} = require('../../util');
const {
  getBaseConfigDataDirectory,
  joinConfigFile,
  joinKFile,
  joinConfigDir,
  getConfigDirFromCurrentDir,
  verifyDataDirectory,
} = require('../../manager');

const { version } = require('../../../package.json');

const isValidDaemonMemoryLimit = (x) => Number(x) >= 0.5 && Number(x) <= 128;
const isValidBlockletMemoryLimit = (x) => Number(x) >= 0.2 && Number(x) <= 64;

async function getQuestions({
  defaultName,
  defaultDescription,
  defaultHttps,
  defaultHttpPort,
  defaultHttpsPort,
  defaultWebWalletUrl,
}) {
  const defaultProvider = await findExistsProvider();
  const providerNames = getProviderNames();

  const questions = [
    {
      type: 'text',
      name: 'name',
      message: 'Naming the server?',
      validate: (v) => (v.trim() ? true : 'Please input a valid name'),
      default: defaultName,
    },
    {
      type: 'text',
      name: 'description',
      message: 'Description of the server?',
      validate: (v) => (v.trim() ? true : 'Please input a valid description'),
      default: defaultDescription,
    },
    {
      type: 'number',
      name: 'port',
      message: 'Which port do you want your server to listen on?',
      validate: (v) => (isValidPort(v) ? true : 'Please input a valid port'),
      default: isValidPort(Number(process.env.ABT_NODE_PORT)) ? Number(process.env.ABT_NODE_PORT) : DEFAULT_DAEMON_PORT,
    },
    {
      type: 'list',
      name: 'provider',
      message: 'Choose routing engine',
      choices: [...providerNames],
      default: defaultProvider,
    },
    {
      type: 'text',
      name: 'adminPath',
      message: 'Where do you want to mount your admin dashboard?',
      validate: (v) => (v.trim() ? true : 'Please input a valid path prefix'),
      default: WELLKNOWN_SERVER_ADMIN_PATH,
    },
    {
      type: 'text',
      name: 'webWalletUrl',
      message: 'Which web wallet do you want to use?',
      validate: (v) => (isUrl(v.trim()) ? true : 'Please input a valid url'),
      default: defaultWebWalletUrl,
    },
    {
      type: 'confirm',
      name: 'https',
      message: 'Do you want to enable https support for dashboard and blocklets',
      default: defaultHttps,
    },
    {
      type: 'text',
      name: 'ipWildcardDomain',
      message: "What's ip wildcard domain?", // eslint-disable-line quotes
      validate: (v) => (v.trim() ? true : 'Please input a valid dashboard domain'),
      default: DEFAULT_IP_DOMAIN,
    },
    {
      type: 'text',
      name: 'wildcardCertHost',
      message: 'Where to download the wildcard certificate?',
      validate: (v) => (isUrl(v) ? true : 'Please input a valid download address url'),
      default: process.env.ABT_NODE_WILDCARD_CERT_HOST || DEFAULT_WILDCARD_CERT_HOST,
    },
    {
      name: 'maxUploadFileSize',
      message: 'Max Upload File Size allowed by the server (MB)?',
      validate: (v) => (Number.isInteger(+v) && +v > 0 ? true : 'Please input a positive integer'),
      // eslint-disable-next-line max-len
      default: Number(process.env.MAX_UPLOAD_FILE_SIZE) > 0 ? Number(process.env.MAX_UPLOAD_FILE_SIZE) : MAX_UPLOAD_FILE_SIZE, // prettier-ignore
    },
    {
      type: 'number',
      name: 'httpPort',
      message: 'Which http port do you want your service gateway to listen on?',
      validate: (v) => (isValidPort(v) ? true : 'Please input a valid port'),
      default: isValidPort(Number(process.env.ABT_NODE_HTTP_PORT))
        ? Number(process.env.ABT_NODE_HTTP_PORT)
        : Number(defaultHttpPort),
    },
    {
      type: 'number',
      name: 'httpsPort',
      message: 'Which https port do you want your service gateway to listen on?',
      validate: (v) => (isValidPort(v) ? true : 'Please input a valid port'),
      default: isValidPort(Number(process.env.ABT_NODE_HTTPS_PORT))
        ? Number(process.env.ABT_NODE_HTTPS_PORT)
        : Number(defaultHttpsPort),
    },
    {
      type: 'number',
      name: 'daemonMaxMemoryLimit',
      message: 'What is the max memory limit of Blocklet Server (GB)?',
      validate: (v) => (isValidDaemonMemoryLimit(v) ? true : 'The memory limit must between 0.5 ~ 128'),
      default: DAEMON_MAX_MEM_LIMIT_IN_MB / 1000,
    },
    {
      type: 'number',
      name: 'blockletMaxMemoryLimit',
      message: 'What is the max memory limit of each Blocklet (GB)?',
      validate: (v) => (isValidBlockletMemoryLimit(v) ? true : 'The memory limit must between 0.5 ~ 128'),
      default: BLOCKLET_MAX_MEM_LIMIT_IN_MB / 1000,
    },
  ];

  return questions;
}

const askQuestions = async (interactive, defaultAnswers = {}) => {
  const questions = await getQuestions(defaultAnswers);
  if (!interactive) {
    debug('init in non-interactive mode by accepting the defaults');
    return questions.reduce((acc, x) => {
      acc[x.name] = x.default;
      return acc;
    }, {});
  }

  return inquirer.prompt(questions);
};

exports.run = async ({
  interactive = false,
  force,
  mode: defaultMode = NODE_MODES.PRODUCTION,
  https: defaultHttps = true,
  httpPort: defaultHttpPort = 80,
  httpsPort: defaultHttpsPort = 443,
  ownerNftHolder,
  ownerNftIssuer,
  disablePassportIssuance: defaultDisablePassportIssuance,
  trustedPassportIssuer: defaultTrustedPassportIssuer,
  webWalletUrl: defaultWebWalletUrl,
  sk,
  yes,
}) => {
  const effectiveForce = force === true || yes === true;
  const customSk = sk || process.env.ABT_NODE_SK;
  const workingDir = process.cwd();
  const baseConfigDirectory = getBaseConfigDataDirectory(workingDir);

  if (baseConfigDirectory) {
    print(`Can't initialize in a configuration data directory: ${baseConfigDirectory}`);
    process.exit(1);
  }

  const existedConfigDir = getConfigDirFromCurrentDir(workingDir);
  if (existedConfigDir) {
    try {
      verifyDataDirectory(existedConfigDir);
    } catch (error) {
      debug('validate configuration directory error', error);
      printError('The data directory already exists, but there is an error:', error.message);
      process.exit(1);
    }

    print('The data directory already exists in the current directory');
    printInfo(`Run ${chalk.cyan(`${getCLICommandName()} start`)} to start`);
    process.exit(0);
  }

  if (!isValidMode(defaultMode)) {
    printError('Invalid mode');
    printInfo(`Valid mode should be ${prettyAvailableModes()}`);
    process.exit(1);
  }

  if (!isValidPort(Number(defaultHttpPort))) {
    printError('Invalid http port');
    printInfo('Valid http port should be 0-65535');
    process.exit(1);
  }

  if (!isValidPort(Number(defaultHttpsPort))) {
    printError('Invalid https port');
    printInfo('Valid https port should be 0-65535');
    process.exit(1);
  }

  if (effectiveForce !== true) {
    const { confirmCreate } = await inquirer.prompt({
      type: 'confirm',
      name: 'confirmCreate',
      message: `Are you sure to initialize a Blocklet Server instance in the current directory(${workingDir})`,
      default: false,
    });

    if (!confirmCreate) {
      print('Aborted!');
      process.exit(0);
    }
  }

  const type = WalletType({
    role: types.RoleType.ROLE_APPLICATION,
    pk: types.KeyType.ED25519,
    hash: types.HashType.SHA3,
  });
  let wallet = fromRandom(type);
  if (customSk) {
    try {
      wallet = fromSecretKey(customSk, type);
      printInfo(`Using custom secret key: ${wallet.address}`);
    } catch (err) {
      printError(`Invalid custom secret key: ${err.message}`);
      process.exit(1);
    }
  }

  let interactiveCreate = interactive;
  if (effectiveForce === true) {
    interactiveCreate = false;
  }

  const {
    name,
    description,
    ownerDid,
    issuerDid,
    initialBlocklets,
    launcher,
    launcherSessionId,
    didRegistry,
    didDomain,
    slpDomain,
    webWalletUrl = defaultWebWalletUrl,
    disablePassportIssuance = defaultDisablePassportIssuance,
    trustedPassportIssuer = defaultTrustedPassportIssuer,
  } = readInitInfoFromEc2();

  const answers = await askQuestions(interactiveCreate, {
    defaultName: name || getDefaultName(),
    defaultDescription: description || (await getDefaultDescription()),
    defaultHttps,
    defaultHttpPort,
    defaultHttpsPort,
    defaultWebWalletUrl: webWalletUrl,
  });
  const {
    name: abtnodeName,
    description: abtnodeDescription,
    port,
    provider,
    adminPath,
    wildcardCertHost,
    ipWildcardDomain,
    maxUploadFileSize,
    https,
    daemonMaxMemoryLimit,
    blockletMaxMemoryLimit,
  } = answers;
  let { httpPort, httpsPort } = answers;

  // Ensure routing engine exist
  const Provider = getProvider(provider);
  try {
    if (Provider) {
      const exists = await Provider.exists();
      if (!exists) {
        printWarning(`Routing engine ${provider} does not exists`);
      }
    }
  } catch (error) {
    debug(error);
    printError(`Routing engine availability check failed: ${error.message}`);
    printInfo(`Checkout out documentation for help: ${chalk.cyan('https://developer.blocklet.io/docs')}`);
    printInfo('The above issue must be resolved to make blocklet server work');
    process.exit(1);
  }

  // Ensure selected ports are available
  if (httpPort === 80 && httpsPort === 443) {
    const result = await Provider.getUsablePorts();
    if (result) {
      if (result.httpPort !== httpPort) {
        printWarning(`Pick ${result.httpPort} as http port since ${httpPort} is not available`);
      }
      if (result.httpsPort !== httpsPort) {
        printWarning(`Pick ${result.httpsPort} as https port since ${httpsPort} is not available`);
      }

      // eslint-disable-next-line no-param-reassign
      httpPort = result.httpPort;
      // eslint-disable-next-line no-param-reassign
      httpsPort = result.httpsPort;
    }
  }

  const ownerNft = { holder: ownerNftHolder, issuer: ownerNftIssuer };
  if (!ownerNftHolder || !ownerNftIssuer) {
    ownerNft.holder = ownerDid;
    ownerNft.issuer = issuerDid;
  }

  if (launcherSessionId) {
    ownerNft.launcherSessionId = launcherSessionId;
  }

  ownerNft.holder = ownerNft.holder || '';
  ownerNft.issuer = ownerNft.issuer || '';

  const dk = crypto.randomBytes(32);
  const config = {
    node: {
      name: abtnodeName.trim(),
      description: abtnodeDescription.trim(),
      mode: defaultMode,
      version,
      sk: security.encrypt(wallet.secretKey, wallet.address, dk),
      pk: wallet.publicKey,
      did: wallet.address,
      port: +port,
      secret: getRandomBytes(32),
      owner: { pk: '', did: '' },
      ownerNft,
      routing: {
        provider,
        adminPath: normalizePathPrefix(adminPath || WELLKNOWN_SERVER_ADMIN_PATH),
        headers: { 'X-Powered-By': `"Blocklet Server/${version}"` },
        maxUploadFileSize: Number(maxUploadFileSize),
        https: !!https,
        httpPort: +httpPort,
        httpsPort: +httpsPort,
        wildcardCertHost: wildcardCertHost.trim(),
        ipWildcardDomain: ipWildcardDomain.trim(),
        enableDefaultServer: false,
        enableIpServer: false,
      },
      runtimeConfig: {
        daemonMaxMemoryLimit: Math.floor(daemonMaxMemoryLimit * 1024),
        blockletMaxMemoryLimit: Math.floor(blockletMaxMemoryLimit * 1024),
      },
      registerUrl: process.env.ABT_NODE_BLOCKLET_LAUNCHER_URL || BLOCKLET_LAUNCHER_URL,
      didRegistry: (process.env.ABT_NODE_DID_REGISTRY || didRegistry || DEFAULT_DID_REGISTRY).trim(),
      didDomain: (process.env.ABT_NODE_DID_DOMAIN || didDomain || DEFAULT_DID_DOMAIN).trim(),
      slpDomain: (process.env.ABT_NODE_SLP_DOMAIN || slpDomain || DEFAULT_SLP_DOMAIN).trim(),
      enablePassportIssuance: !disablePassportIssuance,
      trustedPassports: [trustedPassportIssuer].filter(Boolean).map((x) => ({ issuerDid: x, mappings: [] })),
      webWalletUrl: answers.webWalletUrl.trim(),
      database: {
        engine: 'sqlite',
      },
    },
    blocklet: {
      port, // note: this is required to tell core that blocklet port starts from `node.port + 1`
    },
    initialize: {
      blocklets: initialBlocklets || [],
    },
  };

  if (launcher) {
    config.node.launcher = launcher;
  }

  debug('generated config', config);

  try {
    const configDir = joinConfigDir(workingDir);
    const configFile = joinConfigFile(configDir);

    fs.mkdirSync(configDir);
    fs.writeFileSync(joinKFile(configDir), dk, { encoding: 'binary', mode: '0600' });
    fs.writeFileSync(configFile, yaml.dump(config));

    printSuccess(`Blocklet Server configuration is successfully generated ${chalk.cyan(configFile)}`);
    printInfo(chalk.cyan(`${getCLICommandName()} start`));
    print();

    process.exit(0);
  } catch (err) {
    printError(`Failed to generate config ${err.message}`);
    process.exit(1);
  }
};
