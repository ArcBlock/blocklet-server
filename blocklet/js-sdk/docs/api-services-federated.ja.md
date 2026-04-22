# FederatedService

`FederatedService`は、統一ログインサイト群の設定を操作するためのAPIを提供します。これにより、ログインセッションを制御する「マスター」アプリケーションと、ユーザーが操作している「現在」のアプリケーションに関する情報を取得できます。これは、統一されたアプリケーションスイッチャーのような機能を作成したり、接続されたBlockletのグループ内でのユーザーセッションのコンテキストを理解するために不可欠です。

統一ログインサイト群 (Federated Login Group) を使用すると、複数のBlockletが単一のユーザーセッションを共有でき、ユーザーがそれらの間を移動する際にシームレスな体験を提供します。1つのBlockletがマスターとして機能し、認証を処理し、他のBlockletはメンバーとなります。

<!-- DIAGRAM_IMAGE_START:architecture:16:9 -->
![FederatedService](assets/diagram/federated-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## 一般的な使用例：アプリスイッチャーの構築

`FederatedService` の最も一般的な使用例は、グループ内のすべてのアプリケーションを一覧表示するUIコンポーネントを構築し、ユーザーがそれらの間を簡単に切り替えられるようにすることです。`getApps()` メソッドは、この目的のために特別に設計されています。

```javascript 例：UIコンポーネント用のアプリを取得 icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

// 統一ログインサイト群内のすべてのアプリのリストを取得します
// マスターアプリは常にリストの最初に表示されます。
const apps = sdk.federated.getApps();

console.log('利用可能なアプリ:', apps);

// この 'apps' 配列を使用して、ドロップダウンメニュー、
// サイドバー、またはその他のナビゲーションコンポーネントをレンダリングできます。
apps.forEach(app => {
  console.log(`アプリ名: ${app.appName}, URL: ${app.appUrl}`);
});
```

## APIリファレンス

### getApps()

現在の統一ログインコンテキストに関連するアプリケーションのリストを取得します。マスターアプリケーションと現在のアプリケーションをインテリジェントに組み合わせ、統一ログインが有効な場合はマスターアプリケーションが常に最初にリストされるようにします。

**戻り値**

<x-field data-name="" data-type="Array<AppInfo | ServerInfo>">
  <x-field-desc markdown>アプリケーション情報オブジェクトの配列。統一ログインが有効な場合、マスターアプリは常に最初の要素になります。</x-field-desc>
</x-field>

**例**

```javascript icon=logos:javascript
const appList = sdk.federated.getApps();
console.log(appList);
```

**レスポンス例**

```json
[
  {
    "appId": "z1masterAppDid",
    "appName": "マスターアプリ",
    "appDescription": "グループのメインアプリケーションです。",
    "appLogo": "/assets/logo.png",
    "appPid": "z8tmasterAppPid",
    "appUrl": "https://master.example.com",
    "version": "1.2.0",
    "sourceAppPid": "z8tmasterAppPid",
    "provider": "wallet"
  },
  {
    "appId": "z1currentAppDid",
    "appName": "現在のメンバーアプリ",
    "appDescription": "現在使用しているアプリケーションです。",
    "appLogo": "/assets/logo.png",
    "appPid": "z8tcurrentAppPid",
    "appUrl": "https://member.example.com",
    "version": "1.0.0",
    "sourceAppPid": null,
    "provider": "wallet"
  }
]
```

### getCurrentApp()

現在実行中のアプリケーションの情報を取得します。これは、標準のBlockletまたはBlocklet Server自体のいずれかです。

**戻り値**

<x-field data-name="" data-type="AppInfo | ServerInfo | null">
  <x-field-desc markdown>現在のアプリケーションの詳細を含むオブジェクト、または特定できない場合は `null`。</x-field-desc>
</x-field>

**例**

```javascript icon=logos:javascript
const currentApp = sdk.federated.getCurrentApp();
if (currentApp) {
  console.log(`現在表示中: ${currentApp.appName}`);
}
```

### getFederatedApp()

統一ログインサイト群のマスターアプリケーションの情報を取得します。現在のアプリケーションが統一ログインサイト群の一部でない場合、このメソッドは `null` を返します。

**戻り値**

<x-field data-name="" data-type="AppInfo | null">
  <x-field-desc markdown>マスターアプリケーションの詳細を含むオブジェクト、または統一ログインモードでない場合は `null`。</x-field-desc>
</x-field>

**例**

```javascript icon=logos:javascript
const masterApp = sdk.federated.getFederatedApp();
if (masterApp) {
  console.log(`マスターアプリ: ${masterApp.appName}`);
}
```

### getFederatedEnabled()

統一ログインサイト群機能が有効で、ユーザーによって承認されているかどうかを確認します。

**戻り値**

<x-field data-name="" data-type="boolean">
  <x-field-desc markdown>統一ログインが設定され、ステータスが「承認済み」の場合は `true` を返し、それ以外の場合は `false` を返します。</x-field-desc>
</x-field>

**例**

```javascript icon=logos:javascript
const isFederated = sdk.federated.getFederatedEnabled();
if (isFederated) {
  console.log('統一ログインが有効です。');
} else {
  console.log('これはスタンドアロンアプリケーションです。');
}
```

### getTrustedDomains()

統一ログインサイト群に設定されている信頼できるドメインのリストを非同期で取得します。

**戻り値**

<x-field data-name="" data-type="Promise<Array<string>>">
  <x-field-desc markdown>信頼できるドメイン文字列の配列に解決されるPromise。</x-field-desc>
</x-field>

**例**

```javascript icon=logos:javascript
async function logTrustedDomains() {
  try {
    const domains = await sdk.federated.getTrustedDomains();
    console.log('信頼できるドメイン:', domains);
  } catch (error) {
    console.error('信頼できるドメインの取得に失敗しました:', error);
  }
}

logTrustedDomains();
```

### getBlockletData()

指定されたアプリケーションURLから `__blocklet__.js` メタデータファイルを非同期で取得し、解析します。このメソッドには、冗長なネットワークリクエストを回避するためのキャッシュ機能が含まれています。

**パラメータ**

<x-field-group>
  <x-field data-name="appUrl" data-type="string" data-required="true" data-desc="データを取得したいBlockletのベースURL。"></x-field>
  <x-field data-name="force" data-type="boolean" data-default="false" data-required="false" data-desc="trueの場合、キャッシュをバイパスして新しいデータを取得します。"></x-field>
</x-field-group>

**戻り値**

<x-field data-name="" data-type="Promise<any | null>">
  <x-field-desc markdown>`__blocklet__.js` から解析されたJSONデータに解決されるPromise、失敗した場合は `null`。</x-field-desc>
</x-field>

**例**

```javascript icon=logos:javascript
async function fetchMetadata(url) {
  const metadata = await sdk.federated.getBlockletData(url);
  if (metadata) {
    console.log(`${url}のメタデータ:`, metadata.name, metadata.version);
  }
}

fetchMetadata('https://some-blocklet.example.com');
```

## 型

これらは `FederatedService` メソッドによって返される主要なデータ構造です。

### AppInfo

標準のBlockletアプリケーションを表します。

```typescript AppInfo 型 icon=material-symbols:data-object-outline
type AppInfo = {
  appId: string;
  appName: string;
  appDescription: string;
  appLogo: string;
  appPid: string;
  appUrl: string;
  version: string;
  sourceAppPid: string;
  provider: string;
};
```

### ServerInfo

Blocklet Serverインスタンスを表します。

```typescript ServerInfo 型 icon=material-symbols:data-object-outline
type ServerInfo = {
  appId: string;
  appName: string;
  appDescription: string;
  appUrl: string;
  sourceAppPid: string;
  provider: string;
  type: 'server';
};
```

---

これで、統一ログインアプリケーションの操作方法を理解できました。次は、異なるデバイス間でユーザーのログインセッションを管理する方法を知りたいかもしれません。[UserSessionService](./api-services-user-session.md) のドキュメントに進んで、さらに学びましょう。