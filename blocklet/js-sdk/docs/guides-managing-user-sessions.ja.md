# ユーザーセッションの管理

`@blocklet/js-sdk`は`UserSessionService`を提供し、異なるデバイス間でのユーザーのログインセッションの取得と管理を支援します。これは、「セキュリティ」や「デバイス」ページのような機能を構築する際に特に便利で、ユーザーはすべてのアクティブなセッションを確認し、自分のアカウントがどこで使用されているかを理解できます。

このガイドでは、ユーザーセッションを管理するための一般的なユースケースを説明します。

### UserSessionServiceへのアクセス

まず、Blocklet SDKのインスタンスを取得します。`UserSessionService`は`userSession`プロパティの下で利用可能です。

```javascript SDKの初期化 icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();
const userSessionService = sdk.userSession;
```

## 自分のログインセッションの取得

最も一般的なタスクは、現在認証されているユーザーのセッションリストを取得することです。`getMyLoginSessions`メソッドを使用すると、ページネーションとフィルタリングをサポートしてこれを実行できます。

```javascript 現在のユーザーのセッションを取得する icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

async function fetchMySessions() {
  try {
    const sdk = getBlockletSDK();
    // オンラインセッションの最初のページ（10件）を取得する
    const result = await sdk.userSession.getMyLoginSessions({}, {
      page: 1,
      pageSize: 10,
      status: 'online', // オプションのフィルター: 'online' | 'expired' | 'offline'
    });

    console.log(`Total online sessions: ${result.paging.total}`);
    result.list.forEach(session => {
      console.log(`- Session on ${session.ua} last active at ${session.updatedAt}`);
    });
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
  }
}

fetchMySessions();
```

### パラメータ

メソッドのシグネチャは`getMyLoginSessions({ appUrl?: string }, params: UserSessionQuery)`です。2番目の引数は、以下のパラメータを持つクエリオブジェクトです。

<x-field-group>
  <x-field data-name="page" data-type="number" data-default="1" data-desc="取得するページ番号。"></x-field>
  <x-field data-name="pageSize" data-type="number" data-default="10" data-desc="ページあたりのセッション数。"></x-field>
  <x-field data-name="status" data-type="'online' | 'expired' | 'offline'" data-required="false" data-desc="現在のステータスでセッションをフィルタリングします。"></x-field>
</x-field-group>

### レスポンス

このメソッドは、`UserSessionList`オブジェクトに解決されるプロミスを返します。

<x-field data-name="" data-type="object" data-desc="セッションリストとページネーションの詳細を含むレスポンスオブジェクト。">
  <x-field data-name="list" data-type="UserSession[]" data-desc="ユーザーセッションオブジェクトの配列。">
    <x-field data-name="" data-type="object" data-desc="単一のユーザーセッションオブジェクト。">
      <x-field data-name="id" data-type="string" data-desc="セッションの一意の識別子。"></x-field>
      <x-field data-name="appName" data-type="string" data-desc="セッションが作成されたアプリケーションの名前。"></x-field>
      <x-field data-name="appPid" data-type="string" data-desc="アプリケーションのBlocklet PID。"></x-field>
      <x-field data-name="lastLoginIp" data-type="string" data-desc="このセッションの最後に確認されたIPアドレス。"></x-field>
      <x-field data-name="ua" data-type="string" data-desc="クライアントデバイスのUser-Agent文字列。"></x-field>
      <x-field data-name="updatedAt" data-type="string" data-desc="最終アクティビティのタイムスタンプ。"></x-field>
      <x-field data-name="status" data-type="string" data-desc="セッションの現在のステータス（例：「online」）。"></x-field>
      <x-field data-name="userDid" data-type="string" data-desc="セッションに関連付けられたユーザーのDID。"></x-field>
    </x-field>
  </x-field>
  <x-field data-name="paging" data-type="object" data-desc="ページネーション情報。">
    <x-field data-name="page" data-type="number" data-desc="現在のページ番号。"></x-field>
    <x-field data-name="pageSize" data-type="number" data-desc="ページあたりのアイテム数。"></x-field>
    <x-field data-name="total" data-type="number" data-desc="クエリに一致するセッションの総数。"></x-field>
  </x-field>
</x-field>


## 特定のユーザーのセッションの取得

管理者ダッシュボードのような場合、現在ログインしているユーザー以外のユーザーのログインセッションを取得する必要があるかもしれません。`getUserSessions`メソッドを使用すると、ユーザーのDIDを提供することでこれを実行できます。

```javascript 特定のDIDのセッションを取得する icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

async function fetchUserSessions(userDid) {
  try {
    const sdk = getBlockletSDK();
    const sessions = await sdk.userSession.getUserSessions({ did: userDid });

    console.log(`Found ${sessions.length} sessions for user ${userDid}:`);
    sessions.forEach(session => {
      console.log(`- Session ID: ${session.id}, App: ${session.appName}`);
    });
  } catch (error) {
    console.error(`Failed to fetch sessions for user ${userDid}:`, error);
  }
}

// 対象ユーザーのDIDに置き換えてください
fetchUserSessions('zNK...some...user...did');
```

### パラメータ

<x-field-group>
  <x-field data-name="did" data-type="string" data-required="true" data-desc="セッションを取得する対象ユーザーのDID。"></x-field>
  <x-field data-name="appUrl" data-type="string" data-required="false" data-desc="アプリケーションのベースURL。デフォルトは現在のBlockletのサービスURLです。"></x-field>
</x-field-group>

### レスポンス

このメソッドは、`UserSession`オブジェクトの配列に解決されるプロミスを返します。

<x-field data-name="" data-type="UserSession[]" data-desc="指定されたユーザーのユーザーセッションオブジェクトの配列。">
  <x-field data-name="" data-type="object" data-desc="単一のユーザーセッションオブジェクト。">
    <x-field data-name="id" data-type="string" data-desc="セッションの一意の識別子。"></x-field>
    <x-field data-name="appName" data-type="string" data-desc="セッションが作成されたアプリケーションの名前。"></x-field>
    <x-field data-name="appPid" data-type="string" data-desc="アプリケーションのBlocklet PID。"></x-field>
    <x-field data-name="ua" data-type="string" data-desc="クライアントデバイスのUser-Agent文字列。"></x-field>
    <x-field data-name="updatedAt" data-type="string" data-desc="最終アクティビティのタイムスタンプ。"></x-field>
    <x-field data-name="status" data-type="string" data-desc="セッションの現在のステータス。"></x-field>
    <x-field data-name="userDid" data-type="string" data-desc="セッションに関連付けられたユーザーのDID。"></x-field>
  </x-field>
</x-field>

---

このガイドでは、SDKを使用してユーザーセッション情報を取得する主な方法について説明しました。利用可能なすべてのメソッドと詳細な型定義の完全なリストについては、[UserSessionService APIリファレンス](./api-services-user-session.md)を参照してください。