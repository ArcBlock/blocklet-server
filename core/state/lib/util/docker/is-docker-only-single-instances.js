// search-kit 应该忽略蓝绿部署, 不然重启过程会失败
const SINGLE_INSTANCE_COMPONENT_DIDS = new Set(['z8iZorY6mvb5tZrxXTqhBmwu89xjEEazrgT3t']);

/**
 * 检查组件是否只能以单实例模式运行
 * @param {Object} meta - 组件元数据
 * @param {string} meta.did - 组件DID
 * @param {Object} meta.docker - Docker配置
 * @returns {boolean} 是否只能单实例运行
 */
function isDockerOnlySingleInstance(meta = {}) {
  if (!meta.did) {
    return true;
  }
  if (SINGLE_INSTANCE_COMPONENT_DIDS.has(meta.did)) {
    return true;
  }
  // 用于描述某个组件是否只能以单实例模式运行
  if (meta.capabilities?.singleton) {
    return true;
  }
  if (!meta.docker) {
    return false;
  }
  if (meta.docker.RunBaseScript && meta.docker.installNodeModules) {
    return false;
  }

  return !!meta.docker.volume;
}

module.exports = { isDockerOnlySingleInstance };
