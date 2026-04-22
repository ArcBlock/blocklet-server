# 概述

Blocklet SDK (`@blocklet/sdk`) 是在 ArcBlock 平台上构建应用程序的基础工具包。它通过提供一套全面的实用工具、服务和中间件来处理 Blocklet 的核心功能，从而简化了开发过程，让您可以专注于应用程序的独特功能。

无论您是构建简单的静态网站、复杂的 Web 服务，还是扩展其他应用程序的组件，Blocklet SDK 都提供了必要的抽象，以便与底层的 Blocklet Server 环境无缝交互。

## 主要特性

该 SDK 设计得既强大又易于使用，提供了一系列功能来加速您的开发过程。

<x-cards data-columns="2">
  <x-card data-title="配置与环境" data-icon="lucide:settings">
    通过统一的 `env` 对象和 `config` 模块，轻松访问环境变量、应用程序配置以及其他正在运行的组件的信息。
  </x-card>
  <x-card data-title="认证与授权" data-icon="lucide:lock">
    通过内置的 DID Connect 支持集成去中心化身份。使用强大的会话和授权中间件保护您的路由。
  </x-card>
  <x-card data-title="服务客户端" data-icon="lucide:server">
    以编程方式与 Blocklet Server 交互。使用 `BlockletService` 管理用户、角色和权限，或使用 `NotificationService` 发送消息。
  </x-card>
  <x-card data-title="Web 服务器中间件" data-icon="lucide:shield-check">
    一套即用型 Express.js 中间件，用于处理 CSRF 保护、会话管理、站点地图生成和 SPA 回退等常见任务。
  </x-card>
</x-cards>

## 核心模块

Blocklet SDK 分为几个关键模块，每个模块都有特定的用途：

*   **`BlockletService`**：一个用于与 Blocklet Server API 交互的客户端。它允许您管理用户、角色、权限、访问密钥以及检索 Blocklet 元数据。
*   **`config` & `env`**：提供对您的 Blocklet 运行时配置的访问，包括环境变量、组件挂载点和应用程序设置。
*   **`middlewares`**：一个 Express.js 中间件集合，用于处理身份验证（`auth`）、会话（`session`）、CSRF 保护（`csrf`）等。
*   **`WalletAuthenticator` & `WalletHandlers`**：实现 DID Connect 的核心实用工具，使用户能够使用其去中心化身份安全登录。有关更多详细信息，您还可以参阅 [DID Connect SDK 文档](https://www.arcblock.io/docs/did-connect-sdk/en/did-connect-sdk-overview)。
*   **`getWallet`**：一个用于检索 Blocklet 钱包实例的实用函数，这对于签署交易或消息至关重要。
*   **`Security`**：提供用于数据加密、解密和签名验证的辅助函数，确保应用程序内数据的安全处理。

## 开始使用

准备好构建您的第一个 Blocklet 了吗？请访问我们的[入门指南](./getting-started.md)，获取分步教程，让您在几分钟内就能上手。