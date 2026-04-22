# セキュリティユーティリティ

`@blocklet/meta`ライブラリは、暗号操作を処理するための一連のセキュリティユーティリティを提供します。これらの関数は、特にBlockletメタデータとAPIレスポンスの署名および検証において、データの完全性と信頼性を確保するために不可欠です。これらはBlockletエコシステム内の信頼の基盤を形成します。

このセクションでは、単純なリクエスト/レスポンス署名のための関数、およびより複雑なマルチシグネチャおよび連鎖信頼検証スキームについて説明します。

---

## signResponse

任意のJSONシリアライズ可能なオブジェクトに暗号署名を追加します。この関数は、安定した文字列化メソッド（`json-stable-stringify`）を使用して、提供されたウォレットオブジェクトで署名する前にペイロードの一貫性を確保します。結果の署名はオブジェクトの`$signature`キーの下に追加され、検証が容易になります。

### パラメータ

<x-field-group>
  <x-field data-name="data" data-type="T extends Record<string, any>" data-required="true" data-desc="署名されるデータオブジェクト。"></x-field>
  <x-field data-name="wallet" data-type="WalletObject" data-required="true" data-desc="署名の生成に使用される`@ocap/wallet`インスタンス。"></x-field>
</x-field-group>

### 戻り値

<x-field data-name="T & { $signature: string }" data-type="object" data-desc="元のオブジェクトに、暗号署名文字列を含む`$signature`プロパティが追加されたもの。"></x-field>

### 例

```javascript データオブジェクトに署名する icon=lucide:shield-check
import { signResponse } from '@blocklet/meta';
import { fromRandom } from '@ocap/wallet';

// 署名用の新しいウォレットを作成
const wallet = fromRandom();

const myData = {
  user: wallet.did,
  action: 'updateProfile',
  timestamp: Date.now(),
};

const signedData = signResponse(myData, wallet);

console.log(signedData);
/*
Output:
{
  user: 'z...',
  action: 'updateProfile',
  timestamp: 1678886400000,
  $signature: '...'
}
*/
```

---

## verifyResponse

通常は`signResponse`を使用して以前に署名されたオブジェクトの署名を検証します。`$signature`プロパティからペイロードを自動的に分離し、同じ安定した文字列化メソッドを使用してペイロードのハッシュを再計算し、提供されたウォレットの公開鍵を使用して署名と照合します。

### パラメータ

<x-field-group>
  <x-field data-name="signed" data-type="T & { $signature?: string }" data-required="true" data-desc="検証対象の`$signature`を含むデータオブジェクト。"></x-field>
  <x-field data-name="wallet" data-type="WalletObject" data-required="true" data-desc="署名に使用されたキーペアに対応する`@ocap/wallet`インスタンス。"></x-field>
</x-field-group>

### 戻り値

<x-field data-name="Promise<boolean>" data-type="Promise<boolean>" data-desc="署名が有効な場合は`true`に、それ以外の場合は`false`に解決されるプロミス。"></x-field>

### 例

```javascript 署名済みオブジェクトを検証する icon=lucide:verified
import { signResponse, verifyResponse } from '@blocklet/meta';
import { fromRandom } from '@ocap/wallet';

async function main() {
  const wallet = fromRandom();
  const myData = { user: wallet.did, action: 'updateProfile' };

  // 1. データを署名
  const signedData = signResponse(myData, wallet);
  console.log('Signed Data:', signedData);

  // 2. 有効な署名を検証
  const isValid = await verifyResponse(signedData, wallet);
  console.log(`Signature is valid: ${isValid}`); // 期待値: true

  // 3. データを改ざんして再度検証を試みる
  const tamperedData = { ...signedData, action: 'grantAdminAccess' };
  const isTamperedValid = await verifyResponse(tamperedData, wallet);
  console.log(`Tampered signature is valid: ${isTamperedValid}`); // 期待値: false
}

main();
```

---

## verifyMultiSig

複数の関係者によって署名されたblockletメタデータ（`blocklet.yml`）を検証するための高度なユーティリティです。各署名の`excludes`および`appended`フィールドを尊重して署名を順次処理し、各関係者が署名した正確なペイロードを正しく再構築します。これにより、異なるアクター（例：開発者、パブリッシャー、マーケットプレイス）がメタデータに貢献し、署名することができる、協調的で監査可能なメタデータ作成プロセスが可能になります。

この関数は、あるDIDがJWT（署名オブジェクトの`delegation`フィールド）を介して別のDIDに代理で署名する権限を与える、委任署名も処理します。

### マルチシグネチャ検証フロー

<!-- DIAGRAM_IMAGE_START:flowchart:4:3 -->
![Security Utilities](assets/diagram/security-utilities-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

### パラメータ

<x-field-group>
  <x-field data-name="blockletMeta" data-type="TBlockletMeta" data-required="true" data-desc="`signatures`配列を含む完全なblockletメタデータオブジェクト。"></x-field>
</x-field-group>

### 戻り値

<x-field data-name="Promise<boolean>" data-type="Promise<boolean>" data-desc="チェーン内のすべての署名がマルチシグルールに従って有効な場合は`true`に、それ以外の場合は`false`に解決されるプロミス。"></x-field>

### 例

```javascript 複数の署名を持つBlockletメタデータを検証する icon=lucide:pen-tool
import verifyMultiSig from '@blocklet/meta/lib/verify-multi-sig';

async function verifyMetadata() {
  const blockletMeta = {
    name: 'my-multi-sig-blocklet',
    version: '1.0.0',
    description: 'A blocklet with multiple authors.',
    author: 'did:abt:z1...',
    signatures: [
      {
        // 開発者の署名
        signer: 'did:abt:z1...',
        pk: '...',
        sig: '...',
        // 最初の署名者は、`signatures`と`publisherInfo`が追加される*前*のコンテンツに署名します。
        excludes: ['signatures', 'publisherInfo'], 
      },
      {
        // パブリッシャーの署名。独自のフィールドを追加する場合があります。
        signer: 'did:abt:z2...',
        pk: '...',
        sig: '...',
        // パブリッシャーはこのフィールドを署名前に追加しました。
        appended: ['publisherInfo'], 
      },
    ],
    publisherInfo: {
      name: 'Blocklet Store',
      did: 'did:abt:z2...',
    },
  };

  const isValid = await verifyMultiSig(blockletMeta);
  console.log(`Multi-signature metadata is valid: ${isValid}`);
}

verifyMetadata();
```

---

## verifyVault

特定のアプリケーションコンテキストにおける所有権または管理権の変更シーケンスを表す「vault」の信頼の連鎖を検証します。vault内の各エントリは時系列に並べられ、暗号署名されている必要があります。最初のエントリ以降は、署名が前の所有者によって承認される必要があり、これにより途切れることのない検証可能なチェーンが作成されます。このメカニズムは、資産や管理者ロールの安全なDIDベースの所有権移転などの機能にとって極めて重要です。

### Vaultの信頼の連鎖

```d2 Vault検証プロセス
direction: down

initial-approver: {
  label: "初期承認者\n(例: App DID)"
  shape: c4-person
}

vault-1: {
  label: "Vault 1\n所有者: ユーザー A"
  shape: rectangle
}

vault-2: {
  label: "Vault 2\n所有者: ユーザー B"
  shape: rectangle
}

vault-3: {
  label: "Vault 3\n所有者: ユーザー C"
  shape: rectangle
}

initial-approver -> vault-1: "1. 最初の所有者としてユーザーAを承認"
vault-1 -> vault-2: "2. ユーザーAが次の所有者としてユーザーBを承認"
vault-2 -> vault-3: "3. ユーザーBが最終所有者としてユーザーCを承認"

```

### パラメータ

<x-field-group>
  <x-field data-name="vaults" data-type="VaultRecord[]" data-required="true" data-desc="`at`タイムスタンプで時系列にソートされたvaultレコードの配列。"></x-field>
  <x-field data-name="appPid" data-type="string" data-required="true" data-desc="アプリケーションのDIDまたはvaultのコンテキストの一意の識別子。"></x-field>
  <x-field data-name="throwOnError" data-type="boolean" data-default="false" data-required="false" data-desc="`true`の場合、関数は検証失敗時に空文字列を返す代わりにエラーをスローします。"></x-field>
</x-field-group>

### 戻り値

<x-field data-name="Promise<string>" data-type="Promise<string>" data-desc="チェーン内の最後の有効な所有者のDIDに解決されるプロミス。`throwOnError`が`true`でない限り、失敗時には空文字列を返します。"></x-field>

### 例

```javascript 所有権Vaultを検証する icon=lucide:lock-keyhole
import { verifyVault } from '@blocklet/meta';

// アプリケーションのvaultチェーンの簡略化された例
async function checkVault() {
  const vaults = [
    {
      pk: 'pk_user1',
      did: 'did:abt:user1',
      at: 1672531200,
      sig: 'sig_user1_commit',
      approverPk: 'pk_app',
      approverDid: 'did:abt:app',
      approverSig: 'sig_app_approve_user1',
    },
    {
      pk: 'pk_user2',
      did: 'did:abt:user2',
      at: 1672534800,
      sig: 'sig_user2_commit',
      // 前の所有者（user1）によって承認済み
      approverSig: 'sig_user1_approve_user2', 
    },
  ];
  const appDid = 'did:abt:app';

  try {
    const finalOwnerDid = await verifyVault(vaults, appDid);
    if (finalOwnerDid) {
      console.log(`Vault is valid. Final owner: ${finalOwnerDid}`);
      // Expected: Vault is valid. Final owner: did:abt:user2
    } else {
      console.error('Vault verification failed.');
    }
  } catch (error) {
    console.error('Vault verification threw an error:', error.message);
  }
}

checkVault();
```