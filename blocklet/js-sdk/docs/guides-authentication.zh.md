# 身份验证

`@blocklet/js-sdk` 旨在通过自动处理基于令牌的复杂安全性，实现无缝的身份验证。它在后台管理会话令牌和刷新令牌，让您可以专注于构建应用程序的功能。

本指南解释了自动令牌续订过程，并演示了如何使用 `AuthService` 管理用户身份验证状态，例如获取个人资料和注销。有关所有可用方法的详细列表，请参阅 [AuthService API 参考](./api-services-auth.md)。

## 自动会话令牌续订

SDK 采用标准且安全的身份验证流程，使用短期的会话令牌和长期的刷新令牌。当您使用 SDK 的请求辅助工具（请参阅[发起 API 请求](./guides-making-api-requests.md)）进行 API 调用时，该过程是完全自动化的：

1.  **请求发起**：SDK 将当前的 `sessionToken` 附加到 API 请求的授权标头中。
2.  **令牌过期**：如果 `sessionToken` 已过期，服务器将响应 `401 Unauthorized` 错误。
3.  **自动刷新**：SDK 的请求拦截器会捕获此 `401` 错误。然后，它会自动将存储的 `refreshToken` 发送到身份验证端点，以获取新的 `sessionToken` 和 `refreshToken`。
4.  **请求重试**：一旦接收并存储了新令牌，SDK 会透明地重试失败的原始 API 请求。这次将使用新的、有效的 `sessionToken`。
5.  **成功响应**：服务器验证新令牌并返回成功响应，然后该响应将传递回您的应用程序代码。

整个过程对您的应用程序逻辑是不可见的，确保用户会话保持活动状态，而不会中断用户体验。

下图说明了此流程：

<!-- DIAGRAM_IMAGE_START:sequence:4:3 -->
![Authentication](assets/diagram/authentication-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## 使用 AuthService 管理用户状态

`AuthService` 为常见的身份验证和用户管理任务提供了一个高级 API。您可以通过主 SDK 实例访问它。

### 获取当前用户的个人资料

要获取当前登录用户的个人资料信息，请使用 `getProfile` 方法。

```javascript 获取用户个人资料 icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

async function fetchUserProfile() {
  try {
    const profile = await sdk.auth.getProfile();
    console.log('用户个人资料：', profile);
    return profile;
  } catch (error) {
    console.error('获取个人资料失败：', error);
  }
}

fetchUserProfile();
```

### 注销

`logout` 方法会使用户在服务器上的当前会话失效。您可以不带参数调用它以注销当前设备，或者传递一个 `visitorId` 来注销特定会话，这对于管理跨多个设备的会话非常有用。

```javascript 注销用户 icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

async function handleLogout() {
  try {
    // 注销当前会话
    await sdk.auth.logout();
    console.log('成功注销。');
    // 重定向到登录页面或更新 UI 状态
  } catch (error) {
    console.error('注销失败：', error);
  }
}
```

### 删除用户账户

对于希望删除其账户的用户，SDK 提供了 `destroyMyself` 方法。这是一个破坏性且不可逆的操作，会永久删除用户的数据。

```javascript 删除当前用户的账户 icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

async function deleteAccount() {
  // 与用户确认此操作至关重要
  if (window.confirm('您确定要删除您的账户吗？此操作不可逆。')) {
    try {
      const result = await sdk.auth.destroyMyself();
      console.log(`DID 为 ${result.did} 的账户已被删除。`);
      // 执行清理并重定向用户
    } catch (error) {
      console.error('删除账户失败：', error);
    }
  }
}
```

## 后续步骤

现在您已经了解了 `@blocklet/js-sdk` 中的身份验证工作原理，您可能希望探索如何管理用户的所有活动会话。

<x-card data-title="管理用户会话" data-icon="lucide:user-cog" data-href="/guides/managing-user-sessions" data-cta="阅读指南">
了解如何使用 UserSessionService 获取和管理用户在不同设备上的登录会话。
</x-card>