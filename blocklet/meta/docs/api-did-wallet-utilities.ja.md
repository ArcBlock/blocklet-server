# DIDとウォレットユーティリティ

このセクションでは、分散型識別子（DID）および暗号ウォレットに関連するユーティリティ関数の詳細なリファレンスを提供します。これらのヘルパーは、Blockletのアイデンティティを管理し、アプリケーション固有のウォレットを生成し、ユーザーセッションからアイデンティティ情報を抽出するために不可欠です。

## Blockletのアイデンティティとウォレットの生成

これらの関数は、Blocklet自体のコアアイデンティティと暗号ウォレットを作成および管理するために使用されます。

### toBlockletDid

文字列またはBufferを有効なBlocklet DIDに変換します。入力がすでに有効なDIDである場合は、そのまま返されます。それ以外の場合は、入力から`ROLE_ANY`タイプのDIDを生成します。

**パラメータ**

<x-field-group>
  <x-field data-name="name" data-type="string | Buffer" data-required="true" data-desc="DIDに変換される文字列またはバッファ。"></x-field>
</x-field-group>

**戻り値**

<x-field-group>
  <x-field data-name="did" data-type="string" data-desc="有効なDID。"></x-field>
</x-field-group>

**例**

```javascript toBlockletDid Example icon=mdi:identifier
import toBlockletDid from '@blocklet/meta/lib/did';

// 文字列名からDIDを生成
const blockletName = 'my-awesome-blocklet';
const did = toBlockletDid(blockletName);

console.log(did); // 例: 'z8ia1m4f5z3a...'

// 既存の有効なDIDでも動作します
const existingDid = 'z8iZge7d4a4s9d5z...';
const result = toBlockletDid(existingDid);

console.log(result === existingDid); // true
```

### getApplicationWallet

Blocklet用のウォレットオブジェクトを生成します。これは、他のサービスとの認証や検証可能な資格情報の作成など、署名が必要なあらゆる操作にとって重要な関数です。ウォレットは、BlockletのDIDとノードの秘密鍵の組み合わせから、または環境変数として提供されるカスタム秘密鍵から直接派生させることができます。

**パラメータ**

<x-field-group>
  <x-field data-name="didOrSk" data-type="string" data-required="true" data-desc="BlockletのDIDまたはカスタム秘密鍵。有効なDIDでない場合は、秘密鍵として扱われます。"></x-field>
  <x-field data-name="nodeSk" data-type="string" data-required="false" data-desc="didOrSkがDIDの場合に必須。基盤となるBlocklet Serverノードの秘密鍵。"></x-field>
  <x-field data-name="type" data-type="DIDType | 'default' | 'eth' | 'ethereum'" data-required="false" data-desc="生成するウォレットのタイプ。Ethereum互換ウォレットには'ethereum'または'eth'をサポートします。デフォルトは標準のArcBlockタイプです。"></x-field>
  <x-field data-name="index" data-type="number" data-required="false" data-default="0" data-desc="DIDとノードSKからウォレットを生成する際に使用される派生インデックス。"></x-field>
</x-field-group>

**戻り値**

<x-field-group>
  <x-field data-name="wallet" data-type="WalletObject" data-desc="アドレス、publicKey、secretKey、および署名メソッドを持つOCAPウォレットオブジェクト。"></x-field>
</x-field-group>

**例：DIDとノードSKからの生成**

```javascript Generating from DID icon=mdi:wallet
import getApplicationWallet from '@blocklet/meta/lib/wallet';

const blockletDid = 'z8iZ...'; // BlockletのメタデータからのDID
const nodeSk = '...'; // Blocklet Serverノードの秘密鍵

const wallet = getApplicationWallet(blockletDid, nodeSk);

console.log('Wallet Address:', wallet.address);
console.log('Wallet Type:', wallet.type);
```

**例：カスタムSKからの生成**

```javascript Generating from Custom SK icon=mdi:key-variant
import getApplicationWallet from '@blocklet/meta/lib/wallet';

// 通常、process.env.BLOCKLET_APP_SKから読み込まれます
const customSk = '...'; 
const wallet = getApplicationWallet(customSk);

console.log('Wallet Address:', wallet.address);
```

### getBlockletInfo

これは高レベルのユーティリティで、Blockletの状態オブジェクトを解析して包括的なメタデータセットを抽出し、オプションでそのウォレットを生成します。`blocklet.yml`、環境変数、およびサーバー構成からの情報を統合します。

**パラメータ**

<x-field-group>
  <x-field data-name="state" data-type="BlockletState" data-required="true" data-desc="Blockletの状態オブジェクト。通常、Blockletのバックエンドフックまたはルートで利用可能です。"></x-field>
  <x-field data-name="nodeSk" data-type="string" data-required="false" data-desc="Blocklet Serverノードの秘密鍵。returnWalletがtrueで、カスタムSKが環境に設定されていない場合に必要です。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="設定オプション。">
    <x-field data-name="returnWallet" data-type="boolean" data-required="false" data-default="true" data-desc="trueの場合、関数はwalletおよびpermanentWalletオブジェクトを生成して含めます。"></x-field>
  </x-field>
</x-field-group>

**戻り値**

<x-field-group>
  <x-field data-name="info" data-type="object" data-desc="Blockletの情報を含むオブジェクト。">
    <x-field data-name="did" data-type="string" data-desc="meta.didからのBlockletのDID。"></x-field>
    <x-field data-name="name" data-type="string" data-desc="Blockletの表示名。"></x-field>
    <x-field data-name="version" data-type="string" data-desc="Blockletのバージョン。"></x-field>
    <x-field data-name="description" data-type="string" data-desc="Blockletの説明。"></x-field>
    <x-field data-name="appUrl" data-type="string" data-desc="設定されたアプリケーションURL。"></x-field>
    <x-field data-name="secret" data-type="string" data-desc="セッション管理のための派生秘密ハッシュ。"></x-field>
    <x-field data-name="wallet" data-type="WalletObject | null" data-desc="プライマリアプリケーションウォレット（returnWalletがfalseの場合はnull）。"></x-field>
    <x-field data-name="permanentWallet" data-type="WalletObject | null" data-desc="BLOCKLET_APP_PSKが設定されている場合のパーマネントウォレット。それ以外の場合はwalletと同じ。"></x-field>
    <x-field data-name="passportColor" data-type="string" data-desc="パスポートのカラースキーム。"></x-field>
    <x-field data-name="tenantMode" data-type="string" data-desc="アプリケーションのテナントモード。"></x-field>
  </x-field>
</x-field-group>

**例**

```javascript getBlockletInfo Example icon=mdi:information
import getBlockletInfo from '@blocklet/meta/lib/info';

// 'blockletState'と'nodeSk'がコンテキストで利用可能であると仮定

try {
  const info = getBlockletInfo(blockletState, nodeSk);

  console.log(`Blocklet Name: ${info.name}`);
  console.log(`Blocklet DID: ${info.did}`);
  console.log(`App Wallet Address: ${info.wallet.address}`);

  // ウォレットが不要な場合
  const infoWithoutWallet = getBlockletInfo(blockletState, nodeSk, { returnWallet: false });
  console.log(infoWithoutWallet.wallet); // null
} catch (error) {
  console.error('Failed to get Blocklet info:', error.message);
}
```

## ユーザーアイデンティティとアカウントヘルパー

これらのユーティリティ関数は、Blockletの認証済みルート内で通常`req.user`で利用可能な`UserInfo`オブジェクトから、DIDおよびアカウント情報を簡単に抽出できるように設計されています。

### ユーザー情報ユーティリティ関数

ユーザーのアイデンティティプロファイルのさまざまな部分にアクセスするためのヘルパーのコレクション。

| 関数 | 説明 |
|---|---|
| `getPermanentDid(user)` | ユーザーのプライマリでパーマネントなDIDを返します。 |
| `getConnectedAccounts(user)` | ユーザーのプロファイルに接続されているすべてのアカウントの配列を返します。 |
| `getConnectedDids(user)` | 接続されているすべてのアカウントからのDIDの配列を返します。 |
| `getWallet(user)` | ユーザーの接続されたウォレットアカウントオブジェクトを検索して返します。 |
| `getWalletDid(user)` | ユーザーの接続されたウォレットのDIDを取得するための便利な関数。 |
| `getSourceProvider(user)` | ユーザーが現在のセッションで使用したプロバイダー（例：`wallet`）を返します。 |
| `getSourceProviders(user)` | ユーザーが接続したすべてのプロバイダーの配列を返します。 |

**例**

```javascript User Info Helpers icon=mdi:account-details
import {
  getPermanentDid,
  getConnectedDids,
  getWalletDid,
  getSourceProvider,
} from '@blocklet/meta/lib/did-utils';

// UserInfoオブジェクトのモック（実際のアプリでは、これはreq.userになります）
const mockUser = {
  did: 'z...userPermanentDid',
  sourceProvider: 'wallet',
  connectedAccounts: [
    {
      provider: 'wallet',
      did: 'z...userWalletDid',
      // ... その他のウォレットアカウント詳細
    },
    {
      provider: 'github',
      did: 'z...userGithubDid',
      // ... その他のgithubアカウント詳細
    },
  ],
  // ... その他のUserInfoプロパティ
};

const permanentDid = getPermanentDid(mockUser);
console.log('Permanent DID:', permanentDid); // 'z...userPermanentDid'

const walletDid = getWalletDid(mockUser);
console.log('Wallet DID:', walletDid); // 'z...userWalletDid'

const allDids = getConnectedDids(mockUser);
console.log('All Connected DIDs:', allDids); // ['z...userWalletDid', 'z...userGithubDid']

const loginProvider = getSourceProvider(mockUser);
console.log('Logged in with:', loginProvider); // 'wallet'
```

---

これらのユーティリティは、Blocklet内でアイデンティティとセキュリティを管理するための基本的な構成要素を提供します。これらのウォレットを使用してデータを署名および検証する方法については、[セキュリティユーティリティ](./api-security-utilities.md)セクションに進んでください。