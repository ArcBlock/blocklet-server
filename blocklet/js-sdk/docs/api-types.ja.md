# 型

このセクションでは、`@blocklet/js-sdk` によってエクスポートされるコア TypeScript の型とインターフェースの詳細なリファレンスを提供します。プロジェクトでこれらの型を使用すると、TypeScript の静的分析と自動補完を活用して、より良い開発体験を得ることができます。

## コア Blocklet 型

これらの型は、Blocklet アプリケーションとそのコンポーネントの基本構造を定義します。

### Blocklet

Blocklet の完全なメタデータと構成を表します。このオブジェクトは通常、アプリケーションが Blocklet Server 環境内で実行されている場合、`window.blocklet` としてグローバルに利用できます。

<x-field-group>
<x-field data-name="did" data-type="string" data-required="true" data-desc="Blocklet の分散型識別子 (DID)。"></x-field>
<x-field data-name="appId" data-type="string" data-required="true" data-desc="アプリケーション ID。これはメインコンポーネントの DID でもあります。"></x-field>
<x-field data-name="appPk" data-type="string" data-required="true" data-desc="アプリケーションに関連付けられた公開鍵。"></x-field>
<x-field data-name="appIds" data-type="string[]" data-required="false" data-desc="関連付けられたアプリケーション ID のリスト。Federated Login Group で使用されます。"></x-field>
<x-field data-name="appPid" data-type="string" data-required="true" data-desc="アプリケーションのプロセス ID。"></x-field>
<x-field data-name="appName" data-type="string" data-required="true" data-desc="人間が読める形式のアプリケーション名。"></x-field>
<x-field data-name="appDescription" data-type="string" data-required="true" data-desc="アプリケーションの簡単な説明。"></x-field>
<x-field data-name="appLogo" data-type="string" data-required="true" data-desc="アプリケーションのロゴ (正方形) への URL。"></x-field>
<x-field data-name="appLogoRect" data-type="string" data-required="true" data-desc="アプリケーションのロゴ (長方形) への URL。"></x-field>
<x-field data-name="appUrl" data-type="string" data-required="true" data-desc="アプリケーションがホストされているプライマリ URL。"></x-field>
<x-field data-name="domainAliases" data-type="string[]" data-required="false" data-desc="アプリケーションの代替ドメイン名。"></x-field>
<x-field data-name="isComponent" data-type="boolean" data-required="true" data-desc="Blocklet が別の Blocklet のコンポーネントであるかどうかを示します。"></x-field>
<x-field data-name="prefix" data-type="string" data-required="true" data-desc="Blocklet のルートの URL プレフィックス。"></x-field>
<x-field data-name="groupPrefix" data-type="string" data-required="true" data-desc="Federated Login Group の URL プレフィックス。"></x-field>
<x-field data-name="pageGroup" data-type="string" data-required="true" data-desc="このページが属するグループ。"></x-field>
<x-field data-name="version" data-type="string" data-required="true" data-desc="Blocklet のバージョン。"></x-field>
<x-field data-name="mode" data-type="string" data-required="true" data-desc="Blocklet の実行モード (例: 'development'、'production')。"></x-field>
<x-field data-name="tenantMode" data-type="'single' | 'multiple'" data-required="true" data-desc="Blocklet のテナンシーモード。"></x-field>
<x-field data-name="theme" data-type="BlockletTheme" data-required="true" data-desc="Blocklet のテーマ構成。"></x-field>
<x-field data-name="navigation" data-type="BlockletNavigation[]" data-required="true" data-desc="Blocklet の UI のナビゲーション項目の配列。"></x-field>
<x-field data-name="preferences" data-type="Record<string, any>" data-required="true" data-desc="ユーザーが設定可能な設定。"></x-field>
<x-field data-name="languages" data-type="{ code: string; name: string }[]" data-required="true" data-desc="サポートされている言語のリスト。"></x-field>
<x-field data-name="passportColor" data-type="string" data-required="true" data-desc="DID ウォレットパスポートで使用されるプライマリカラー。"></x-field>
<x-field data-name="componentMountPoints" data-type="BlockletComponent[]" data-required="true" data-desc="この Blocklet によってマウントされた子コンポーネントのリスト。"></x-field>
<x-field data-name="alsoKnownAs" data-type="string[]" data-required="true" data-desc="代替識別子のリスト。"></x-field>
<x-field data-name="trustedFactories" data-type="string[]" data-required="true" data-desc="信頼できるファクトリ DID のリスト。"></x-field>
<x-field data-name="status" data-type="string" data-required="true" data-desc="Blocklet の現在の実行ステータス。"></x-field>
<x-field data-name="serverDid" data-type="string" data-required="true" data-desc="Blocklet Server インスタンスの DID。"></x-field>
<x-field data-name="serverVersion" data-type="string" data-required="true" data-desc="Blocklet Server のバージョン。"></x-field>
<x-field data-name="componentId" data-type="string" data-required="true" data-desc="コンポーネントの ID。"></x-field>
<x-field data-name="webWalletUrl" data-type="string" data-required="true" data-desc="Web ベースの DID ウォレットの URL。"></x-field>
<x-field data-name="updatedAt" data-type="number" data-required="true" data-desc="最終更新のタイムスタンプ。"></x-field>
<x-field data-name="settings" data-type="BlockletSettings" data-required="true" data-desc="Blocklet の詳細設定。"></x-field>
</x-field-group>

### BlockletSettings

セッション管理、Federated Login Group の構成、OAuth プロバイダーの詳細など、Blocklet のさまざまな設定が含まれています。

<x-field-group>
<x-field data-name="session" data-type="object" data-required="true" data-desc="セッション構成。">
  <x-field data-name="ttl" data-type="number" data-required="true" data-desc="セッションの有効期間 (秒)。"></x-field>
  <x-field data-name="cacheTtl" data-type="number" data-required="true" data-desc="キャッシュの有効期間 (秒)。"></x-field>
</x-field>
<x-field data-name="federated" data-type="object" data-required="true" data-desc="Federated Login Group の構成。">
  <x-field data-name="master" data-type="object" data-required="true" data-desc="グループ内のマスターアプリケーションに関する情報。">
    <x-field data-name="appId" data-type="string" data-required="true" data-desc="マスターアプリケーション ID。"></x-field>
    <x-field data-name="appPid" data-type="string" data-required="true" data-desc="マスターアプリケーションのプロセス ID。"></x-field>
    <x-field data-name="appName" data-type="string" data-required="true" data-desc="マスターアプリケーション名。"></x-field>
    <x-field data-name="appDescription" data-type="string" data-required="true" data-desc="マスターアプリケーションの説明。"></x-field>
    <x-field data-name="appUrl" data-type="string" data-required="true" data-desc="マスターアプリケーションの URL。"></x-field>
    <x-field data-name="appLogo" data-type="string" data-required="true" data-desc="マスターアプリケーションのロゴ URL。"></x-field>
    <x-field data-name="version" data-type="string" data-required="true" data-desc="マスターアプリケーションのバージョン。"></x-field>
  </x-field>
  <x-field data-name="config" data-type="Record<string, any>" data-required="true" data-desc="フェデレーテッドグループの追加構成。"></x-field>
</x-field>
<x-field data-name="oauth" data-type="Record<string, { enabled: boolean; [x: string]: any }>" data-required="true" data-desc="OAuth プロバイダー構成。プロバイダー名でキー付けされています。"></x-field>
</x-field-group>

### BlockletComponent

親 Blocklet 内にマウントされるコンポーネントを記述します。`TComponentInternalInfo` からプロパティを継承します。

<x-field-group>
<x-field data-name="status" data-type="keyof typeof BlockletStatus" data-required="true" data-desc="コンポーネントの実行ステータス (例: 'running'、'stopped')。"></x-field>
</x-field-group>

## ユーザーと認証の型

これらの型は、`AuthService` がユーザープロファイル、設定、および認証関連のデータを管理するために使用します。

### UserPublicInfo

ユーザーの基本的な公開プロファイル情報を表します。

<x-field-group>
<x-field data-name="avatar" data-type="string" data-required="true" data-desc="ユーザーのアバター画像の URL。"></x-field>
<x-field data-name="did" data-type="string" data-required="true" data-desc="ユーザーの分散型識別子 (DID)。"></x-field>
<x-field data-name="fullName" data-type="string" data-required="true" data-desc="ユーザーのフルネーム。"></x-field>
<x-field data-name="sourceAppPid" data-type="string | null" data-required="true" data-desc="該当する場合、ユーザーが由来するアプリケーションのプロセス ID。"></x-field>
</x-field-group>

### NotificationConfig

Webhook の構成や通知チャネルなど、ユーザーの通知設定を定義します。

<x-field-group>
<x-field data-name="webhooks" data-type="Webhook[]" data-required="false" data-desc="設定済みの Webhook の配列。"></x-field>
<x-field data-name="notifications" data-type="object" data-required="false" data-desc="チャネル固有の通知設定。">
  <x-field data-name="email" data-type="boolean" data-required="false" data-desc="メール通知を有効または無効にします。"></x-field>
  <x-field data-name="wallet" data-type="boolean" data-required="false" data-desc="DID ウォレット通知を有効または無効にします。"></x-field>
  <x-field data-name="phone" data-type="boolean" data-required="false" data-desc="電話通知を有効または無効にします。"></x-field>
</x-field>
</x-field-group>

### Webhook

単一の Webhook 構成の構造を定義します。

<x-field-group>
<x-field data-name="type" data-type="'slack' | 'api'" data-required="true" data-desc="Webhook エンドポイントのタイプ。"></x-field>
<x-field data-name="url" data-type="string" data-required="true" data-desc="Webhook 通知が送信される URL。"></x-field>
</x-field-group>

### PrivacyConfig

ユーザーのプライバシー設定を表すオブジェクト。キーは特定のプライバシーオプションに対応します。

<x-field-group>
<x-field data-name="[key]" data-type="boolean" data-required="true" data-desc="プライバシー設定を表す動的キー。ブール値で有効かどうかを示します。"></x-field>
</x-field-group>

### SpaceGateway

DID Space ゲートウェイのプロパティを定義します。

<x-field-group>
<x-field data-name="did" data-type="string" data-required="true" data-desc="スペースゲートウェイの DID。"></x-field>
<x-field data-name="name" data-type="string" data-required="true" data-desc="スペースゲートウェイの名前。"></x-field>
<x-field data-name="url" data-type="string" data-required="true" data-desc="スペースゲートウェイの公開 URL。"></x-field>
<x-field data-name="endpoint" data-type="string" data-required="true" data-desc="スペースゲートウェイの API エンドポイント。"></x-field>
</x-field-group>

## セッション管理の型

これらの型は、`UserSessionService` が異なるデバイスやアプリケーション間でユーザーのログインセッションを管理するために使用します。

### UserSession

デバイス、アプリケーション、およびユーザーに関する詳細を含む、単一のユーザーログインセッションを表します。

<x-field-group>
<x-field data-name="appName" data-type="string" data-required="true" data-desc="セッションのアプリケーション名。"></x-field>
<x-field data-name="appPid" data-type="string" data-required="true" data-desc="セッションのアプリケーションのプロセス ID。"></x-field>
<x-field data-name="extra" data-type="object" data-required="true" data-desc="セッションに関する追加のメタデータ。">
  <x-field data-name="walletOS" data-type="'android' | 'ios' | 'web'" data-required="true" data-desc="ログインに使用されたウォレットのオペレーティングシステム。"></x-field>
</x-field>
<x-field data-name="id" data-type="string" data-required="true" data-desc="セッションの一意の識別子。"></x-field>
<x-field data-name="lastLoginIp" data-type="string" data-required="true" data-desc="最後のログインの IP アドレス。"></x-field>
<x-field data-name="passportId" data-type="string | null" data-required="true" data-desc="ログインに使用されたパスポートの ID。"></x-field>
<x-field data-name="ua" data-type="string" data-required="true" data-desc="クライアントの User-Agent 文字列。"></x-field>
<x-field data-name="createdAt" data-type="string" data-required="false" data-desc="セッションが作成されたときの ISO 文字列のタイムスタンプ。"></x-field>
<x-field data-name="updatedAt" data-type="string" data-required="true" data-desc="最後のセッションアクティビティの ISO 文字列のタイムスタンプ。"></x-field>
<x-field data-name="status" data-type="string" data-required="false" data-desc="セッションの現在のステータス (例: 'online'、'expired')。"></x-field>
<x-field data-name="user" data-type="UserSessionUser" data-required="false" data-desc="セッションに関連付けられたユーザーの詳細情報。"></x-field>
<x-field data-name="userDid" data-type="string" data-required="true" data-desc="ユーザーの DID。"></x-field>
<x-field data-name="visitorId" data-type="string" data-required="true" data-desc="デバイス/ブラウザの一意の識別子。"></x-field>
</x-field-group>

### UserSessionUser

`UserSession` に関連付けられた詳細なユーザー情報が含まれています。

<x-field-group>
<x-field data-name="avatar" data-type="string" data-required="true" data-desc="ユーザーのアバター画像の URL。"></x-field>
<x-field data-name="did" data-type="string" data-required="true" data-desc="ユーザーの分散型識別子 (DID)。"></x-field>
<x-field data-name="email" data-type="string" data-required="true" data-desc="ユーザーのメールアドレス。"></x-field>
<x-field data-name="fullName" data-type="string" data-required="true" data-desc="ユーザーのフルネーム。"></x-field>
<x-field data-name="pk" data-type="string" data-required="true" data-desc="ユーザーの公開鍵。"></x-field>
<x-field data-name="remark" data-type="string" data-required="false" data-desc="ユーザーに関するオプションの備考またはメモ。"></x-field>
<x-field data-name="role" data-type="string" data-required="true" data-desc="ユーザーの役割 (例: 'owner'、'admin')。"></x-field>
<x-field data-name="roleTitle" data-type="string" data-required="true" data-desc="ユーザーの役割の表示タイトル。"></x-field>
<x-field data-name="sourceAppPid" data-type="string | null" data-required="true" data-desc="ユーザーが由来するアプリケーションのプロセス ID。"></x-field>
<x-field data-name="sourceProvider" data-type="'wallet' | 'auth0' | 'nft'" data-required="true" data-desc="認証に使用された元のプロバイダー。"></x-field>
</x-field-group>

### UserSessionList

ユーザーセッションのリストに対するページ分割されたレスポンスオブジェクト。

<x-field-group>
<x-field data-name="list" data-type="UserSession[]" data-required="true" data-desc="ユーザーセッションオブジェクトの配列。"></x-field>
<x-field data-name="paging" data-type="object" data-required="true" data-desc="ページネーション情報。">
  <x-field data-name="page" data-type="number" data-required="true" data-desc="現在のページ番号。"></x-field>
  <x-field data-name="pageSize" data-type="number" data-required="true" data-desc="1 ページあたりの項目数。"></x-field>
  <x-field data-name="total" data-type="number" data-required="true" data-desc="利用可能なセッションの総数。"></x-field>
</x-field>
</x-field-group>

## グローバルと環境の型

これらの型は、グローバルに利用可能なオブジェクトとサーバー環境の構成を定義します。

### ServerEnv

サーバー側の環境変数を表し、しばしば `window.env` としてクライアント側に公開されます。

<x-field-group>
<x-field data-name="appId" data-type="string" data-required="true" data-desc="アプリケーション ID。"></x-field>
<x-field data-name="appPid" data-type="string" data-required="true" data-desc="アプリケーションのプロセス ID。"></x-field>
<x-field data-name="appName" data-type="string" data-required="true" data-desc="アプリケーション名。"></x-field>
<x-field data-name="appDescription" data-type="string" data-required="true" data-desc="アプリケーションの説明。"></x-field>
<x-field data-name="apiPrefix" data-type="string" data-required="true" data-desc="バックエンド API ルートのプレフィックス。"></x-field>
<x-field data-name="baseUrl" data-type="string" data-required="true" data-desc="アプリケーションのベース URL。"></x-field>
</x-field-group>

### グローバル Window 宣言

SDK は、ブラウザ環境で実行される際に、`window` オブジェクトに特定のグローバル変数が存在することに依存しています。

```typescript TypeScript Definition icon=logos:typescript
declare global {
  interface Window {
    blocklet: Blocklet;
    env?: ServerEnv;
  }
}
```

## ユーティリティ型

API リクエストとトークン管理に使用されるヘルパー型。

### TokenResult

トークン更新操作の成功結果を表します。

<x-field-group>
<x-field data-name="nextToken" data-type="string" data-required="true" data-desc="新しいセッショントークン。"></x-field>
<x-field data-name="nextRefreshToken" data-type="string" data-required="true" data-desc="新しいリフレッシュトークン。"></x-field>
</x-field-group>

### RequestParams

SDK の API ヘルパーでリクエストを行う際に使用できる共通のパラメータを定義します。

<x-field-group>
<x-field data-name="lazy" data-type="boolean" data-required="false" data-desc="true の場合、リクエストはデバウンスまたは遅延されることがあります。"></x-field>
<x-field data-name="lazyTime" data-type="number" data-required="false" data-desc="遅延リクエストの遅延時間 (ミリ秒)。"></x-field>
<x-field data-name="componentDid" data-type="string" data-required="false" data-desc="リクエストの対象となるコンポーネントの DID。"></x-field>
</x-field-group>