# はじめに

このガイドでは、`@blocklet/js-sdk` をインストールし、最初の API コールを行うための基本的な手順を説明します。ほんの数分で使い始められるようにすることが目標です。

## インストール

まず、SDK をプロジェクトに追加する必要があります。お好みのパッケージマネージャーを使用できます:

```bash Installation icon=mdi:bash
npm install @blocklet/js-sdk

# or

yarn add @blocklet/js-sdk

# or

pnpm add @blocklet/js-sdk
```

## 基本的な使用方法

SDK は直感的に使えるように設計されています。最も一般的な2つのユースケースは、コアなBlockletサービス（ユーザー認証など）へのアクセスと、独自のBlockletのバックエンドへの認証済みリクエストの作成です。

### コアサービスへのアクセス

SDK を使用する最も簡単な方法は、`getBlockletSDK` シングルトンファクトリをインポートすることです。この関数は、アプリケーション全体で常に同じ SDK インスタンスを取得することを保証し、状態管理を簡素化します。

以下に、現在のユーザーのプロファイルを取得するための使用方法を示します:

```javascript Get User Profile icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

async function fetchUserProfile() {
  try {
    const { data: userProfile } = await sdk.user.getProfile();
    console.log('User Profile:', userProfile);
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
  }
}

fetchUserProfile();
```

`sdk` インスタンスは、`user`、`userSession`、`blocklet` などのさまざまなサービスへのアクセスを提供します。これらのサービスは、よく知られた Blocklet サービスエンドポイントとの通信を処理します。

### あなたのBlockletへのAPIリクエストの作成

独自のBlockletのバックエンドAPIと通信するために、SDKは `createAxios` と `createFetch` ヘルパー関数を提供します。これらはAxiosとネイティブのFetch APIのラッパーであり、認証済みリクエストに必要なすべてが事前に設定されています。

これらは自動的に処理します:
- コンポーネントに適した `baseURL` の設定。
- `Authorization` ヘッダーへのセッショントークンの付与。
- セキュリティのための `x-csrf-token` の含入。
- セッショントークンが期限切れになった場合の自動更新。

`createAxios` を使用してバックエンド用の API クライアントを作成する方法は次のとおりです:

```javascript Create an API Client icon=logos:javascript
import { createAxios } from '@blocklet/js-sdk';

// Create an Axios instance configured for your Blocklet
const apiClient = createAxios();

async function fetchData() {
  try {
    // Make a request to your own backend, e.g., GET /api/posts
    const response = await apiClient.get('/api/posts');
    console.log('Posts:', response.data);
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
}

fetchData();
```

この設定により、トークンやヘッダーを手動で管理する必要はありません。SDK が認証フローをシームレスに処理します。

## 次のステップ

これで、`@blocklet/js-sdk` をインストールし、最も一般的な2つのシナリオで使用する方法を学びました。さらに深く掘り下げるには、次のガイドを探索することをお勧めします:

<x-cards>
  <x-card data-title="APIリクエストの作成" data-icon="lucide:file-code-2" data-href="/guides/making-api-requests">
    `createAxios` と `createFetch` の高度な設定について詳しく学びます。エラーハンドリングやリクエストパラメータも含まれます。
  </x-card>
  <x-card data-title="認証" data-icon="lucide:key-round" data-href="/guides/authentication">
    SDKが内部でセッショントークンとリフレッシュトークンをどのように管理してユーザーのログイン状態を維持するかを理解します。
  </x-card>
</x-cards>