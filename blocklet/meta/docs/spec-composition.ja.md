# 構成 (コンポーネント)

Blocklet の構成は、より小さく独立した Blocklet を組み立てることで、複雑でモジュール化されたアプリケーションを構築できる強力な機能です。このアプローチは、再利用性、関心の分離、およびメンテナンスの容易さを促進します。`blocklet.yml` ファイルの `components` プロパティは、この機能の基礎であり、Blocklet が他の Blocklet に持つ依存関係を定義します。

## コアコンセプト: 親子関係

その核心は、構成が親子関係を確立することです。プライマリ Blocklet (親) は、機能するために必要な他の Blocklet (子またはコンポーネント) のリストを宣言できます。ユーザーが親 Blocklet をインストールすると、Blocklet Server は必要なすべてのコンポーネントを自動的に解決、取得、インストールし、複数のパーツから単一のまとまりのあるアプリケーションを作成します。

<!-- DIAGRAM_IMAGE_START:architecture:16:9 -->
![Composition (Components)](assets/diagram/composition-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## `components` プロパティの仕様

`components` プロパティはオブジェクトの配列で、各オブジェクトは単一の子 Blocklet を定義します。各コンポーネントオブジェクトの主要なフィールドは次のとおりです。

<x-field-group>
  <x-field data-name="source" data-type="object" data-required="true">
    <x-field-desc markdown>コンポーネントの場所を指定します。`url` または `store` と `name` のいずれかが含まれます。</x-field-desc>
  </x-field>
  <x-field data-name="required" data-type="boolean" data-required="false">
    <x-field-desc markdown>`true` の場合、このコンポーネントなしでは親 Blocklet をインストールまたは開始できません。デフォルトは `false` です。</x-field-desc>
  </x-field>
  <x-field data-name="title" data-type="string" data-required="false">
    <x-field-desc markdown>インストールプロセス中にコンポーネントに表示される推奨タイトル。ユーザーはこの値を上書きできます。</x-field-desc>
  </x-field>
  <x-field data-name="description" data-type="string" data-required="false">
    <x-field-desc markdown>インストール中にコンポーネントに表示される推奨説明。</x-field-desc>
  </x-field>
  <x-field data-name="mountPoint" data-type="string" data-required="false">
    <x-field-desc markdown>コンポーネントをマウントする場所の推奨 URL パスプレフィックス。例えば、バックエンドサービスの場合は `/api` です。ユーザーはセットアップ中にこれを変更できます。</x-field-desc>
  </x-field>
  <x-field data-name="name" data-type="string" data-required="false" data-deprecated="true">
    <x-field-desc markdown>後方互換性のためのレガシーフィールド。`source` オブジェクト内の `name` に依存することが推奨されます。</x-field-desc>
  </x-field>
</x-field-group>

### コンポーネントの `source` の定義

`source` オブジェクトは必須で、Blocklet Server にコンポーネントの場所とダウンロード方法を伝えます。これには主に2つの形式があります。

1.  **Blocklet Store から (推奨)**: これが標準的な方法です。ストアの URL、コンポーネント名、およびバージョン範囲を指定します。
    <x-field-group>
      <x-field data-name="store" data-type="string" data-required="true" data-desc="Blocklet Store API の URL。"></x-field>
      <x-field data-name="name" data-type="string" data-required="true" data-desc="コンポーネント Blocklet の一意の名前。"></x-field>
      <x-field data-name="version" data-type="string" data-required="false" data-default="latest">
        <x-field-desc markdown>セマンティックバージョニングの範囲 (例: `^1.2.3`, `~2.0.0`, `latest`)。</x-field-desc>
      </x-field>
    </x-field-group>

2.  **直接 URL から**: これにより、コンポーネントのマニフェスト (`blocklet.yml` または `blocklet.json`) またはその tarball パッケージに直接リンクできます。
    <x-field-group>
      <x-field data-name="url" data-type="string | string[]" data-required="true" data-desc="単一の URL 文字列、または冗長性のための URL 文字列の配列。"></x-field>
      <x-field data-name="version" data-type="string" data-required="false">
        <x-field-desc markdown>リンクされたマニフェストで指定されたバージョンに対して検証するためのセマンティックバージョニングの範囲。</x-field-desc>
      </x-field>
    </x-field-group>

### `blocklet.yml` 設定例

これは、`blocklet.yml` ファイルでコンポーネントを宣言する方法を示すスニペットです。

```yaml blocklet.yml icon=mdi:file-document-outline
name: 'my-composite-blog'
did: 'z8iZexampleDidForCompositeBlog'
version: '1.0.0'
title: 'My Composite Blog'
description: 'いくつかの小さな Blocklet から構築されたブログアプリケーション'

# ... その他のプロパティ

components:
  # Blocklet Store から取得したコンポーネント (推奨)
  - name: 'blog-api-service' # 後方互換性のある名前
    required: true
    title: 'Blog API Service'
    description: 'すべてのバックエンドロジックとデータベースの相互作用を処理します'
    mountPoint: '/api/blog'
    source:
      store: 'https://store.blocklet.dev/api/blocklets'
      name: 'blog-api-service'
      version: '^1.0.0'

  # 直接 URL から取得したコンポーネント
  - name: 'blog-frontend-ui'
    required: true
    title: 'Blog User Interface'
    mountPoint: '/'
    source:
      url: 'https://github.com/me/blog-frontend/releases/download/v2.1.0/blocklet.yml'
      version: '2.1.0'
```

この設定は、他の2つの Blocklet、つまりバックエンド API サービスとフロントエンド UI に依存するブログアプリケーションを定義します。両方とも `required` としてマークされています。

## 依存関係の解決

Blocklet の構成はネスト可能です。つまり、コンポーネントは独自のコンポーネントを持つことができます。この複雑さを管理するために、システムは依存関係ツリー全体を解決して、正しいインストール順序を決定する必要があります。`@blocklet/meta` ライブラリはこの目的のためのユーティリティ関数を提供します。

### `getRequiredComponentsLayers()`

この関数は依存関係グラフを走査し、依存関係のレイヤーを表す2次元配列を返します。配列は最も低いレベルの依存関係から最も高いレベルの順に並べられており、基盤となるコンポーネントがそれに依存するコンポーネントの前にインストールされることを保証します。

**使用例**

```javascript Resolving Dependency Order icon=logos:javascript
import { getRequiredComponentsLayers } from '@blocklet/meta';

// 利用可能なすべての Blocklet とその依存関係の簡略化されたリスト
const allBlocklets = [
  {
    meta: { did: 'did:app:parent' },
    dependencies: [{ did: 'did:app:child', required: true }],
  },
  {
    meta: { did: 'did:app:child' },
    dependencies: [{ did: 'did:app:grandchild', required: true }],
  },
  {
    meta: { did: 'did:app:grandchild' },
    dependencies: [],
  },
  {
    meta: { did: 'did:app:optional_component' },
    dependencies: [],
  },
];

const layers = getRequiredComponentsLayers({
  targetDid: 'did:app:parent',
  children: allBlocklets,
});

console.log(layers);
// 期待される出力: [['did:app:grandchild'], ['did:app:child']]
// これは 'grandchild' を最初にインストールし、次に 'child' をインストールする必要があることを意味します。
```

このユーティリティは、複雑で多層的なアプリケーションに対して、安定した予測可能なインストールプロセスを保証するために不可欠です。