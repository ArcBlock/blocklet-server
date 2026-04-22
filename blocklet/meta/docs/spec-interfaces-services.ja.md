# インターフェースとサービス

Blockletは`インターフェース`を介して外部と対話し、`サービス`を介して強力で再利用可能な機能で強化されます。`blocklet.yml`の`interfaces`プロパティは、アプリケーションのウェブページ、API、およびその他のエンドポイントを公開するための基礎です。組み込みの認証サービスなどの`サービス`は、これらのインターフェースにアタッチして、余分な定型コードなしで共通の機能を提供できます。

このセクションでは、両方の設定方法を詳しく説明し、Blockletの明確なエントリポイントを定義し、より広範なエコシステムにシームレスに統合できるようにします。

---

## インターフェース

`interfaces`配列は、Blockletのすべての公開エントリポイントを定義します。配列内の各オブジェクトは単一のインターフェースを表し、そのタイプ、場所、および動作を指定します。

### インターフェーススキーマ

各インターフェースオブジェクトは、次のプロパティによって定義されます:

<x-field-group>
  <x-field data-name="type" data-type="string" data-required="true">
    <x-field-desc markdown>インターフェースのタイプ。有効な値には、`web`、`well-known`、`api`、`health`などがあります。Blockletは`web`インターフェースを1つしか宣言できません。</x-field-desc>
  </x-field>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="インターフェースの一意で人間が読める名前（例：`publicUrl`、`adminApi`）。"></x-field>
  <x-field data-name="path" data-type="string" data-default="/" data-desc="このインターフェースを提供するBlocklet内の内部パス。"></x-field>
  <x-field data-name="prefix" data-type="string" data-default="*">
    <x-field-desc markdown>このインターフェースが公開されるパスプレフィックス。値が`*`（`BLOCKLET_DYNAMIC_PATH_PREFIX`）の場合、ユーザーは任意のパスにマウントできます。</x-field-desc>
  </x-field>
  <x-field data-name="protocol" data-type="string" data-default="http">
    <x-field-desc markdown>通信プロトコル。有効な値は`http`、`https`、`tcp`、`udp`です。</x-field-desc>
  </x-field>
  <x-field data-name="port" data-type="string | object" data-default="PORT">
    <x-field-desc markdown>ポートマッピングを定義します。環境変数を参照する文字列（例：`PORT`）にすることも、固定マッピングのために`internal`（環境変数名）と`external`（ポート番号）キーを持つオブジェクトにすることもできます。</x-field-desc>
  </x-field>
  <x-field data-name="containerPort" data-type="number" data-required="false" data-desc="コンテナ内のポート番号。"></x-field>
  <x-field data-name="hostIP" data-type="string" data-required="false" data-desc="インターフェースをホストマシン上の特定のIPにバインドします。"></x-field>
  <x-field data-name="services" data-type="array" data-default="[]" data-desc="このインターフェースにアタッチするサービスのリスト。詳細は以下のサービスセクションを参照してください。"></x-field>
  <x-field data-name="endpoints" data-type="array" data-default="[]" data-desc="検出可能性と相互作用のためのメタデータを持つ特定のAPIエンドポイントを定義します。"></x-field>
  <x-field data-name="cacheable" data-type="array" data-default="[]" data-desc="このインターフェース以下の相対パスのリストで、アップストリームサービスによってキャッシュ可能です。"></x-field>
  <x-field data-name="proxyBehavior" data-type="string" data-default="service">
    <x-field-desc markdown>リクエストがどのようにプロキシされるかを定義します。`service`はBlocklet Serverのサービスレイヤーを経由してルーティングし、`direct`はそれをバイパスします。</x-field-desc>
  </x-field>
  <x-field data-name="pageGroups" data-type="array" data-default="[]" data-desc="ページグループ識別子のリスト。"></x-field>
</x-field-group>

### 特別なインターフェースタイプ

-   **`web`**: これはBlockletの主要なユーザー向けインターフェースです。Blockletは`web`タイプのインターフェースを**最大で1つ**しか宣言できません。
-   **`well-known`**: このタイプは、標準化されたリソース発見パス（例：`/.well-known/did.json`）用です。このタイプのインターフェースは、`/.well-known`で始まる`prefix`を持つ必要があります。

### 例：インターフェースの定義

以下は、プライマリウェブインターフェースと別のAPIインターフェースの両方を定義する`blocklet.yml`の例です。

```yaml blocklet.yml icon=mdi:code-braces
name: my-awesome-app
did: z8iZpky2Vd3i2bE8z9f6c7g8h9j0k1m2n3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d
version: 1.2.0
description: An awesome app with a web UI and an API.

interfaces:
  # ユーザーがアクセス可能なメインのウェブインターフェース
  - type: web
    name: publicUrl
    path: /
    prefix: /
    protocol: http
    port: PORT

  # 専用のAPIインターフェース
  - type: api
    name: dataApi
    path: /api
    prefix: /api
    protocol: http
    port: PORT
```

---

## サービス

サービスは、Blocklet Server環境によって提供される、事前に構築された設定可能な機能です。インターフェースの`services`配列で宣言するだけで、認証、認可などの機能を追加するためにインターフェースにアタッチできます。

### サービススキーマ

サービスオブジェクトには2つの主要なプロパティがあります:

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="アタッチするサービスの名前（例：`auth`）。"></x-field>
  <x-field data-name="config" data-type="object" data-default="{}" data-desc="そのサービスに固有の設定オブジェクト。"></x-field>
</x-field-group>

### 組み込みサービス：`auth`

`auth`サービスは、Blockletのための完全なユーザー認証および認可ソリューションを提供します。ユーザーのログイン、プロファイル管理、およびアクセス制御を処理します。

#### `auth`サービスの設定

`auth`サービスを追加すると、`config`オブジェクトを使用してその動作をカスタマイズできます。利用可能なオプションは次のとおりです:

<x-field-group>
  <x-field data-name="whoCanAccess" data-type="string" data-default="all">
    <x-field-desc markdown>誰がインターフェースにアクセスできるかを定義します。有効な値：`owner`（DID Spaceの所有者のみ）、`invited`（所有者と招待されたユーザー）、または`all`（認証されたすべてのユーザー）。</x-field-desc>
  </x-field>
  <x-field data-name="profileFields" data-type="array" data-default='["fullName", "email", "avatar"]'>
    <x-field-desc markdown>ログイン時にアプリが要求するユーザープロファイル情報。有効なフィールドは`fullName`、`email`、`avatar`、および`phone`です。</x-field-desc>
  </x-field>
  <x-field data-name="allowSwitchProfile" data-type="boolean" data-default="true" data-desc="ユーザーがアプリケーション内で異なるプロファイルを切り替えることができるかどうかを決定します。"></x-field>
  <x-field data-name="blockUnauthenticated" data-type="boolean" data-default="false" data-desc="`true`の場合、サービスは認証されていないリクエストを自動的にブロックします。"></x-field>
  <x-field data-name="blockUnauthorized" data-type="boolean" data-default="false">
    <x-field-desc markdown>`true`の場合、サービスは`whoCanAccess`の基準を満たさない認証済みユーザーをブロックします。</x-field-desc>
  </x-field>
  <x-field data-name="ignoreUrls" data-type="array" data-default="[]">
    <x-field-desc markdown>認証チェックから除外すべきURLパスまたはパターンのリスト（例：`/public/**`）。</x-field-desc>
  </x-field>
</x-field-group>

### 例：`auth`サービスのアタッチ

この例は、前の例の`web`インターフェースを`auth`サービスを使用して保護する方法を示しています。

```yaml blocklet.yml icon=mdi:code-braces
interfaces:
  - type: web
    name: publicUrl
    path: /
    prefix: /
    protocol: http
    port: PORT
    services:
      - name: auth
        config:
          whoCanAccess: invited
          blockUnauthenticated: true
          profileFields:
            - fullName
            - email
          ignoreUrls:
            - /assets/**
            - /login
```

この設定では、ウェブインターフェース以下のすべてのパスは、`/assets/**`と`/login`を除いて保護されます。DID Spaceの所有者と招待されたユーザーのみが、ログイン後に保護されたページにアクセスでき、フルネームとメールアドレスの共有を求められます。

---

## エンドポイント

インターフェース内の`endpoints`配列により、APIエンドポイントを明示的に定義でき、検出可能性を高め、自動化された相互作用を可能にします。

### エンドポイントスキーマ

<x-field-group>
  <x-field data-name="type" data-type="string" data-required="true" data-desc="エンドポイントタイプの一意の識別子。"></x-field>
  <x-field data-name="path" data-type="string" data-required="true" data-desc="インターフェースのパスに対するエンドポイントへの相対パス。"></x-field>
  <x-field data-name="meta" data-type="object" data-required="false" data-desc="エンドポイントに関するメタデータを含むオブジェクト。">
    <x-field data-name="vcType" data-type="string" data-desc="エンドポイントに関連付けられた検証可能な資格情報のタイプ。"></x-field>
    <x-field data-name="payable" data-type="boolean" data-desc="エンドポイントが支払いを伴うかどうかを示します。"></x-field>
    <x-field data-name="params" data-type="array" data-desc="エンドポイントが受け入れるパラメータを記述する配列。">
      <x-field data-name="name" data-type="string" data-required="true" data-desc="パラメータの名前。"></x-field>
      <x-field data-name="description" data-type="string" data-required="true" data-desc="パラメータの説明。"></x-field>
    </x-field>
  </x-field>
</x-field-group>

---

インターフェースとサービスを組み合わせることで、Blockletがどのように公開されるかを明確に定義し、強力な組み込み機能で保護することができます。複数のBlockletを組み合わせてより複雑なアプリケーションを構築する方法については、次のコンポジションに関するセクションを参照してください。

[次へ：コンポジション（コンポーネント）](./spec-composition.md)