/**
 * WARNING this feature is not ready for production
 */

const path = require('path');
const fs = require('fs-extra');
const createArchive = require('archiver');
const pick = require('lodash/pick');
const { BLOCKLET_META_FILE, PROJECT, BLOCKLET_INTERFACE_TYPE_WEB } = require('@blocklet/constant');
const { update: updateMetaFile, read: readMetaFile } = require('@blocklet/meta/lib/file');
const { createRelease: createBlockletRelease } = require('@abtnode/util/lib/create-blocklet-release');
const { hasStartEngine } = require('@blocklet/meta/lib/util');
const { convertToMoniker } = require('@abtnode/util/lib/transfer-to-moniker');
const { parseDockerArgsToSchema, dockerParseEnvironments, dockerParsePublishPorts } = require('@abtnode/docker-utils');

const logger = require('@abtnode/logger')('blocklet-studio-pack');

const { createReleaseSchema } = require('../../validators/project');

const { getLogoFile, exportBlockletResources, getResourceList, getExtendedMetaFile } = require('./util');

const createPackRelease = async ({
  did,
  projectId,
  releaseId,
  blockletTitle,
  blockletDescription,
  blockletVersion,
  blockletIntroduction,
  blockletLogo,
  blockletScreenshots,
  blockletComponents,
  blockletResourceType,
  note,
  blockletHomepage,
  blockletSupport,
  blockletCommunity,
  blockletRepository,
  blockletVideos,
  blockletDocker,
  blockletSingleton,
  contentType,
  manager,
  status,
}) => {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  if (!PROJECT.RELEASE_STATUS[status]) {
    throw new Error(`status is invalid: ${status}`);
  }

  const params = {
    blockletVersion,
    blockletTitle,
    blockletDescription,
    blockletLogo,
    blockletIntroduction,
    blockletScreenshots,
    blockletComponents,
    blockletResourceType,
    note,
    blockletHomepage,
    blockletSupport,
    blockletCommunity,
    blockletRepository,
    blockletVideos,
    blockletDocker,
    contentType,
    blockletSingleton,
  };

  const releaseSchema = createReleaseSchema(status);
  await releaseSchema.validateAsync(params);

  const blocklet = await manager.getBlocklet(did);
  const { projectState, releaseState } = await manager._getProjectState(did);

  const project0 = await projectState.findOne({ id: projectId });
  if (!project0) {
    throw new Error('project not found');
  }

  const action = releaseId ? 'update' : 'create';

  if (action === 'update') {
    const release = await releaseState.findOne({ projectId, id: releaseId });
    if (!release) {
      throw new Error('release not found');
    }
    if (release.status !== 'draft') {
      throw new Error(`Can not update a published release: ${releaseId}`);
    }
  }

  const existVersion = await releaseState.findOne({ projectId, blockletVersion });
  if (existVersion && (action === 'create' || existVersion.id !== releaseId)) {
    throw new Error(`blockletVersion ${blockletVersion} already exists`);
  }

  const { blockletDid } = project0;

  params.blockletDid = blockletDid;

  const projectDir = path.join(blocklet.env.dataDir, PROJECT.DIR, `${projectId}`);

  const release = await releaseState.upsertRelease({
    ...params,
    publishedStoreIds: [],
    projectId,
    releaseId,
    status,
  });

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
    logger.error('release file already exists, remove it', releaseFile);
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

    // create resource
    await exportBlockletResources({
      app: blocklet,
      projectId,
      releaseId: _releaseId,
      exportDir: releaseBundleDir,
      blockletDid,
      isPack: true,
      selectedComponentDids: blockletComponents.map((x) => x.did),
    });
    const resourceList = await getResourceList(releaseBundleDir, { isPublic: false });

    const components = blocklet.children
      .filter((x) => x.bundleSource?.url || x.bundleSource?.store)
      .filter((x) => blockletComponents.find((y) => y.did === x.meta.did))
      .map((x) => {
        const required = !!blockletComponents.find((y) => y.did === x.meta.did)?.required;
        const hasMountPoint = hasStartEngine(x.meta);
        const res = {
          name: x.meta.name,
          source: x.bundleSource,
          required,
        };
        if (hasMountPoint) {
          res.mountPoint = x.mountPoint;
        }
        return res;
      });

    let dockerYml;
    if (blockletDocker?.dockerImage) {
      const { error, value } = parseDockerArgsToSchema(
        blockletDocker.dockerImage,
        blockletDocker.dockerCommand,
        blockletDocker.dockerArgs
      );
      if (error) {
        throw new Error(`Docker args is invalid: ${error.message}`);
      }
      dockerYml = value;
    }

    // create blocklet.yml
    const meta = {
      did: blockletDid,
      name: blockletDid,
      title: blockletTitle,
      description: blockletDescription,
      homepage: blockletHomepage || undefined,
      support: blockletSupport || undefined,
      community: blockletCommunity || undefined,
      repository: blockletRepository || undefined,
      version: blockletVersion,
      group: blockletResourceType === 'resource' ? undefined : 'pack',
      logo: logoFileName,
      resource: {
        bundles: resourceList.length ? resourceList : undefined,
      },
      components,
      files: project.blockletScreenshots?.length ? ['screenshots'] : [],
      screenshots: project.blockletScreenshots || [],
      videos: blockletVideos || [],
      capabilities: {
        singleton: !!blockletSingleton,
      },
    };

    if (blockletDocker?.dockerImage && dockerYml) {
      meta.group = 'dapp';
      meta.docker = dockerYml;
      meta.environments = dockerParseEnvironments(blockletDocker.dockerEnvs, true);
      if (!meta.interfaces) {
        meta.interfaces = [];
      }
      meta.timeout = {
        start: 120,
        script: 120,
      };

      meta.interfaces.push(
        ...dockerParsePublishPorts(
          `${meta.title || blockletDocker.dockerImage}-${meta.did?.slice(-6)}`,
          blockletDocker.dockerArgs
        )
      );
    }

    // merge extended blocklet.yml
    const extendedMetaFile = getExtendedMetaFile({ app: blocklet, projectId, releaseId });
    if (fs.existsSync(extendedMetaFile)) {
      const extendedMeta = readMetaFile(extendedMetaFile);
      logger.info('merge extended blocklet.yml', extendedMeta);
      Object.assign(meta, pick(extendedMeta, ['environments', 'engine', 'capabilities']));
    }

    // Reset group for blocklets with engine specified
    if (meta.engine?.interpreter === 'blocklet') {
      delete meta.group;
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

    logger.info('create release success', res2);

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

module.exports = createPackRelease;
