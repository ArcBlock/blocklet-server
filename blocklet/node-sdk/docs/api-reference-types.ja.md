# 型定義

Blocklet SDKは、より堅牢で保守性の高いコードを書くのに役立つように、厳密に型付けされています。このセクションでは、ユーザーセッション、通知、イベント、ブロックレット設定を扱う際によく遭遇する最も一般的なTypeScriptの型とインターフェースのリファレンスを提供します。これらの型を理解することは、型の安全性を確保し、IDEのオートコンプリート機能を効果的に活用するのに役立ちます。

## セッションとユーザーの型

これらの型は、アプリケーション内でのユーザー認証とアイデンティティを管理するための基本です。

### SessionUser

`SessionUser`オブジェクトは、セッションミドルウェアによって`request`オブジェクト（`req.user`として）に添付されます。これには、現在ログインしているユーザーに関する重要な情報が含まれています。

```typescript SessionUser Type Definition icon=logos:typescript
export type SessionUser = {
  did: string;
  role: string | undefined;
  provider: string;
  fullName: string;
  walletOS: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  method?: AuthMethod;
  kyc?: number;
  [key: string]: any;
};
```

<x-field data-name="did" data-type="string" data-required="true" data-desc="ユーザーの分散型識別子（DID）。"></x-field>
<x-field data-name="role" data-type="string | undefined" data-required="false" data-desc="ユーザーに割り当てられた役割（例：「admin」、「owner」、「guest」）。"></x-field>
<x-field data-name="provider" data-type="string" data-required="true" data-desc="ログインに使用された認証プロバイダー（例：「wallet」）。"></x-field>
<x-field data-name="fullName" data-type="string" data-required="true" data-desc="ユーザーのフルネーム。"></x-field>
<x-field data-name="walletOS" data-type="string" data-required="true" data-desc="ユーザーのウォレットのオペレーティングシステム。"></x-field>
<x-field data-name="emailVerified" data-type="boolean" data-required="false" data-desc="ユーザーのメールアドレスが検証済みかどうかを示します。"></x-field>
<x-field data-name="phoneVerified" data-type="boolean" data-required="false" data-desc="ユーザーの電話番号が検証済みかどうかを示します。"></x-field>
<x-field data-name="method" data-type="AuthMethod" data-required="false" data-desc="使用された認証方法。一般的な値は「loginToken」、「componentCall」、「signedToken」、「accessKey」です。"></x-field>
<x-field data-name="kyc" data-type="number" data-required="false" data-desc="ユーザーのKYCステータスの数値表現。"></x-field>

### TUserInfo

`TUserInfo`型は、ユーザーのアイデンティティ、連絡先情報、ログイン履歴、および関連するセキュリティ資格情報を含む、ユーザープロファイルの包括的なビューを提供します。

<x-field data-name="did" data-type="string" data-required="true" data-desc="ユーザーの分散型識別子（DID）。"></x-field>
<x-field data-name="pk" data-type="string" data-required="true" data-desc="ユーザーの公開鍵。"></x-field>
<x-field data-name="role" data-type="string" data-required="true" data-desc="ユーザーの主要な役割。"></x-field>
<x-field data-name="avatar" data-type="string" data-required="true" data-desc="ユーザーのアバター画像のURL。"></x-field>
<x-field data-name="fullName" data-type="string" data-required="true" data-desc="ユーザーのフルネーム。"></x-field>
<x-field data-name="email" data-type="string" data-required="true" data-desc="ユーザーのメールアドレス。"></x-field>
<x-field data-name="approved" data-type="boolean" data-required="true" data-desc="ユーザーアカウントが承認されたかどうかを示します。"></x-field>
<x-field data-name="createdAt" data-type="number" data-required="true" data-desc="ユーザーが作成されたときのタイムスタンプ。"></x-field>
<x-field data-name="lastLoginAt" data-type="number" data-required="true" data-desc="ユーザーの最終ログイン時のタイムスタンプ。"></x-field>
<x-field data-name="passports" data-type="TPassport[]" data-required="true" data-desc="ユーザーに発行されたパスポートの配列。"></x-field>
<x-field data-name="connectedAccounts" data-type="TConnectedAccount[]" data-required="true" data-desc="ユーザーのプロファイルにリンクされた外部アカウントのリスト。"></x-field>


## 通知の型

[通知サービス](./services-notification-service.md)を使用する場合、これらの型を使用してメッセージを構築し、ユーザーに送信します。

### TNotification

これは通知を定義するための主要なインターフェースです。通知のコンテンツ、外観、および動作を制御するために必要なすべてのフィールドが含まれています。

<x-field data-name="id" data-type="string" data-required="false" data-desc="通知の一意の識別子。"></x-field>
<x-field data-name="title" data-type="string" data-required="false" data-desc="通知のメインタイトル。"></x-field>
<x-field data-name="body" data-type="string" data-required="false" data-desc="通知の主要なコンテンツまたはメッセージ。"></x-field>
<x-field data-name="type" data-type="'notification' | 'connect' | 'feed' | 'hi' | 'passthrough'" data-required="false" data-desc="通知のタイプ。これはその処理と表示に影響を与える可能性があります。"></x-field>
<x-field data-name="severity" data-type="'normal' | 'success' | 'error' | 'warning'" data-required="false" data-desc="重要度レベル。通知を色分けするためによく使用されます。"></x-field>
<x-field data-name="actions" data-type="TNotificationAction[]" data-required="false" data-desc="通知に含めるインタラクティブなアクションボタンの配列。"></x-field>
<x-field data-name="attachments" data-type="TNotificationAttachment[]" data-required="false" data-desc="画像、テキストブロック、リンクなどのリッチコンテンツ添付ファイルの配列。"></x-field>
<x-field data-name="activity" data-type="TNotificationActivity" data-required="false" data-desc="コメントやフォローなど、通知をトリガーしたソーシャルアクティビティを記述します。"></x-field>
<x-field data-name="url" data-type="string" data-required="false" data-desc="通知がクリックされたときにナビゲートするURL。"></x-field>


### TNotificationAttachment

添付ファイルを使用すると、通知にリッチで構造化されたコンテンツを追加できます。

<x-field data-name="type" data-type="'asset' | 'vc' | 'token' | 'text' | 'image' | 'divider' | 'transaction' | 'dapp' | 'link' | 'section'" data-required="true" data-desc="表示するコンテンツのタイプ。"></x-field>
<x-field data-name="data" data-type="any" data-required="false" data-desc="添付ファイルのデータペイロード。タイプによって異なります。例えば、「image」タイプにはurlプロパティを持つオブジェクトが含まれます。"></x-field>
<x-field data-name="fields" data-type="any" data-required="false" data-desc="添付ファイル内に表示する追加フィールド。「section」タイプでよく使用されます。"></x-field>

**例：画像添付ファイル**
```json
{
  "type": "image",
  "data": {
    "url": "https://path.to/your/image.png",
    "alt": "Descriptive text for the image"
  }
}
```

### TNotificationAction

アクションは通知に追加できるインタラクティブなボタンで、ユーザーが直接応答できるようにします。

<x-field data-name="name" data-type="string" data-required="true" data-desc="アクションの名前。識別子としてよく使用されます。"></x-field>
<x-field data-name="title" data-type="string" data-required="false" data-desc="ボタンに表示されるテキスト。指定されていない場合はnameがデフォルトになります。"></x-field>
<x-field data-name="link" data-type="string" data-required="false" data-desc="ボタンがクリックされたときにナビゲートするURL。"></x-field>
<x-field data-name="color" data-type="string" data-required="false" data-desc="ボタンのテキストの色。"></x-field>
<x-field data-name="bgColor" data-type="string" data-required="false" data-desc="ボタンの背景色。"></x-field>


## イベントの型

イベントバスを使用する場合、イベントは`TEvent`インターフェースを使用して構造化されます。

### TEvent

このインターフェースは、Blockletエコシステム内で発行および消費されるイベントの構造を定義します。

<x-field data-name="id" data-type="string" data-required="true" data-desc="イベントインスタンスの一意の識別子。"></x-field>
<x-field data-name="type" data-type="string" data-required="true" data-desc="イベントタイプの名前（例：「user:created」、「post:published」）。"></x-field>
<x-field data-name="time" data-type="Date" data-required="true" data-desc="イベントが発生したときのタイムスタンプ。"></x-field>
<x-field data-name="source" data-type="unknown" data-required="true" data-desc="イベントのソースまたは発信元。"></x-field>
<x-field data-name="spec_version" data-type="string" data-required="true" data-desc="CloudEvents仕様のバージョン。"></x-field>
<x-field data-name="object_id" data-type="string" data-required="false" data-desc="イベントが関連するオブジェクトのID。"></x-field>
<x-field data-name="object_type" data-type="string" data-required="false" data-desc="イベントが関連するオブジェクトのタイプ。"></x-field>
<x-field data-name="data" data-type="object" data-required="true" data-desc="イベントのペイロード。何が起こったかの詳細が含まれます。"></x-field>

## 設定と状態の型

これらの型は、ブロックレットの設定オブジェクトと状態情報の構造を定義します。

### WindowBlocklet

クライアントサイドでは、`window.blocklet`オブジェクトが実行中のブロックレットに関する重要なコンテキストを提供します。このオブジェクトは`WindowBlocklet`として型付けされています。

<x-field data-name="did" data-type="string" data-required="true" data-desc="ブロックレットインスタンスのDID。"></x-field>
<x-field data-name="appId" data-type="string" data-required="true" data-desc="アプリケーションID。"></x-field>
<x-field data-name="appName" data-type="string" data-required="true" data-desc="アプリケーションの表示名。"></x-field>
<x-field data-name="appUrl" data-type="string" data-required="true" data-desc="アプリケーションの公開URL。"></x-field>
<x-field data-name="webWalletUrl" data-type="string" data-required="true" data-desc="関連付けられたウェブウォレットのURL。"></x-field>
<x-field data-name="isComponent" data-type="boolean" data-required="true" data-desc="ブロックレットが別のブロックレットのコンポーネントとして実行されている場合はtrue。"></x-field>
<x-field data-name="prefix" data-type="string" data-required="true" data-desc="ブロックレットのルートのURLプレフィックス。"></x-field>
<x-field data-name="theme" data-type="TTheme" data-required="true" data-desc="UIの現在のテーマ設定。"></x-field>
<x-field data-name="navigation" data-type="TNavigationItem[]" data-required="true" data-desc="アプリケーションメニューのナビゲーション項目の配列。"></x-field>


### TBlockletState

この型は、サーバー上のブロックレットインスタンスの完全な状態を表します。これには、メタデータ、ステータス、設定、および他のコンポーネントとの関係が含まれます。

<x-field data-name="meta" data-type="TBlockletMeta" data-required="false" data-desc="ブロックレットのメタデータ。そのblocklet.ymlファイルから取得されます。"></x-field>
<x-field data-name="status" data-type="enum_pb.BlockletStatusMap" data-required="true" data-desc="ブロックレットの現在の実行ステータス（例：「running」、「stopped」）。"></x-field>
<x-field data-name="port" data-type="number" data-required="true" data-desc="ブロックレットが実行されているポート。"></x-field>
<x-field data-name="appDid" data-type="string" data-required="true" data-desc="ブロックレットインスタンスのDID。"></x-field>
<x-field data-name="children" data-type="TComponentState[]" data-required="true" data-desc="このブロックレットが子を持つ場合のコンポーネント状態の配列。"></x-field>
<x-field data-name="settings" data-type="TBlockletSettings" data-required="false" data-desc="ユーザーが設定したブロックレットの設定。"></x-field>
<x-field data-name="environments" data-type="TConfigEntry[]" data-required="true" data-desc="ブロックレットに設定された環境変数のリスト。"></x-field>