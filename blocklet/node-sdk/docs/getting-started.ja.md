# はじめに

このガイドでは、Blocklet SDK をインストールし、最小限のアプリケーションを起動して実行するための基本的な手順を説明します。私たちの目標は、わずか数分でゼロから実用的な例を構築できるようお手伝いすることです。

## 前提条件

始める前に、Blocklet プロジェクトが設定されていることを確認してください。まだ設定していない場合は、[Blocklet 開発ドキュメント](https://www.arcblock.io/docs/createblocklet/create-single-blocklet) に従って作成してください。

## ステップ 1: SDK のインストール

Blocklet プロジェクトのディレクトリに移動し、`@blocklet/sdk` パッケージを依存関係として追加します。

```bash Terminal icon=lucide:terminal
npm install @blocklet/sdk

# または yarn を使用
yarn add @blocklet/sdk
```

## ステップ 2: 環境の理解

Blocklet SDK は、アプリケーションの実行時に Blocklet Server によって自動的に注入される環境変数に依存しています。これらの変数は、アプリ ID、名前、シークレットキーなど、アプリケーションにその環境に関するコンテキストを提供します。

SDK には、必要なすべての環境変数が存在することを確認するためのユーティリティが含まれています。通常、これらを手動で設定する必要はありませんが、知っておくと良いでしょう。

以下は、SDK が使用する主要な環境変数の一部です。

| Variable Name | Description |
| :--- | :--- |
| `BLOCKLET_APP_ID` | Blocklet の一意の識別子。 |
| `BLOCKLET_APP_SK` | Blocklet のシークレットキー。リクエストの署名に使用されます。 |
| `BLOCKLET_APP_NAME` | Blocklet の名前。 |
| `BLOCKLET_APP_URL` | Blocklet の公開 URL。 |
| `BLOCKLET_DATA_DIR` | Blocklet が永続データを保存できるディレクトリ。 |
| `ABT_NODE_DID` | Blocklet が実行されているノードの DID。 |

設定の詳細については、[設定と環境](./core-concepts-configuration.md) ガイドを参照してください。

## ステップ 3: 最小限のサーバーを作成する

次に、SDK の動作を確認するために、簡単な Express.js サーバーを作成しましょう。`app.js`（またはプロジェクトのメインエントリーポイント）という名前のファイルを作成し、次のコードを追加します。

この例では、以下の方法をデモンストレーションします。
1.  SDK から `env` オブジェクトをインポートして環境情報にアクセスする。
2.  基本的な Express サーバーをセットアップする。
3.  Blocklet のアプリ名を返すルートエンドポイントを作成する。

```javascript app.js icon=logos:javascript
const express = require('express');
const { env } = require('@blocklet/sdk');

// グローバルなエラーハンドラーは、本番アプリケーションにとって良い習慣です。
process
  .on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
    process.exit(1);
  })
  .on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', (reason)?.message || reason);
    process.exit(1);
  });

const app = express();
const port = process.env.BLOCKLET_PORT || 3000;

app.get('/', (req, res) => {
  // `env` オブジェクトは、すべての Blocklet 環境変数への型付きアクセスを提供します。
  res.send(`Hello from ${env.appName}!`);
});

app.listen(port, () => {
  console.log(`Blocklet listening on port ${port}`);
  console.log(`Visit your Blocklet at: ${env.appUrl}`);
});
```

## ステップ 4: Blocklet を実行する

サーバーコードを配置したら、Blocklet を実行できます。Blocklet CLI を使用して開発サーバーを起動します。

```bash Terminal icon=lucide:terminal
blocklet dev
```

サーバーが起動すると、アプリケーションにアクセスするための URL が記載されたメッセージが表示されます。その URL をブラウザで開くと、`Hello from [Your Blocklet Name]!` というメッセージが表示されるはずです。

## 次のステップ

おめでとうございます！これで Blocklet SDK のセットアップと最小限のアプリケーションの構築が正常に完了しました。

学習を続けるために、SDK を支える基本概念を探求することをお勧めします。

<x-card data-title="コアコンセプト" data-icon="lucide:graduation-cap" data-href="/core-concepts" data-cta="続きを読む">
設定管理からウォレットの取り扱い、セキュリティまで、Blocklet SDK を支える基本概念を理解します。
</x-card>