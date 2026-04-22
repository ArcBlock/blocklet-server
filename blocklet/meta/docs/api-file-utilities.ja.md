# ファイルユーティリティ

このモジュールは、ファイルシステム上の `blocklet.yml` ファイルと対話するための低レベル関数のセットを提供します。これには、メタデータファイルの検索、読み取り、書き込みのためのユーティリティ、およびファイルパスとDIDのバリデーションを効率化するためのカスタム [Joi](https://joi.dev/) 拡張機能が含まれています。

## `blocklet.yml` ファイルハンドラ

これらの関数は、Blockletのメタデータファイルをプログラムで読み取りまたは変更する必要があるあらゆるツールの基本的な構成要素です。

### select(dir, options?)

`select` 関数は、指定されたディレクトリ内で正しい `blocklet.yml` または `blocklet.yaml` ファイルをインテリジェントに検索します。

**パラメータ**

<x-field-group>
  <x-field data-name="dir" data-type="string" data-required="true" data-desc="Blockletメタデータファイルが配置されているディレクトリの絶対パス。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="select関数の設定オプション。">
    <x-field data-name="throwOnError" data-type="boolean" data-default="true" data-required="false" data-desc="trueの場合、メタデータファイルが見つからない場合にエラーがスローされます。falseの場合、空の文字列を返します。"></x-field>
  </x-field>
</x-field-group>

**戻り値**

<x-field data-name="metaFilePath" data-type="string" data-desc="見つかったメタデータファイルの完全な絶対パス。見つからず `throwOnError` が false の場合は空の文字列。"></x-field>

**例**

```javascript メタデータファイルの検索 icon=logos:javascript
import { select } from '@blocklet/meta';

const blockletDir = '/path/to/your/blocklet';

try {
  const metaFile = select(blockletDir);
  console.log(`Found metadata file at: ${metaFile}`);
} catch (error) {
  console.error(error.message); // 例: 'blocklet.yml not found...'
}
```

### read(file)

ファイルパスを取得したら、`read` 関数はYAMLコンテンツをJavaScriptオブジェクトに解析します。

**パラメータ**

<x-field data-name="file" data-type="string" data-required="true" data-desc="読み取る blocklet.yml ファイルへのパス。"></x-field>

**戻り値**

<x-field data-name="meta" data-type="object" data-desc="解析されたYAMLファイルの内容をJavaScriptオブジェクトとして。"></x-field>

**例**

```javascript メタデータファイルの読み取り icon=logos:javascript
import { select, read } from '@blocklet/meta';

const metaFile = select('/path/to/your/blocklet');
const meta = read(metaFile);
console.log(`Blocklet name: ${meta.name}`);
```

### update(file, meta, options?)

`update` 関数は、メタデータオブジェクトをYAMLファイルにシリアライズし直します。デフォルトでは、書き込む前にランタイムにのみ関連するプロパティ（例：`path`、`stats`、`signatures`）を削除してメタデータをクリーンアップします。

**パラメータ**

<x-field-group>
  <x-field data-name="file" data-type="string" data-required="true" data-desc="更新する blocklet.yml ファイルへのパス。"></x-field>
  <x-field data-name="meta" data-type="TBlockletMeta" data-required="true" data-desc="ファイルに書き込むメタデータオブジェクト。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="update関数の設定オプション。">
    <x-field data-name="fix" data-type="boolean" data-default="true" data-required="false" data-desc="trueの場合、書き込む前にメタデータオブジェクトをクリーンアップします（例：`path`、`stats`、`signatures` を削除）。falseの場合、オブジェクトをそのまま書き込みます。"></x-field>
  </x-field>
</x-field-group>

**戻り値**

この関数は値を返しません（`void`）。

**例**

```javascript メタデータファイルの更新 icon=logos:javascript
import { select, read, update } from '@blocklet/meta';

const metaFile = select('/path/to/your/blocklet');
let meta = read(metaFile);

// 説明を変更
meta.description = 'An updated description for my blocklet.';

// 変更をクリーンアップしてファイルに書き戻す
update(metaFile, meta);
console.log('blocklet.yml has been updated.');
```

### list

`select` が内部で使用する、Blockletメタデータファイルの潜在的な名前を含む単純な定数配列です。

**例**

```javascript icon=logos:javascript
import { list } from '@blocklet/meta';

console.log(list); // Outputs: ['blocklet.yml', 'blocklet.yaml']
```

## カスタムJoi拡張機能

これらの拡張機能は、Joiバリデーションライブラリと統合して、ファイルパスやDIDなどの一般的なBlocklet関連データのためのカスタムバリデーションタイプを提供します。

### fileExtension

Joiスキーマにカスタムの `file()` 型を提供し、強力なファイルシステム対応のバリデーションを可能にします。

**使用方法**

まず、Joiインスタンスを `fileExtension` で拡張します。その後、スキーマで `file()` 型とそのルールを使用できます。

```javascript fileExtensionを使用したJoiスキーマ icon=logos:javascript
import Joi from 'joi';
import path from 'path';
import { fileExtension } from '@blocklet/meta';

// カスタムタイプで拡張されたJoiインスタンスを作成
const customJoi = Joi.extend(fileExtension);

const schema = customJoi.object({
  // プロジェクトディレクトリ内に 'logo.png' が存在することを検証
  logoPath: customJoi.file().exists({ baseDir: __dirname }),
});

const { error } = schema.validate({ logoPath: 'logo.png' });
if (error) {
  console.log(error.message); // 例: 'file "logo.png" does not exist'
}
```

### didExtension

Joiにカスタムの `DID()` 型を提供し、ArcBlockの分散型識別子を検証します。

**使用方法**

`didExtension` でJoiを拡張して、`DID()` バリデーションタイプを追加します。

```javascript didExtensionを使用したJoiスキーマ icon=logos:javascript
import Joi from 'joi';
import { didExtension } from '@blocklet/meta';

const customJoi = Joi.extend(didExtension);

const schema = customJoi.object({
  author: customJoi.DID().required(),
});

// 無効なDIDの例
const { error } = schema.validate({ author: 'z123...invalid_did' });
if (error) {
  console.log(error.message); // 'did "z123...invalid_did" is not valid'
}

// 有効なDIDの例
const { value } = schema.validate({ author: 'z8iZpbpJ4Yy2LzG1cqK9rC9pZ8r1Yq2Z3t4a' });
console.log(value); // { author: 'z8iZpbpJ4Yy2LzG1cqK9rC9pZ8r1Yq2Z3t4a' }
```

---

これらのファイルユーティリティは、Blockletエコシステム内の多くの高レベル操作の基盤を形成します。より高度なメタデータ処理については、[解析とバリデーション](./api-parsing-validation.md) のドキュメントに進んでください。