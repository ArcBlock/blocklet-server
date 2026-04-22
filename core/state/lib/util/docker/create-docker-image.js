const fs = require('fs/promises');
const path = require('path');
const logger = require('@abtnode/logger')('@abtnode/core:util:blocklet');
const promiseSpawn = require('@abtnode/util/lib/promise-spawn');
const { checkDockerHasImage } = require('./check-docker-has-image');
const getBlockletCustomDockerfile = require('./blocklet-custom-dockerfile');
const debianDockerfile = require('./debian-dockerfile');
const debianChmodDockerfile = require('./debian-chmod-dockerfile');
const debainWrapDockerfile = require('./debian-wrap-dockerfile');

/**
 * 在镜像名（不含 tag/digest）后追加自定义后缀
 * @param {string} image 原始镜像字符串
 * @param {string} suffix 要追加的后缀，默认 "-wrap"
 * @returns {string} 追加后缀的新镜像字符串
 */
function addSuffixToImageName(image, suffix = '-wrap') {
  // 先把 digest（@sha256:...）摘出来
  const [noDigest, digestPart = ''] = image.split('@');
  const digest = digestPart ? `@${digestPart}` : '';

  // 切出路径/镜像名区段
  const lastSlash = noDigest.lastIndexOf('/');
  const group = lastSlash >= 0 ? noDigest.slice(0, lastSlash + 1) : '';
  const rest = noDigest.slice(lastSlash + 1); // e.g. mysql:8.0.0

  // 识别 tag（:xxx）；注意 registry:port 里的冒号已在 path 里
  const tagIndex = rest.lastIndexOf(':');
  const hasTag = tagIndex >= 0;
  const name = hasTag ? rest.slice(0, tagIndex) : rest; // mysql
  const tag = hasTag ? rest.slice(tagIndex) : ''; // :8.0.0

  return `${group}${name}${suffix}${tag}${digest}`;
}

async function buildImage({ image, dockerfile }) {
  const dir = process.env.ABT_NODE_DATA_DIR;
  if (!dir) {
    logger.error('ABT_NODE_DATA_DIR is not set');
    return;
  }

  if (await checkDockerHasImage(image)) {
    return;
  }
  const dockerfilePath = path.join(dir, 'Dockerfile');

  try {
    await fs.access(dockerfilePath);
    await fs.unlink(dockerfilePath);
  } catch (_) {
    // File doesn't exist, no need to remove
  }

  await fs.writeFile(dockerfilePath, dockerfile);
  try {
    await promiseSpawn(
      `docker build -f ${path.join(dir, 'Dockerfile')} --no-cache --build-arg uid=$(id -u) --build-arg gid=$(id -g) -t ${image} .`,
      {
        env: {
          ...process.env,
          HTTP_PROXY: process.env.DOCKER_HTTP_PROXY || '',
          HTTPS_PROXY: process.env.DOCKER_HTTPS_PROXY || '',
        },
      }
    );
  } catch (error) {
    logger.error('Failed to build Docker image. Error:', error.message);
    throw error;
  }
  logger.info('Success build docker image');
}

const building = {};

async function createDockerImage(data) {
  const metaDockerInfo = data?.meta?.docker || {};
  const keys = Object.keys(metaDockerInfo);
  for (const key of keys) {
    if (metaDockerInfo[key] === '') {
      delete metaDockerInfo[key];
    }
  }
  const customInfo = getBlockletCustomDockerfile(data);
  if (building[customInfo.image]) {
    await building[customInfo.image];
    return Object.assign(customInfo, metaDockerInfo);
  }

  if (
    customInfo.image !== debianDockerfile.image &&
    customInfo.image !== debianChmodDockerfile.image &&
    customInfo.runBaseScript &&
    !customInfo.skipWrapDockerfile
  ) {
    customInfo.dockerfile = debainWrapDockerfile(customInfo.image);
    customInfo.image = addSuffixToImageName(customInfo.image);
  }

  if (customInfo.dockerfile) {
    building[customInfo.image] = buildImage(customInfo);
    await building[customInfo.image];
  }

  return Object.assign(customInfo, metaDockerInfo);
}

module.exports = {
  createDockerImage,
  addSuffixToImageName,
};
