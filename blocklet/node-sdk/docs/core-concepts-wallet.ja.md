# ウォレット管理

Blocklet SDKでは、ウォレットはアプリケーションのアイデンティティを表す基本的な暗号オブジェクトです。データの署名、リクエストの認証、ブロックチェーンネットワークとの対話に不可欠です。SDKは、アプリケーションの環境変数から直接ウォレットインスタンスを作成および管理するための強力で便利なユーティリティ `getWallet` を提供します。

このユーティリティは、ArcBlockのネイティブDIDまたはEthereumで作業しているかどうかにかかわらず、異なる暗号曲線とキーフォーマットの取り扱いの複雑さを抽象化します。ウォレットのキーは、Blocklet Serverによって設定された環境変数から取得されます。これについては、[設定と環境](./core-concepts-configuration.md)のドキュメントで詳しく学ぶことができます。

## `getWallet` ユーティリティ

`getWallet` 関数は `WalletObject` を作成するための主要なメソッドです。デフォルトでは、環境からアプリケーションの標準秘密鍵（`BLOCKLET_APP_SK`）と設定されたチェーンタイプ（`CHAIN_TYPE` または `BLOCKLET_WALLET_TYPE`）を使用します。

```javascript 基本的な使い方 icon=logos:javascript
import getWallet from '@blocklet/sdk/lib/wallet';

// 環境変数を使用してウォレットインスタンスを作成
const appWallet = getWallet();

// これでウォレットを使用してデータに署名できます
const signature = appWallet.sign('data to be signed');
```

このユーティリティは、設定に基づいてさまざまなブロックチェーンタイプをインテリジェントに処理します。

### パラメータ

`getWallet` は環境変数を使用してすぐに機能しますが、パラメータを渡すことでその動作を上書きできます。

<x-field data-name="type" data-type="DIDTypeShortcut" data-required="false" data-desc="ウォレットのDIDタイプ。「ethereum」または「arcblock」（または「default」）が可能です。デフォルトは CHAIN_TYPE または BLOCKLET_WALLET_TYPE 環境変数の値です。"></x-field>

<x-field data-name="appSk" data-type="string" data-required="false" data-desc="アプリケーションの16進数形式の秘密鍵。デフォルトは BLOCKLET_APP_SK 環境変数の値です。"></x-field>


### 特定のチェーン用のウォレットの作成

`type` パラメータを指定することで、特定のチェーンタイプのウォレットを明示的に要求できます。

```javascript Ethereumウォレットの作成 icon=logos:javascript
import getWallet from '@blocklet/sdk/lib/wallet';

// デフォルトの秘密鍵を使用してEthereumウォレットを明示的に作成
const ethWallet = getWallet('ethereum');
```

## 特殊なウォレットヘルパー

`getWallet` 関数には、一般的なユースケースのためのいくつかのヘルパーメソッドも付属しています。

### `getWallet.getPermanentWallet()`

一部の操作では、より安定した長期的なアイデンティティが必要になる場合があります。このため、Blocklet Serverは永続的な秘密鍵（`BLOCKLET_APP_PSK`）を提供します。このヘルパーは、この永続的なキーを使用してウォレットを作成します。

```javascript 永続ウォレットの使用 icon=logos:javascript
import getWallet from '@blocklet/sdk/lib/wallet';

const permanentWallet = getWallet.getPermanentWallet();
```

### `getWallet.getEthereumWallet(permanent)`

これはEthereumウォレットを作成するための便利なショートカットです。永続的な秘密鍵を使用するかどうかを指定するために、オプションのブール値パラメータを受け入れます。

```javascript Ethereumウォレットの作成 icon=logos:javascript
import getWallet from '@blocklet/sdk/lib/wallet';

// 標準のEthereumウォレットを取得（BLOCKLET_APP_SKを使用）
const standardEthWallet = getWallet.getEthereumWallet();

// 永続的なEthereumウォレットを取得（BLOCKLET_APP_PSKを使用）
const permanentEthWallet = getWallet.getEthereumWallet(true);
```

### `getWallet.getPkWallet()`

一部のシナリオでは、秘密鍵にアクセスせずに署名を検証するために、ウォレットの公開鍵（`BLOCKLET_APP_PK`）を使用する必要がある場合があります。`getPkWallet` ヘルパーは、公開鍵から読み取り専用のウォレットインスタンスを作成します。

```javascript 公開鍵からのウォレット作成 icon=logos:javascript
import getWallet from '@blocklet/sdk/lib/wallet';

// アプリの公開鍵からウォレットを作成
const pkWallet = getWallet.getPkWallet();

// このウォレットは署名の検証に使用できますが、データの署名には使用できません
// const isValid = pkWallet.verify('data', signature);
```

## パフォーマンスとキャッシュ

最適なパフォーマンスのために、`getWallet` ユーティリティには組み込みのLRU（Least Recently Used）キャッシュが含まれています。タイプと秘密鍵に基づいて最大4つのウォレットインスタンスをキャッシュし、同じパラメータでの繰り返し呼び出しが非常に高速であることを保証します。このキャッシュは自動的に処理されるため、独自に実装する必要はありません。

---

ウォレット管理をしっかりと理解したことで、blockletでの暗号操作を処理する準備が整いました。次の論理的なステップは、これらのウォレットがアプリケーションを保護するためにどのように使用されるかを確認することです。

<x-card data-title="次のステップ：セキュリティユーティリティ" data-icon="lucide:shield-check" data-href="/core-concepts/security" data-cta="続きを読む">
ウォレットを使用してデータを暗号化し、APIレスポンスに署名する方法を学びます。
</x-card>