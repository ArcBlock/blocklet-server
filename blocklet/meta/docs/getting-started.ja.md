# はじめに

このガイドでは、`@blocklet/meta` ライブラリの使用方法を簡単に紹介します。パッケージのインストール方法と、最も一般的なタスクである `blocklet.yml` ファイルの解析方法を学び、アプリケーション内でそのメタデータにアクセスできるようになります。

### 前提条件

始める前に、以下が揃っていることを確認してください：

1.  Node.js 開発環境。
2.  `blocklet.yml` ファイルを含む Blocklet プロジェクトディレクトリ。

このガイドでは、`my-blocklet` という名前のプロジェクトディレクトリがあり、その中に以下の `blocklet.yml` ファイルがあると仮定します：

```yaml title="my-blocklet/blocklet.yml" icon=mdi:language-yaml
name: my-awesome-blocklet
version: 0.1.0
title: My Awesome Blocklet
description: A simple blocklet to demonstrate parsing.
author: 'Jane Doe <jane.doe@example.com>'
```

### ステップ1：インストール

Yarn または npm を使用して、`@blocklet/meta` パッケージをプロジェクトの依存関係に追加します。

```shell yarn
yarn add @blocklet/meta
```

または npm を使用する場合：

```shell npm
npm install @blocklet/meta
```

### ステップ2：Blockletメタデータを解析する

このライブラリの中核となる関数は `parse` です。指定されたディレクトリから `blocklet.yml` (または `blocklet.yaml`) を読み込み、その内容を Blocklet 仕様に照らして検証し、必要な修正（人物フィールドの標準化など）を適用して、クリーンな JavaScript オブジェクトを返します。

`my-blocklet` ディレクトリの隣に `index.js` という名前のファイルを作成し、以下のコードを追加します：

```javascript title="index.js" icon=logos:javascript
const path = require('path');
const { parse } = require('@blocklet/meta');

// blocklet のルートディレクトリへのパスを定義
const blockletDir = path.join(__dirname, 'my-blocklet');

try {
  // メタデータを解析
  const meta = parse(blockletDir);

  // 解析されたメタデータオブジェクトを出力
  console.log('Successfully parsed blocklet meta:', meta);
} catch (error) {
  console.error('Failed to parse blocklet.yml:', error.message);
}
```

このスクリプト（`node index.js`）を実行すると、解析されたメタデータオブジェクトが出力されます。

### 期待される出力

`parse` 関数は YAML ファイルを読み取るだけでなく、キーをキャメルケースに変換し、`author` のような複雑なフィールドを構造化されたオブジェクトにフォーマットします。

```json Output icon=mdi:code-json
{
  "name": "my-awesome-blocklet",
  "version": "0.1.0",
  "title": "My Awesome Blocklet",
  "description": "A simple blocklet to demonstrate parsing.",
  "author": {
    "name": "Jane Doe",
    "email": "jane.doe@example.com"
  },
  "specVersion": "1.0.0",
  "path": "/path/to/your/project/my-blocklet"
}
```

### 次のステップ

`@blocklet/meta` を正常にインストールし、最初の `blocklet.yml` を解析しました。次に、より高度なトピックを探求できます。

<x-cards>
  <x-card data-title="Blocklet 仕様 (blocklet.yml)" data-icon="lucide:file-text" data-href="/spec">
    利用可能なすべてのフィールドとその意味について学び、blocklet の動作と外観を完全に設定します。
  </x-card>
  <x-card data-title="API リファレンス" data-icon="lucide:book-open" data-href="/api">
    完全な API ドキュメントを深く掘り下げ、検証、ファイル処理、セキュリティに関する他のユーティリティを発見します。
  </x-card>
</x-cards>