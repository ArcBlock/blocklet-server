# 服务

`@blocklet/js-sdk` 被组织成几个服务类，每个类负责一个特定的功能领域。这些服务充当不同 Blocklet API 端点的专用客户端，提供了一种结构化且直观的方式来与平台的功能进行交互。

大多数核心服务都已预先初始化，并作为主 `BlockletSDK` 实例的属性提供，您可以使用 `getBlockletSDK()` 函数获取该实例。

```javascript Accessing a Service icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

// 访问 AuthService 以获取用户信息
async function getUserProfile() {
  const profile = await sdk.user.getProfile();
  console.log(profile);
}

// 访问 BlockletService 以获取 blocklet 信息
async function getBlockletMeta() {
  const meta = await sdk.blocklet.getMeta();
  console.log(meta);
}
```

下图说明了 `BlockletSDK` 实例的结构及其与核心服务的关系。

<!-- DIAGRAM_IMAGE_START:architecture:1:1 -->
![Services](assets/diagram/services-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

以下是可用服务的完整列表。单击任何服务以查看其详细的 API 参考。

<x-cards data-columns="2">
  <x-card data-title="AuthService" data-href="/api/services/auth" data-icon="lucide:user-cog">
    用于管理用户个人资料、隐私设置、通知以及注销等身份验证操作的 API。
  </x-card>
  <x-card data-title="BlockletService" data-href="/api/services/blocklet" data-icon="lucide:box">
    用于从 `window.blocklet` 或远程 URL 获取和加载 blocklet 元数据的 API。
  </x-card>
  <x-card data-title="ComponentService" data-href="/api/services/component" data-icon="lucide:layout-template">
    用于获取已挂载组件信息并为其构建 URL 的 API。
  </x-card>
  <x-card data-title="FederatedService" data-href="/api/services/federated" data-icon="lucide:network">
    用于与联合登录组设置交互以及检索有关主应用和当前应用信息的 API。
  </x-card>
  <x-card data-title="TokenService" data-href="/api/services/token" data-icon="lucide:key-round">
    用于从存储（Cookies 和 LocalStorage）中获取、设置和移除会话令牌和刷新令牌的底层 API。
  </x-card>
  <x-card data-title="UserSessionService" data-href="/api/services/user-session" data-icon="lucide:users">
    用于获取和管理用户登录会话的 API。
  </x-card>
</x-cards>

每个服务都为 Blocklet 平台的特定部分提供了一组专注的方法。要了解这些服务返回的数据结构和类型，请参阅 [类型](./api-types.md) 参考。