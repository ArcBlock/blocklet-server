# Blocklet 仕様 (blocklet.yml)

`blocklet.yml`ファイルは、すべてのBlockletの中心です。これは、アプリケーションに関するすべての重要なメタデータを定義するYAMLマニフェストであり、Blocklet Serverやエコシステム内の他のツールにとっての信頼できる唯一の情報源として機能します。

これはNode.jsの世界における`package.json`に相当するものですが、分散型アプリケーションの完全なライフサイクルと構成を網羅するように拡張されています。BlockletのIDとバージョンから、実行方法、公開するウェブインターフェース、他のBlockletへの依存関係、ユーザーインターフェースとの統合方法まで、あらゆる詳細を定義します。

この仕様は、`blocklet.yml`で利用可能なすべてのフィールドの決定版リファレンスです。単純な静的ウェブサイトを構築する場合でも、複雑なマルチサービスアプリケーションを構築する場合でも、適切に記述された`blocklet.yml`は、アプリケーションが正しく予測どおりに実行されることを保証するための第一歩です。

### 基本的な例

以下に、基本的な構造を示す最小限の`blocklet.yml`ファイルを示します。各フィールドの詳細は、以下のセクションで説明します。

```yaml blocklet.yml icon=logos:yaml
# BlockletのコアID
did: z8iZpA63mBCy9j82Vf9aL3a8u9b5c7d9e1f2
name: my-awesome-blocklet
version: 1.0.0

# 人間が読めるメタデータ
title: My Awesome Blocklet
description: A simple Blocklet to demonstrate the core concepts.

# Blockletの実行方法
main: api/index.js

# BlockletのWebへの公開方法
interfaces:
  - type: web
    name: publicUrl
    path: /
    prefix: '*'
    port: BLOCKLET_PORT
    protocol: http

# システム要件
requirements:
  server: ">=1.16.0"
  os: "*"
  cpu: "*"
```

### 仕様のセクション

`blocklet.yml`の仕様は、プロパティの論理的なグループに整理されています。各フィールドの目的、有効な値に関する包括的なガイドについては、以下のセクションをご覧ください。

<x-cards data-columns="3">
  <x-card data-title="コアメタデータ" data-href="/spec/core-metadata" data-icon="lucide:package">
    名前、DID、バージョン、説明など、Blockletのアイデンティティを定義する基本的なプロパティ。
  </x-card>
  <x-card data-title="関係者と所有権" data-href="/spec/people-ownership" data-icon="lucide:users">
    Blockletの作成者、貢献者、メンテナーを指定します。
  </x-card>
  <x-card data-title="配布とリンク" data-href="/spec/distribution-links" data-icon="lucide:link">
    配布パッケージ、ソースコードリポジトリ、ホームページ、ドキュメントへのリンクのためのフィールド。
  </x-card>
  <x-card data-title="実行と環境" data-href="/spec/execution-environment" data-icon="lucide:terminal">
    ランタイムエンジン、システム要件、環境変数、ライフサイクルスクリプトを設定します。
  </x-card>
  <x-card data-title="インターフェースとサービス" data-href="/spec/interfaces-services" data-icon="lucide:network">
    BlockletがWebページ、API、その他のエンドポイントを外部に公開する方法を定義します。
  </x-card>
  <x-card data-title="構成（コンポーネント）" data-href="/spec/composition" data-icon="lucide:boxes">
    他のBlockletをコンポーネントとして組み合わせることで、複雑なアプリケーションを構築します。
  </x-card>
  <x-card data-title="UIとテーマ" data-href="/spec/ui-theming" data-icon="lucide:palette">
    ナビゲーション項目とテーマ設定を定義して、BlockletのUIをシームレスに統合します。
  </x-card>
  <x-card data-title="収益化" data-href="/spec/monetization" data-icon="lucide:dollar-sign">
    Blockletの価格設定、収益分配、NFTベースの購入を設定します。
  </x-card>
  <x-card data-title="セキュリティとリソース" data-href="/spec/security-resources" data-icon="lucide:shield">
    署名でメタデータの完全性を確保し、リソースフィールドを使用して共有アセットを定義します。
  </x-card>
</x-cards>

---

`blocklet.yml`の構造の概要を理解したところで、上記の特定のセクションを詳しく調べて、必要な詳細情報を見つけてください。このメタデータとプログラムでやり取りする方法については、[APIリファレンス](./api.md)を参照してください。