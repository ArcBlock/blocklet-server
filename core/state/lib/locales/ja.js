/* eslint-disable prettier/prettier */
module.exports = {
  registry: {
    getListError: 'レジストリ"{registryUrl}"からBlockletリストの取得に失敗しました。',
  },
  backup: {
    space: {
      error: {
        title: 'DID Spacesとのバックアップでエラーが発生しました',
        forbidden:
          'バックアップの実行権限がありません。DIDスペースでアプリケーションのライセンスを復元するか、DIDスペースに再接続してもう一度お試しください',
      },
      isFull: '現在の DID Space のストレージスペースはいっぱいですので、スペースを拡張して再度バックアップしてください',
      lackOfSpace:
        '現在のストレージの利用可能なスペースは不十分です。スペースを拡張してバックアップを再実行してください。',
      unableEnableAutoBackup: '自動バックアップを有効化できません。最初に DID スペースに接続してください',
    },
  },
};
