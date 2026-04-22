# AuthService

`AuthService` 提供了一个全面的 API，用于管理用户账户的各个方面。它处理用户个人资料、隐私和通知设置、关注其他用户等社交互动，以及注销和删除账户等关键身份验证操作。您可以通过 SDK 实例的 `sdk.auth` 访问它。

该服务与 [`TokenService`](./api-services-token.md) 紧密合作以管理身份验证状态，但在大多数操作中抽象了底层的令牌处理。

## 用户个人资料管理

这些方法允许您获取、更新和管理用户个人资料数据。

### getProfile

检索当前已验证用户的完整个人资料。

```javascript icon=logos:javascript
const profile = await sdk.auth.getProfile();
console.log(profile);
```

**返回**

<x-field data-name="profile" data-type="Promise<object>" data-desc="一个解析为用户个人资料对象的 promise。"></x-field>

**响应示例**

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

更新当前已验证用户的个人资料。您可以更新 `locale`、`metadata` 等字段。

**参数**

<x-field-group>
  <x-field data-name="profileData" data-type="object" data-required="true" data-desc="一个包含要更新的个人资料字段的对象。">
    <x-field data-name="locale" data-type="string" data-required="false" data-desc="用户的首选语言区域设置（例如 'en'）。"></x-field>
    <x-field data-name="inviter" data-type="string" data-required="false" data-desc="邀请当前用户的用户的 DID。"></x-field>
    <x-field data-name="metadata" data-type="any" data-required="false" data-desc="一个用于存储自定义用户数据的对象。"></x-field>
    <x-field data-name="address" data-type="any" data-required="false" data-desc="用户的地址信息。"></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const updatedProfile = await sdk.auth.saveProfile({
  metadata: { twitter: '@johndoe' },
  locale: 'en-US'
});
console.log('个人资料已保存:', updatedProfile);
```

**返回**

<x-field data-name="updatedProfile" data-type="Promise<object>" data-desc="一个解析为更新后的个人资料对象的 promise。"></x-field>

### getUserPublicInfo

获取任何用户的公开信息，通过其 DID 进行识别。

**参数**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="did" data-type="string" data-required="true" data-desc="用户的去中心化标识符（DID）。"></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const publicInfo = await sdk.auth.getUserPublicInfo({ did: 'z8ia...' });
console.log(publicInfo.fullName);
```

**返回**

<x-field data-name="UserPublicInfo" data-type="Promise<object>" data-desc="一个解析为 UserPublicInfo 对象的 promise。">
  <x-field data-name="avatar" data-type="string" data-desc="用户头像的 URL。"></x-field>
  <x-field data-name="did" data-type="string" data-desc="用户的 DID。"></x-field>
  <x-field data-name="fullName" data-type="string" data-desc="用户的全名。"></x-field>
  <x-field data-name="sourceAppPid" data-type="string | null" data-desc="源应用程序的 PID。"></x-field>
</x-field>

### refreshProfile

强制从其原始来源同步用户的个人资料，确保数据是最新​​的。

```javascript icon=logos:javascript
await sdk.auth.refreshProfile();
console.log('已启动个人资料刷新。');
```

**返回**

<x-field data-name="void" data-type="Promise<void>" data-desc="一个在刷新请求已发送时解析的 promise。"></x-field>

### updateDidSpace

更新用户的 DID Space 配置，该配置决定了他们的数据存储位置。

**参数**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="spaceGateway" data-type="object" data-required="true" data-desc="一个包含新 DID Space 网关详细信息的对象。">
      <x-field data-name="did" data-type="string" data-required="true" data-desc="空间的 DID。"></x-field>
      <x-field data-name="name" data-type="string" data-required="true" data-desc="空间的名称。"></x-field>
      <x-field data-name="url" data-type="string" data-required="true" data-desc="空间的 URL。"></x-field>
      <x-field data-name="endpoint" data-type="string" data-required="true" data-desc="空间的 API 端点。"></x-field>
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

<x-field data-name="void" data-type="Promise<void>" data-desc="一个在更新成功时解析的 promise。"></x-field>

### getProfileUrl

构建用户公开个人资料页面的 URL。

**参数**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="did" data-type="string" data-required="true" data-desc="用户的 DID。"></x-field>
    <x-field data-name="locale" data-type="string" data-required="true" data-desc="个人资料页面所需​​的区域设置。"></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const url = await sdk.auth.getProfileUrl({ did: 'z8ia...', locale: 'en' });
console.log('个人资料 URL:', url);
```

**返回**

<x-field data-name="url" data-type="Promise<string>" data-desc="一个解析为完整个人资料 URL 字符串的 promise。"></x-field>

## 设置管理

管理用户的隐私和通知特定设置。

### getUserPrivacyConfig

检索指定用户的隐私设置。

**参数**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="did" data-type="string" data-required="true" data-desc="正在请求其隐私设置的用户的 DID。"></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const privacyConfig = await sdk.auth.getUserPrivacyConfig({ did: 'z8ia...' });
console.log('邮箱是否公开?', privacyConfig.isEmailPublic);
```

**返回**

<x-field data-name="PrivacyConfig" data-type="Promise<object>" data-desc="一个解析为用户 PrivacyConfig 对象的 promise，其中键是设置名称，值是布尔值。"></x-field>

### saveUserPrivacyConfig

保存当前已验证用户的隐私设置。

**参数**

<x-field-group>
  <x-field data-name="config" data-type="object" data-required="true" data-desc="一个包含表示隐私设置的键值对的对象。"></x-field>
</x-field-group>

```javascript icon=logos:javascript
const newConfig = { isEmailPublic: false, allowFriendRequests: false };
const savedConfig = await sdk.auth.saveUserPrivacyConfig(newConfig);
console.log('隐私配置已保存。');
```

**返回**

<x-field data-name="PrivacyConfig" data-type="Promise<object>" data-desc="一个解析为已保存的 PrivacyConfig 对象的 promise。"></x-field>

### getUserNotificationConfig

获取当前用户的通知配置，包括 Webhook 和频道偏好。

```javascript icon=logos:javascript
const notificationConfig = await sdk.auth.getUserNotificationConfig();
console.log('Webhooks:', notificationConfig.webhooks);
```

**返回**

<x-field data-name="NotificationConfig" data-type="Promise<object>" data-desc="一个解析为 NotificationConfig 对象的 promise。">
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

为当前用户保存新的通知设置。

**参数**

<x-field-group>
  <x-field data-name="config" data-type="object" data-required="true" data-desc="新的通知配置对象。">
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
console.log('通知配置已保存:', savedConfig);
```

**返回**

<x-field data-name="NotificationConfig" data-type="Promise<object>" data-desc="一个解析为已保存的 NotificationConfig 对象的 promise。"></x-field>

### testNotificationWebhook

测试 Webhook 配置以确保其可以接收测试通知。

**参数**

<x-field-group>
  <x-field data-name="webhook" data-type="object" data-required="true" data-desc="要测试的 Webhook 对象。">
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
console.log('Webhook 测试成功:', result.success);
```

**返回**

<x-field data-name="result" data-type="Promise<object>" data-desc="一个解析为具有 success 属性的对象的 promise。">
  <x-field data-name="success" data-type="boolean" data-desc="指示测试是否成功。"></x-field>
</x-field>

## 社交互动

管理用户之间的社交联系。

### followUser

关注另一个用户。

**参数**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="userDid" data-type="string" data-required="true" data-desc="要关注的用户的 DID。"></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const userToFollow = 'z8ia...';
await sdk.auth.followUser({ userDid: userToFollow });
console.log(`成功关注 ${userToFollow}。`);
```

**返回**

<x-field data-name="void" data-type="Promise<void>" data-desc="一个在操作完成时解析的 promise。"></x-field>

### unfollowUser

取消关注一个用户。

**参数**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="userDid" data-type="string" data-required="true" data-desc="要取消关注的用户的 DID。"></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const userToUnfollow = 'z8ia...';
await sdk.auth.unfollowUser({ userDid: userToUnfollow });
console.log(`成功取消关注 ${userToUnfollow}。`);
```

**返回**

<x-field data-name="void" data-type="Promise<void>" data-desc="一个在操作完成时解析的 promise。"></x-field>

### isFollowingUser

检查当前用户是否正在关注特定用户。

**参数**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="userDid" data-type="string" data-required="true" data-desc="要检查的用户的 DID。"></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const userToCheck = 'z8ia...';
const { isFollowing } = await sdk.auth.isFollowingUser({ userDid: userToCheck });
if (isFollowing) {
  console.log(`您正在关注 ${userToCheck}。`);
} else {
  console.log(`您没有关注 ${userToCheck}。`);
}
```

**返回**

<x-field data-name="result" data-type="Promise<object>" data-desc="一个解析为包含 isFollowing 属性的对象的 promise。">
  <x-field data-name="isFollowing" data-type="boolean" data-desc="如果当前用户正在关注指定用户，则为 True。"></x-field>
</x-field>

## 身份验证和账户操作

执行与用户会话和账户生命周期相关的关键操作。

### logout

将当前用户注销。可以配置为从特定设备或所有会话中注销。

**参数**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="false">
    <x-field data-name="visitorId" data-type="string" data-required="false" data-desc="要注销的特定设备/会话的 ID。"></x-field>
    <x-field data-name="status" data-type="string" data-required="false" data-desc="要注销的会话的状态。"></x-field>
    <x-field data-name="includeFederated" data-type="boolean" data-required="false" data-desc="如果为 true，则也从联合登录组中的所有应用程序注销。"></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
// 从当前会话简单注销
await sdk.auth.logout({});
console.log('注销成功。');

// 从特定设备和所有联合应用程序注销
await sdk.auth.logout({ visitorId: 'some-visitor-id', includeFederated: true });
```

**返回**

<x-field data-name="void" data-type="Promise<void>" data-desc="一个在注销过程完成时解析的 promise。"></x-field>

### destroyMyself

永久删除当前已验证用户的账户。此操作不可逆，应极其谨慎使用。

```javascript icon=logos:javascript
// 这是一个破坏性操作。通常，您需要与用户确认此操作。
try {
  const result = await sdk.auth.destroyMyself();
  console.log(`账户 ${result.did} 已被永久删除。`);
} catch (error) {
  console.error('删除账户失败:', error);
}
```

**返回**

<x-field data-name="result" data-type="Promise<object>" data-desc="一个解析为包含已删除用户 DID 的对象的 promise。">
  <x-field data-name="did" data-type="string" data-desc="已删除用户的 DID。"></x-field>
</x-field>