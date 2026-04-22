const path = require('path');
const fs = require('fs-extra');
const createArchive = require('archiver');
const pick = require('lodash/pick');
const {
  BLOCKLET_META_FILE,
  PROJECT,
  BLOCKLET_INTERFACE_TYPE_WEB,
  STATIC_SERVER_ENGINE_DID,
} = require('@blocklet/constant');
const { update: updateMetaFile, read: readMetaFile } = require('@blocklet/meta/lib/file');
const { createRelease: createBlockletRelease } = require('@abtnode/util/lib/create-blocklet-release');
const { titleSchema } = require('@blocklet/meta/lib/schema');
const { validateNewDid } = require('@blocklet/meta/lib/name');
const { convertToMoniker } = require('@abtnode/util/lib/transfer-to-moniker');
const logger = require('@abtnode/logger')('blocklet-studio');

const { createReleaseSchema } = require('../../validators/project');
const getIsMultipleTenant = require('./get-is-multiple-tenant');

const {
  getLogoFile,
  exportBlockletResources,
  getResourceList,
  getExtendedMetaFile,
  exportUploadedResources,
  checkUploadExists,
} = require('./util');
const createPackRelease = require('./create-pack-release');
const connectToStore = require('./connect-to-store');
const connectToEndpoint = require('./connect-to-endpoint');
const connectToAigne = require('./connect-to-aigne');
const publishToStore = require('./publish-to-store');
const publishToEndpoint = require('./publish-to-endpoint');
const connectByStudio = require('./connect-by-studio');
const disconnectFromStore = require('./disconnect-from-store');

const COMPONENT_CONFIG_MAP_DIR = '.component_config';

// project

const ensureProjectCreateBy = (fn) => {
  return async ({ did, projectId, messageId, context, manager, ...rest }) => {
    const isMultipleTenant = await getIsMultipleTenant(manager, did);
    if (isMultipleTenant) {
      const { projectState } = await manager._getProjectState(did);
      const createdBy = context?.user?.did;
      if (!createdBy) {
        throw new Error('No permission to perform this project');
      }
      const project = await projectState.findOne(messageId ? { messageId, createdBy } : { id: projectId, createdBy });
      if (!project) {
        throw new Error('No permission to perform this project');
      }
    }
    return fn({ did, projectId, messageId, context, manager, ...rest });
  };
};

const createProject = async ({
  did,
  type,
  blockletTitle,
  blockletDid,
  componentDid,
  tenantScope,
  manager,
  context,
}) => {
  await titleSchema.validateAsync(blockletTitle);
  validateNewDid(blockletDid);
  if (!PROJECT.TYPES[type]) {
    throw new Error(`type is invalid: ${type}`);
  }
  const blocklet = await manager.getBlocklet(did, { useCache: true });
  const { projectState } = await manager._getProjectState(did);

  const project = await projectState.createProject({
    blockletTitle,
    blockletDid,
    type,
    componentDid,
    tenantScope,
    createdBy: context?.user?.did,
  });

  // create project dir
  const projectDir = path.join(blocklet.env.dataDir, PROJECT.DIR, `${project.id}`);
  const releasesDir = path.join(projectDir, PROJECT.RELEASE_DIR);
  const tmpResourceDir = path.join(projectDir, PROJECT.RESOURCE_DIR);
  const assetDir = path.join(projectDir, PROJECT.ASSET_DIR);
  await fs.ensureDir(releasesDir);
  await fs.ensureDir(tmpResourceDir);
  await fs.ensureDir(assetDir);

  return project;
};

const getProjects = async ({ did, manager, componentDid, showAccessToken, tenantScope, context }) => {
  const isMultipleTenant = await getIsMultipleTenant(manager, did);
  if (isMultipleTenant && componentDid && !tenantScope) {
    throw new Error('Multiple tenant mode in component, tenantScope is required');
  }
  const { projectState } = await manager._getProjectState(did);
  const query = { componentDid, showAccessToken };
  if (isMultipleTenant) {
    query.createdBy = context.user.did;
  }
  if (componentDid && tenantScope) {
    query.tenantScope = tenantScope;
  }
  const projects = await projectState.getProjects(query);
  return { projects };
};

const getProject = async ({ did, projectId, messageId, showAccessToken, manager }) => {
  const { projectState } = await manager._getProjectState(did);
  const project = await projectState.findOne(messageId ? { messageId } : { id: projectId });
  if (project) {
    if (!showAccessToken) {
      project.connectedStores?.forEach((store) => {
        store.accessToken = store.accessToken ? '__encrypted__' : '';
      });
    }

    if (!showAccessToken) {
      project.connectedEndpoints?.forEach((endpoint) => {
        endpoint.accessKeySecret = endpoint.accessKeySecret ? '__encrypted__' : '';
      });
    }
  }

  return project;
};

const updateProject = async ({ did, projectId, manager, context, ...params }) => {
  const { projectState } = await manager._getProjectState(did);
  const project = await projectState.updateProject(projectId, params);
  return project;
};

// 这个接口不会被前端直接调用
const deleteProject = async ({ did, projectId, manager }) => {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  const { projectState, releaseState } = await manager._getProjectState(did);
  const blocklet = await manager.getBlocklet(did);
  const projectDir = path.join(blocklet.env.dataDir, PROJECT.DIR, `${projectId}`);

  await projectState.remove({ id: projectId });
  await releaseState.remove({ projectId });
  await fs.remove(projectDir);
};

// release
const getReleases = async ({ did, projectId, manager }) => {
  const { releaseState } = await manager._getProjectState(did);
  const releases = await releaseState.getReleases({ projectId });
  return { releases };
};

const getRelease = async ({ did, projectId, releaseId, manager }) => {
  const { releaseState } = await manager._getProjectState(did);
  const release = await releaseState.findOne({ projectId, id: releaseId });
  return release;
};

const deleteRelease = async ({ did, projectId, releaseId, manager }) => {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  if (!releaseId) {
    throw new Error('releaseId is required');
  }

  const blocklet = await manager.getBlocklet(did);
  const { releaseState } = await manager._getProjectState(did);
  const releaseDir = path.join(blocklet.env.dataDir, PROJECT.DIR, `${projectId}`, PROJECT.RELEASE_DIR, `${releaseId}`);
  await releaseState.remove({ projectId, id: releaseId });
  await fs.remove(releaseDir);
};

const createRelease = async ({
  did,
  projectId,
  releaseId,
  blockletTitle,
  blockletDescription,
  blockletVersion,
  blockletIntroduction,
  blockletHomepage,
  blockletSupport,
  blockletCommunity,
  blockletRepository,
  blockletLogo,
  blockletScreenshots,
  blockletVideos,
  uploadedResource,
  blockletComponents,
  blockletResourceType,
  blockletDocker,
  blockletSingleton,
  contentType,
  note,
  manager,
  status,
}) => {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  if (!PROJECT.RELEASE_STATUS[status]) {
    throw new Error(`status is invalid: ${status}`);
  }

  if ((blockletComponents || []).some((x) => typeof x === 'string')) {
    // eslint-disable-next-line no-param-reassign
    blockletComponents = blockletComponents.map(JSON.parse);
  }

  const params = {
    blockletVersion,
    blockletTitle,
    blockletDescription,
    blockletLogo,
    blockletIntroduction,
    blockletHomepage,
    blockletSupport,
    blockletCommunity,
    blockletRepository,
    blockletScreenshots,
    blockletVideos,
    uploadedResource,
    blockletResourceType,
    blockletDocker,
    blockletSingleton,
    contentType,
    note,
  };

  const releaseSchema = createReleaseSchema(status);
  await releaseSchema.validateAsync(params);

  const blocklet = await manager.getBlocklet(did);
  const { projectState, releaseState } = await manager._getProjectState(did);

  const project0 = await projectState.findOne({ id: projectId });
  if (!project0) {
    throw new Error('project not found');
  }

  const isPack = blockletComponents?.length > 0 || !!blockletDocker?.dockerImage;

  if (isPack) {
    return createPackRelease({
      did,
      projectId,
      releaseId,
      blockletTitle,
      blockletDescription,
      blockletVersion,
      blockletIntroduction,
      blockletLogo,
      blockletHomepage,
      blockletSupport,
      blockletCommunity,
      blockletRepository,
      blockletVideos,
      blockletScreenshots,
      blockletComponents,
      blockletResourceType,
      blockletDocker,
      blockletSingleton,
      contentType,
      note,
      manager,
      status,
    });
  }

  const action = releaseId ? 'update' : 'create';

  if (action === 'update') {
    const release = await releaseState.findOne({ projectId, id: releaseId });
    if (!release) {
      throw new Error(`Blocklet release ${releaseId} not found for project ${projectId}`);
    }
    if (release.status !== 'draft') {
      throw new Error(`Can not update a published release: ${releaseId}`);
    }
  }

  const existVersion = await releaseState.findOne({ projectId, blockletVersion });
  if (existVersion && (action === 'create' || existVersion.id !== releaseId)) {
    throw new Error(`Release version ${blockletVersion} already exists`);
  }

  const { blockletDid } = project0;

  params.blockletDid = blockletDid;

  const projectDir = path.join(blocklet.env.dataDir, PROJECT.DIR, `${projectId}`);

  // validate resources
  const isResourceFromUpload = !!uploadedResource;
  if (status !== PROJECT.RELEASE_STATUS.draft && isResourceFromUpload) {
    await checkUploadExists(projectDir, action, releaseId, uploadedResource);
  }

  const release = await releaseState.upsertRelease({
    ...params,
    publishedStoreIds: [],
    projectId,
    releaseId,
    status,
  });
  logger.info('release upsert done', release);

  const _releaseId = release.id;
  const releaseDir = path.join(projectDir, PROJECT.RELEASE_DIR, `${_releaseId}`);
  const resourceDir = path.join(releaseDir, PROJECT.RESOURCE_DIR);
  const tmpResourceDir = path.join(projectDir, PROJECT.RESOURCE_DIR);

  await fs.ensureDir(releaseDir);

  // move tmp resource to release
  if (action === 'create') {
    await fs.ensureDir(tmpResourceDir);
    await fs.remove(releaseDir);
    await fs.ensureDir(releaseDir);
    await fs.move(tmpResourceDir, resourceDir);
    await fs.ensureDir(tmpResourceDir);
  }

  const releaseExportDir = path.join(releaseDir, '.blocklet');
  const releaseBundleDir = path.join(releaseExportDir, 'bundle');
  const releaseReleaseDir = path.join(releaseExportDir, 'release');

  const moniker = convertToMoniker(release.blockletTitle, 'blocklet');
  const releaseFileName = `${moniker}-${release.blockletVersion}.zip`;
  const releaseFile = path.join(releaseDir, releaseFileName);

  if (status !== PROJECT.RELEASE_STATUS.draft) {
    params.lastReleaseId = _releaseId;
    params.lastReleaseFiles = [releaseFileName];
    params.updatedAt = Date.now();
  }

  const project = await projectState.updateProject(projectId, params);

  if (status === PROJECT.RELEASE_STATUS.draft) {
    return release;
  }

  if (fs.existsSync(releaseFile)) {
    logger.warn('release file exists, remove it', releaseFile);
    await fs.remove(releaseFile);
  }

  try {
    await fs.ensureDir(releaseBundleDir);

    // create logo
    const { logoFile, logoFileName } = getLogoFile(blocklet, project);
    await fs.copy(logoFile, path.join(releaseBundleDir, logoFileName));

    // create screenshots
    const screenshotsDistDir = path.join(releaseBundleDir, 'screenshots');
    await fs.ensureDir(screenshotsDistDir);
    if (project.blockletScreenshots?.length) {
      await Promise.all(
        project.blockletScreenshots.map(async (screenshot) => {
          const screenshotFile = path.join(projectDir, PROJECT.ASSET_DIR, screenshot);
          await fs.copy(screenshotFile, path.join(screenshotsDistDir, screenshot));
        })
      );
    }

    // create readme
    if (blockletIntroduction) {
      await fs.outputFile(path.join(releaseBundleDir, 'README.md'), blockletIntroduction);
    }

    // changelog
    const changelogDistFile = path.join(releaseBundleDir, 'CHANGELOG.md');
    const releases = await releaseState.getReleases({ projectId, status: PROJECT.RELEASE_STATUS.published });
    const changelog = releases.map((_release) => {
      const { blockletVersion: version, note: content } = _release;
      if (!content) {
        return `## ${version}\n\n`;
      }

      let parsedNote = content;
      if (content.startsWith('{') && content.endsWith('}')) {
        try {
          const parsed = JSON.parse(content);
          parsedNote = parsed && typeof parsed.note === 'string' ? parsed.note : content;
        } catch (error) {
          logger.error('parse release note error', error);
        }
      }

      return `## ${version}\n\n${parsedNote}`;
    });
    await fs.outputFile(changelogDistFile, changelog.join('\n\n'));

    // create blocklet.yml
    const meta = {
      did: blockletDid,
      name: blockletDid,
      title: blockletTitle,
      description: blockletDescription,
      version: blockletVersion,
      homepage: blockletHomepage || undefined,
      support: blockletSupport || undefined,
      community: blockletCommunity || undefined,
      repository: blockletRepository || undefined,
      logo: logoFileName,
      components: [],
      files: project.blockletScreenshots?.length ? ['screenshots'] : [],
      screenshots: project.blockletScreenshots || [],
      videos: blockletVideos || [],
      capabilities: {
        singleton: !!blockletSingleton,
      },
    };

    // create resource
    if (isResourceFromUpload) {
      await exportUploadedResources({
        app: blocklet,
        projectId,
        releaseId: _releaseId,
        exportDir: releaseBundleDir,
      });

      meta.main = PROJECT.MAIN_DIR;
      meta.engine = {
        interpreter: 'blocklet',
        source: {
          store: 'https://store.blocklet.dev',
          name: STATIC_SERVER_ENGINE_DID,
          version: 'latest',
        },
      };
    } else {
      await exportBlockletResources({
        app: blocklet,
        projectId,
        releaseId: _releaseId,
        exportDir: releaseBundleDir,
        blockletDid,
      });

      const resourceList = await getResourceList(resourceDir);
      if (resourceList) {
        meta.resource = {
          bundles: resourceList.length ? resourceList : undefined,
        };
      }
    }

    // merge extended blocklet.yml
    const extendedMetaFile = getExtendedMetaFile({ app: blocklet, projectId, releaseId });
    if (fs.existsSync(extendedMetaFile)) {
      const extendedMeta = readMetaFile(extendedMetaFile);
      logger.info('release extended blocklet.yml', extendedMeta);
      Object.assign(meta, pick(extendedMeta, ['environments', 'engine', 'capabilities']));
    }

    meta.capabilities = {
      navigation: false,
      ...meta.capabilities,
    };

    // Enable mountPoint for blocklets with engine specified
    if (meta.engine?.interpreter === 'blocklet') {
      meta.interfaces = [
        {
          name: 'publicUrl',
          path: '/',
          port: 'BLOCKLET_PORT',
          prefix: '*',
          protocol: 'tcp',
          type: BLOCKLET_INTERFACE_TYPE_WEB,
        },
      ];
    }

    await updateMetaFile(path.join(releaseBundleDir, BLOCKLET_META_FILE), meta);

    // create release
    await createBlockletRelease(releaseExportDir, { printError: logger.error, printInfo: logger.info });

    // archive
    const archive = createArchive('zip', { zlib: { level: 9 } });
    const writeStream = fs.createWriteStream(releaseFile);

    await new Promise((resolve, reject) => {
      archive
        .directory(releaseReleaseDir, false)
        .on('error', (err) => reject(err))
        .pipe(writeStream);

      writeStream.on('close', () => resolve(releaseFile));
      archive.finalize();
    });

    const res2 = await releaseState.upsertRelease({
      projectId,
      releaseId: _releaseId,
      files: [releaseFileName],
    });

    logger.info('release finalized', res2);

    return res2;
  } catch (error) {
    await fs.remove(releaseExportDir);
    await fs.remove(releaseFile);
    if (action === 'create') {
      await fs.remove(releaseDir);
      await releaseState.remove({ projectId, id: _releaseId });
    } else {
      await releaseState.update({ id: _releaseId }, { $set: { status: PROJECT.RELEASE_STATUS.draft } });
    }
    logger.error(`export ${project.type} error`, error);
    throw error;
  }
};

const getSelectedResourcesFile = ({ app, projectId, releaseId, componentDid }) => {
  const { dataDir } = app.env;
  const dirArr = [dataDir, PROJECT.DIR, projectId || '/'];
  if (releaseId) {
    dirArr.push(PROJECT.RELEASE_DIR, releaseId || '/');
  }
  dirArr.push(PROJECT.RESOURCE_DIR);
  dirArr.push(COMPONENT_CONFIG_MAP_DIR);
  dirArr.push(`${componentDid}.json`);
  return path.join(...dirArr);
};

const getSelectedResources = async ({ did, projectId, releaseId, componentDid, manager }) => {
  if (!projectId) {
    throw new Error('projectId is required');
  }

  if (!componentDid) {
    throw new Error('componentDid is required');
  }

  const app = await manager.getBlocklet(did, { useCache: true });
  const file = getSelectedResourcesFile({ app, projectId, releaseId, componentDid });

  if (!fs.existsSync(file)) {
    return [];
  }

  const content = await fs.readJSON(file);
  return content;
};

const updateSelectedResources = async ({ did, projectId, releaseId, componentDid, resources, manager }) => {
  if (!projectId) {
    throw new Error('projectId is required');
  }

  if (!componentDid) {
    throw new Error('componentDid is required');
  }

  const app = await manager.getBlocklet(did, { useCache: true });

  const file = getSelectedResourcesFile({ app, projectId, releaseId, componentDid });

  if (fs.existsSync(file)) {
    await fs.remove(file);
  }

  if (resources.length) {
    await fs.ensureDir(path.dirname(file));
    await fs.outputJSON(file, resources);
  }
};

module.exports = {
  createProject,
  getProjects,
  getProject: ensureProjectCreateBy(getProject),
  updateProject: ensureProjectCreateBy(updateProject),
  createRelease: ensureProjectCreateBy(createRelease),
  getReleases: ensureProjectCreateBy(getReleases),
  getRelease: ensureProjectCreateBy(getRelease),
  deleteRelease: ensureProjectCreateBy(deleteRelease),
  getSelectedResources: ensureProjectCreateBy(getSelectedResources),
  updateSelectedResources: ensureProjectCreateBy(updateSelectedResources),
  deleteProject,
  connectToStore,
  disconnectFromStore,
  connectByStudio,
  publishToStore,
  connectToEndpoint,
  publishToEndpoint,
  connectToAigne,
};
