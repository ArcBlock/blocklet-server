# セキュリティとリソース

セキュリティとリソース管理は、信頼性が高く相互運用可能なBlockletを作成するために不可欠です。`blocklet.yml`仕様は、この目的のために2つの主要なフィールドを提供します。`signatures`はメタデータの完全性と真正性を保証し、`resource`は他のBlockletと構成するための共有アセットを定義およびバンドルします。

このセクションでは、これらのフィールドの仕様について説明し、それらを操作するために`@blocklet/meta`によって提供されるユーティリティ関数を紹介します。

## 署名

`signatures`フィールドには、Blockletのメタデータに対する検証可能な信頼の連鎖を作成するデジタル署名の配列が含まれています。このメカニズムは、不正な変更を防ぎ、開発者やBlocklet Storeなどの公開者の身元を確認します。連鎖内の各署名は、後続の署名とともにコアメタデータを暗号的に署名し、変更の履歴全体が改ざん防止であることを保証します。

### マルチシグネチャプロセスの流れ

公開プロセス中の典型的なマルチシグネチャワークフローでは、開発者が初期メタデータに署名し、続いてBlocklet Storeがそれを検証し、配布情報を追加して独自の署名を付加します。

<!-- DIAGRAM_IMAGE_START:flowchart:16:9 -->
![Security & Resources](assets/diagram/security-resources-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

### 仕様

`signatures`フィールドは署名オブジェクトの配列です。各オブジェクトは次の構造を持っています。

```yaml blocklet.yml icon=lucide:shield-check
signatures:
  - type: 'ED25519'
    name: 'dev'
    signer: 'z8qa...'
    pk: 'z28n...'
    created: '2023-10-27T10:00:00.000Z'
    sig: 'z24e...'
    excludes: []
  - type: 'ED25519'
    name: 'store'
    signer: 'z8qR...'
    pk: 'z29c...'
    created: '2023-10-27T10:05:00.000Z'
    sig: 'z25a...'
    appended:
      - 'dist'
      - 'stats'
```

<x-field-group>
  <x-field data-name="type" data-type="string" data-required="true" data-desc="署名に使用される暗号アルゴリズム（例：「ED25519」）。"></x-field>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="署名の役割を示す人間が読める名前（例：「dev」、「store」）。"></x-field>
  <x-field data-name="signer" data-type="string" data-required="true" data-desc="署名を作成したエンティティのDID。"></x-field>
  <x-field data-name="pk" data-type="string" data-required="true" data-desc="署名者のDIDに対応する公開鍵。"></x-field>
  <x-field data-name="created" data-type="string" data-required="true" data-desc="署名が作成されたときのISO 8601タイムスタンプ。"></x-field>
  <x-field data-name="sig" data-type="string" data-required="true" data-desc="base58エンコードされた署名文字列。"></x-field>
  <x-field data-name="excludes" data-type="string[]" data-required="false" data-desc="署名する前にメタデータから除外するトップレベルのフィールド名の配列。"></x-field>
  <x-field data-name="appended" data-type="string[]" data-required="false" data-desc="この署名者によってメタデータに追加されたトップレベルのフィールド名の配列。これは、次の署名者が前の署名を正しく検証するために使用されます。"></x-field>
  <x-field data-name="delegatee" data-type="string" data-required="false" data-desc="署名が委任によって行われた場合の委任先のDID。"></x-field>
  <x-field data-name="delegateePk" data-type="string" data-required="false" data-desc="委任先の公開鍵。"></x-field>
  <x-field data-name="delegation" data-type="string" data-required="false" data-desc="`delegatee`が`signer`に代わって署名することを承認する委任トークン（JWT）。"></x-field>
</x-field-group>

## リソース管理

`resource`フィールドを使用すると、Blockletはエクスポートできる共有データ型を宣言し、他のBlockletからのリソースをバンドルできます。これは、Blockletがデータと機能をシームレスに共有できる、構成可能で相互運用可能なエコシステムを実現するための基本です。

### 仕様

```yaml blocklet.yml icon=lucide:boxes
resource:
  exportApi: '/api/resources'
  types:
    - type: 'posts'
      description: 'A collection of blog posts.'
    - type: 'images'
      description: 'A gallery of images.'
  bundles:
    - did: 'z2qa...'
      type: 'user-profiles'
      public: true
```

<x-field data-name="resource" data-type="object">
  <x-field-desc markdown>エクスポート可能な型とバンドルされたリソースを定義するためのプロパティを含みます。</x-field-desc>
  <x-field data-name="exportApi" data-type="string" data-required="false" data-desc="他のBlockletがエクスポートされたリソースを取得するために呼び出すことができるAPIエンドポイントへのパス。"></x-field>
  <x-field data-name="types" data-type="object[]" data-required="false" data-desc="このBlockletがエクスポートできるリソースタイプの配列。最大10タイプに制限されます。">
    <x-field data-name="type" data-type="string" data-required="true" data-desc="リソースタイプの一意の識別子（例：「posts」、「products」）。"></x-field>
    <x-field data-name="description" data-type="string" data-required="false" data-desc="リソースタイプの人間が読める説明。"></x-field>
  </x-field>
  <x-field data-name="bundles" data-type="object[]" data-required="false" data-desc="他のBlockletからインポートされたリソースバンドルの配列。">
    <x-field data-name="did" data-type="string" data-required="true" data-desc="含めるリソースバンドルのDID。"></x-field>
    <x-field data-name="type" data-type="string" data-required="true" data-desc="ソースからバンドルする特定のリソースタイプ。"></x-field>
    <x-field data-name="public" data-type="boolean" data-required="false" data-desc="`true`の場合、バンドルされたリソースが公開アクセス可能であることを示します。"></x-field>
  </x-field>
</x-field>

## 関連APIユーティリティ

`@blocklet/meta`ライブラリは、Blockletのメタデータと通信のセキュリティ側面を処理するための一連の関数を提供します。詳細については、[セキュリティユーティリティAPIリファレンス](./api-security-utilities.md)を参照してください。

### メタデータ署名の検証

`verifyMultiSig`関数は、`blocklet.yml`ファイルの完全性を保証するための主要なツールです。`signatures`配列を処理し、連鎖内の各署名を検証して、メタデータが改ざんされておらず、宣言されたエンティティによって署名されたことを確認します。

```javascript verifyMultiSig Example icon=lucide:shield-check
import verifyMultiSig from '@blocklet/meta/lib/verify-multi-sig';
import { TBlockletMeta } from '@blocklet/meta/lib/types';

async function checkMetadata(meta: TBlockletMeta) {
  const isValid = await verifyMultiSig(meta);
  if (isValid) {
    console.log('Blockletのメタデータは信頼でき、改ざんされていません。');
  } else {
    console.error('警告：Blockletメタデータの検証に失敗しました！');
  }
}
```

### APIレスポンスの署名と検証

Blocklet間またはBlockletとクライアント間の通信を保護するために、`signResponse`および`verifyResponse`関数を使用できます。これらのヘルパーは、ウォレットオブジェクトを使用してJSONシリアライズ可能なデータを暗号的に署名および検証し、データの完全性と送信者の信頼性を保証します。

```javascript signResponse Example icon=lucide:pen-tool
import { signResponse, verifyResponse } from '@blocklet/meta/lib/security';
import { fromRandom } from '@ocap/wallet';

async function secureCommunicate() {
  const wallet = fromRandom(); // あなたのBlockletのウォレット
  const data = { message: 'hello world', timestamp: Date.now() };

  // 署名
  const signedData = signResponse(data, wallet);
  console.log('署名済みデータ:', signedData);

  // 検証
  const isVerified = await verifyResponse(signedData, wallet);
  console.log('検証結果:', isVerified); // true
}
```