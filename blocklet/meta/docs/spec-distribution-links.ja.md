# 配布とリンク

このセクションでは、`blocklet.yml`内のフィールドについて説明します。これらのフィールドは、blockletが配布用にパッケージ化される方法を定義し、ソースコード、ホームページ、ドキュメント、その他のリソースへの重要なリンクを提供します。これらのフィールドを適切に設定することは、発見可能性、ユーザーの信頼、Blockletエコシステムへの統合にとって非常に重要です。

## 配布パッケージ (`dist`)

`dist` オブジェクトには、blockletのバンドルされたパッケージに関する情報が含まれています。このデータは通常、`blocklet publish` コマンドによって自動的に生成および追加され、Blocklet Storeがblockletをダウンロードして検証するために使用します。

これにより、ユーザーがインストールするblockletパッケージの完全性と信頼性が保証されます。

### スキーマ

<x-field-group>
  <x-field data-name="dist" data-type="object" data-required="false" data-desc="blockletのバンドルされたパッケージに関する情報を含みます。">
    <x-field data-name="tarball" data-type="string" data-required="true" data-desc="圧縮されたblockletバンドル(.tar.gz)をダウンロードできるURL。"></x-field>
    <x-field data-name="integrity" data-type="string" data-required="true" data-desc="ダウンロードされたパッケージの内容を検証するためのサブリソース完全性文字列（例：SHA-512ハッシュ）。"></x-field>
    <x-field data-name="size" data-type="number" data-required="false" data-desc="tarballのサイズ（バイト単位）。"></x-field>
  </x-field>
</x-field-group>

### 例

```yaml blocklet.yml icon=mdi:package-variant
# このフィールドは通常、公開プロセス中に自動生成されます
dist:
  tarball: https://store.blocklet.dev/uploads/z123abc.tar.gz
  integrity: sha512-Vbf...Q==
  size: 1234567
```

## ソースコードリポジトリ (`repository`)

`repository` フィールドは、blockletのソースコードの場所を指定します。これにより、ユーザーや貢献者がコードを確認し、問題を報告し、貢献できるようになるため、強く推奨されます。

単純なURL文字列またはより詳細なオブジェクトを提供できます。

### スキーマ

<x-field data-name="repository" data-type="string | object" data-required="false" data-desc="blockletのソースコードの場所を指定します。">
  <x-field-desc markdown>単純なURL文字列または詳細なプロパティを持つオブジェクトを指定できます。システムは通常、標準的なURL文字列からタイプを解析できます。</x-field-desc>
  <x-field data-name="type" data-type="string" data-required="true" data-desc="バージョン管理システムのタイプ（例：「git」、「https」、「svn」）。"></x-field>
  <x-field data-name="url" data-type="string" data-required="true" data-desc="リポジトリのURL。"></x-field>
  <x-field data-name="directory" data-type="string" data-required="false" data-desc="モノレポ内のblockletパッケージへのパス。"></x-field>
</x-field>

### 例：単純なURL

文字列を提供すると、リポジトリのタイプを決定するために自動的に解析されます。

```yaml blocklet.yml icon=mdi:git
repository: https://github.com/arcblock/blocklet-spec.git
```

### 例：オブジェクト形式

オブジェクト形式を使用すると、モノレポの場合や、より明示的にする必要がある場合に便利です。

```yaml blocklet.yml icon=mdi:git
repository:
  type: git
  url: https://github.com/arcblock/blocklet-framework.git
  directory: packages/blocklet-spec
```

## Webリンクとサポート

これらのフィールドは、重要な外部リソースへの直接リンクを提供し、ユーザーサポートとコミュニティエンゲージメントを強化します。

<x-field-group>
  <x-field data-name="homepage" data-type="string" data-required="false" data-desc="blockletの公式ホームページまたはマーケティングページ。"></x-field>
  <x-field data-name="documentation" data-type="string" data-required="false" data-desc="blockletの詳細なドキュメントサイトへのリンク。"></x-field>
  <x-field data-name="community" data-type="string" data-required="false" data-desc="コミュニティフォーラム、Discordサーバー、またはその他のディスカッションプラットフォームへのリンク。"></x-field>
  <x-field data-name="support" data-type="string" data-required="false" data-desc="ユーザーがヘルプを得るためのURLまたはメールアドレス。"></x-field>
</x-field-group>

### 例

```yaml blocklet.yml icon=mdi:web
homepage: https://www.arcblock.io/
documentation: https://docs.arcblock.io/
community: https://community.arcblock.io/
support: support@arcblock.io
```

## プロモーションアセット

これらのフィールドは、Blocklet Storeでblockletを紹介するために使用され、ユーザーにその機能や機能の視覚的なプレビューを提供します。

<x-field-group>
  <x-field data-name="screenshots" data-type="string[]" data-required="false" data-desc="blockletのUIや機能を紹介する画像へのURLの配列。"></x-field>
  <x-field data-name="videos" data-type="string[]" data-required="false">
    <x-field-desc markdown>プロモーションビデオ用の最大3つのURLの配列。YouTubeとVimeoのリンクのみがサポートされています。</x-field-desc>
  </x-field>
  <x-field data-name="logoUrl" data-type="string" data-required="false" data-desc="blockletのロゴへの直接URL。これは通常、公開プロセスによって生成およびアップロードされます。"></x-field>
</x-field-group>

### 例

```yaml blocklet.yml icon=mdi:image-multiple
screenshots:
  - https://meta.blocklet.dev/screenshots/1.png
  - https://meta.blocklet.dev/screenshots/2.png
videos:
  - https://www.youtube.com/watch?v=xxxxxxxx
logoUrl: https://meta.blocklet.dev/logo.png
```

## 使用統計 (`stats`)

`stats` オブジェクトには、blockletの使用状況メトリクスが含まれています。`dist` フィールドと同様に、これは通常Blocklet Storeによって管理され、手動で設定するべきではありません。

### スキーマ

<x-field-group>
  <x-field data-name="stats" data-type="object" data-required="false" data-desc="Blocklet Storeによって管理される、blockletの使用状況メトリクスを含みます。">
    <x-field data-name="downloads" data-type="number" data-required="false" data-desc="blockletがダウンロードされた総回数。"></x-field>
    <x-field data-name="star" data-type="number" data-default="0" data-required="false" data-desc="blockletが受け取ったスターまたは賛成票の数。"></x-field>
    <x-field data-name="purchases" data-type="number" data-default="0" data-required="false" data-desc="blockletが購入された回数。"></x-field>
  </x-field>
</x-field-group>

### 例

```yaml blocklet.yml icon=mdi:chart-bar
# このフィールドはBlocklet Storeによって管理されます
stats:
  downloads: 10500
  star: 250
  purchases: 120
```

---

これらのフィールドを設定すると、blockletは配布の準備が整います。次のステップは、その実行方法を定義することです。

<x-card data-title="次へ：実行と環境" data-icon="lucide:terminal" data-cta="続きを読む" data-href="/spec/execution-environment">
blockletのエンジン、ランタイム要件、環境変数、および起動スクリプトの設定方法を学びます。
</x-card>