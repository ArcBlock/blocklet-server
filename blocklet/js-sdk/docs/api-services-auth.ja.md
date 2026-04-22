# AuthService

`AuthService`は、ユーザーアカウントのあらゆる側面を管理するための包括的なAPIを提供します。ユーザープロファイル、プライバシーと通知設定、他のユーザーをフォローするなどのソーシャルインタラクション、ログアウトやアカウント削除などの重要な認証アクションを処理します。SDKインスタンスの`sdk.auth`を通じてアクセスできます。

このサービスは、[`TokenService`](./api-services-token.md)と密接に連携して認証状態を管理しますが、ほとんどの操作では低レベルのトークン処理を抽象化します。

## ユーザープロファイル管理

これらのメソッドを使用すると、ユーザープロファイルデータを取得、更新、管理できます。

### getProfile

現在認証されているユーザーの完全なプロファイルを取得します。

```javascript icon=logos:javascript
const profile = await sdk.auth.getProfile();
console.log(profile);
```

**戻り値**

<x-field data-name="profile" data-type="Promise<object>" data-desc="ユーザーのプロファイルオブジェクトに解決されるPromise。"></x-field>

**レスポンス例**

```json
{
  "did": "z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ",
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "avatar": "https://example.com/avatar.png",
  "bio": "Developer and enthusiast.",
  "metadata": {}
}
```

### saveProfile

現在認証されているユーザーのプロファイルを更新します。`locale`、`metadata`などのフィールドを更新できます。

**パラメータ**

<x-field-group>
  <x-field data-name="profileData" data-type="object" data-required="true" data-desc="更新するプロファイルフィールドを含むオブジェクト。">
    <x-field data-name="locale" data-type="string" data-required="false" data-desc="ユーザーの優先言語ロケール（例：「en」）。"></x-field>
    <x-field data-name="inviter" data-type="string" data-required="false" data-desc="現在のユーザーを招待したユーザーのDID。"></x-field>
    <x-field data-name="metadata" data-type="any" data-required="false" data-desc="カスタムユーザーデータを保存するためのオブジェクト。"></x-field>
    <x-field data-name="address" data-type="any" data-required="false" data-desc="ユーザーの住所情報。"></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const updatedProfile = await sdk.auth.saveProfile({
  metadata: { twitter: '@johndoe' },
  locale: 'en-US'
});
console.log('プロファイルが保存されました:', updatedProfile);
```

**戻り値**

<x-field data-name="updatedProfile" data-type="Promise<object>" data-desc="更新されたプロファイルオブジェクトに解決されるPromise。"></x-field>

### getUserPublicInfo

DIDによって識別される任意のユーザーの公開情報を取得します。

**パラメータ**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="did" data-type="string" data-required="true" data-desc="ユーザーの分散型識別子（DID）。"></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const publicInfo = await sdk.auth.getUserPublicInfo({ did: 'z8ia...' });
console.log(publicInfo.fullName);
```

**戻り値**

<x-field data-name="UserPublicInfo" data-type="Promise<object>" data-desc="UserPublicInfoオブジェクトに解決されるPromise。">
  <x-field data-name="avatar" data-type="string" data-desc="ユーザーのアバターのURL。"></x-field>
  <x-field data-name="did" data-type="string" data-desc="ユーザーのDID。"></x-field>
  <x-field data-name="fullName" data-type="string" data-desc="ユーザーのフルネーム。"></x-field>
  <x-field data-name="sourceAppPid" data-type="string | null" data-desc="ソースアプリケーションのPID。"></x-field>
</x-field>

### refreshProfile

ユーザーのプロファイルを元のソースから強制的に同期し、データが最新であることを保証します。

```javascript icon=logos:javascript
await sdk.auth.refreshProfile();
console.log('プロファイルの更新が開始されました。');
```

**戻り値**

<x-field data-name="void" data-type="Promise<void>" data-desc="更新リクエストが送信されたときに解決されるPromise。"></x-field>

### updateDidSpace

ユーザーのDID Space設定を更新します。これにより、データがどこに保存されるかが決まります。

**パラメータ**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="spaceGateway" data-type="object" data-required="true" data-desc="新しいDID Spaceゲートウェイの詳細を含むオブジェクト。">
      <x-field data-name="did" data-type="string" data-required="true" data-desc="スペースのDID。"></x-field>
      <x-field data-name="name" data-type="string" data-required="true" data-desc="スペースの名前。"></x-field>
      <x-field data-name="url" data-type="string" data-required="true" data-desc="スペースのURL。"></x-field>
      <x-field data-name="endpoint" data-type="string" data-required="true" data-desc="スペースのAPIエンドポイント。"></x-field>
    </x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const spaceGateway = {
  did: 'zNK...',
  name: 'My Personal Space',
  url: 'https://space.example.com',
  endpoint: 'https://space.example.com/api'
};

await sdk.auth.updateDidSpace({ spaceGateway });
console.log('DID Spaceが正常に更新されました。');
```

**戻り値**

<x-field data-name="void" data-type="Promise<void>" data-desc="更新が成功したときに解決されるPromise。"></x-field>

### getProfileUrl

ユーザーの公開プロファイルページのURLを構築します。

**パラメータ**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="did" data-type="string" data-required="true" data-desc="ユーザーのDID。"></x-field>
    <x-field data-name="locale" data-type="string" data-required="true" data-desc="プロファイルページに希望するロケール。"></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const url = await sdk.auth.getProfileUrl({ did: 'z8ia...', locale: 'en' });
console.log('プロファイルURL:', url);
```

**戻り値**

<x-field data-name="url" data-type="Promise<string>" data-desc="完全なプロファイルURL文字列に解決されるPromise。"></x-field>

## 設定管理

プライバシーと通知に関するユーザー固有の設定を管理します。

### getUserPrivacyConfig

指定されたユーザーのプライバシー設定を取得します。

**パラメータ**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="did" data-type="string" data-required="true" data-desc="プライバシー設定が要求されているユーザーのDID。"></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const privacyConfig = await sdk.auth.getUserPrivacyConfig({ did: 'z8ia...' });
console.log('メールアドレスは公開されていますか？', privacyConfig.isEmailPublic);
```

**戻り値**

<x-field data-name="PrivacyConfig" data-type="Promise<object>" data-desc="ユーザーのPrivacyConfigオブジェクトに解決されるPromise。キーは設定名、値はブール値です。"></x-field>

### saveUserPrivacyConfig

現在認証されているユーザーのプライバシー設定を保存します。

**パラメータ**

<x-field-group>
  <x-field data-name="config" data-type="object" data-required="true" data-desc="プライバシー設定を表すキーと値のペアを持つオブジェクト。"></x-field>
</x-field-group>

```javascript icon=logos:javascript
const newConfig = { isEmailPublic: false, allowFriendRequests: false };
const savedConfig = await sdk.auth.saveUserPrivacyConfig(newConfig);
console.log('プライバシー設定が保存されました。');
```

**戻り値**

<x-field data-name="PrivacyConfig" data-type="Promise<object>" data-desc="保存されたPrivacyConfigオブジェクトに解決されるPromise。"></x-field>

### getUserNotificationConfig

Webhookやチャンネル設定を含む、現在のユーザーの通知設定を取得します。

```javascript icon=logos:javascript
const notificationConfig = await sdk.auth.getUserNotificationConfig();
console.log('Webhooks:', notificationConfig.webhooks);
```

**戻り値**

<x-field data-name="NotificationConfig" data-type="Promise<object>" data-desc="NotificationConfigオブジェクトに解決されるPromise。">
  <x-field data-name="webhooks" data-type="array" data-required="false">
    <x-field data-name="webhook" data-type="object">
      <x-field data-name="type" data-type="'slack' | 'api'" data-required="true"></x-field>
      <x-field data-name="url" data-type="string" data-required="true"></x-field>
    </x-field>
  </x-field>
  <x-field data-name="notifications" data-type="object" data-required="false">
    <x-field data-name="email" data-type="boolean" data-required="false"></x-field>
    <x-field data-name="wallet" data-type="boolean" data-required="false"></x-field>
    <x-field data-name="phone" data-type="boolean" data-required="false"></x-field>
  </x-field>
</x-field>

### saveUserNotificationConfig

現在のユーザーの新しい通知設定を保存します。

**パラメータ**

<x-field-group>
  <x-field data-name="config" data-type="object" data-required="true" data-desc="新しい通知設定オブジェクト。">
    <x-field data-name="webhooks" data-type="array" data-required="false">
      <x-field data-name="webhook" data-type="object">
        <x-field data-name="type" data-type="'slack' | 'api'" data-required="true"></x-field>
        <x-field data-name="url" data-type="string" data-required="true"></x-field>
      </x-field>
    </x-field>
    <x-field data-name="notifications" data-type="object" data-required="false">
      <x-field data-name="email" data-type="boolean" data-required="false"></x-field>
      <x-field data-name="wallet" data-type="boolean" data-required="false"></x-field>
      <x-field data-name="phone" data-type="boolean" data-required="false"></x-field>
    </x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const newConfig = {
  webhooks: [
    { type: 'api', url: 'https://example.com/webhook' }
  ],
  notifications: {
    email: true,
    wallet: false
  }
};
const savedConfig = await sdk.auth.saveUserNotificationConfig(newConfig);
console.log('通知設定が保存されました:', savedConfig);
```

**戻り値**

<x-field data-name="NotificationConfig" data-type="Promise<object>" data-desc="保存されたNotificationConfigオブジェクトに解決されるPromise。"></x-field>

### testNotificationWebhook

Webhook設定をテストして、テスト通知を受信できることを確認します。

**パラメータ**

<x-field-group>
  <x-field data-name="webhook" data-type="object" data-required="true" data-desc="テストするWebhookオブジェクト。">
    <x-field data-name="type" data-type="'slack' | 'api'" data-required="true"></x-field>
    <x-field data-name="url" data-type="string" data-required="true"></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const webhookToTest = {
  type: 'slack',
  url: 'https://hooks.slack.com/services/...'
};
const result = await sdk.auth.testNotificationWebhook(webhookToTest);
console.log('Webhookのテストに成功しました:', result.success);
```

**戻り値**

<x-field data-name="result" data-type="Promise<object>" data-desc="successプロパティを持つオブジェクトに解決されるPromise。">
  <x-field data-name="success" data-type="boolean" data-desc="テストが成功したかどうかを示します。"></x-field>
</x-field>

## ソーシャルインタラクション

ユーザー間のソーシャルなつながりを管理します。

### followUser

他のユーザーをフォローします。

**パラメータ**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="userDid" data-type="string" data-required="true" data-desc="フォローするユーザーのDID。"></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const userToFollow = 'z8ia...';
await sdk.auth.followUser({ userDid: userToFollow });
console.log(`${userToFollow}を正常にフォローしました。`);
```

**戻り値**

<x-field data-name="void" data-type="Promise<void>" data-desc="操作が完了したときに解決されるPromise。"></x-field>

### unfollowUser

ユーザーのフォローを解除します。

**パラメータ**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="userDid" data-type="string" data-required="true" data-desc="フォローを解除するユーザーのDID。"></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const userToUnfollow = 'z8ia...';
await sdk.auth.unfollowUser({ userDid: userToUnfollow });
console.log(`${userToUnfollow}のフォローを正常に解除しました。`);
```

**戻り値**

<x-field data-name="void" data-type="Promise<void>" data-desc="操作が完了したときに解決されるPromise。"></x-field>

### isFollowingUser

現在のユーザーが特定のユーザーをフォローしているかどうかを確認します。

**パラメータ**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="userDid" data-type="string" data-required="true" data-desc="確認するユーザーのDID。"></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const userToCheck = 'z8ia...';
const { isFollowing } = await sdk.auth.isFollowingUser({ userDid: userToCheck });
if (isFollowing) {
  console.log(`${userToCheck}をフォローしています。`);
} else {
  console.log(`${userToCheck}をフォローしていません。`);
}
```

**戻り値**

<x-field data-name="result" data-type="Promise<object>" data-desc="isFollowingプロパティを含むオブジェクトに解決されるPromise。">
  <x-field data-name="isFollowing" data-type="boolean" data-desc="現在のユーザーが指定されたユーザーをフォローしている場合はtrue。"></x-field>
</x-field>

## 認証とアカウントアクション

ユーザーのセッションとアカウントのライフサイクルに関連する重要なアクションを実行します。

### logout

現在のユーザーをログアウトします。特定のデバイスまたはすべてのセッションからログアウトするように設定できます。

**パラメータ**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="false">
    <x-field data-name="visitorId" data-type="string" data-required="false" data-desc="ログアウトする特定のデバイス/セッションのID。"></x-field>
    <x-field data-name="status" data-type="string" data-required="false" data-desc="ログアウトするセッションのステータス。"></x-field>
    <x-field data-name="includeFederated" data-type="boolean" data-required="false" data-desc="trueの場合、フェデレーションログイングループ内のすべてのアプリケーションからもログアウトします。"></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
// 現在のセッションから単純にログアウト
await sdk.auth.logout({});
console.log('正常にログアウトしました。');

// 特定のデバイスとすべてのフェデレーションアプリからログアウト
await sdk.auth.logout({ visitorId: 'some-visitor-id', includeFederated: true });
```

**戻り値**

<x-field data-name="void" data-type="Promise<void>" data-desc="ログアウトプロセスが完了したときに解決されるPromise。"></x-field>

### destroyMyself

現在認証されているユーザーのアカウントを完全に削除します。この操作は元に戻すことができず、細心の注意を払って使用する必要があります。

```javascript icon=logos:javascript
// これは破壊的な操作です。通常、ユーザーに確認を取ります。
try {
  const result = await sdk.auth.destroyMyself();
  console.log(`アカウント${result.did}は完全に削除されました。`);
} catch (error) {
  console.error('アカウントの削除に失敗しました:', error);
}
```

**戻り値**

<x-field data-name="result" data-type="Promise<object>" data-desc="削除されたユーザーのDIDを含むオブジェクトに解決されるPromise。">
  <x-field data-name="did" data-type="string" data-desc="削除されたユーザーのDID。"></x-field>
</x-field>