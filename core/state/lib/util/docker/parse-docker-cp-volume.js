/* eslint-disable no-await-in-loop */
const { isVolumePath } = require('@abtnode/docker-utils');
const promiseSpawn = require('@abtnode/util/lib/promise-spawn');
const fs = require('fs/promises');
const path = require('path');

/**
 * Generate and execute a docker workflow that:
 * @param {string} appDataDir - Absolute path on host where container volumes should be mounted
 * @param {object} dockerInfo - Metadata describing image, mounts, ports, and network
 * @returns {Promise} resolves when all docker commands have executed
 */
async function parseDockerCpVolume(dockerName, appDataDir, dockerInfo) {
  const { image, volume = [] } = dockerInfo?.dockerMeta || {};

  try {
    await fs.access(appDataDir);
  } catch (error) {
    await fs.mkdir(appDataDir, { recursive: true });
  }

  const tmpContainer = `${dockerName}_cp`;

  const needCopyVolumes = volume.filter((vol) => {
    return !isVolumePath(vol);
  });

  if (needCopyVolumes.length === 0) {
    return;
  }

  const copySteps = [];
  for (const vol of needCopyVolumes) {
    const [dir, dest] = vol.split(':');
    const destPath = path.join(appDataDir, dir);
    try {
      await fs.access(destPath);
    } catch (_) {
      await fs.mkdir(destPath, { recursive: true });
    }
    // 判断路径下是否存在文件, 如果已经有文件了，就跳过
    const files = await fs.readdir(destPath);
    if (files.length > 0) {
      continue;
    }

    copySteps.push(`docker cp ${tmpContainer}:${dest}/. ${destPath} || true`);
  }

  if (copySteps.length === 0) {
    return;
  }

  const deleteContainerCmd = `docker rm -f ${tmpContainer} || true`;
  const createContainerCmd = `docker create --name ${tmpContainer} ${image}`;

  try {
    await promiseSpawn([deleteContainerCmd, createContainerCmd, ...copySteps].join(' && '));
  } catch (error) {
    throw new Error(`Failed to create container ${tmpContainer}: ${error.message}`);
  } finally {
    await promiseSpawn(deleteContainerCmd);
  }
}

module.exports = parseDockerCpVolume;
