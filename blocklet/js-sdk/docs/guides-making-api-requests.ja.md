# APIリクエストの作成

`@blocklet/js-sdk`は、BlockletサービスへのAPIリクエストを行うための、強力で事前設定済みのヘルパーを提供します。これらのヘルパーである`createAxios`と`createFetch`は、認証とセッション管理の複雑さを自動的に処理するように設計されているため、アプリケーションの機能構築に集中できます。

主な機能は次のとおりです。
- **自動トークン挿入**: セッショントークンは自動的に`Authorization`ヘッダーに含まれます。
- **自動トークン更新**: リクエストが401 Unauthorizedエラーで失敗した場合、SDKは自動的にセッショントークンの更新を試み、元のリクエストを一度再試行します。
- **CSRF保護**: セキュリティを強化するため、すべてのリクエストに`x-csrf-token`ヘッダーが添付されます。
- **ベースURL処理**: リクエストには自動的に正しいコンポーネントのマウントポイントが接頭辞として付加されるため、手動でのURL構築が不要になります。
- **安全なレスポンス検証**: Blockletサーバーからのレスポンスの完全性を検証するためのオプションのセキュリティ層です。

---

## `createAxios`の使用

`axios`ライブラリを好む開発者向けに、`createAxios`関数はSDKのリクエスト処理のすべての利点を組み込んだ`axios`インスタンスを返します。すべての標準的な`axios`設定と機能をサポートしています。

### 基本的な使用法

インスタンスを作成し、簡単な`GET`リクエストを行う方法は次のとおりです。

```javascript Basic Axios Request icon=logos:javascript
import { createAxios } from '@blocklet/js-sdk';

// SDKによって管理されるaxiosインスタンスを作成
const api = createAxios();

async function fetchData() {
  try {
    const response = await api.get('/api/users/profile');
    console.log('ユーザープロファイル:', response.data);
  } catch (error) {
    console.error('ユーザープロファイルの取得に失敗しました:', error);
  }
}

fetchData();
```

この例では、`createAxios`がインスタンスを設定し、認証ヘッダーとトークン更新ロジックを自動的に処理します。`/api/users/profile`へのリクエストは、コンポーネントのバックエンドに正しくルーティングされます。

### カスタム設定

`createAxios`に有効な`axios`設定オブジェクトを渡すことで、カスタムベースURLの設定やデフォルトヘッダーの追加など、その動作をカスタマイズできます。

```javascript Custom Axios Configuration icon=logos:javascript
import { createAxios } from '@blocklet/js-sdk';

const customApi = createAxios({
  baseURL: '/api/v2/',
  timeout: 10000, // 10秒
  headers: { 'X-Custom-Header': 'MyValue' },
});

async function postData() {
  const response = await customApi.post('/items', { name: 'New Item' });
  console.log('アイテムが作成されました:', response.data);
}
```

---

## `createFetch`の使用

標準のWeb `fetch` APIに基づく、より軽量なソリューションを好む場合、`createFetch`関数が最適です。これは`fetch`のラッパーを提供し、`axios`ヘルパーと同じ自動トークン管理とセキュリティ機能を備えています。

### 基本的な使用法

`createFetch`関数は、ネイティブの`fetch`と似たシグネチャを持つ非同期関数を返します。

```javascript Basic Fetch Request icon=logos:javascript
import { createFetch } from '@blocklet/js-sdk';

// SDKによって管理されるfetchインスタンスを作成
const fetcher = createFetch();

async function fetchData() {
  try {
    const response = await fetcher('/api/users/profile');
    if (!response.ok) {
      throw new Error(`HTTPエラー！ステータス: ${response.status}`);
    }
    const data = await response.json();
    console.log('ユーザープロファイル:', data);
  } catch (error) {
    console.error('ユーザープロファイルの取得に失敗しました:', error);
  }
}

fetchData();
```

### カスタム設定

`createFetch`にデフォルトの`RequestInit`オブジェクトを渡して、そのインスタンスで行われるすべてのリクエストのグローバルオプションを設定できます。これらのオプションはリクエストごとに上書きすることもできます。

```javascript Custom Fetch Configuration icon=logos:javascript
import { createFetch } from '@blocklet/js-sdk';

// グローバルオプションを設定
const fetcher = createFetch({
  headers: {
    'Content-Type': 'application/json',
  },
});

async function postData() {
  const response = await fetcher('/api/items', {
    method: 'POST',
    body: JSON.stringify({ name: 'New Item' }),
  });
  const data = await response.json();
  console.log('アイテムが作成されました:', data);
}
```

## 自動トークン更新フロー

`createAxios`と`createFetch`はどちらもセッションの期限切れを適切に処理します。以下の図は、期限切れのトークンでAPI呼び出しが行われたときに発生する自動化されたプロセスを示しています。

<!-- DIAGRAM_IMAGE_START:sequence:4:3 -->
![Making API Requests](assets/diagram/making-api-requests-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

このフロー全体はアプリケーションコードに対して透過的であり、手動での介入なしにシームレスなユーザーエクスペリエンスを保証します。

---

## 安全なリクエスト

機密性の高い操作のために、APIレスポンスの署名を検証することで、追加のセキュリティ層を有効にすることができます。これにより、サーバーとクライアント間でレスポンスが改ざんされていないことが保証されます。これを有効にするには、リクエスト設定で`secure`オプションを`true`に設定します。

### `createAxios`を使用する場合

```javascript Axios Secure Request icon=logos:javascript
import { createAxios } from '@blocklet/js-sdk';
const api = createAxios();

// SDKはレスポンスの署名を検証します。
// 検証が失敗した場合、promiseはエラーで拒否されます。
const response = await api.get('/api/billing/details', { secure: true });
```

### `createFetch`を使用する場合

```javascript Fetch Secure Request icon=logos:javascript
import { createFetch } from '@blocklet/js-sdk';
const fetcher = createFetch();

const response = await fetcher('/api/billing/details', { secure: true });
// 署名が有効な場合にのみ、レスポンスオブジェクトが返されます。
const data = await response.json();
```

## 次のステップ

認証済みAPIリクエストの作成方法を理解したところで、SDKがユーザーIDとセッションをどのように管理するかについて、さらに深く掘り下げてみましょう。

<x-cards>
  <x-card data-title="認証" data-icon="lucide:key-round" data-href="/guides/authentication">
    セッショントークンとリフレッシュトークンの概念、およびユーザー認証状態の管理方法について学びます。
  </x-card>
  <x-card data-title="APIリファレンス" data-icon="lucide:book-open" data-href="/api/client">
    `createAxios`、`createFetch`、およびその他のSDKコンポーネントの詳細なAPIドキュメントをご覧ください。
  </x-card>
</x-cards>