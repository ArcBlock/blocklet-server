/* eslint-disable prettier/prettier */
export default {
  blocklet: {
    restoreBlocklet: {
      title: '還原Blocklet',
      description: '請選擇您想要恢復的塊',
      verify: {
        title: '驗證所有權',
        subTitle: '請使用您的DID錢包驗證 Blocklet 的所有權',
        verify: '驗證',
        reconnect: '嘗試另一個 Blocklet',
        scan: '使用您的DID錢包掃描QR碼以證明所有權',
        confirm: '委託簽署以允許服務器下載和解密備份',
        success: '所有權驗證，正在進行還原',
        exists: '此模塊已存在於此伺服器上，且恢復中止',
        open: '訪問Blocklet',
        overwrite: '覆蓋',
      },
      overwrite: {
        title: '覆蓋現有的 Blocklet？',
        description: '您要恢復的 Blocklet 已經存在於該伺服器上，是否要覆寫？如果您繼續，則先刪除現有的 Blocklet。',
      },
      restore: {
        title: '恢復 Blocklet',
      },
    },
    restoreFromServer: {
      selectTitle: '選擇應用',
      description: '請選擇您想要恢復的應用程式',
      backupIn: '備份在',
    },
    restoreFromSpaces: {
      title: '從 DID Spaces 恢復',
      navSubTitle: '還原',
      connect: {
        title: '連接到 DID Spaces',
        subTitle: '跳轉到 DID Spaces，選擇要還原的 Blocklet Space。',
        select: '請選擇 DID 空間網關',
        connect: '連接',
      },
      selectBlocklet: {
        title: '選取應用程式',
      },
      restore: {
        title: '還原應用程式',
        subTitle: '應用程式正在還原中',
        completeTitle: '一切準備就緒',
        installedTitle: '成功還原！',
        installedSubTitle: '但仍然需要一些設定才能開始',
        support:
          '如果重試無效，請在<a href="{communityLink}" target="_blank">社區</a>尋求幫助，或透過<a href="mailto: {supportEmail}">{supportEmail}</a>與我們聯繫。',
      },
      nftAuthDialog: {
        title: '請展示你的應用空間NFT',
        scan: '使用您的DID錢包掃描QR碼以展示您的NFT',
        confirm: '確認在你的帳戶',
        success: 'NFT 驗證成功！',
      },
      progress: {
        waiting: '等待恢復...',
        restoring: '正在還原...',
        importData: '正在匯入資料...',
        downloading: '下載檔案，進度：{progress}',
        importSuccess: '成功導入！',
        installing: '正在安裝中...',
      },
    },
  },
  server: {
    checkUpgrade: '檢查新版本',
  },
};
