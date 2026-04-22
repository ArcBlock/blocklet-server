/* eslint-disable prettier/prettier */
export default {
  blocklet: {
    restoreBlocklet: {
      title: 'Blockletを復元する',
      description: '復元したいブロックを選択してください',
      verify: {
        title: '所有権を確認する',
        subTitle: 'あなたのDIDウォレットでブロックの所有権を確認してください',
        verify: '検証',
        reconnect: '別のブロックを試してみてください',
        scan: '以下の方法を使用して所有権を証明してください',
        confirm: 'バックアップのダウンロードと復号化をサーバーに許可するための署名委任を行います',
        success: '所有権が確認され、復元が進行中です',
        exists: 'このブロックレットは既にこのサーバー上に存在し、復元が中止されました',
        open: 'Blockletを訪れる',
        overwrite: '上書きする ',
      },
      overwrite: {
        title: '既存のブロックを上書きしますか？',
        description:
          '復元しようとしているブロックレットは既にこのサーバーに存在しています。上書きしますか？続行する場合、既存のブロックレットは先に削除されます。',
      },
      restore: {
        title: 'ブロックの復元',
      },
    },
    restoreFromServer: {
      selectTitle: 'アプリケーションを選択',
      description: '復元したいアプリケーションを選択してください',
      backupIn: 'バックアップ中',
    },
    restoreFromSpaces: {
      title: 'DIDスペースから復元する',
      navSubTitle: '復元',
      connect: {
        title: 'DID Spaces に接続',
        subTitle: 'DID Spacesにジャンプして、復元したいブロックレットを選択してください。',
        select: 'DID スペースゲートウェイを選択してください',
        connect: '接続する',
      },
      selectBlocklet: {
        title: 'アプリを選択',
      },
      restore: {
        title: 'アプリを復元する',
        subTitle: 'アプリが復元中です',
        completeTitle: '全ての準備が整っています',
        installedTitle: '復元に成功しました！',
        installedSubTitle: 'しかし、まだいくつかの設定が必要です',
        support:
          '再試行しても問題が解決しない場合は、<a href="{communityLink}" target="_blank">コミュニティ</a>でヘルプをお求めいただくか、<a href="mailto: {supportEmail}">{supportEmail}</a>までお問い合わせください。',
      },
      nftAuthDialog: {
        title: 'あなたのApp Space NFTをご紹介ください',
        scan: 'DIDウォレットでQRコードをスキャンしてNFTを表示してください',
        confirm: 'アカウントで確認',
        success: 'NFT の検証に成功しました！',
      },
      progress: {
        waiting: '復元待ち...',
        restoring: '復元中...',
        importData: 'データのインポート中...',
        downloading: 'ファイルのダウンロード中、進捗：{progress}',
        importSuccess: 'インポートに成功しました！',
        installing: 'インストール中...',
      },
    },
  },
  server: {
    checkUpgrade: '新しいバージョンをチェック',
  },
};
