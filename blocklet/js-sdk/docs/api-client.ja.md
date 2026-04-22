# SDK クライアント

SDK クライアントは、`@blocklet/js-sdk` と対話するための主要なエントリーポイントを提供します。利用可能なすべてのサービスをバンドルしたメインの `BlockletSDK` クラスと、便利なアクセスとインスタンス化のためのいくつかのファクトリ関数 (`getBlockletSDK`, `createAxios`, `createFetch`) を提供します。

このセクションでは、これらのコアコンポーネントの詳細なリファレンスを提供します。実践的な例については、[APIリクエストの作成](./guides-making-api-requests.md) ガイドを参照してください。

<!-- DIAGRAM_IMAGE_START:architecture:16:9 -->
![SDK Client](assets/diagram/client-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## BlockletSDK クラス

`BlockletSDK` クラスは、すべての異なるサービスのインスタンスを保持するコンテナであり、SDK の機能への単一のアクセスポイントを提供します。

直接インスタンス化することもできますが、推奨される方法は `getBlockletSDK()` ファクトリ関数を介してインスタンスを取得することです。これにより、アプリケーション全体で単一の共有インスタンスが保証されます。

### プロパティ

`BlockletSDK` インスタンスでは、以下のサービスがプロパティとして利用可能です：

| プロパティ      | サービス                                                    | 説明                                                  |
|---------------|------------------------------------------------------------|--------------------------------------------------------------|
| `user`        | [AuthService](./api-services-auth.md)                           | ユーザープロファイル、設定、認証アクションを管理します。 |
| `userSession` | [UserSessionService](./api-services-user-session.md)           | デバイス間のユーザーログインセッションを取得し、管理します。      |
| `token`       | [TokenService](./api-services-token.md)                         | セッショントークンとリフレッシュトークンを管理するための低レベルサービス。   |
| `blocklet`    | [BlockletService](./api-services-blocklet.md)                   | Blocklet のメタデータを取得し、ロードします。                         |
| `federated`   | [FederatedService](./api-services-federated.md)                 | 連合ログイングループの設定と対話します。               |
| `api`         | `Axios`                                                    | **非推奨**。Axios インスタンス。代わりに `createAxios()` を使用してください。 |

## ファクトリ関数

これらのヘルパー関数は、SDK クライアントと HTTP リクエストハンドラを便利に作成する方法を提供します。

### getBlockletSDK()

`getBlockletSDK()`

この関数は `BlockletSDK` クラスのシングルトンインスタンスを返します。シングルトンを使用することで、アプリケーションのすべての部分がトークン情報やサービス設定を含む同じ SDK 状態を共有することが保証されます。

**戻り値**

シングルトンの `BlockletSDK` インスタンス。

```javascript getBlockletSDK の使用 icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

async function fetchUserProfile() {
  try {
    const profile = await sdk.user.getProfile();
    console.log('ユーザープロファイル:', profile);
  } catch (error) {
    console.error('プロファイルの取得に失敗しました:', error);
  }
}

fetchUserProfile();
```

### createAxios()

`createAxios(config, requestParams)`

これは、事前設定された [Axios](https://axios-http.com/) インスタンスを作成するための推奨されるファクトリ関数です。インスタンスは、送信リクエストへの認証ヘッダーの追加と、セッショントークンが期限切れになった場合のリフレッシュを自動的に処理します。

**パラメータ**

<x-field-group>
  <x-field data-name="config" data-type="AxiosRequestConfig" data-required="false" data-desc="オプション。標準の Axios 設定オブジェクト。有効な Axios オプションはすべてここに渡すことができます。"></x-field>
  <x-field data-name="requestParams" data-type="RequestParams" data-required="false" data-desc="オプション。SDK 固有のリクエスト処理のための追加パラメータ。"></x-field>
</x-field-group>

**戻り値**

自動トークン管理のためにインターセプターが設定された `Axios` インスタンス。

```javascript Axios クライアントの作成 icon=logos:javascript
import { createAxios } from '@blocklet/js-sdk';

// ベース URL を持つ API クライアントを作成
const apiClient = createAxios({
  baseURL: '/api/v1',
});

async function getItems() {
  try {
    // Authorization ヘッダーは自動的に追加されます
    const response = await apiClient.get('/items');
    return response.data;
  } catch (error) {
    console.error('アイテムの取得中にエラーが発生しました:', error);
    throw error;
  }
}
```

### createFetch()

`createFetch(options, requestParams)`

ネイティブの [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) を好む開発者向けに、この関数は `createAxios` と同じ自動トークン管理を提供するラップされた `fetch` 関数を返します。

**パラメータ**

<x-field-group>
  <x-field data-name="options" data-type="RequestInit" data-required="false" data-desc="オプション。標準の RequestInit 型で定義されているヘッダーなど、Fetch API のデフォルトオプション。"></x-field>
  <x-field data-name="requestParams" data-type="RequestParams" data-required="false" data-desc="オプション。SDK 固有のリクエスト処理のための追加パラメータ。"></x-field>
</x-field-group>

**戻り値**

認証を自動的に処理する `fetch` 互換の関数。

```javascript Fetch クライアントの作成 icon=logos:javascript
import { createFetch } from '@blocklet/js-sdk';

// デフォルトの JSON ヘッダーを持つ fetcher を作成
const apiFetcher = createFetch({
  headers: {
    'Content-Type': 'application/json',
  },
});

async function postItem(item) {
  try {
    const response = await apiFetcher('/api/v1/items', {
      method: 'POST',
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      throw new Error(`HTTPエラー！ステータス: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('アイテムの投稿中にエラーが発生しました:', error);
    throw error;
  }
}
```

---

SDK クライアントが初期化されたので、Blocklet エコシステムと対話するために提供されるさまざまなサービスを探索できます。

<x-cards>
  <x-card data-title="認証ガイド" data-icon="lucide:key-round" data-href="/guides/authentication">
    SDKがユーザー認証とトークン管理をどのように簡素化するかを学びます。
  </x-card>
  <x-card data-title="サービスAPIリファレンス" data-icon="lucide:book-open" data-href="/api/services">
    各サービスの詳細なAPIドキュメントを深く掘り下げます。
  </x-card>
</x-cards>