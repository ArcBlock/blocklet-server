# DID Connect

Blocklet SDK 提供了一种简化方法，通过使用 DID Connect 将去中心化身份集成到您的应用中。这允许用户使用 DID 钱包安全登录和管理他们的数据，提供无密码、以用户为中心的身份验证体验。实现此功能的核心组件是 `WalletAuthenticator` 和 `WalletHandler`。

这些实用工具构建在强大的 `@arcblock/did-connect-js` 库之上，简化了在 Blocklet 环境中的设置过程。

### 工作原理

典型的 DID Connect 登录流程涉及用户、您的应用程序前端和后端，以及用户的 DID 钱包。

<!-- DIAGRAM_IMAGE_START:sequence:4:3 -->
![DID Connect](assets/diagram/did-connect-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## 基本设置

在您的 Blocklet 中设置 DID Connect 非常简单。您需要实例化 `WalletAuthenticator` 和 `WalletHandler`，并为会话数据提供一个存储机制。

以下是在 Express.js 应用程序中的典型设置：

```javascript Basic DID Connect Setup icon=logos:javascript
import path from 'path';
import AuthStorage from '@arcblock/did-connect-storage-nedb';
import WalletAuthenticator from '@blocklet/sdk/lib/wallet-authenticator';
import WalletHandler from '@blocklet/sdk/lib/wallet-handler';

// 1. 初始化 authenticator
export const authenticator = new WalletAuthenticator();

// 2. 使用 authenticator 和存储解决方案初始化 handler
export const handlers = new WalletHandler({
  authenticator,
  tokenStorage: new AuthStorage({
    dbPath: path.join(process.env.BLOCKLET_DATA_DIR, 'auth.db'),
  }),
});

// 3. 将 handler 挂载到您的 Express 应用
// app.use('/api/did/auth', handlers);
```

**代码解析：**

1.  **`WalletAuthenticator`**：此类负责创建和管理 DID Connect 会话。它生成的数据将被编码到二维码中并展示给用户。
2.  **`@arcblock/did-connect-storage-nedb`**：这是一个基于文件的存储适配器，用于持久化会话令牌。对于 Blocklet 而言，这是一个便捷的选择，因为它将数据存储在 Blocklet 的数据目录（`BLOCKLET_DATA_DIR`）内。
3.  **`WalletHandler`**：此类处理整个身份验证生命周期。它管理会话创建、状态更新（例如，当用户扫描二维码时）以及来自钱包的最终身份验证响应。

## 配置

`WalletHandler` 构造函数接受一个选项对象以自定义其行为。以下是一些关键参数：

<x-field-group>
  <x-field data-name="authenticator" data-type="WalletAuthenticator" data-required="true" data-desc="WalletAuthenticator 的一个实例。"></x-field>
  <x-field data-name="tokenStorage" data-type="object" data-required="true" data-desc="用于持久化会话令牌的存储实例，例如来自 '@arcblock/did-connect-storage-nedb' 的 AuthStorage。"></x-field>
  <x-field data-name="autoConnect" data-type="boolean" data-default="true" data-required="false">
    <x-field-desc markdown>如果为 `true`，之前已连接钱包的返回用户可以自动登录，无需再次扫描二维码。这是通过向他们的钱包发送推送通知来实现的。</x-field-desc>
  </x-field>
  <x-field data-name="connectedDidOnly" data-type="boolean" data-default="false" data-required="false">
    <x-field-desc markdown>如果为 `true`，则只有当前登录用户（如有）的 DID 可用于连接。这在用户需要将钱包链接到现有账户的场景中非常有用。</x-field-desc>
  </x-field>
</x-field-group>

### 自定义应用信息

当用户扫描二维码时，他们的 DID 钱包会显示有关您的应用程序的信息，例如名称、描述和图标。SDK 会使用您 Blocklet 的元数据自动填充这些信息。但是，您可以通过向 `WalletAuthenticator` 构造函数传递一个 `appInfo` 函数来覆盖此信息。

```javascript Customizing App Info icon=logos:javascript
import WalletAuthenticator from '@blocklet/sdk/lib/wallet-authenticator';

const authenticator = new WalletAuthenticator({
  async appInfo() {
    // 此函数可以返回自定义的应用信息
    // 返回的对象将与默认信息合并
    return {
      name: 'My Custom App Name',
      description: 'A custom description for the DID Connect request.',
      icon: 'https://my-app.com/logo.png',
    };
  },
});
```

## 延伸阅读

Blocklet SDK 提供的 `WalletAuthenticator` 和 `WalletHandler` 是对功能更全面的 `@arcblock/did-connect-js` 库的便捷封装。对于高级用例、深度定制或更透彻地理解底层机制，请参阅官方的 DID Connect SDK 文档。

<x-card data-title="DID Connect SDK 文档" data-icon="lucide:book-open" data-href="https://www.arcblock.io/docs/did-connect-sdk/en/did-connect-sdk-overview" data-cta="阅读更多">
  探索 DID Connect 协议及其 JavaScript SDK 的全部功能，以构建强大的去中心化应用。
</x-card>

用户成功通过身份验证后，下一步是在您的应用程序中管理他们的会话。Blocklet SDK 为此提供了一个强大的中间件。

要了解如何验证用户会话和保护您的路由，请继续阅读下一节 [会话中间件](./authentication-session-middleware.md)。