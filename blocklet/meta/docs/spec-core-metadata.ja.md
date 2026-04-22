# コアメタデータ

コアメタデータフィールドは、Blockletの基本的なアイデンティティを確立します。これらは、Blockletエコシステム内での識別、バージョニング、および発見可能性のための、一目でわかる必須情報を提供します。すべての `blocklet.yml` ファイルは、有効と見なされるためにこれらの基本的なプロパティを定義する必要があります。

---

## アイデンティティとバージョニング

これらのフィールドは、Blockletを一意に識別し、その進化を追跡します。

### `did` (分散型識別子)

`did`は、Blockletのグローバルにユニークで不変の識別子です。これはArcBlockエコシステム全体でそのプライマリキーとして機能し、すべてのBlockletが安全かつ明確に参照できるようにします。

<x-field-group>
  <x-field data-name="did" data-type="string" data-required="true">
    <x-field-desc markdown>有効な分散型識別子。DIDのタイプ情報は `RoleType.ROLE_BLOCKLET` を指定する必要があります。</x-field-desc>
  </x-field>
</x-field-group>

#### 検証ルール

システムは、提供されたDIDが構文的に正しいだけでなく、適切なロールタイプ（`ROLE_BLOCKLET`）を持っていることも検証します。これは重要なセキュリティと整合性の機能です。

```yaml blocklet.yml icon=mdi:code-tags
did: z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ
```

### `name`

`name`は、Blockletの人間が読める形式の識別子です。`did`がマシンにとっての正規の識別子であるのに対し、`name`は開発者やユーザーにとって便利で覚えやすいエイリアスを提供します。レガシーな設定では、BlockletのDIDを導出するためにも使用されていました。

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true">
    <x-field-desc markdown="">[npmパッケージの命名規則](https://www.npmjs.com/package/validate-npm-package-name)に従い、32文字を超えないユニークな名前。</x-field-desc>
  </x-field>
</x-field-group>

#### `name`と`did`の関係

`name`と`did`がどのように相互作用するかを理解することが重要です：

1.  **DIDファースト（推奨）**：有効な、事前登録されたBlocklet DIDを提供します。これは現代的で最も堅牢なアプローチです。
2.  **ネームファースト（レガシーサポート）**：`name`を提供すると、システムはそこからDIDを導出できます。メタデータが有効であるためには、`blocklet.yml`内の`did`フィールドが、`name`から生成される期待されるDIDと**一致しなければなりません**。不一致があると検証エラーが発生します。

```yaml blocklet.yml icon=mdi:code-tags
# この名前は表示用であり、DIDの導出に使用できます
name: 'my-awesome-blocklet'

# このDIDは有効なBlocklet DIDでなければなりません。ネームファーストのアプローチを使用する場合、
# 'my-awesome-blocklet' から導出されたDIDと一致する必要があります。
did: z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ
```

### `version`

`version`フィールドはBlockletのリリースバージョンを追跡し、ユーザーや他のBlockletのための適切な依存関係管理とバージョン管理を可能にします。

<x-field-group>
  <x-field data-name="version" data-type="string" data-required="true">
    <x-field-desc markdown="">Blockletのバージョン。[セマンティックバージョニング2.0.0](https://semver.org/)仕様に準拠する必要があります（例：`1.2.3`、`2.0.0-beta.1`）。</x-field-desc>
  </x-field>
</x-field-group>

```yaml blocklet.yml icon=mdi:code-tags
version: '1.0.0'
```

### `specVersion`

このフィールドは、メタデータファイルが準拠する`blocklet.yml`仕様のバージョンを指定します。これにより、Blockletランタイムとツールがファイルの内容を正しく解析および解釈し、前方互換性を確保できます。

<x-field-group>
  <x-field data-name="specVersion" data-type="string" data-required="false">
    <x-field-desc markdown="">仕様バージョンを示す有効なSemVer文字列。`1.0.0`以上である必要があります。</x-field-desc>
  </x-field>
</x-field-group>

```yaml blocklet.yml icon=mdi:code-tags
specVersion: '1.2.0'
```

---

## プレゼンテーションと分類

これらのフィールドは、Blockletがユーザーインターフェースでどのように表示され、どのように分類されるかを定義します。

### `title`

`title`はBlockletの表示に適した名前です。短い`name`よりも説明的またはブランド化された名前が好まれるBlockletストア、ダッシュボード、ランチャーなどのユーザーインターフェースで使用されます。

<x-field-group>
  <x-field data-name="title" data-type="string" data-required="false">
    <x-field-desc markdown="">短く、人間が読める形式のタイトル。その長さはCJK文字を認識して計算され、事前に定義された制限（`MAX_TITLE_LENGTH`）を超えてはなりません。詳細については、[cjk-length](https://www.npmjs.com/package/cjk-length)を参照してください。</x-field-desc>
  </x-field>
</x-field-group>

```yaml blocklet.yml icon=mdi:code-tags
title: 'My Awesome Blocklet'
```

### `description`

`description`は、Blockletの目的と機能の簡潔な要約を提供します。検索結果やUIのプレビューで多用され、ユーザーがBlockletの機能をすばやく理解するのに役立ちます。

<x-field-group>
  <x-field data-name="description" data-type="string" data-required="true">
    <x-field-desc markdown="">Blockletの簡単な要約。3文字以上160文字以内。</x-field-desc>
  </x-field>
</x-field-group>

```yaml blocklet.yml icon=mdi:code-tags
description: 'あなたのDID Spaceのための素晴らしいデータ可視化ツールを提供するBlocklet。'
```

### `logo`

このフィールドはBlockletのロゴへのパスまたはURLを指定します。ロゴは、Blockletストア、ダッシュボード、その他のユーザーインターフェースでのブランディングに使用されます。

<x-field-group>
  <x-field data-name="logo" data-type="string" data-required="false">
    <x-field-desc markdown="">ロゴ画像への相対パスまたは絶対HTTP(S) URL。システムが内部で使用する既知のロゴパス (`/.well-known/blocklet/logo`) を指してはいけません。</x-field-desc>
  </x-field>
</x-field-group>

```yaml blocklet.yml icon=mdi:code-tags
# Blockletバンドル内の相対パスを使用
logo: 'images/logo.png'

# または絶対URLを使用
# logo: 'https://cdn.example.com/blocklet-logo.svg'
```

### `group`

`group`フィールドはBlockletを分類し、レジストリやマーケットプレイスでの整理と発見可能性を助けます。

<x-field-group>
  <x-field data-name="group" data-type="string" data-required="false">
    <x-field-desc markdown="">Blockletのカテゴリ。定義済みの値のいずれかでなければなりません。</x-field-desc>
  </x-field>
</x-field-group>

`group`の有効な値は次のとおりです：

| Value       | Description                                                          |
|-------------|----------------------------------------------------------------------|
| `dapp`      | 分散型アプリケーション。                                         |
| `static`    | 静的ウェブサイトまたはシングルページアプリケーション。                         |
| `service`   | バックエンドサービスまたはAPI。                                            |
| `component` | 他のBlocklet内で構成されるように設計された再利用可能なコンポーネント。 |

```yaml blocklet.yml icon=mdi:code-tags
# このBlockletを分散型アプリケーションとして分類します。
group: 'dapp'
```

---

## 完全な例

以下は、`blocklet.yml`ファイルですべてのコアメタデータフィールドが連携して動作する様子を示すスニペットです。

```yaml blocklet.yml icon=mdi:code-tags
name: 'data-visualizer'
did: z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ # 'data-visualizer' に対応
version: '1.2.0'
specVersion: '1.2.0'
title: 'Data Visualizer'
description: 'あなたのDID Spaceのための素晴らしいデータ可視化ツールを提供するBlocklet。'
logo: 'images/logo.svg'
group: 'dapp'
```

Blockletのコアアイデンティティを理解したところで、次のセクションではその作成者とメンテナーを指定する方法について説明します。

<x-card data-title="次へ：人と所有権" data-icon="lucide:users" data-href="/spec/people-ownership" data-cta="続きを読む">
Blockletの作成者、貢献者、およびメンテナーを指定する方法を学びます。
</x-card>