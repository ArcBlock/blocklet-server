# 概要

`@blocklet/meta` はBlockletエコシステム内の基礎ライブラリであり、Blockletメタデータを管理するための決定的なツールキットとして機能します。これは `blocklet.yml` マニフェストファイルの正式な仕様を確立し、このメタデータをプログラムで解析、検証、修正、および操作するための包括的なユーティリティ関数スイートを提供します。

このライブラリの中核は、すべてのBlockletが一貫性があり、信頼性が高く、機械可読な方法で記述されることを保証することです。この標準化が、アプリケーションを実行するBlocklet Serverから、その構築を支援する開発者ツールまで、Blockletエコシステム全体を支えています。

<!-- DIAGRAM_IMAGE_START:architecture:16:9 -->
![Overview](assets/diagram/overview-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

このドキュメントは、ライブラリ自体の二重の目的を反映して、2つの主要な部分に分かれています。

## Blocklet仕様: `blocklet.yml`

`blocklet.yml`ファイルは、Blockletの設計図です。これは、アプリケーションのあらゆる側面を定義する宣言的なマニフェストです。`@blocklet/meta`ライブラリには、このファイルを検証する正式なスキーマが含まれており、Blockletプラットフォームがアプリケーションを正しくインストール、設定、実行、および管理できるようにします。定義できる主な側面は次のとおりです。

- **コアアイデンティティ**: `name`、`version`、およびBlocklet固有の分散型ID (`did`)。
- **プレゼンテーション**: `title`、`description`、`logo`、およびアプリストアで表示するためのスクリーンショット。
- **実行環境**: ランタイム`engine`（例：Node.js）、ライフサイクル`scripts`（`pre-start`など）、および必要な`environments`変数。
- **ネットワークとサービス**: 公開されるWeb `interfaces`、内部サービス、および必要なポート。
- **構成**: `components`として含める他のBlockletのリスト。これにより、モジュラーアプリケーション設計が可能になります。
- **ユーザーインターフェース**: ダッシュボードと統合するための`navigation`リンク、および視覚的な一貫性のための`theme`設定。
- **収益化**: 価格設定と収益分配のための`payment`詳細。
- **セキュリティ**: メタデータの完全性と作者性を検証するための暗号`signatures`。

## ユーティリティツールキット: プログラムによるアクセス

仕様を定義するだけでなく、`@blocklet/meta`は、開発者がBlockletのメタデータと状態を扱うための豊富なJavaScript/TypeScript関数のセットを提供します。このツールキットは、Blockletエコシステムと対話するカスタムツール、プラグイン、または複雑なアプリケーションを構築するために不可欠です。

ユーティリティは、いくつかの主要なカテゴリに分類できます。

- **解析と検証**: `parse`や`validateMeta`などの関数を使用すると、ディスクから`blocklet.yml`ファイルを読み取り、その内容を公式スキーマに対して検証できます。
- **メタデータヘルパー**: 一般的なフォーマットの問題を自動的に修正したり、personオブジェクトをフォーマットしたり、リポジトリURLを解決したりするための関数のコレクション。
- **コンポーネントと状態のユーティリティ**: 実行中のBlockletとそのコンポーネントの状態を走査するための強力なヘルパーセット（`forEachBlocklet`、`findComponent`、`getAppUrl`など）。これは、管理ダッシュボードや動的アプリケーションを構築するために非常に重要です。
- **DIDとウォレットのユーティリティ**: `toBlockletDid`や`getBlockletWallet`など、Blockletに関連付けられた分散型識別子（DID）と暗号ウォレットを処理するための関数。
- **セキュリティ**: `signResponse`や`verifyResponse`などのツールを使用して、データの署名と検証を行い、完全性と信頼性を確保します。

## 次は？

<x-cards data-columns="3">
  <x-card data-title="はじめに" data-href="/getting-started" data-icon="lucide:rocket">
    ライブラリをインストールし、数分で最初の `blocklet.yml` ファイルを解析します。
  </x-card>
  <x-card data-title="Blocklet仕様 (blocklet.yml)" data-href="/spec" data-icon="lucide:book-marked">
    `blocklet.yml` マニフェストの各フィールドに関する包括的なリファレンスを深く掘り下げます。
  </x-card>
  <x-card data-title="APIリファレンス" data-href="/api" data-icon="lucide:code-2">
    ライブラリで利用可能なすべてのユーティリティ関数の詳細なドキュメントを探索します。
  </x-card>
</x-cards>