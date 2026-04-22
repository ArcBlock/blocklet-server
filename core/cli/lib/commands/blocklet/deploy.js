/* eslint-disable indent */
require('dotenv-flow').config({ silent: true, node_env: 'development' });

const fs = require('fs');
const path = require('path');
const expandTilde = require('expand-tilde');
const chalk = require('chalk');
const { joinURL } = require('ufo');

const { isValid: isValidDid, toAddress } = require('@arcblock/did');
const Client = require('@blocklet/server-js');
const hashFiles = require('@abtnode/util/lib/hash-files');
const { default: axios } = require('axios');
const { validateBlockletEntry } = require('@blocklet/meta/lib/entry');
const { hasMountPoint } = require('@blocklet/meta/lib/engine');
const { BLOCKLET_BUNDLE_FOLDER } = require('@blocklet/constant');
const { hasReservedKey } = require('@blocklet/meta/lib/has-reserved-key');
const { urlPathFriendly } = require('@blocklet/meta/lib/url-path-friendly');
const { WELLKNOWN_SERVICE_PATH_PREFIX, SERVER_ROLES } = require('@abtnode/constant');
const ensureServerEndpoint = require('@abtnode/util/lib/ensure-server-endpoint');
const makeFormData = require('@abtnode/util/lib/make-from-data');

const { createConnect } = require('@blocklet/store');
const open = require('open');
const inquirer = require('inquirer');
const { createRelease } = require('@abtnode/util/lib/create-blocklet-release');

const Config = require('../../util/blocklet/config');
const {
  print,
  printError,
  printInfo,
  printSuccess,
  printWarning,
  formatGQLError,
  getCLIBinaryName,
} = require('../../util');
const { wrapSpinner } = require('../../ui');
const { getNode } = require('../../node');
const { checkRunning, deployManager } = require('../../manager');
const { version } = require('../../../package.json');

const { signWithAccessKey, validateAccessKey } = Client;
const { printDeployFileInfo } = deployManager;

function getFilename(input) {
  try {
    if (input.startsWith('http://') || input.startsWith('https://') || input.startsWith('file://')) {
      const url = new URL(input);
      return path.basename(url.pathname);
    }
  } catch (err) {
    // ignore invalid URL parsing
  }

  // Handle local path or filename — extract the base filename
  return path.basename(input);
}

async function confirmOpenConnectPage(
  message = 'No access key found, do you need to open the connect page to generate access key?'
) {
  const { isOpenConnectPage } = await inquirer.prompt([
    {
      name: 'isOpenConnectPage',
      type: 'confirm',
      default: true,
      message,
    },
  ]);

  return isOpenConnectPage;
}

const deploy = async (
  dir,
  { endpoint, accessKey, accessSecret, appDid, appId, mountPoint: inputMountPoint, incremental = false }
) => {
  let bundleDir = dir;
  if (fs.existsSync(path.join(dir, BLOCKLET_BUNDLE_FOLDER))) {
    bundleDir = path.join(dir, BLOCKLET_BUNDLE_FOLDER);
  }

  const releaseMetaPath = path.join(bundleDir, '..', 'release', 'blocklet.json');
  if (!fs.existsSync(releaseMetaPath)) {
    printInfo('No release found, create release...');
    await createRelease(path.join(bundleDir, '..'));
    if (!fs.existsSync(releaseMetaPath)) {
      throw new Error('Failed to create release meta');
    }
  }

  // get local blocklet meta
  let localMeta;
  try {
    localMeta = JSON.parse(fs.readFileSync(releaseMetaPath, 'utf-8'));
  } catch (error) {
    throw new Error(`Get blocklet meta failed: ${error.message}`);
  }
  // build tarFile
  const tarFile = path.join(bundleDir, '..', 'release', getFilename(localMeta.dist.tarball));
  if (!fs.existsSync(tarFile)) {
    printInfo('No release found, create release...');
    await createRelease(path.join(bundleDir, '..'));
    if (!fs.existsSync(releaseMetaPath)) {
      throw new Error('Failed to create release meta');
    }
  }

  const rootDid = appDid || appId;

  const fullEndpoint = joinURL(endpoint, '/api/gql');

  const client = new Client(fullEndpoint, `BlockletCLI/${version}`);
  client.setAuthAccessKey({
    accessKeyId: accessKey,
    accessKeySecret: accessSecret,
  });

  // check mountPoint when deploy a component
  let app = null;
  try {
    const result = await client.getBlocklet(
      { input: { did: rootDid, attachRuntimeInfo: false } },
      { headers: { 'x-access-blocklet': rootDid } }
    );
    app = result.blocklet;
  } catch (error) {
    printError('get blocklet error', error?.message);
    throw error;
  }

  if (!app) {
    printError(`App ${chalk.cyan(rootDid)} not found`);
    process.exit(1);
  }

  if (new URL(endpoint).protocol === 'http:' && new URL(endpoint).hostname !== '127.0.0.1') {
    printWarning(
      `You are deploying to an insecure endpoint of ${chalk.cyan('http')} protocol, you should use ${chalk.cyan(
        'https'
      )} to achieve better security.`
    );
  }

  printInfo(
    `Try to deploy ${chalk.cyan(`${localMeta.title}@${localMeta.version}`)} from`,
    `${chalk.cyan(bundleDir)} to ${chalk.cyan(app.meta.title)} in server ${chalk.cyan(endpoint)}.`
  );

  if (hasReservedKey(localMeta.environments)) {
    throw new Error('Blocklet key of environments can not start with `ABT_NODE_` or `BLOCKLET_`');
  }

  // mountPoint
  let mountPoint;
  if (hasMountPoint(localMeta)) {
    if (inputMountPoint) {
      mountPoint = inputMountPoint;
      printInfo(`Use mountPoint from input: ${chalk.cyan(inputMountPoint)}`);
    } else if (process.env.BLOCKLET_DEPLOY_MOUNT_POINT) {
      printInfo(`Use mountPoint from env: ${chalk.cyan(process.env.BLOCKLET_DEPLOY_MOUNT_POINT)}`);
      mountPoint = process.env.BLOCKLET_DEPLOY_MOUNT_POINT;
    } else {
      const { name, title } = localMeta;
      mountPoint = `/${urlPathFriendly(title) || urlPathFriendly(name)}`.toLowerCase();
      printInfo(`Use default mountPoint: ${chalk.cyan(mountPoint)}`);
    }
  } else {
    mountPoint = `/${localMeta.did}`;
    printInfo(`Use fake mountPoint: ${chalk.cyan(mountPoint)}`);
  }

  // ensure entry file/folder exist
  try {
    await validateBlockletEntry(bundleDir, localMeta);
  } catch (err) {
    throw new Error(err.message);
  }

  // get hashFiles
  const { files } = await hashFiles(bundleDir);

  // check node_modules
  const fileNames = Object.keys(files);
  for (let i = 0; i < fileNames.length; i++) {
    if (fileNames[i].includes('node_modules') && !fileNames[i].includes('node_modules_os_lock')) {
      printError(`${chalk.bold('node_modules')} cannot be in the list of uploaded files:`, fileNames[i]);
      process.exit();
    }
  }

  let blockletDiff;
  if (incremental) {
    printInfo('Incremental mode, fetching blocklet diff...');
    try {
      blockletDiff = await client.getBlockletDiff(
        {
          input: {
            did: localMeta.did,
            hashFiles: Object.entries(files).map(([file, hash]) => ({ file, hash })),
            rootDid: rootDid || '',
          },
        },
        {
          headers: {
            'x-access-blocklet': rootDid,
          },
        }
      );
    } catch (error) {
      throw new Error(`Blocklet deploy failed when fetching diff: ${formatGQLError(error)}`);
    }
  }

  const {
    addSet = [],
    changeSet = [],
    deleteSet = [],
    hasBlocklet: hasDiff,
    version: serverVersion,
  } = blockletDiff?.blockletDiff || {};

  printInfo(`Name: ${chalk.cyan(localMeta.name)}`);
  printInfo(`DID: ${chalk.cyan(localMeta.did)}`);
  printInfo(`Version: ${chalk.cyan(localMeta.version)}`);

  if (hasDiff) {
    printDeployFileInfo(addSet, changeSet, deleteSet);
  } else {
    printDeployFileInfo(Object.keys(files));
  }

  // do upload
  const { form } = makeFormData({
    tarFile,
    hasDiff,
    did: localMeta.did,
    serverVersion,
    deleteSet,
    mountPoint,
    rootDid,
    dist: {
      tarball: localMeta.dist.tarball,
      integrity: localMeta.dist.integrity,
    },
  });

  try {
    const timestamp = Date.now();
    const timer = setInterval(() => {
      // travis will close task if no output has been received in the last 10m0s
      if (process.env.CI && process.env.TRAVIS) {
        print('Uploading...');
      }
    }, 1000 * 500);
    const signature = await signWithAccessKey({
      accessKeyId: accessKey,
      accessKeySecret: accessSecret,
      message: `${timestamp}-${accessKey}`,
    });

    const res = await wrapSpinner(`Uploading ${localMeta.name}...`, () =>
      axios({
        url: fullEndpoint,
        method: 'POST',
        data: form,
        headers: {
          ...form.getHeaders(),
          'user-agent': `BlockletCLI/${version}`,
          'x-access-key-id': accessKey,
          'x-access-stamp': timestamp,
          'x-access-signature': signature,
          'x-access-blocklet': rootDid,
        },
        timeout: 1000 * 60 * 30, // 30min
        // max file size is limited by server, so here is infinity
        maxContentLength: Number.POSITIVE_INFINITY,
        maxBodyLength: Number.POSITIVE_INFINITY,
      })); // prettier-ignore
    clearInterval(timer);
    if (Array.isArray(res.data.errors) && res.data.errors.length) {
      const error = new Error('GraphQL Response Error');
      error.errors = res.data.errors;
      throw error;
    }
    printSuccess(
      `${chalk.cyan(localMeta.title)}@${chalk.cyan(localMeta.version)} was successfully deployed to ${chalk.cyan(
        app.meta.title
      )} in server ${chalk.cyan(endpoint)}.`
    );
  } catch (error) {
    throw new Error(`Blocklet deploy failed when uploading: ${formatGQLError(error)}`);
  }
};

const getNodeAsync = async ({ dir }) => {
  const { node } = await getNode({ dir });
  return new Promise((resolve) => {
    node.onReady(() => resolve({ node }));
  });
};

const deployToLocal = async (dir, opts) => {
  const isRunning = await checkRunning();
  if (!isRunning) {
    const startCommand = chalk.cyan(`${getCLIBinaryName()} start`);
    printError('Blocklet Server is not running, can not deploy anything!');
    printInfo(`To start Blocklet Server, use ${startCommand}`);
    process.exit(1);
  }

  const { node } = await getNodeAsync({ dir: process.cwd() });

  const nodeInfo = await node.getNodeInfo();
  const endpoint = `http://127.0.0.1:${nodeInfo.port}`;

  const { accessKeyId, accessKeySecret } = await node.createAccessKey(
    { teamDid: nodeInfo.did, remark: '@blocklet/cli', passport: SERVER_ROLES.CI },
    { user: { fullName: '@blocklet/cli', passports: [{ role: SERVER_ROLES.CI, status: 'valid' }] } }
  );

  try {
    await deploy(dir, {
      endpoint,
      accessKey: accessKeyId,
      accessSecret: accessKeySecret,
      ...opts,
    });
    await node.deleteAccessKey(
      { teamDid: nodeInfo.did, accessKeyId },
      { user: { fullName: '@blocklet/cli', role: SERVER_ROLES.BLOCKLET_SDK } }
    );
    process.exit(0);
  } catch (err) {
    printError(err.message);
    await node.deleteAccessKey(
      { teamDid: nodeInfo.did, accessKeyId },
      { user: { fullName: '@blocklet/cli', role: SERVER_ROLES.BLOCKLET_SDK } }
    );
    process.exit(1);
  }
};

const deployToRemote = async (dir, opts) => {
  try {
    await deploy(dir, opts);
    process.exit(0);
  } catch (err) {
    printError(err.message);
    process.exit(1);
  }
};

const checkAppID = (opts) => {
  if (!opts.appDid && !opts.appId) {
    printError('appId must exist. Please use --app-id to specify appId');
    printInfo('If you want to deploy this blocklet as an application, please install from your Blocklet Server');
    printInfo(`See ${chalk.cyan('https://developer.blocklet.io/docs/d6e08589-278a-448a-92e1-1e5f8bd4cc70')}`);
    process.exit(1);
  }

  if (opts.appId) {
    if (!isValidDid(opts.appId)) {
      printError('Invalid appId');
      process.exit(1);
    } else {
      opts.appId = toAddress(opts.appId);
    }
  }

  if (opts.appDid) {
    if (!isValidDid(opts.appDid)) {
      printError('Invalid appDid');
      process.exit(1);
    } else {
      opts.appDid = toAddress(opts.appDid);
    }
  }
};

const createConnectForGenerateAccessKey = async (dir, opts) => {
  const config = new Config({
    configFile: process.env.ABT_NODE_ACCESS_KEY_FILE,
    section: opts.appDid,
  });

  const fetchData = await createConnect({
    connectUrl: joinURL(new URL(opts.connectEndpoint).origin, WELLKNOWN_SERVICE_PATH_PREFIX),
    connectAction: 'gen-access-key',
    enableEncrypt: true,
    wrapSpinner,
    openPage: open,
    source: 'connect to blocklet cli',
    prettyUrl: (url) => chalk.cyan(url),
  });

  const { accessKeyId, accessKeySecret, developerDid, expireAt, name, email } = fetchData;
  config.set('accessKeyId', accessKeyId);
  config.set('accessKeySecret', accessKeySecret);
  config.set('developerDid', developerDid);
  config.set('name', name);
  config.set('email', email);
  config.set('expireAt', expireAt);

  await deployToRemote(dir, { ...opts, accessKey: accessKeyId, accessSecret: accessKeySecret });
};

const checkLocalAccessKey = async (dir, opts) => {
  const rootDid = opts.appDid || opts.appId;

  const config = new Config({
    configFile: process.env.ABT_NODE_ACCESS_KEY_FILE,
    section: rootDid,
  });

  if (config && config.get('accessKeyId')) {
    const accessKey = config.get('accessKeyId');
    const accessSecret = config.get('accessKeySecret');
    const expireAt = config.get('expireAt');

    try {
      validateAccessKey({ accessKeyId: accessKey, accessKeySecret: accessSecret });

      if (expireAt && new Date(expireAt).getTime() < new Date().getTime()) {
        throw new Error('Access key expired');
      }
    } catch (error) {
      if (await confirmOpenConnectPage('Invalid access key. Generate a new one?')) {
        await createConnectForGenerateAccessKey(dir, opts);
        return;
      }
    }

    checkAppID(opts);

    try {
      await deploy(dir, { ...opts, accessKey, accessSecret });
    } catch (error) {
      if ((error?.message || '')?.includes('does not exist')) {
        if (await confirmOpenConnectPage('Invalid access key. Generate a new one?')) {
          await createConnectForGenerateAccessKey(dir, opts);
        }
      }
    }
  } else if (await confirmOpenConnectPage()) {
    await createConnectForGenerateAccessKey(dir, opts);
  }
};

const verifyEndpoint = async (opts) => {
  const { endpoint, appPid } = await ensureServerEndpoint(opts.endpoint);
  opts.connectEndpoint = opts.endpoint;
  opts.endpoint = endpoint;

  if (appPid && !opts.appDid) {
    opts.appDid = appPid;
  }

  // console.log('opts', opts);
};

const deployToRemoteWithDIDConnect = async (dir, opts) => {
  try {
    await verifyEndpoint(opts);
    checkAppID(opts);

    await checkLocalAccessKey(dir, opts);
    process.exit(0);
  } catch (err) {
    printError(err.message);
    process.exit(1);
  }
};

exports.run = async (dirRaw, { endpoint, accessKey, accessSecret, ...opts }) => {
  const dirExpanded = expandTilde(dirRaw);
  const dir = [dirExpanded, path.join(process.cwd(), dirExpanded)].filter((x) => fs.existsSync(x)).pop();

  if (!dir) {
    printError(`Can not deploy blocklet from a non-existent directory ${chalk.red(dirRaw)}`);
    process.exit(1);
  }

  if (!opts.appDid && !opts.appId) {
    opts.appDid = process.env.BLOCKLET_DEPLOY_APP_DID || process.env.BLOCKLET_DEPLOY_APP_ID;
  }

  if (endpoint || accessKey || accessSecret) {
    if (!endpoint) {
      printError('Can not deploy to remote Blocklet Server with empty endpoint!');
      process.exit(1);
    }

    try {
      const { protocol } = new URL(endpoint);
      if (!/https?/.test(protocol)) {
        printError('Invalid endpoint protocol:', protocol.replace(':', ''));
        process.exit(1);
      }
    } catch (error) {
      printError('Invalid endpoint:', endpoint);
      process.exit(1);
    }

    if (!accessKey || !accessSecret) {
      await deployToRemoteWithDIDConnect(dir, { endpoint, accessKey, accessSecret, ...opts });
      process.exit(0);
    }

    if (!accessKey) {
      printError('Can not deploy to remote Blocklet Server with empty access-key!');
      process.exit(1);
    }

    if (!accessSecret) {
      printError('Can not deploy to remote Blocklet Server with empty access-secret!');
      process.exit(1);
    }
    const newOpts = { endpoint, accessKey, accessSecret, ...opts };
    validateAccessKey({ accessKeyId: accessKey, accessKeySecret: accessSecret });

    await verifyEndpoint(newOpts);
    checkAppID(newOpts);
    deployToRemote(dir, newOpts);
  } else {
    checkAppID(opts);
    deployToLocal(dir, opts);
  }
};
