/* eslint-disable prettier/prettier */
export default {
  blocklet: {
    restoreBlocklet: {
      title: '还原应用',
      verify: {
        title: '验证所有权',
        subTitle: '使用 DID Wallet 验证所有权',
        verify: '验证',
        reconnect: '换个应用',
        scan: '使用以下方法证明所有权',
        confirm: '请在钱包中确认签名，以允许服务器下载并解密备份',
        success: '所有权验证成功，正在进行还原',
        exists: '相同 DID 的应用已存在此节点上，没有继续恢复',
        open: '访问此应用',
        overwrite: '覆盖安装',
      },
      overwrite: {
        title: '覆盖现有应用？',
        description: '你要恢复的应用已经存在于此节点上，是否要覆盖安装？如果继续，现有应用将被删除，然后执行恢复操作',
      },
      restore: {
        title: '还原应用',
      },
      description: '请选择您要恢复的 blocklet',
    },
    restoreFromServer: {
      selectTitle: '选择应用',
      description: '请选择要还原的应用',
      backupIn: '备份于',
    },
    restoreFromSpaces: {
      title: '从 DID Spaces 还原',
      navSubTitle: '还原',
      connect: {
        title: '连接到 DID Spaces',
        subTitle: '跳转到 DID Spaces, 选择你要还原的应用',
        select: '请选择 DID Spaces 网关地址',
        connect: '前往授权',
      },
      selectBlocklet: {
        title: '选择应用',
      },
      restore: {
        title: '还原应用',
        subTitle: '正在还原应用...',
        completeTitle: '一切已就绪',
        installedTitle: '恢复成功',
        installedSubTitle: '但还需要一些配置才能启动',
        support:
          '如果重试未能解决问题，请在<a href="{communityLink}" target="_blank">社区</a>求助, 或者给我们发送邮件至<a href="mailto: {supportEmail}">{supportEmail}</a>.',
      },
      nftAuthDialog: {
        title: '请出示您的应用空间 NFT',
        scan: '用你的 DID Wallet 扫描下面的二维码以提供 NFT',
        confirm: '确认在你的账户',
        success: '验证 NFT 成功',
      },
      progress: {
        waiting: '等待恢复',
        restoring: '正在恢复...',
        importData: '导入数据...',
        downloading: '下载数据, 进度: {progress}',
        importSuccess: '数据导入成功',
        installing: '安装应用...',
      },
    },
  },
  server: {
    checkUpgrade: '检查新版',
  },
};
