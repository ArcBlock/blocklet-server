# AuthService

`AuthService` 提供了一個全面的 API，用於管理使用者帳戶的各個方面。它處理使用者個人資料、隱私和通知設定、追蹤其他使用者等社交互動，以及登出和刪除帳戶等關鍵的身份驗證操作。您可以透過 SDK 實例中的 `sdk.auth` 來存取它。

此服務與 [`TokenService`](./api-services-token.md) 密切合作以管理身份驗證狀態，但在大多數操作中抽象化了底層的權杖處理。

## 使用者個人資料管理

這些方法允許您獲取、更新和管理使用者個人資料。

### getProfile

擷取當前已驗證使用者的完整個人資料。

```javascript icon=logos:javascript
const profile = await sdk.auth.getProfile();
console.log(profile);
```

**返回**

<x-field data-name="profile" data-type="Promise<object>" data-desc="一個解析為使用者個人資料物件的 Promise。"></x-field>

**回應範例**

```json
{
  "did": "z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ",
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "avatar": "https://example.com/avatar.png",
  "bio": "開發者和愛好者。",
  "metadata": {}
}
```

### saveProfile

更新當前已驗證使用者的個人資料。您可以更新 `locale`、`metadata` 等欄位。

**參數**

<x-field-group>
  <x-field data-name="profileData" data-type="object" data-required="true" data-desc="一個包含要更新的個人資料欄位的物件。">
    <x-field data-name="locale" data-type="string" data-required="false" data-desc="使用者的偏好語言地區設定（例如：'en'）。"></x-field>
    <x-field data-name="inviter" data-type="string" data-required="false" data-desc="邀請當前使用者的使用者 DID。"></x-field>
    <x-field data-name="metadata" data-type="any" data-required="false" data-desc="一個用於儲存自訂使用者資料的物件。"></x-field>
    <x-field data-name="address" data-type="any" data-required="false" data-desc="使用者的地址資訊。"></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const updatedProfile = await sdk.auth.saveProfile({
  metadata: { twitter: '@johndoe' },
  locale: 'en-US'
});
console.log('個人資料已儲存：', updatedProfile);
```

**返回**

<x-field data-name="updatedProfile" data-type="Promise<object>" data-desc="一個解析為已更新個人資料物件的 Promise。"></x-field>

### getUserPublicInfo

透過 DID 獲取任何使用者的公開可用資訊。

**參數**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="did" data-type="string" data-required="true" data-desc="使用者的去中心化識別碼（DID）。"></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const publicInfo = await sdk.auth.getUserPublicInfo({ did: 'z8ia...' });
console.log(publicInfo.fullName);
```

**返回**

<x-field data-name="UserPublicInfo" data-type="Promise<object>" data-desc="一個解析為 UserPublicInfo 物件的 Promise。">
  <x-field data-name="avatar" data-type="string" data-desc="使用者頭像的 URL。"></x-field>
  <x-field data-name="did" data-type="string" data-desc="使用者的 DID。"></x-field>
  <x-field data-name="fullName" data-type="string" data-desc="使用者的全名。"></x-field>
  <x-field data-name="sourceAppPid" data-type="string | null" data-desc="來源應用程式的 PID。"></x-field>
</x-field>

### refreshProfile

強制從原始來源同步使用者個人資料，確保資料是最新的。

```javascript icon=logos:javascript
await sdk.auth.refreshProfile();
console.log('已啟動個人資料刷新。');
```

**返回**

<x-field data-name="void" data-type="Promise<void>" data-desc="一個在刷新請求已發送時解析的 Promise。"></x-field>

### updateDidSpace

更新使用者的 DID Space 設定，這決定了他們的資料儲存在哪裡。

**參數**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="spaceGateway" data-type="object" data-required="true" data-desc="一個包含新 DID Space 閘道詳細資訊的物件。">
      <x-field data-name="did" data-type="string" data-required="true" data-desc="空間的 DID。"></x-field>
      <x-field data-name="name" data-type="string" data-required="true" data-desc="空間的名稱。"></x-field>
      <x-field data-name="url" data-type="string" data-required="true" data-desc="空間的 URL。"></x-field>
      <x-field data-name="endpoint" data-type="string" data-required="true" data-desc="空間的 API 端點。"></x-field>
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
console.log('DID Space 更新成功。');
```

**返回**

<x-field data-name="void" data-type="Promise<void>" data-desc="一個在成功更新後解析的 Promise。"></x-field>

### getProfileUrl

為使用者的公開個人資料頁面建構 URL。

**參數**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="did" data-type="string" data-required="true" data-desc="使用者的 DID。"></x-field>
    <x-field data-name="locale" data-type="string" data-required="true" data-desc="個人資料頁面的目標地區設定。"></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const url = await sdk.auth.getProfileUrl({ did: 'z8ia...', locale: 'en' });
console.log('個人資料 URL：', url);
```

**返回**

<x-field data-name="url" data-type="Promise<string>" data-desc="一個解析為完整個人資料 URL 字串的 Promise。"></x-field>

## 設定管理

管理使用者特定的隱私和通知設定。

### getUserPrivacyConfig

擷取指定使用者的隱私設定。

**參數**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="did" data-type="string" data-required="true" data-desc="正在請求其隱私設定的使用者 DID。"></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const privacyConfig = await sdk.auth.getUserPrivacyConfig({ did: 'z8ia...' });
console.log('電子郵件是否公開？', privacyConfig.isEmailPublic);
```

**返回**

<x-field data-name="PrivacyConfig" data-type="Promise<object>" data-desc="一個解析為使用者 PrivacyConfig 物件的 Promise，其中鍵是設定名稱，值是布林值。"></x-field>

### saveUserPrivacyConfig

儲存當前已驗證使用者的隱私設定。

**參數**

<x-field-group>
  <x-field data-name="config" data-type="object" data-required="true" data-desc="一個帶有鍵值對的物件，代表隱私設定。"></x-field>
</x-field-group>

```javascript icon=logos:javascript
const newConfig = { isEmailPublic: false, allowFriendRequests: false };
const savedConfig = await sdk.auth.saveUserPrivacyConfig(newConfig);
console.log('隱私設定已儲存。');
```

**返回**

<x-field data-name="PrivacyConfig" data-type="Promise<object>" data-desc="一個解析為已儲存 PrivacyConfig 物件的 Promise。"></x-field>

### getUserNotificationConfig

獲取當前使用者的通知設定，包括 webhooks 和頻道偏好。

```javascript icon=logos:javascript
const notificationConfig = await sdk.auth.getUserNotificationConfig();
console.log('Webhooks:', notificationConfig.webhooks);
```

**返回**

<x-field data-name="NotificationConfig" data-type="Promise<object>" data-desc="一個解析為 NotificationConfig 物件的 Promise。">
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

為當前使用者儲存新的通知設定。

**參數**

<x-field-group>
  <x-field data-name="config" data-type="object" data-required="true" data-desc="新的通知設定物件。">
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
console.log('通知設定已儲存：', savedConfig);
```

**返回**

<x-field data-name="NotificationConfig" data-type="Promise<object>" data-desc="一個解析為已儲存 NotificationConfig 物件的 Promise。"></x-field>

### testNotificationWebhook

測試 webhook 設定以確保它可以接收測試通知。

**參數**

<x-field-group>
  <x-field data-name="webhook" data-type="object" data-required="true" data-desc="要測試的 webhook 物件。">
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
console.log('Webhook 測試成功：', result.success);
```

**返回**

<x-field data-name="result" data-type="Promise<object>" data-desc="一個解析為帶有 success 屬性的物件的 Promise。">
  <x-field data-name="success" data-type="boolean" data-desc="指示測試是否成功。"></x-field>
</x-field>

## 社交互動

管理使用者之間的社交聯繫。

### followUser

追蹤另一位使用者。

**參數**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="userDid" data-type="string" data-required="true" data-desc="要追蹤的使用者 DID。"></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const userToFollow = 'z8ia...';
await sdk.auth.followUser({ userDid: userToFollow });
console.log(`成功追蹤 ${userToFollow}。`);
```

**返回**

<x-field data-name="void" data-type="Promise<void>" data-desc="一個在操作完成後解析的 Promise。"></x-field>

### unfollowUser

取消追蹤使用者。

**參數**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="userDid" data-type="string" data-required="true" data-desc="要取消追蹤的使用者 DID。"></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const userToUnfollow = 'z8ia...';
await sdk.auth.unfollowUser({ userDid: userToUnfollow });
console.log(`成功取消追蹤 ${userToUnfollow}。`);
```

**返回**

<x-field data-name="void" data-type="Promise<void>" data-desc="一個在操作完成後解析的 Promise。"></x-field>

### isFollowingUser

檢查當前使用者是否正在追蹤特定使用者。

**參數**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="userDid" data-type="string" data-required="true" data-desc="要檢查的使用者 DID。"></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const userToCheck = 'z8ia...';
const { isFollowing } = await sdk.auth.isFollowingUser({ userDid: userToCheck });
if (isFollowing) {
  console.log(`您正在追蹤 ${userToCheck}。`);
} else {
  console.log(`您沒有追蹤 ${userToCheck}。`);
}
```

**返回**

<x-field data-name="result" data-type="Promise<object>" data-desc="一個解析為包含 isFollowing 屬性的物件的 Promise。">
  <x-field data-name="isFollowing" data-type="boolean" data-desc="如果當前使用者正在追蹤指定使用者，則為 true。"></x-field>
</x-field>

## 身份驗證與帳戶操作

執行與使用者會話和帳戶生命週期相關的關鍵操作。

### logout

將當前使用者登出。可以設定為從特定設備或所有會話登出。

**參數**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="false">
    <x-field data-name="visitorId" data-type="string" data-required="false" data-desc="要登出的特定設備/會話的 ID。"></x-field>
    <x-field data-name="status" data-type="string" data-required="false" data-desc="要登出的會話狀態。"></x-field>
    <x-field data-name="includeFederated" data-type="boolean" data-required="false" data-desc="如果為 true，也會從聯邦登入群組中的所有應用程式登出。"></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
// 從當前會話簡單登出
await sdk.auth.logout({});
console.log('登出成功。');

// 從特定設備和所有聯邦應用程式登出
await sdk.auth.logout({ visitorId: 'some-visitor-id', includeFederated: true });
```

**返回**

<x-field data-name="void" data-type="Promise<void>" data-desc="一個在登出過程完成後解析的 Promise。"></x-field>

### destroyMyself

永久刪除當前已驗證使用者的帳戶。此操作不可逆，應極其謹慎使用。

```javascript icon=logos:javascript
// 這是一個破壞性操作。通常，您需要與使用者確認此操作。
try {
  const result = await sdk.auth.destroyMyself();
  console.log(`帳戶 ${result.did} 已被永久刪除。`);
} catch (error) {
  console.error('刪除帳戶失敗：', error);
}
```

**返回**

<x-field data-name="result" data-type="Promise<object>" data-desc="一個解析為包含已刪除使用者 DID 的物件的 Promise。">
  <x-field data-name="did" data-type="string" data-desc="已刪除使用者的 DID。"></x-field>
</x-field>