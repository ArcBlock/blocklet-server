const logger = require('@abtnode/logger')('@abtnode/core:blocklet:manager:install-component');
const { isInServerlessMode } = require('@abtnode/util/lib/serverless');
const { updateComponentDid } = require('@abtnode/util/lib/upload-component');

const states = require('../../../states');
const { installComponentFromUpload } = require('../helper/install-component-from-upload');
const { installComponentFromUrl } = require('../helper/install-component-from-url');

/**
 * Install component
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function installComponent(
  manager,
  {
    rootDid,
    mountPoint,
    url,
    file,
    did,
    diffVersion,
    deleteSet,
    title,
    name,
    configs,
    sync,
    downloadTokenList,
    onlyRequired,
    dist,
  },
  context = {}
) {
  logger.debug('start install component', { rootDid, mountPoint, url });
  if (file) {
    // TODO: 如何触发这种场景？
    const info = await states.node.read();
    if (isInServerlessMode(info)) {
      throw new Error("Can't install component in serverless-mode server via upload");
    }

    return installComponentFromUpload({
      rootDid,
      mountPoint,
      file,
      did,
      diffVersion,
      deleteSet,
      context,
      states,
      manager,
      dist,
    });
  }

  if (url) {
    // 如果是 file 协议的 URI，那么就认为是上传的文件
    const isUploadFile = url.startsWith('file://');
    // 需要判断是否是上传的文件，如果是上传的文件，需要判断是否要更新 did,走升级的逻辑
    // 不需要阻塞流程，如果失败了，就新建一个组件
    try {
      if (isUploadFile && did) {
        await updateComponentDid(url, did);
      }
    } catch (error) {
      logger.error('update component did failed', { error });
    }

    return installComponentFromUrl({
      rootDid,
      mountPoint,
      url,
      context,
      title,
      did,
      name,
      configs,
      sync,
      downloadTokenList,
      states,
      manager,
      onlyRequired,
      isUploadFile,
    });
  }

  // should not be here
  throw new Error('Unknown source');
}

module.exports = {
  installComponent,
};
