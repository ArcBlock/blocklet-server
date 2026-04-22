# 実行と環境

`blocklet.yml` 内の実行と環境の設定は、Blocklet がどのように実行されるかの設計図です。それは、必要なランタイムを指定し、システム要件を定義し、ユーザーに設定オプションを公開し、Blocklet のライフサイクルにフックします。このセクションを正しく設定することは、ポータブルで、堅牢で、ユーザーフレンドリーなアプリケーションを作成するために不可欠です。

このセクションでは、`engine`、`docker`、`requirements`、`environments`、`scripts`、および `timeout` の6つの主要な領域について説明します。

## エンジン (`engine`)

このプロパティは、blocklet の実行エンジンを指定し、ランタイムとそれをどのように起動するかを定義します。ほとんどの JavaScript ベースの blocklet では、インタープリタとして `node` を指定し、(`blocklet.yml` のルートで定義された) `main` プロパティがエントリポイントとして機能します。

```yaml シンプルな Node.js エンジン icon=mdi:language-yaml
name: my-node-blocklet
main: build/index.js
engine:
  interpreter: node
```

また、複数のプラットフォームをサポートするためにエンジン設定の配列を提供することもできます。これはバイナリ配布に最適です。

```yaml マルチプラットフォームエンジン設定 icon=mdi:language-yaml
# ... 他のプロパティ
engine:
  - platform: linux
    interpreter: binary
    source: ./bin/server-linux
  - platform: darwin
    interpreter: binary
    source: ./bin/server-macos
  - platform: win32
    interpreter: binary
    source: ./bin/server-win.exe
```

### エンジンのプロパティ

<x-field-group>
  <x-field data-name="interpreter" data-type="string" data-default="node">
    <x-field-desc markdown>blocklet を実行するためのランタイム。有効な値: `node`、`blocklet`、`binary`、`bun`。</x-field-desc>
  </x-field>
  <x-field data-name="platform" data-type="string" data-required="false">
    <x-field-desc markdown>オプションの OS プラットフォーム。`engine` が配列の場合に、異なる OS (例: `linux`、`darwin`、`win32`) の設定を指定するために使用します。</x-field-desc>
  </x-field>
  <x-field data-name="source" data-type="string | object" data-required="false">
    <x-field-desc markdown>インタープリタが `blocklet` の場合のエンジンのソース。URL 文字列、または URL や Blocklet Store を参照するオブジェクトを指定できます。</x-field-desc>
  </x-field>
  <x-field data-name="args" data-type="string[]" data-default="[]" data-required="false">
    <x-field-desc markdown>実行可能ファイルに渡すコマンドライン引数の配列。</x-field-desc>
  </x-field>
</x-field-group>

## Docker (`docker`)

`engine` プロパティの代替として、`docker` を使用してコンテナ化された環境で blocklet を実行できます。これは、複雑な依存関係を持つアプリケーションや JavaScript 以外のランタイムに最適です。`image` または `dockerfile` のいずれかを提供する必要があります。

```yaml ビルド済み Docker イメージの使用 icon=mdi:docker
docker:
  image: 'nginx:latest'
  egress: true
```

`dockerfile` を使用する場合、そのパスをルートの `files` 配列に含める必要もあります。

```yaml Dockerfile からのビルド icon=mdi:docker
docker:
  dockerfile: 'Dockerfile.prod'
files:
  - 'Dockerfile.prod'
```

### Docker のプロパティ

<x-field-group>
  <x-field data-name="image" data-type="string" data-required="false">
    <x-field-desc markdown>使用する Docker イメージの名前。</x-field-desc>
  </x-field>
  <x-field data-name="dockerfile" data-type="string" data-required="false">
    <x-field-desc markdown>イメージをビルドするための Dockerfile へのパス。`image` と `dockerfile` を同時に使用することはできません。</x-field-desc>
  </x-field>
  <x-field data-name="egress" data-type="boolean" data-default="true" data-required="false">
    <x-field-desc markdown>blocklet が外部ネットワークにアクセスできるかどうか。</x-field-desc>
  </x-field>
</x-field-group>

## ランタイム要件 (`requirements`)

このオブジェクトは、blocklet が正しく実行されるために必要な環境制約を定義します。システムは、互換性を確保するためにインストール前にこれらの要件をチェックします。

```yaml 要件の例 icon=mdi:language-yaml
requirements:
  server: '>=1.16.0'
  os: '*'
  cpu: 'x64'
  nodejs: '>=18.0.0'
```

### 要件のプロパティ

<x-field-group>
  <x-field data-name="server" data-type="string">
    <x-field-desc markdown>必要な Blocklet Server バージョンの有効な SemVer 範囲。デフォルトは最新の安定バージョンです。</x-field-desc>
  </x-field>
  <x-field data-name="os" data-type="string | string[]" data-default="*">
    <x-field-desc markdown>互換性のあるオペレーティングシステム。任意の OS の場合は `*` を使用します。単一の文字列または配列 (例: `['linux', 'darwin']`) を指定できます。有効なプラットフォームには `aix`、`darwin`、`freebsd`、`linux`、`openbsd`、`sunos`、`win32` が含まれます。</x-field-desc>
  </x-field>
  <x-field data-name="cpu" data-type="string | string[]" data-default="*">
    <x-field-desc markdown>互換性のある CPU アーキテクチャ。任意のアーキテクチャの場合は `*` を使用します。単一の文字列または配列 (例: `['x64', 'arm64']`) を指定できます。有効なアーキテクチャには `arm`、`arm64`、`ia32`、`mips`、`mipsel`、`ppc`、`ppc64`、`s390`、`s390x`、`x32`、`x64` が含まれます。</x-field-desc>
  </x-field>
  <x-field data-name="nodejs" data-type="string" data-default="*">
    <x-field-desc markdown>必要な Node.js バージョンの有効な SemVer 範囲。</x-field-desc>
  </x-field>
  <x-field data-name="fuels" data-type="array" data-required="false">
    <x-field-desc markdown>特定の操作のために接続されたウォレットで必要な資産 (トークン) のリストを指定します。</x-field-desc>
  </x-field>
  <x-field data-name="aigne" data-type="boolean" data-required="false">
    <x-field-desc markdown>`true` の場合、blocklet が AI Engine を利用可能にする必要があることを示します。</x-field-desc>
  </x-field>
</x-field-group>

## 環境変数 (`environments`)

`environments` 配列を使用すると、カスタム設定変数を定義できます。これらは、インストール中または blocklet の設定ページでユーザーに提示され、API キーを安全に入力したり、機能フラグを設定したり、動作をカスタマイズしたりすることができます。

```yaml 環境変数の定義 icon=mdi:language-yaml
environments:
  - name: 'API_KEY'
    description: '外部サービス用の秘密の API キーです。'
    required: true
    secure: true
  - name: 'FEATURE_FLAG_BETA'
    description: 'この blocklet のベータ機能を有効にします。'
    required: false
    default: 'false'
    validation: '^(true|false)$'
```

**キーの命名規則:**
- 名前は予約済みのプレフィックス `BLOCKLET_`、`COMPONENT_`、または `ABTNODE_` で始まってはいけません。
- 名前には文字、数字、アンダースコア (`_`) のみを含めることができます。

### 環境プロパティ

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true">
    <x-field-desc markdown>環境変数の名前。</x-field-desc>
  </x-field>
  <x-field data-name="description" data-type="string" data-required="true">
    <x-field-desc markdown>この変数が何のためのものかを説明する、ユーザーフレンドリーな説明。</x-field-desc>
  </x-field>
  <x-field data-name="default" data-type="string" data-required="false">
    <x-field-desc markdown>オプションのデフォルト値。`secure` が `true` の場合は使用できません。</x-field-desc>
  </x-field>
  <x-field data-name="required" data-type="boolean" data-default="false" data-required="false">
    <x-field-desc markdown>ユーザーがこの変数に値を指定する必要があるかどうか。</x-field-desc>
  </x-field>
  <x-field data-name="secure" data-type="boolean" data-default="false" data-required="false">
    <x-field-desc markdown>true の場合、値は機密データ (例: パスワード、API キー) として扱われ、暗号化されて保存され、UI で非表示になります。</x-field-desc>
  </x-field>
  <x-field data-name="validation" data-type="string" data-required="false">
    <x-field-desc markdown>ユーザーの入力を検証するためのオプションの正規表現文字列。</x-field-desc>
  </x-field>
  <x-field data-name="shared" data-type="boolean" data-required="false">
    <x-field-desc markdown>true の場合、この変数はコンポーネント間で共有できます。`secure` が `true` の場合はデフォルトで `false` になります。</x-field-desc>
  </x-field>
</x-field-group>

## ライフサイクルスクリプト (`scripts`)

スクリプトは、blocklet のライフサイクルにフックするシェルコマンドであり、インストール、起動、アンインストールなどの特定の段階で自動タスクを実行できます。次の図は、インストールと起動のフックがいつ実行されるかを示しています:

<!-- DIAGRAM_IMAGE_START:flowchart:16:9 -->
![Execution & Environment](assets/diagram/execution-environment-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

```yaml スクリプトフックの例 icon=mdi:language-yaml
scripts:
  pre-install: 'npm install --production'
  post-start: 'node ./scripts/post-start.js'
  pre-stop: 'echo "Shutting down..."'
```

### 利用可能なフック

| フック (`kebab-case`) | いつ実行されるか                                                          |
|---------------------|---------------------------------------------------------------------------|
| `dev`               | 開発モードで blocklet を実行するためのコマンド。                      |
| `e2eDev`            | 開発環境でエンドツーエンドテストを実行するためのコマンド。   |
| `pre-flight`        | インストールプロセスが開始される前、初期チェックのため。               |
| `pre-install`       | blocklet ファイルが最終的な宛先にコピーされる前。          |
| `post-install`      | blocklet が正常にインストールされた後。                       |
| `pre-start`         | blocklet のメインプロセスが開始される前。                            |
| `post-start`        | blocklet が正常に起動した後。                              |
| `pre-stop`          | blocklet が停止される前。                                           |
| `pre-uninstall`     | blocklet がアンインストールされる前。                                       |
| `pre-config`        | 設定ユーザーインターフェースがユーザーに表示される前。         |

## タイムアウト (`timeout`)

このオブジェクトを使用すると、プロセスが無期限にハングするのを防ぐために、重要なライフサイクル操作の最大待機時間を設定できます。

```yaml タイムアウト設定 icon=mdi:language-yaml
timeout:
  start: 120  # blocklet が起動するのを最大 120 秒待つ
  script: 600 # スクリプトを最大 10 分間実行できるようにする
```

### タイムアウトのプロパティ

<x-field-group>
  <x-field data-name="start" data-type="number" data-default="60">
    <x-field-desc markdown>blocklet が起動するのを待つ最大時間 (秒単位)。10 から 600 の間でなければなりません。</x-field-desc>
  </x-field>
  <x-field data-name="script" data-type="number">
    <x-field-desc markdown>任意のライフサイクルスクリプトが実行される最大時間 (秒単位)。1 から 1800 の間でなければなりません。</x-field-desc>
  </x-field>
</x-field-group>

---

実行環境が設定されたら、次のステップは blocklet が外部とどのように通信するかを定義することです。[インターフェースとサービス](./spec-interfaces-services.md) のセクションに進み、Web ページと API エンドポイントを公開する方法を学びましょう。