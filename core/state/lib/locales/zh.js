/* eslint-disable prettier/prettier */
module.exports = {
  registry: {
    getListError: '从 "{registryUrl}" 源获取 Blocklet 列表失败.',
  },
  backup: {
    space: {
      error: {
        title: '备份到 DID Spaces 发生错误',
        forbidden: '你还没有权限执行备份操作，请尝试在 DID Spaces 上恢复应用授权或者重新连接 DID Spaces 后重试',
      },
      isFull: '当前 DID Space 存储空间已满，请扩展空间并再次备份',
      lackOfSpace: '当前存储空间的可用空间不足, 请扩展空间后再次进行备份',
      unableEnableAutoBackup: '无法开启自动备份，请先连接到 DID Spaces',
    },
  },
};
