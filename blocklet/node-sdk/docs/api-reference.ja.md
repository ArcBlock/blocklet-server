# APIリファレンス

Blocklet SDK APIリファレンスへようこそ。このセクションでは、SDKによってエクスポートされるすべてのモジュール、クラス、関数、およびユーティリティの詳細な内訳を提供します。ユーザーの管理、通知の送信、またはアプリケーションのセキュリティ保護など、必要な詳細がここで見つかります。

これらのAPIを使用するための実践的でタスクベースのアプローチについては、[ガイド](./guides.md)をご覧ください。詳細なTypeScriptの定義については、[型定義](./api-reference-types.md)セクションを参照してください。

## 主なエクスポート

Blocklet SDKはいくつかのモジュールに整理されており、それぞれが特定の機能セットを提供します。以下は、主に扱うことになる主要なモジュールの概要です。

<x-cards data-columns="2">
  <x-card data-title="BlockletService" data-icon="lucide:server">
    基盤となるBlocklet Server APIと対話し、ユーザー、ロール、権限などを管理するための強力なクライアントです。
  </x-card>
  <x-card data-title="NotificationService" data-icon="lucide:bell-ring">
    リアルタイム通信を処理し、ユーザーに通知を送信したり、システム全体のイベントをリッスンしたりできます。
  </x-card>
  <x-card data-title="EventBus" data-icon="lucide:git-merge">
    アプリケーションの異なる部分間で通信するためのイベント駆動型メッセージングシステムです。
  </x-card>
  <x-card data-title="Middlewares" data-icon="lucide:layers">
    セッション、認証、CSRF保護などを処理するための、事前に構築されたExpress.jsミドルウェアのコレクションです。
  </x-card>
  <x-card data-title="Component Utilities" data-icon="lucide:puzzle">
    ブロックレット内の異なるコンポーネント間の安全な通信を促進する関数です。
  </x-card>
  <x-card data-title="Config & Env" data-icon="lucide:settings">
    ランタイム構成、環境変数、および他のコンポーネントに関する情報にアクセスします。
  </x-card>
  <x-card data-title="Wallet Utilities" data-icon="lucide:wallet">
    署名と認証に不可欠なウォレットインスタンスを作成および管理するためのツールです。
  </x-card>
  <x-card data-title="Security Utilities" data-icon="lucide:shield">
    データの暗号化/復号化やレスポンス署名などの基本的なセキュリティ機能を提供します。
  </x-card>
</x-cards>

---

## BlockletService

`BlockletService`は、ユーザー、ロール、権限、およびその他のコアなブロックレット機能を管理するための包括的なAPIを提供するクライアントです。Blocklet ServerのGraphQL APIへのインターフェースとして機能します。

```javascript サービスの初期化 icon=logos:javascript
import { BlockletService } from '@blocklet/sdk';

const blockletService = new BlockletService();

async function getOwnerInfo() {
  const { user } = await blockletService.getOwner();
  console.log('Owner:', user);
}
```

### 主要なメソッド

このサービスは広範なメソッドを公開しています。以下は、最も一般的に使用されるメソッドの一部です：

| Method | Description |
|---|---|
| `login(data)` | 提供された認証情報でユーザーを認証します。 |
| `refreshSession(data)` | リフレッシュトークンを使用してユーザーのセッションを更新します。 |
| `getUser(did, options)` | DIDによって単一のユーザーのプロファイルを取得します。 |
| `getUsers(args)` | ページネーションされたユーザーのリストを取得します。 |
| `getOwner()` | ブロックレットの所有者のプロファイルを取得します。 |
| `updateUserApproval(did, approved)` | ユーザーのアクセスを承認または不承認にします。 |
| `createRole(args)` | 名前、タイトル、説明を持つ新しいユーザーロールを作成します。 |
| `getRoles()` | 利用可能なすべてのロールのリストを取得します。 |
| `deleteRole(name)` | 名前によってロールを削除します。 |
| `grantPermissionForRole(roleName, permissionName)` | ロールに特定の権限を付与します。 |
| `revokePermissionFromRole(roleName, permissionName)` | ロールから権限を取り消します。 |
| `hasPermission(role, permission)` | ロールが特定の権限を持っているかどうかを確認します。 |
| `getPermissions()` | 利用可能なすべての権限のリストを取得します。 |
| `getBlocklet(attachRuntimeInfo)` | 現在のブロックレットのメタデータと設定を取得します。 |
| `getComponent(did)` | 特定のコンポーネントのメタデータを取得します。 |
| `createAccessKey(params)` | プログラムによるアクセスのための新しいアクセスキーを作成します。 |
| `verifyAccessKey(params)` | アクセスキーの有効性を検証します。 |

メソッドとそのパラメータの完全なリストについては、[型定義](./api-reference-types.md)を参照してください。

---

## NotificationService

`NotificationService`はリアルタイム通信を可能にします。ユーザーに直接通知を送信したり、公開チャネルにメッセージをブロードキャストしたりできます。また、システムイベントをリッスンすることもできます。

```javascript 通知の送信 icon=logos:javascript
import NotificationService from '@blocklet/sdk/service/notification';

async function notifyUser(userId, message) {
  const notification = {
    type: 'info',
    title: 'New Update',
    content: message,
  };
  await NotificationService.sendToUser(userId, notification);
}
```

### 主な関数

| Function | Description |
|---|---|
| `sendToUser(receiver, notification, options)` | 1人または複数のユーザーに直接通知を送信します。 |
| `sendToMail(receiver, notification, options)` | ユーザーのメールアドレスに通知を送信します。 |
| `broadcast(notification, options)` | ブロックレットの公開チャネルにメッセージをブロードキャストします。 |
| `on(event, callback)` | システムイベント（例：コンポーネントの更新、ユーザーイベント）を購読します。 |
| `off(event, callback)` | システムイベントの購読を解除します。 |

---

## EventBus

`EventBus`は、アプリケーション内での通信のためのシンプルなpublish-subscribeメカニズムを提供し、疎結合でイベント駆動型の機能の構築を支援します。

```javascript イベントの発行 icon=logos:javascript
import EventBus from '@blocklet/sdk/service/eventbus';

// In one part of your app
async function publishOrderCreated(orderData) {
  await EventBus.publish('order.created', { data: orderData });
}

// In another part of your app
EventBus.subscribe((event) => {
  if (event.type === 'order.created') {
    console.log('New order received:', event.data);
  }
});
```

### 関数

| Function | Description |
|---|---|
| `publish(name, event)` | 特定の名前とペイロードでイベントを発行します。 |
| `subscribe(callback)` | すべてのイベントを購読し、受信した各イベントに対してコールバックを実行します。 |
| `unsubscribe(callback)` | 以前に登録したイベント購読者を削除します。 |

---

## Middlewares

SDKは、認証、セッション管理、セキュリティなどの一般的なWebサーバータスクを処理するための一連の事前設定済みExpress.jsミドルウェアを提供します。

```javascript ミドルウェアの使用 icon=logos:javascript
import express from 'express';
import middlewares from '@blocklet/sdk/middlewares';

const app = express();

// Session middleware must be used before auth middleware
app.use(middlewares.session());

// Protect a route, requiring 'admin' role
app.get('/admin', middlewares.auth({ roles: ['admin'] }), (req, res) => {
  res.send('Welcome, admin!');
});
```

### 利用可能なミドルウェア

| Middleware | Description |
|---|---|
| `session()` | トークンまたはアクセスキーからユーザーセッションを解析・検証し、ユーザー情報を `req.session` に添付します。 |
| `auth(rules)` | ロールと権限に基づいてルートを保護します。ユーザーが承認されていない場合、403 Forbiddenエラーをスローします。 |
| `user()` | 有効なセッションが存在する場合にユーザー情報を `req.user` に添付する軽量ミドルウェアですが、認証されていないリクエストはブロックしません。 |
| `component()` | 同じブロックレット内の他のコンポーネントからのみアクセス可能なルートを保護するためのミドルウェアです。 |
| `csrf()` | CSRF（クロスサイトリクエストフォージェリ）保護を実装します。 |
| `sitemap()` | アプリケーションの `sitemap.xml` ファイルを生成します。 |
| `fallback()` | 不明なルートに対して `index.html` を提供する、シングルページアプリケーション（SPA）用のフォールバックミドルウェアです。 |

---

## Component Utilities

これらのユーティリティは、コンポーネント間の通信とURL管理のために設計されています。

```javascript 他のコンポーネントの呼び出し icon=logos:javascript
import component from '@blocklet/sdk/component';

async function fetchUserDataFromProfileComponent() {
  try {
    const response = await component.call({
      name: 'profile-component-did', // The DID of the target component
      path: '/api/user-data',
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    console.error('Failed to call component:', error);
  }
}
```

### 主な関数

| Function | Description |
|---|---|
| `call(options, retryOptions)` | 同じブロックレット内の別のコンポーネントに安全なHTTPリクエストを行います。 |
| `getUrl(...parts)` | 現在のコンポーネント内のパスに対する絶対公開URLを構築します。 |
| `getRelativeUrl(...parts)` | 現在のコンポーネント内のパスに対する相対URLを構築します。 |
| `getResources(options)` | ブロックレットで利用可能なリソースコンポーネントのリストを取得します。 |
| `waitForComponentRunning(name, timeout)` | 指定されたコンポーネントが実行中で到達可能になるまで待機します。 |

---

## Config & Env

`config`エクスポートを通じて、ブロックレットの構成、環境変数、コンポーネントのメタデータにアクセスします。

```javascript 環境データへのアクセス icon=logos:javascript
import config from '@blocklet/sdk/config';

// Access environment variables
const appName = config.env.appName;
const appUrl = config.env.appUrl;

// Access the list of other components
const allComponents = config.components;
const databaseComponent = config.components.find(c => c.name === 'database');
```

### 主要なプロパティ

| Property | Description |
|---|---|
| `config.env` | 環境変数とアプリケーション設定（例：`appName`、`appUrl`、`isComponent`）を含むオブジェクト。 |
| `config.components` | 各オブジェクトがマウントされたコンポーネントに関するメタデータ（例：`did`、`name`、`status`、`mountPoint`）を含むオブジェクトの配列。 |
| `config.logger` | ロガーインスタンス（`info`、`warn`、`error`、`debug`）。 |
| `config.events` | ブロックレットの構成またはコンポーネントリストが変更されたときに発生する `EventEmitter`。 |

---

## Wallet Utilities

`getWallet`関数は、環境で提供される秘密鍵からウォレットインスタンスを簡単に作成する方法を提供します。これらのウォレットは、データの署名など、あらゆる暗号操作に不可欠です。

```javascript ウォレットの作成 icon=logos:javascript
import getWallet from '@blocklet/sdk/wallet';

// Get the default wallet for the current application instance
const wallet = getWallet();
console.log('Wallet Address:', wallet.address);

// Get the permanent wallet associated with the blocklet's DID
const permanentWallet = getWallet.getPermanentWallet();
console.log('Permanent Wallet Address:', permanentWallet.address);
```

### 関数

| Function | Description |
|---|---|
| `getWallet(type, sk)` | ウォレットインスタンスを作成します。デフォルトでは、アプリケーションのランタイム秘密鍵（`BLOCKLET_APP_SK`）を使用します。 |
| `getWallet.getPermanentWallet()` | 永続的な秘密鍵（`BLOCKLET_APP_PSK`）から派生したウォレットを取得するためのショートカットです。 |
| `getWallet.getEthereumWallet(permanent)` | Ethereum互換のウォレットを作成します。 |

---

## Security Utilities

SDKには、暗号化やレスポンス署名などの一般的な暗号タスクのためのヘルパー関数を持つ`security`モジュールが含まれています。

```javascript データの暗号化 icon=logos:javascript
import security from '@blocklet/sdk/security';

const sensitiveData = 'This is a secret message';

// Encrypt data using the blocklet's encryption key
const encrypted = security.encrypt(sensitiveData);

// Decrypt it later
const decrypted = security.decrypt(encrypted);

console.log(decrypted === sensitiveData); // true
```

### 関数

| Function | Description |
|---|---|
| `encrypt(message, password, salt)` | AESを使用して文字列を暗号化します。デフォルトでは `BLOCKLET_APP_EK` と `BLOCKLET_DID` を使用します。 |
| `decrypt(message, password, salt)` | `encrypt`で暗号化された文字列を復号化します。 |
| `signResponse(data)` | ブロックレットのウォレットでデータペイロードに署名し、署名メタデータを追加します。 |
| `verifyResponse(data)` | `signResponse`で署名されたレスポンスの署名を検証します。 |
