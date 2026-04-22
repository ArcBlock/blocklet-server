# APIリファレンス

`@blocklet/meta` ライブラリは、`blocklet.yml` メタデータとプログラムで対話するための包括的なユーティリティ関数スイートを提供します。これらのヘルパーは、解析、検証、データ操作、セキュリティ操作などの一般的なタスクを効率化します。開発ツール、カスタムBlockletランタイム、またはBlockletエコシステムと対話するアプリケーションを構築している場合でも、これらのAPIは必要な構成要素を提供します。

このセクションは、エクスポートされたすべての関数について、そのコア機能ごとにグループ化された詳細なリファレンスとして機能します。これらの関数が操作するメタデータ構造を完全に理解するには、[Blocklet仕様 (blocklet.yml)](./spec.md) を参照してください。

以下のカテゴリを調べて、必要な特定の関数を見つけてください。各セクションでは、詳細な説明、パラメータ、使用例が提供されており、迅速に開始するのに役立ちます。

<x-cards data-columns="2">
  <x-card data-title="解析と検証" data-icon="lucide:scan-line" data-href="/api/parsing-validation">
    `blocklet.yml` ファイルの読み取り、解析、検証のための関数。`parse`、`validateMeta`、`fixAndValidateService`、その他の検証ヘルパーが含まれます。
  </x-card>
  <x-card data-title="メタデータヘルパー" data-icon="lucide:file-cog" data-href="/api/metadata-helpers">
    リモートURLからBlockletメタデータを取得し、処理するためのユーティリティ。`getBlockletMetaByUrl` と `getSourceUrlsFromConfig` が含まれます。
  </x-card>
  <x-card data-title="コンポーネントと状態のユーティリティ" data-icon="lucide:cuboid" data-href="/api/component-state-utilities">
    コンポーネントツリーの走査、特定のコンポーネントの検索、情報の抽出など、Blocklet状態オブジェクトを操作するためのヘルパー関数のコレクション。
  </x-card>
  <x-card data-title="DIDとウォレットのユーティリティ" data-icon="lucide:wallet" data-href="/api/did-wallet-utilities">
    Blockletコンテキスト内でDIDとウォレットを処理するための関数。Blocklet固有のDIDの作成、ウォレットの生成、ユーザー情報の抽出などが含まれます。
  </x-card>
  <x-card data-title="セキュリティユーティリティ" data-icon="lucide:shield-check" data-href="/api/security-utilities">
    応答への署名、署名の検証、メタデータのマルチシグネチャ検証の管理など、暗号化操作のための関数。
  </x-card>
  <x-card data-title="ナビゲーションユーティリティ" data-icon="lucide:navigation" data-href="/api/navigation-utilities">
    Blockletのメタデータと状態から `navigation` プロパティを解析・処理し、動的なユーザーインターフェースを構築するための関数。
  </x-card>
  <x-card data-title="URLとパスのユーティリティ" data-icon="lucide:link" data-href="/api/url-path-utilities">
    URLフレンドリーな文字列の作成やURLパスの検証に役立つヘルパー。クリーンで有効なルートの生成に便利です。
  </x-card>
  <x-card data-title="ファイルユーティリティ" data-icon="lucide:files" data-href="/api/file-utilities">
    ファイルシステム上で `blocklet.yml` ファイルを読み書き、検索するための低レベル関数、およびファイル検証用のカスタムJoi拡張。
  </x-card>
  <x-card data-title="その他のユーティリティ" data-icon="lucide:box" data-href="/api/misc-utilities">
    コミュニケーションチャネルヘルパーやアイデンティティアイコン（Blockies）の生成など、その他の便利なユーティリティのコレクション。
  </x-card>
</x-cards>