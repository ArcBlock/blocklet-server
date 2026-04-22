# パースと検証

このセクションでは、`blocklet.yml` ファイルの読み取り、パース、検証に使用される関数の詳細なリファレンスを提供します。これらのユーティリティは、[Blocklet Specification](./spec.md) を扱うためのプログラム的なインターフェースであり、Blockletのメタデータが正しく、完全で、Blocklet Serverやその他のツールで使用できる状態であることを保証します。

これらの関数は、Blockletと対話するツールの構築、CI/CDパイプラインでの設定の検証、またはプログラムによるBlockletメタデータの読み取りに不可欠です。

## `parse`

`parse` 関数は、ファイルシステムからBlockletのメタデータを読み取るための主要なユーティリティです。指定されたディレクトリ内の `blocklet.yml`（または `blocklet.yaml`）ファイルを見つけ、その内容を読み取り、一連の互換性修正を適用し、最終的なオブジェクトを公式スキーマに対して検証します。

### ワークフロー

パース処理は、有効で一貫性のあるメタデータオブジェクトが生成されることを保証するために、いくつかの重要なステップに従います。

<!-- DIAGRAM_IMAGE_START:flowchart:4:3 -->
![Parsing & Validation](assets/diagram/parsing-validation-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

### シグネチャ

```typescript
function parse(
  dir: string,
  options?: {
    ensureFiles?: boolean;
    ensureDist?: boolean;
    ensureComponentStore?: boolean;
    extraRawAttrs?: any;
    schemaOptions?: any;
    defaultStoreUrl?: string | ((component: TComponent) => string);
    fix?: boolean;
  }
): TBlockletMeta;
```

### パラメータ

<x-field-group>
  <x-field data-name="dir" data-type="string" data-required="true" data-desc="blocklet.yml ファイルを含む Blocklet ディレクトリへのパス。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="オプションの設定オブジェクト。">
    <x-field data-name="ensureFiles" data-type="boolean" data-default="false" data-desc="`true` の場合、`logo` および `files` フィールドにリストされているファイルがファイルシステムに実際に存在することを確認します。"></x-field>
    <x-field data-name="ensureDist" data-type="boolean" data-default="false" data-desc="`true` の場合、メタデータに `dist` フィールドが存在し、有効であることが必要です。"></x-field>
    <x-field data-name="ensureComponentStore" data-type="boolean" data-default="true" data-desc="`true` の場合、ストアからソース提供されたコンポーネントに `source.store` URLが定義されていることを保証します。"></x-field>
    <x-field data-name="extraRawAttrs" data-type="object" data-desc="検証前にメタデータにマージされる追加の属性を持つオブジェクト。例えば、レジストリでメタデータを拡張するのに役立ちます。"></x-field>
    <x-field data-name="schemaOptions" data-type="object" data-desc="基盤となる Joi スキーマバリデータに渡す追加のオプション。"></x-field>
    <x-field data-name="defaultStoreUrl" data-type="string | function" data-desc="ストアを指定しないコンポーネントのデフォルトストアとして使用される URL。静的な文字列または文字列を返す関数を指定できます。"></x-field>
    <x-field data-name="fix" data-type="boolean" data-default="true" data-desc="`true` の場合、メタデータに自動修正を適用します（例：`person`、`repository`、`keywords`）。"></x-field>
  </x-field>
</x-field-group>

### 戻り値

検証済みの `TBlockletMeta` オブジェクトを返します。`blocklet.yml` ファイルが見つからない、無効な YAML である、またはスキーマ検証に失敗した場合、この関数は説明的なメッセージとともに `Error` をスローします。

### 使用例

```javascript parse-example.js icon=logos:javascript
import path from 'path';
import parse from '@blocklet/meta/lib/parse';

const blockletDir = path.join(__dirname, 'my-blocklet');

try {
  const meta = parse(blockletDir, {
    ensureFiles: true, // ロゴが存在することを確認
  });
  console.log('Blocklet のパースに成功しました:', meta.name, meta.version);
} catch (error) {
  console.error('blocklet.yml のパースに失敗しました:', error.message);
}
```

---

## `validateMeta`

既にBlockletメタデータオブジェクト（例：データベースやAPIレスポンスから取得したもの）があり、ファイルシステムから読み取ることなくBlockletスキーマに対して検証する必要がある場合に `validateMeta` を使用します。

### シグネチャ

```typescript
function validateMeta(
  meta: any,
  options?: {
    ensureFiles?: boolean;
    ensureDist?: boolean;
    ensureComponentStore?: boolean;
    ensureName?: boolean;
    skipValidateDidName?: boolean;
    schemaOptions?: any;
  }
): TBlockletMeta;
```

### パラメータ

<x-field-group>
  <x-field data-name="meta" data-type="any" data-required="true" data-desc="検証対象の生の Blocklet メタデータオブジェクト。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="オプションの設定オブジェクト、parse と同様です。">
    <x-field data-name="ensureFiles" data-type="boolean" data-default="false" data-desc="`true` の場合、`logo` および `files` フィールドにリストされているファイルがファイルシステムに実際に存在することを確認します。"></x-field>
    <x-field data-name="ensureDist" data-type="boolean" data-default="false" data-desc="`true` の場合、メタデータに `dist` フィールドが存在し、有効であることが必要です。"></x-field>
    <x-field data-name="ensureComponentStore" data-type="boolean" data-default="true" data-desc="`true` の場合、ストアからソース提供されたコンポーネントに `source.store` URLが定義されていることを保証します。"></x-field>
    <x-field data-name="ensureName" data-type="boolean" data-default="false" data-desc="`true` の場合、`name` フィールドが存在する必要があります。"></x-field>
    <x-field data-name="skipValidateDidName" data-type="boolean" data-default="false" data-desc="`true` で、Blocklet 名が DID 形式の場合、DID タイプの検証をスキップします。"></x-field>
    <x-field data-name="schemaOptions" data-type="object" data-desc="基盤となる Joi スキーマバリデータに渡す追加のオプション。"></x-field>
  </x-field>
</x-field-group>

### 戻り値

検証およびクリーンアップされた `TBlockletMeta` オブジェクトを返します。メタデータオブジェクトが検証に失敗した場合、`Error` をスローします。

### 使用例

```javascript validate-example.js icon=logos:javascript
import validateMeta from '@blocklet/meta/lib/validate';

const rawMeta = {
  name: 'my-first-blocklet',
  version: '1.0.0',
  description: 'A simple blocklet.',
  did: 'z8iZpA529j4Jk1iA...',
  // ... その他のプロパティ
};

try {
  const validatedMeta = validateMeta(rawMeta, { ensureName: true });
  console.log('メタデータは有効です:', validatedMeta.title);
} catch (error) {
  console.error('無効な Blocklet メタデータ:', error.message);
}
```

---

## `fixAndValidateService`

これは、メタデータの `interfaces` 配列の各エントリ内の `services` 設定を検証するための特殊なヘルパー関数です。メインの `parse` および `validateMeta` 関数はこれを内部的に呼び出しますが、サービス設定を個別に処理する必要がある場合のためにエクスポートされています。

### シグネチャ

```typescript
function fixAndValidateService(meta: TBlockletMeta): TBlockletMeta;
```

### パラメータ

<x-field data-name="meta" data-type="TBlockletMeta" data-required="true" data-desc="検証するサービス設定を含む Blocklet メタデータオブジェクト。"></x-field>

### 戻り値

入力された `TBlockletMeta` オブジェクトを返します。そのサービス設定は検証され、場合によってはデフォルト値で変更されます。いずれかのサービス設定が無効な場合、`Error` をスローします。

### 使用例

```javascript service-validate-example.js icon=logos:javascript
import { fixAndValidateService } from '@blocklet/meta/lib/validate';

const meta = {
  // ... その他のメタデータプロパティ
  interfaces: [
    {
      type: 'web',
      name: 'publicUrl',
      path: '/',
      services: [
        {
          name: '@blocklet/service-auth',
          config: {
            // 認証サービスの設定
          },
        },
      ],
    },
  ],
};

try {
  const metaWithValidatedServices = fixAndValidateService(meta);
  console.log('サービス設定は有効です。');
} catch (error) {
  console.error('無効なサービス設定:', error.message);
}
```

---

## `validateBlockletEntry`

このユーティリティ関数は、Blockletのエントリーポイント（`main` プロパティ）を検証し、そのグループタイプ（`dapp` または `static`）に対して正しく設定されていることを保証します。`dapp` の場合、必要なファイルの存在または有効な `engine` 設定を確認します。`static` Blockletの場合、`main` ディレクトリが存在することを確認します。これは、パース後に Blocklet が実行可能であることを確認するために実行する重要なチェックです。

### シグネチャ

```typescript
function validateBlockletEntry(dir: string, meta: TBlockletMeta): void;
```

### パラメータ

<x-field-group>
  <x-field data-name="dir" data-type="string" data-required="true" data-desc="Blocklet バンドルのルートディレクトリ。"></x-field>
  <x-field data-name="meta" data-type="TBlockletMeta" data-required="true" data-desc="パースおよび検証済みの Blocklet メタデータオブジェクト。"></x-field>
</x-field-group>

### 戻り値

この関数は値を返しません。エントリーポイントの検証が失敗した場合、問題を説明するメッセージとともに `Error` をスローします。

### 使用例

```javascript entry-validate-example.js icon=logos:javascript
import path from 'path';
import parse from '@blocklet/meta/lib/parse';
import validateBlockletEntry from '@blocklet/meta/lib/entry';

const blockletDir = path.join(__dirname, 'my-dapp');

try {
  const meta = parse(blockletDir);
  validateBlockletEntry(blockletDir, meta);
  console.log('Blocklet のエントリーポイントは有効です。');
} catch (error) {
  console.error('検証に失敗しました:', error.message);
}
```

---

メタデータのパースと検証の方法を理解したところで、リモートソースからメタデータを取得するためのヘルパーについて探求することをお勧めします。詳細は[メタデータヘルパー](./api-metadata-helpers.md)セクションに進んでください。