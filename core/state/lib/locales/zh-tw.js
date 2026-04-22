/* eslint-disable prettier/prettier */
module.exports = {
  registry: {
    getListError: '從注冊表"{registryUrl}"獲取Blocklet列表失敗。',
  },
  backup: {
    space: {
      error: {
        title: '備份到 DID Spaces 發生錯誤',
        forbidden: '您無權限執行備份，請嘗試在DID Spaces上恢復應用程式許可證，或重新連接到DID Spaces並重試',
      },
      isFull: '當前 DID Space 儲存空間已滿，請擴展空間並再次備份',
      lackOfSpace: '儲存空間當前的可用空間不足，請擴展空間並重新進行備份。',
      unableEnableAutoBackup: '無法啟用自動備份，請先連接到 DID 空間',
    },
  },
};
