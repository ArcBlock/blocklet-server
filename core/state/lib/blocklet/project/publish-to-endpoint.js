const { joinURL } = require('ufo');
const path = require('path');
const { PROJECT } = require('@blocklet/constant');

const fs = require('fs/promises');
const { parse: getBlockletMeta } = require('@blocklet/meta/lib/parse');
const { hasReservedKey } = require('@blocklet/meta/lib/has-reserved-key');
const logger = require('@abtnode/logger')('@abtnode/core:publish-to-endpoint');
const slugify = require('slugify');
const tar = require('tar');

const { default: axios } = require('axios');
const hashFiles = require('@abtnode/util/lib/hash-files');
const { validateBlockletEntry } = require('@blocklet/meta/lib/entry');
const { hasMountPoint } = require('@blocklet/meta/lib/engine');
const { urlPathFriendly } = require('@blocklet/meta/lib/url-path-friendly');
const makeFormData = require('@abtnode/util/lib/make-from-data');
const { fileFilter } = require('@abtnode/util/lib/check-file');
const { formatError } = require('@blocklet/error');

const getMountPoint = (localMeta) => {
  let mountPoint;
  const inputMountPoint = '';
  if (hasMountPoint(localMeta)) {
    if (inputMountPoint) {
      mountPoint = inputMountPoint;
      logger.info(`Use mountPoint from input: ${inputMountPoint}`);
    } else if (process.env.BLOCKLET_DEPLOY_MOUNT_POINT) {
      logger.info(`Use mountPoint from env: ${process.env.BLOCKLET_DEPLOY_MOUNT_POINT}`);
      mountPoint = process.env.BLOCKLET_DEPLOY_MOUNT_POINT;
    } else {
      const { name, title } = localMeta;
      mountPoint = `/${urlPathFriendly(title) || urlPathFriendly(name)}`.toLowerCase();
      logger.info(`Use default mountPoint: ${mountPoint}`);
    }
  } else {
    mountPoint = `/${localMeta.did}`;
    logger.info(`Use fake mountPoint: ${mountPoint}`);
  }

  return mountPoint;
};

function getReleaseDir(blocklet, projectId, releaseId) {
  const projectDir = path.join(blocklet.env.dataDir, PROJECT.DIR, `${projectId}`);
  return path.join(projectDir, PROJECT.RELEASE_DIR, `${releaseId}`);
}

const Client = require('@blocklet/server-js');

const { signWithAccessKey, validateAccessKey } = Client;

const publishToEndpoint = async ({ did, projectId, endpointId, releaseId, manager }) => {
  if (
    !did ||
    !projectId ||
    !endpointId ||
    !releaseId ||
    typeof projectId !== 'string' ||
    typeof endpointId !== 'string'
  ) {
    throw new Error('params is failed');
  }
  const rootDid = endpointId;

  const blocklet = await manager.getBlocklet(did);
  if (!blocklet) {
    throw new Error('blocklet not found');
  }

  const { projectState, releaseState } = await manager._getProjectState(did);

  const release = await releaseState.findOne({ projectId, id: releaseId });
  if (!release) {
    throw new Error('release not found');
  }

  const endpoint = await projectState.getConnectedEndpoint(projectId, endpointId);
  if (!endpoint) {
    throw new Error('no find connected endpoint');
  }

  const connected = (blocklet.settings?.endpointList || []).find((x) => x.id === endpointId);
  if (!connected) {
    throw new Error('no find connected endpoint');
  }

  const { accessKeyId, accessKeySecret } = endpoint;

  validateAccessKey({ accessKeyId, accessKeySecret });

  const fullEndpoint = joinURL(connected.endpoint, '/api/gql');
  const client = new Client(fullEndpoint, 'PublishToEndpoint');
  client.setAuthAccessKey({ accessKeyId, accessKeySecret });

  let app = null;
  try {
    const result = await client.getBlocklet(
      { input: { did: rootDid, attachRuntimeInfo: false } },
      { headers: { 'x-access-blocklet': rootDid } }
    );
    app = result.blocklet;
  } catch (error) {
    logger.error(`get blocklet error: ${error?.message}`);
    throw error;
  }

  if (!app) {
    throw new Error(`App ${endpointId} not found`);
  }

  logger.info('publish to app', { endpoint: connected.endpoint, appDid: app.appDid });

  const project = await projectState.findOne({ id: projectId });
  let releaseDir = getReleaseDir(blocklet, projectId, releaseId);
  if (project.possibleSameStore) {
    await fs.cp(releaseDir, `${releaseDir}-${endpointId}`, { recursive: true });
    releaseDir = `${releaseDir}-${endpointId}`;
  }

  const bundleDir = path.join(releaseDir, '.blocklet', 'bundle');
  let localMeta;
  const metaFile = path.join(releaseDir, '.blocklet', 'release', 'blocklet.json');
  let metaExists = false;
  try {
    await fs.access(metaFile);
    metaExists = true;
  } catch (_) {
    //
  }
  if (metaExists) {
    localMeta = JSON.parse(await fs.readFile(metaFile, 'utf-8'));
  } else {
    try {
      localMeta = getBlockletMeta(bundleDir);
    } catch (error) {
      throw new Error(`Get blocklet meta failed: ${error.message}`);
    }
    if (hasReservedKey(localMeta.environments)) {
      throw new Error('Blocklet key of environments can not start with `ABT_NODE_` or `BLOCKLET_`');
    }
  }

  const mountPoint = getMountPoint(localMeta);

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
    if (fileNames[i].includes('node_modules')) {
      throw new Error(`node_modules cannot be in the list of uploaded files: ${fileNames[i]}`);
    }
  }

  logger.info(`start deploy ${localMeta.name}@${localMeta.version} to ${connected.endpoint}`);

  const tarFile = path.join(releaseDir, `${slugify(localMeta.name)}-${localMeta.version}.tgz`);
  await tar.c(
    {
      file: tarFile,
      cwd: bundleDir,
      filter: (f) => !files || fileFilter(f.replace(/^\.\//, ''), { files }),
    },
    ['.']
  );

  const { form } = makeFormData({
    tarFile,
    did: localMeta.did,
    mountPoint,
    rootDid,
    dist: {
      tarball: localMeta.dist?.tarball || '',
      integrity: localMeta.dist?.integrity || '',
    },
  });

  try {
    const timestamp = Date.now();

    const res = await axios({
      url: fullEndpoint,
      method: 'POST',
      data: form,
      headers: {
        ...form.getHeaders(),
        'user-agent': 'PublishToEndpoint',
        'x-access-key-id': accessKeyId,
        'x-access-stamp': timestamp,
        'x-access-signature': await signWithAccessKey({
          accessKeyId,
          accessKeySecret,
          message: `${timestamp}-${accessKeyId}`,
        }),
        'x-access-blocklet': rootDid,
      },
      timeout: 1000 * 60 * 30, // 30min
      maxContentLength: Number.POSITIVE_INFINITY,
      maxBodyLength: Number.POSITIVE_INFINITY,
    });

    if (Array.isArray(res.data.errors) && res.data.errors.length) {
      const error = new Error('GraphQL Response Error');
      error.errors = res.data.errors;
      throw error;
    }

    logger.info(`${localMeta.title}@${localMeta.version} was successfully deployed to ${app.meta.title}`);
  } catch (error) {
    throw new Error(`Blocklet deploy failed when uploading: ${formatError(error)}`);
  }
};

module.exports = publishToEndpoint;
