# API 参考

欢迎来到 Blocklet SDK API 参考。本节详细介绍了 SDK 导出的所有模块、类、函数和实用工具。无论您是管理用户、发送通知，还是保护您的应用程序，都可以在这里找到必要的详细信息。

有关使用这些 API 的实用、基于任务的方法，请参阅我们的 [指南](./guides.md)。有关详细的 TypeScript 定义，请参阅 [类型定义](./api-reference-types.md) 部分。

## 主要导出

Blocklet SDK 被组织成多个模块，每个模块提供一组特定的功能。以下是您将使用的主要模块的快速概览。

<x-cards data-columns="2">
  <x-card data-title="BlockletService" data-icon="lucide:server">
    一个功能强大的客户端，用于与底层的 Blocklet Server API 交互，以管理用户、角色、权限等。
  </x-card>
  <x-card data-title="NotificationService" data-icon="lucide:bell-ring">
    处理实时通信，允许您向用户发送通知并监听系统范围的事件。
  </x-card>
  <x-card data-title="EventBus" data-icon="lucide:git-merge">
    一个事件驱动的消息系统，用于应用程序不同部分之间的通信。
  </x-card>
  <x-card data-title="中间件" data-icon="lucide:layers">
    一组预构建的 Express.js 中间件，用于处理会话、身份验证、CSRF 保护等。
  </x-card>
  <x-card data-title="组件实用工具" data-icon="lucide:puzzle">
    用于促进 Blocklet 内不同组件之间安全通信的函数。
  </x-card>
  <x-card data-title="配置与环境" data-icon="lucide:settings">
    访问运行时配置、环境变量以及有关其他组件的信息。
  </x-card>
  <x-card data-title="钱包实用工具" data-icon="lucide:wallet">
    用于创建和管理钱包实例的工具，对于签名和身份验证至关重要。
  </x-card>
  <x-card data-title="安全实用工具" data-icon="lucide:shield">
    提供数据加密/解密和响应签名等基本安全功能。
  </x-card>
</x-cards>

---

## BlockletService

`BlockletService` 是一个客户端，提供了一个全面的 API，用于管理用户、角色、权限以及其他核心 Blocklet 功能。它充当 Blocklet Server 的 GraphQL API 的接口。

```javascript 服务初始化 icon=logos:javascript
import { BlockletService } from '@blocklet/sdk';

const blockletService = new BlockletService();

async function getOwnerInfo() {
  const { user } = await blockletService.getOwner();
  console.log('所有者：', user);
}
```

### 主要方法

该服务公开了多种方法。以下是一些最常用的方法：

| Method | Description |
|---|---|
| `login(data)` | 使用提供的凭据对用户进行身份验证。 |
| `refreshSession(data)` | 使用刷新令牌刷新用户的会话。 |
| `getUser(did, options)` | 通过用户的 DID 检索单个用户的个人资料。 |
| `getUsers(args)` | 检索分页的用户列表。 |
| `getOwner()` | 检索 Blocklet 所有者的个人资料。 |
| `updateUserApproval(did, approved)` | 批准或不批准用户的访问。 |
| `createRole(args)` | 创建一个具有名称、标题和描述的新用户角色。 |
| `getRoles()` | 检索所有可用角色的列表。 |
| `deleteRole(name)` | 通过名称删除角色。 |
| `grantPermissionForRole(roleName, permissionName)` | 授予角色特定权限。 |
| `revokePermissionFromRole(roleName, permissionName)` | 从角色中撤销权限。 |
| `hasPermission(role, permission)` | 检查角色是否具有特定权限。 |
| `getPermissions()` | 检索所有可用权限的列表。 |
| `getBlocklet(attachRuntimeInfo)` | 获取当前 Blocklet 的元数据和设置。 |
| `getComponent(did)` | 检索特定组件的元数据。 |
| `createAccessKey(params)` | 为程序化访问创建新的访问密钥。 |
| `verifyAccessKey(params)` | 验证访问密钥的有效性。 |

有关方法及其参数的完整列表，请参阅 [类型定义](./api-reference-types.md)。

---

## NotificationService

`NotificationService` 支持实时通信。您可以直接向用户发送通知或向公共频道广播消息。它还允许您监听系统事件。

```javascript 发送通知 icon=logos:javascript
import NotificationService from '@blocklet/sdk/service/notification';

async function notifyUser(userId, message) {
  const notification = {
    type: 'info',
    title: 'New Update',
    content: message,
  };
  await NotificationService.sendToUser(userId, notification);
}
```

### 主要函数

| Function | Description |
|---|---|
| `sendToUser(receiver, notification, options)` | 向一个或多个用户发送直接通知。 |
| `sendToMail(receiver, notification, options)` | 向用户的电子邮件发送通知。 |
| `broadcast(notification, options)` | 向 Blocklet 的公共频道广播消息。 |
| `on(event, callback)` | 订阅系统事件（例如，组件更新、用户事件）。 |
| `off(event, callback)` | 取消订阅系统事件。 |

---

## EventBus

`EventBus` 提供了一个简单的发布-订阅机制，用于在您的应用程序内部进行通信，帮助您构建解耦的、事件驱动的功能。

```javascript 发布事件 icon=logos:javascript
import EventBus from '@blocklet/sdk/service/eventbus';

// 在您的应用程序的一部分中
async function publishOrderCreated(orderData) {
  await EventBus.publish('order.created', { data: orderData });
}

// 在您的应用程序的另一部分中
EventBus.subscribe((event) => {
  if (event.type === 'order.created') {
    console.log('收到新订单：', event.data);
  }
});
```

### 函数

| Function | Description |
|---|---|
| `publish(name, event)` | 发布具有特定名称和有效负载的事件。 |
| `subscribe(callback)` | 订阅所有事件，为接收到的每个事件执行回调。 |
| `unsubscribe(callback)` | 移除先前注册的事件订阅者。 |

---

## 中间件

SDK 提供了一套预配置的 Express.js 中间件，用于处理常见的 Web 服务器任务，如身份验证、会话管理和安全。

```javascript 使用中间件 icon=logos:javascript
import express from 'express';
import middlewares from '@blocklet/sdk/middlewares';

const app = express();

// 会话中间件必须在身份验证中间件之前使用
app.use(middlewares.session());

// 保护路由，需要 'admin' 角色
app.get('/admin', middlewares.auth({ roles: ['admin'] }), (req, res) => {
  res.send('欢迎，管理员！');
});
```

### 可用中间件

| Middleware | Description |
|---|---|
| `session()` | 解析并验证来自令牌或访问密钥的用户会话，将用户信息附加到 `req.session`。 |
| `auth(rules)` | 根据角色和权限保护路由。如果用户未获授权，则抛出 403 Forbidden 错误。 |
| `user()` | 一个轻量级中间件，如果存在有效会话，则将用户信息附加到 `req.user`，但不会阻止未经身份验证的请求。 |
| `component()` | 用于保护只能由同一 Blocklet 内的其他组件访问的路由的中间件。 |
| `csrf()` | 实现 CSRF（跨站请求伪造）保护。 |
| `sitemap()` | 为您的应用程序生成一个 `sitemap.xml` 文件。 |
| `fallback()` | 一个用于单页应用程序（SPA）的回退中间件，为未知路由提供 `index.html`。 |

---

## 组件实用工具

这些实用工具专为组件间通信和 URL 管理而设计。

```javascript 调用另一个组件 icon=logos:javascript
import component from '@blocklet/sdk/component';

async function fetchUserDataFromProfileComponent() {
  try {
    const response = await component.call({
      name: 'profile-component-did', // 目标组件的 DID
      path: '/api/user-data',
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    console.error('调用组件失败：', error);
  }
}
```

### 主要函数

| Function | Description |
|---|---|
| `call(options, retryOptions)` | 向同一 Blocklet 内的另一个组件发出安全的 HTTP 请求。 |
| `getUrl(...parts)` | 为当前组件内的路径构建一个绝对公共 URL。 |
| `getRelativeUrl(...parts)` | 为当前组件内的路径构建一个相对 URL。 |
| `getResources(options)` | 检索 Blocklet 可用的资源组件列表。 |
| `waitForComponentRunning(name, timeout)` | 等待直到指定的组件正在运行且可达。 |

---

## 配置与环境

通过 `config` 导出访问您的 Blocklet 的配置、环境变量和组件元数据。

```javascript 访问环境数据 icon=logos:javascript
import config from '@blocklet/sdk/config';

// 访问环境变量
const appName = config.env.appName;
const appUrl = config.env.appUrl;

// 访问其他组件的列表
const allComponents = config.components;
const databaseComponent = config.components.find(c => c.name === 'database');
```

### 主要属性

| Property | Description |
|---|---|
| `config.env` | 一个包含环境变量和应用程序设置的对象（例如，`appName`、`appUrl`、`isComponent`）。 |
| `config.components` | 一个对象数组，其中每个对象包含有关已挂载组件的元数据（例如，`did`、`name`、`status`、`mountPoint`）。 |
| `config.logger` | 一个日志记录器实例 (`info`、`warn`、`error`、`debug`)。 |
| `config.events` | 一个 `EventEmitter`，当 Blocklet 的配置或组件列表更改时触发。 |

---

## 钱包实用工具

`getWallet` 函数提供了一种从环境中提供的私钥创建钱包实例的简单方法。这些钱包对于任何加密操作（如签名数据）都是必不可少的。

```javascript 创建钱包 icon=logos:javascript
import getWallet from '@blocklet/sdk/wallet';

// 获取当前应用程序实例的默认钱包
const wallet = getWallet();
console.log('钱包地址：', wallet.address);

// 获取与 Blocklet 的 DID 关联的永久钱包
const permanentWallet = getWallet.getPermanentWallet();
console.log('永久钱包地址：', permanentWallet.address);
```

### 函数

| Function | Description |
|---|---|
| `getWallet(type, sk)` | 创建一个钱包实例。默认情况下，它使用应用程序的运行时私钥 (`BLOCKLET_APP_SK`)。 |
| `getWallet.getPermanentWallet()` | 获取从永久私钥 (`BLOCKLET_APP_PSK`) 派生的钱包的快捷方式。 |
| `getWallet.getEthereumWallet(permanent)` | 创建一个与以太坊兼容的钱包。 |

---

## 安全实用工具

SDK 包含一个 `security` 模块，其中包含用于常见加密任务（如加密和响应签名）的辅助函数。

```javascript 加密数据 icon=logos:javascript
import security from '@blocklet/sdk/security';

const sensitiveData = '这是一条机密消息';

// 使用 Blocklet 的加密密钥加密数据
const encrypted = security.encrypt(sensitiveData);

// 稍后解密
const decrypted = security.decrypt(encrypted);

console.log(decrypted === sensitiveData); // true
```

### 函数

| Function | Description |
|---|---|
| `encrypt(message, password, salt)` | 使用 AES 加密字符串。默认使用 `BLOCKLET_APP_EK` 和 `BLOCKLET_DID`。 |
| `decrypt(message, password, salt)` | 解密使用 `encrypt` 加密的字符串。 |
| `signResponse(data)` | 使用 Blocklet 的钱包对数据有效负载进行签名，并添加签名元数据。 |
| `verifyResponse(data)` | 验证使用 `signResponse` 签名的响应的签名。 |
