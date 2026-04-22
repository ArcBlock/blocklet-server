# UserSessionService

`UserSessionService`は、さまざまなデバイスやアプリケーションにわたるユーザーのログインセッションを取得および管理するためのAPIを提供します。このサービスは、ユーザーがアクティブなログイン場所を表示したり、どのアカウントにどのデバイスがアクセスしたかを確認したり、それらのセッションを管理したりできる機能を構築するために不可欠です。

このサービスの使用に関する実践的なガイドについては、[ユーザーセッションの管理](./guides-managing-user-sessions.md)ガイドを参照してください。

## メソッド

### getMyLoginSessions()

現在のユーザー自身のログインセッションのページ分割されたリストを取得します。

**パラメータ**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="設定オプションを含むオブジェクト。">
    <x-field data-name="appUrl" data-type="string" data-required="false" data-desc="クエリ対象のアプリケーションのベースURL。"></x-field>
  </x-field>
  <x-field data-name="params" data-type="UserSessionQuery" data-required="false" data-default="{ page: 1, pageSize: 10 }" data-desc="ページネーションとフィルタリングのためのオブジェクト。">
    <x-field data-name="page" data-type="number" data-required="true" data-desc="取得するページ番号。"></x-field>
    <x-field data-name="pageSize" data-type="number" data-required="true" data-desc="1ページあたりのアイテム数。"></x-field>
    <x-field data-name="status" data-type="'online' | 'expired' | 'offline'" data-required="false" data-desc="ステータスによってセッションをフィルタリングします。"></x-field>
  </x-field>
</x-field-group>

**戻り値**

<x-field data-name="Promise<UserSessionList>" data-type="Promise" data-desc="セッションのリストとページネーションの詳細を含むオブジェクトに解決されるPromise。"></x-field>

**例**

```javascript 自分のオンラインセッションを取得する icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

async function fetchMySessions() {
  try {
    const sessionData = await sdk.userSession.getMyLoginSessions(
      {},
      { page: 1, pageSize: 5, status: 'online' }
    );
    console.log('オンラインセッション:', sessionData.list);
    console.log('オンラインセッションの合計:', sessionData.paging.total);
  } catch (error) {
    console.error('セッションの取得に失敗しました:', error);
  }
}

fetchMySessions();
```

**レスポンス例**

```json
{
  "list": [
    {
      "id": "z8V...",
      "appName": "My Blocklet",
      "appPid": "my-blocklet-pid",
      "lastLoginIp": "192.168.1.1",
      "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...",
      "updatedAt": "2023-10-27T10:00:00.000Z",
      "status": "online",
      "userDid": "zNK..."
    }
  ],
  "paging": {
    "page": 1,
    "pageSize": 5,
    "total": 1
  }
}
```

### getUserSessions()

特定のユーザーDIDのすべてのログインセッションを取得します。このメソッドは通常、管理コンテキストで使用されます。

**パラメータ**

<x-field data-name="options" data-type="object" data-required="true" data-desc="ユーザーのDIDとオプションのアプリURLを含むオブジェクト。">
  <x-field data-name="did" data-type="string" data-required="true" data-desc="セッションを取得するユーザーのDID。"></x-field>
  <x-field data-name="appUrl" data-type="string" data-required="false" data-desc="クエリ対象のアプリケーションのベースURL。"></x-field>
</x-field>

**戻り値**

<x-field data-name="Promise<UserSession[]>" data-type="Promise" data-desc="UserSessionオブジェクトの配列に解決されるPromise。"></x-field>

**例**

```javascript 特定のユーザーのセッションを取得する icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

async function fetchUserSessions(userDid) {
  try {
    const sessions = await sdk.userSession.getUserSessions({ did: userDid });
    console.log(`ユーザー ${userDid} のセッション:`, sessions);
  } catch (error) {
    console.error('ユーザーセッションの取得に失敗しました:', error);
  }
}

fetchUserSessions('zNK...userDid...'); // 有効なユーザーDIDに置き換えてください
```

**レスポンス例**

```json
[
  {
    "id": "z8V...",
    "appName": "My Blocklet",
    "appPid": "my-blocklet-pid",
    "lastLoginIp": "192.168.1.1",
    "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...",
    "updatedAt": "2023-10-27T10:00:00.000Z",
    "status": "online",
    "userDid": "zNK..."
  }
]
```

### loginByUserSession()

既存のユーザーセッションIDに基づいて新しいログインを開始します。これは、関連アプリケーション間でのシームレスなサインインなどの機能に使用できます。

**パラメータ**

<x-field data-name="options" data-type="object" data-required="true" data-desc="ログインに必要なセッション詳細を含むオブジェクト。">
  <x-field data-name="id" data-type="string" data-required="true" data-desc="ログインに使用する既存のセッションのID。"></x-field>
  <x-field data-name="appPid" data-type="string" data-required="true" data-desc="ログインするアプリケーションのPID。"></x-field>
  <x-field data-name="userDid" data-type="string" data-required="true" data-desc="セッションに関連付けられているユーザーのDID。"></x-field>
  <x-field data-name="passportId" data-type="string" data-required="true" data-desc="ユーザーのパスポートのID。"></x-field>
  <x-field data-name="appUrl" data-type="string" data-required="false" data-desc="アプリケーションのベースURL。"></x-field>
</x-field>

**戻り値**

<x-field data-name="Promise<UserSession[]>" data-type="Promise" data-desc="新しいユーザーセッションを含む配列に解決されるPromise。"></x-field>

**例**

```javascript 既存のセッションでログインする icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

async function loginWithSession(sessionDetails) {
  try {
    const newSessions = await sdk.userSession.loginByUserSession(sessionDetails);
    console.log('新しいセッションで正常にログインしました:', newSessions[0]);
  } catch (error) {
    console.error('セッションによるログインに失敗しました:', error);
  }
}

const existingSession = {
  id: 'session_id_to_use',
  appPid: 'target_app_pid',
  userDid: 'zNK...userDid...',
  passportId: 'passport_id_string'
};

loginWithSession(existingSession);
```

## データ構造

以下は`UserSessionService`で使用される主要なデータ構造です。

### UserSession

特定のアプリケーションにおけるユーザーの単一のログインセッションを表します。

<x-field-group>
  <x-field data-name="id" data-type="string" data-required="true" data-desc="セッションの一意の識別子。"></x-field>
  <x-field data-name="appName" data-type="string" data-required="true" data-desc="セッションが開始されたアプリケーションの名前。"></x-field>
  <x-field data-name="appPid" data-type="string" data-required="true" data-desc="アプリケーションのPID。"></x-field>
  <x-field data-name="lastLoginIp" data-type="string" data-required="true" data-desc="このセッションで最後に確認されたIPアドレス。"></x-field>
  <x-field data-name="ua" data-type="string" data-required="true" data-desc="クライアントデバイスのUser-Agent文字列。"></x-field>
  <x-field data-name="createdAt" data-type="string" data-required="false" data-desc="セッションが作成されたときのタイムスタンプ。"></x-field>
  <x-field data-name="updatedAt" data-type="string" data-required="true" data-desc="このセッションの最後のアクティビティのタイムスタンプ。"></x-field>
  <x-field data-name="status" data-type="'online' | 'expired' | 'offline'" data-required="false" data-desc="セッションの現在のステータス。"></x-field>
  <x-field data-name="user" data-type="UserSessionUser" data-required="false" data-desc="ユーザーに関する詳細情報。"></x-field>
  <x-field data-name="userDid" data-type="string" data-required="true" data-desc="セッションを所有するユーザーのDID。"></x-field>
  <x-field data-name="visitorId" data-type="string" data-required="true" data-desc="訪問者/デバイスの識別子。"></x-field>
  <x-field data-name="passportId" data-type="string | null" data-required="true" data-desc="ユーザーのパスポートのID。"></x-field>
  <x-field data-name="extra" data-type="object" data-required="true" data-desc="追加のメタデータ。">
    <x-field data-name="walletOS" data-type="'android' | 'ios' | 'web'" data-required="true" data-desc="使用されたウォレットのオペレーティングシステム。"></x-field>
  </x-field>
</x-field-group>

### UserSessionUser

セッションに関連付けられたユーザーに関する詳細情報を含みます。

<x-field-group>
  <x-field data-name="did" data-type="string" data-required="true" data-desc="ユーザーの分散型識別子（DID）。"></x-field>
  <x-field data-name="fullName" data-type="string" data-required="true" data-desc="ユーザーのフルネーム。"></x-field>
  <x-field data-name="email" data-type="string" data-required="true" data-desc="ユーザーのメールアドレス。"></x-field>
  <x-field data-name="avatar" data-type="string" data-required="true" data-desc="ユーザーのアバター画像へのURL。"></x-field>
  <x-field data-name="pk" data-type="string" data-required="true" data-desc="ユーザーの公開鍵。"></x-field>
  <x-field data-name="role" data-type="string" data-required="true" data-desc="アプリケーション内でのユーザーの役割（例：「owner」、「admin」）。"></x-field>
  <x-field data-name="roleTitle" data-type="string" data-required="true" data-desc="ユーザーの役割の表示タイトル。"></x-field>
  <x-field data-name="sourceProvider" data-type="'wallet' | 'auth0' | 'nft'" data-required="true" data-desc="認証に使用されたプロバイダー。"></x-field>
  <x-field data-name="sourceAppPid" data-type="string | null" data-required="true" data-desc="ユーザーデータを供給したアプリケーションのPID。"></x-field>
  <x-field data-name="remark" data-type="string" data-required="false" data-desc="ユーザーに関する備考やメモ。"></x-field>
</x-field-group>

### UserSessionList

ユーザーセッションのページ分割されたリスト。

<x-field-group>
  <x-field data-name="list" data-type="UserSession[]" data-required="true" data-desc="ユーザーセッションオブジェクトの配列。"></x-field>
  <x-field data-name="paging" data-type="object" data-required="true" data-desc="ページネーションの詳細を含むオブジェクト。">
    <x-field data-name="page" data-type="number" data-required="true" data-desc="現在のページ番号。"></x-field>
    <x-field data-name="pageSize" data-type="number" data-required="true" data-desc="1ページあたりのアイテム数。"></x-field>
    <x-field data-name="total" data-type="number" data-required="true" data-desc="アイテムの総数。"></x-field>
  </x-field>
</x-field-group>

### UserSessionQuery

セッションクエリのフィルタリングとページネーションに使用されるオブジェクト。

<x-field-group>
  <x-field data-name="page" data-type="number" data-required="true" data-desc="取得するページ番号。"></x-field>
  <x-field data-name="pageSize" data-type="number" data-required="true" data-desc="1ページあたりのセッション数。"></x-field>
  <x-field data-name="status" data-type="'online' | 'expired' | 'offline'" data-required="false" data-desc="ステータスによってセッションをフィルタリングします。"></x-field>
</x-field-group>