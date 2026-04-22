# 快速入门

本指南将引导您完成安装 `@blocklet/js-sdk` 并进行首次 API 调用的基本步骤。我们的目标是让您在几分钟内就能上手。

## 安装

首先，您需要将 SDK 添加到您的项目中。您可以使用您喜欢的包管理器：

```bash Installation icon=mdi:bash
npm install @blocklet/js-sdk

# or

yarn add @blocklet/js-sdk

# or

pnpm add @blocklet/js-sdk
```

## 基本用法

SDK 的设计力求简单直观。两个最常见的用例是访问核心 Blocklet 服务（如用户身份验证）和向您自己的 Blocklet 后端发出经身份验证的请求。

### 访问核心服务

使用 SDK 最简单的方法是导入 `getBlockletSDK` 单例工厂。该函数确保您在整个应用程序中始终获得相同的 SDK 实例，从而简化状态管理。

以下是如何使用它来获取当前用户个人资料的示例：

```javascript Get User Profile icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

async function fetchUserProfile() {
  try {
    const { data: userProfile } = await sdk.user.getProfile();
    console.log('User Profile:', userProfile);
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
  }
}

fetchUserProfile();
```

`sdk` 实例提供了对各种服务的访问，例如 `user`、`userSession`、`blocklet` 等。这些服务为您处理与众所周知的 Blocklet 服务端点的通信。

### 向您的 Blocklet 发出 API 请求

为了与您自己的 Blocklet 后端 API 通信，SDK 提供了 `createAxios` 和 `createFetch` 辅助函数。它们是 Axios 和原生 Fetch API 的包装器，预先配置了进行身份验证请求所需的一切。

它们会自动处理：
- 为您的组件设置正确的 `baseURL`。
- 将会话令牌附加到 `Authorization` 标头。
- 为安全起见包含 `x-csrf-token`。
- 在会话令牌过期时自动刷新。

以下是如何使用 `createAxios` 为您的后端创建 API 客户端的示例：

```javascript Create an API Client icon=logos:javascript
import { createAxios } from '@blocklet/js-sdk';

// 创建一个为您的 Blocklet 配置的 Axios 实例
const apiClient = createAxios();

async function fetchData() {
  try {
    // 向您自己的后端发出请求，例如 GET /api/posts
    const response = await apiClient.get('/api/posts');
    console.log('Posts:', response.data);
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
}

fetchData();
```

通过此设置，您无需手动管理令牌或标头。SDK 会无缝地处理身份验证流程。

## 后续步骤

您现在已经学会了如何安装 `@blocklet/js-sdk` 并在两种最常见的场景中使用它。要深入了解，我们建议您浏览以下指南：

<x-cards>
  <x-card data-title="发出 API 请求" data-icon="lucide:file-code-2" data-href="/guides/making-api-requests">
    了解有关 `createAxios` 和 `createFetch` 的高级配置，包括错误处理和请求参数。
  </x-card>
  <x-card data-title="身份验证" data-icon="lucide:key-round" data-href="/guides/authentication">
    了解 SDK 在底层如何管理会话和刷新令牌，以保持用户登录状态。
  </x-card>
</x-cards>