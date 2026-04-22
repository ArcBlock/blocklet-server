# BlockletService

`BlockletService`は、ブロックレットのメタデータにアクセスするためのメソッドを提供します。`Blocklet`オブジェクトで表されるこのメタデータには、アプリケーション名、URLプレフィックス、バージョン、コンポーネントのマウントポイントなどの重要な情報が含まれています。

このサービスは、主に2つの方法でこの情報を取得できます。

1.  **クライアントサイド:** ブロックレットのフロントエンド内でコードが実行されているときに自動的に利用可能になるグローバルな`window.blocklet`オブジェクトを読み取ることによって。
2.  **リモートフェッチ:** 指定されたベースURLからブロックレットのメタデータを取得することによって。これは、サーバーサイドのコンテキストや、外部アプリケーションからブロックレットと対話する場合に便利です。

パフォーマンスを向上させるため、このサービスはリモートで取得したブロックレットデータに対して60秒間持続するインメモリキャッシュを実装しています。

---

## メソッド

### getBlocklet()

ブロックレットのメタデータオブジェクトを取得します。このメソッドの動作は、提供された引数によって変わります。

-   クライアントサイドで引数なしで呼び出されると、同期的に`window.blocklet`を返します。
-   `baseUrl`を指定して呼び出されると、リモートURLから非同期でメタデータを取得します。

**パラメータ**

<x-field-group>
  <x-field data-name="baseUrl" data-type="string" data-required="false" data-desc="メタデータを取得するブロックレットのベースURL。サーバーサイドでの使用に必要です。"></x-field>
  <x-field data-name="force" data-type="boolean" data-default="false" data-required="false" data-desc="trueの場合、キャッシュをバイパスしてリモートURLから新しいデータを取得します。"></x-field>
</x-field-group>

**戻り値**

<x-field data-name="Promise<Blocklet> | Blocklet" data-type="Promise<Blocklet> | Blocklet" data-desc="リモートで取得する場合はブロックレットのメタデータオブジェクトで解決されるPromiseを返し、クライアントサイドのコンテキストではオブジェクトを直接返します。"></x-field>

**例**

```javascript クライアントサイドでBlockletを取得 icon=logos:javascript
// このコードは、ブロックレットのフロントエンド環境で実行されていることを前提としています

async function logBlockletName() {
  try {
    // クライアントでは、データがプリロードされている場合、getBlocklet()は同期的になることがあります
    const blocklet = await sdk.blocklet.getBlocklet();
    console.log('Blocklet名:', blocklet.appName);
  } catch (error) {
    console.error('ブロックレット情報の取得に失敗しました:', error);
  }
}

logBlockletName();
```

```javascript URLからBlockletを取得 icon=logos:javascript
async function fetchRemoteBlocklet(url) {
  try {
    console.log(`${url}からブロックレット情報を取得中...`);
    const blocklet = await sdk.blocklet.getBlocklet(url);
    console.log(`正常に取得しました: ${blocklet.appName} v${blocklet.version}`);

    // 再度取得します。今回はキャッシュから取得されるはずです
    const cachedBlocklet = await sdk.blocklet.getBlocklet(url);
    console.log('キャッシュから取得:', cachedBlocklet.appName);

    // キャッシュをバイパスして強制的に再取得します
    const freshBlocklet = await sdk.blocklet.getBlocklet(url, true);
    console.log('強制再取得:', freshBlocklet.appName);
  } catch (error) {
    console.error('リモートブロックレットの取得に失敗しました:', error);
  }
}

fetchRemoteBlocklet('https://store.blocklet.dev');
```

### loadBlocklet()

これは、`__blocklet__.js`スクリプトをドキュメントの`<head>`に動的に挿入するクライアントサイドのユーティリティメソッドです。このスクリプトは`window.blocklet`オブジェクトを生成し、メタデータをグローバルに利用可能にします。これは、ブロックレット自体ではないが、ブロックレットと対話する必要があるアプリケーションに特に便利です。

> 注: このメソッドはサーバーサイド（Node.js）環境で呼び出されると失敗します。

**戻り値**

<x-field data-name="Promise<void>" data-type="Promise<void>" data-desc="スクリプトが正常にロードされたときに解決され、エラーがある場合は拒否されるPromise。"></x-field>

**例**

```javascript Blockletスクリプトを動的にロード icon=logos:javascript
async function initializeBlockletData() {
  try {
    await sdk.blocklet.loadBlocklet();
    console.log('Blockletスクリプトが正常にロードされました。');
    // これでwindow.blockletが利用可能になります
    console.log('Blocklet名:', window.blocklet.appName);
  } catch (error) {
    console.error('ブロックレットスクリプトのロードに失敗しました:', error);
  }
}

// この関数はブラウザ環境で実行してください
initializeBlockletData();
```

### getPrefix()

ブロックレットのURLプレフィックスを取得するための便利なメソッドです。プレフィックスは、ブロックレットが提供されるベースパスです（例：`/` または `/my-blocklet`）。

**パラメータ**

<x-field data-name="blocklet" data-type="Blocklet" data-required="false" data-desc="オプションのBlockletオブジェクト。指定された場合、そのprefixプロパティが返されます。"></x-field>

**戻り値**

<x-field data-name="string | null" data-type="string | null" data-desc="文字列のプレフィックス（例：'/app'）またはデフォルトとして'/'。windowが利用できず、blockletオブジェクトが渡されないサーバーサイド環境では、nullを返します。"></x-field>

**例**

```javascript URLプレフィックスを取得 icon=logos:javascript
// これがブロックレット内のクライアントサイドで実行されることを想定しています
const prefix = sdk.blocklet.getPrefix();
console.log('現在のブロックレットのプレフィックス:', prefix);

// または、すでに取得したBlockletオブジェクトを渡すこともできます
async function logPrefixForRemoteBlocklet(url) {
  const remoteBlocklet = await sdk.blocklet.getBlocklet(url);
  const remotePrefix = sdk.blocklet.getPrefix(remoteBlocklet);
  console.log(`${remoteBlocklet.appName}のプレフィックスは:`, remotePrefix);
}

logPrefixForRemoteBlocklet('https://store.blocklet.dev');
```

---

## Blockletオブジェクト

`getBlocklet()`メソッドは、アプリケーションに関する包括的なメタデータを含む`Blocklet`オブジェクトを返します。以下は、最も一般的に使用されるプロパティの一部です。

<x-field-group>
  <x-field data-name="did" data-type="string" data-desc="ブロックレットの分散型識別子（DID）。"></x-field>
  <x-field data-name="appName" data-type="string" data-desc="アプリケーションの人間が読める名前。"></x-field>
  <x-field data-name="appUrl" data-type="string" data-desc="アプリケーションの完全な公開URL。"></x-field>
  <x-field data-name="prefix" data-type="string" data-desc="ブロックレットがマウントされているURLプレフィックス。"></x-field>
  <x-field data-name="version" data-type="string" data-desc="ブロックレットのバージョン（例：'1.2.3'）。"></x-field>
  <x-field data-name="isComponent" data-type="boolean" data-desc="ブロックレットがコンポーネントであるかどうかを示します。"></x-field>
  <x-field data-name="componentMountPoints" data-type="BlockletComponent[]" data-desc="このブロックレットによってマウントされたコンポーネントの配列。"></x-field>
  <x-field data-name="theme" data-type="BlockletTheme" data-desc="色やロゴなどのテーマ設定を含むオブジェクト。"></x-field>
  <x-field data-name="navigation" data-type="BlockletNavigation[]" data-desc="ブロックレットのUI用のナビゲーション項目の配列。"></x-field>
  <x-field data-name="serverDid" data-type="string" data-desc="ブロックレットを実行しているBlocklet ServerインスタンスのDID。"></x-field>
</x-field-group>

**レスポンス例**

```json Blockletオブジェクトの例 icon=mdi:code-json
{
  "did": "z8iZz...",
  "appId": "z1s...",
  "appName": "Blocklet Store",
  "appDescription": "A marketplace for blocklets",
  "appUrl": "https://store.blocklet.dev",
  "prefix": "/",
  "version": "1.16.29",
  "isComponent": false,
  "theme": {
    "logo": "logo.png",
    "colors": {
      "primary": "#4F6AF6"
    }
  },
  "navigation": [
    {
      "id": "home",
      "title": "Home",
      "link": "/"
    }
  ],
  "componentMountPoints": [],
  "serverDid": "z2qaD...",
  "webWalletUrl": "https://web.abtwallet.io"
}
```

すべてのプロパティの完全なリストについては、[Types](./api-types.md)のリファレンスページを参照してください。

---

## 次のステップ

ブロックレットのメタデータを取得する方法を学んだので、次はマウントされたコンポーネントに関する情報を取得する方法を学びたいと思うかもしれません。次のセクションに進み、`ComponentService`について学びましょう。

<x-card data-title="ComponentService" data-icon="lucide:box" data-cta="続きを読む" data-href="/api/services/component">
  マウントされたコンポーネントに関する情報を取得し、それらのURLを構築するためのAPI。
</x-card>