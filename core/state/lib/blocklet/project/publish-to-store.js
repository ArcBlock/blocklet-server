const path = require('path');
const { PROJECT } = require('@blocklet/constant');
const { upload } = require('@blocklet/store');
const { getDisplayName } = require('@blocklet/meta/lib/util');
const fs = require('fs/promises');

function ensureArray(value) {
  if (!value) {
    return [];
  }
  if (typeof value === 'string') {
    return JSON.parse(value);
  }
  return value;
}

function getReleaseDir(blocklet, projectId, releaseId) {
  const projectDir = path.join(blocklet.env.dataDir, PROJECT.DIR, `${projectId}`);
  return path.join(projectDir, PROJECT.RELEASE_DIR, `${releaseId}`);
}

const MAX_RETRIES = 5;
const RETRY_DELAY = 100;

// 利用乐观锁, 去更新字段, 如果连续5次都失败, 就算更新失败
async function updateReleaseWithRetry(releaseState, releaseId, projectId, storeId) {
  // eslint-disable-next-line no-unused-vars
  for (const _ of Array(MAX_RETRIES).fill(0)) {
    // eslint-disable-next-line no-await-in-loop
    const release = await releaseState.findOne({ projectId, id: releaseId });
    release.publishedStoreIds = ensureArray(release.publishedStoreIds);
    release.publishedStoreIds.push(storeId);

    try {
      // eslint-disable-next-line no-await-in-loop
      const result = await releaseState.update(
        { id: releaseId, updatedAt: release.updatedAt },
        { $set: { publishedStoreIds: Array.from(new Set(release.publishedStoreIds)) } }
      );
      if (result?.[0] > 0) {
        return true;
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    } catch (error) {
      throw new Error(`Failed to update release: ${error.message}`);
    }
  }

  throw new Error('Failed to update release after maximum retries');
}

const publishToStore = async ({ did, projectId, releaseId, type, storeId, manager }) => {
  if (
    !did ||
    !projectId ||
    !releaseId ||
    !type ||
    !storeId ||
    typeof projectId !== 'string' ||
    typeof releaseId !== 'string'
  ) {
    throw new Error('params is failed');
  }

  const { releaseState, projectState } = await manager._getProjectState(did);

  const release = await releaseState.findOne({ projectId, id: releaseId });
  if (!release) {
    throw new Error('release not found');
  }

  const store = await projectState.getConnectedStore(projectId, storeId);
  if (!store) {
    throw new Error('no find connected store');
  }

  const { storeUrl } = store;
  const { accessToken, developerDid } = store;

  const blocklet = await manager.getBlocklet(did);
  if (!blocklet) {
    throw new Error('blocklet not found');
  }

  const project = await projectState.findOne({ id: projectId });
  let releaseDir = getReleaseDir(blocklet, projectId, releaseId);
  if (project.possibleSameStore) {
    await fs.cp(releaseDir, `${releaseDir}-${storeId}`, { recursive: true });
    releaseDir = `${releaseDir}-${storeId}`;
  }
  const metaFile = path.join(releaseDir, '.blocklet', 'release', 'blocklet.json');

  const response = await upload({
    metaFile,
    storeUrl,
    accessToken,
    developerDid,
    possibleSameStore: project.possibleSameStore,
    source: `Blocklet Studio (${getDisplayName(blocklet)})`,
  });

  await updateReleaseWithRetry(releaseState, releaseId, projectId, storeId);

  return response?.status;
};

module.exports = publishToStore;
