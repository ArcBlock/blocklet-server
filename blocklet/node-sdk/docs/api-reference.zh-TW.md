# API 參考

歡迎來到 Blocklet SDK API 參考。本節詳細介紹了 SDK 匯出的所有模組、類別、函式和工具程式。無論您是要管理使用者、發送通知，還是保護您的應用程式，都可以在這裡找到必要的詳細資訊。

若需基於任務的實用方法來使用這些 API，請參閱我們的 [指南](./guides.md)。有關詳細的 TypeScript 定義，請參閱 [類型定義](./api-reference-types.md) 部分。

## 主要匯出

Blocklet SDK 分為數個模組，每個模組提供一組特定的功能。以下是您將使用的主要模組的快速概覽。

<x-cards data-columns="2">
  <x-card data-title="BlockletService" data-icon="lucide:server">
    一個強大的客戶端，用於與底層的 Blocklet Server API 互動，以管理使用者、角色、權限等。
  </x-card>
  <x-card data-title="NotificationService" data-icon="lucide:bell-ring">
    處理即時通訊，讓您可以向使用者發送通知並監聽全系統事件。
  </x-card>
  <x-card data-title="EventBus" data-icon="lucide:git-merge">
    一個事件驅動的訊息系統，用於應用程式不同部分之間的通訊。
  </x-card>
  <x-card data-title="Middlewares" data-icon="lucide:layers">
    一組預先建構的 Express.js 中介軟體，用於處理會話、身份驗證、CSRF 保護等。
  </x-card>
  <x-card data-title="Component Utilities" data-icon="lucide:puzzle">
    用於促進 blocklet 內不同元件之間安全通訊的函式。
  </x-card>
  <x-card data-title="Config & Env" data-icon="lucide:settings">
    存取執行階段設定、環境變數以及有關其他元件的資訊。
  </x-card>
  <x-card data-title="Wallet Utilities" data-icon="lucide:wallet">
    用於建立和管理錢包實例的工具，對於簽署和身份驗證至關重要。
  </x-card>
  <x-card data-title="Security Utilities" data-icon="lucide:shield">
    提供基本的安全功能，如資料加密/解密和回應簽署。
  </x-card>
</x-cards>

---

## BlockletService

`BlockletService` 是一個客戶端，提供全面的 API 來管理使用者、角色、權限和其他核心 blocklet 功能。它作為 Blocklet Server 的 GraphQL API 的介面。

```javascript 服務初始化 icon=logos:javascript
import { BlockletService } from '@blocklet/sdk';

const blockletService = new BlockletService();

async function getOwnerInfo() {
  const { user } = await blockletService.getOwner();
  console.log('Owner:', user);
}
```

### 主要方法

該服務公開了多種方法。以下是一些最常用的方法：

| Method | Description |
|---|---|
| `login(data)` | 使用提供的憑證驗證使用者。 |
| `refreshSession(data)` | 使用刷新權杖刷新使用者的會話。 |
| `getUser(did, options)` | 透過 DID 檢索單一使用者的個人資料。 |
| `getUsers(args)` | 檢索分頁的使用者列表。 |
| `getOwner()` | 檢索 blocklet 擁有者的個人資料。 |
| `updateUserApproval(did, approved)` | 批准或不批准使用者的存取。 |
| `createRole(args)` | 建立一個具有名稱、標題和描述的新使用者角色。 |
| `getRoles()` | 檢索所有可用角色的列表。 |
| `deleteRole(name)` | 依名稱刪除角色。 |
| `grantPermissionForRole(roleName, permissionName)` | 授予角色特定權限。 |
| `revokePermissionFromRole(roleName, permissionName)` | 從角色中撤銷權限。 |
| `hasPermission(role, permission)` | 檢查角色是否具有特定權限。 |
| `getPermissions()` | 檢索所有可用權限的列表。 |
| `getBlocklet(attachRuntimeInfo)` | 獲取目前 blocklet 的中繼資料和設定。 |
| `getComponent(did)` | 檢索特定元件的中繼資料。 |
| `createAccessKey(params)` | 為程式化存取建立新的存取金鑰。 |
| `verifyAccessKey(params)` | 驗證存取金鑰的有效性。 |

有關方法及其參數的完整列表，請參閱 [類型定義](./api-reference-types.md)。

---

## NotificationService

`NotificationService` 啟用即時通訊。您可以直接向使用者發送通知或向公共頻道廣播訊息。它還允許您監聽系統事件。

```javascript 發送通知 icon=logos:javascript
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

### 主要函式

| Function | Description |
|---|---|
| `sendToUser(receiver, notification, options)` | 向一個或多個使用者發送直接通知。 |
| `sendToMail(receiver, notification, options)` | 向使用者的電子郵件發送通知。 |
| `broadcast(notification, options)` | 向 blocklet 的公共頻道廣播訊息。 |
| `on(event, callback)` | 訂閱系統事件（例如，元件更新、使用者事件）。 |
| `off(event, callback)` | 取消訂閱系統事件。 |

---

## EventBus

`EventBus` 提供了一個簡單的發布-訂閱機制，用於應用程式內的通訊，幫助您建構解耦的、事件驅動的功能。

```javascript 發布事件 icon=logos:javascript
import EventBus from '@blocklet/sdk/service/eventbus';

// In one part of your app
async function publishOrderCreated(orderData) {
  await EventBus.publish('order.created', { data: orderData });
}

// In another part of your app
EventBus.subscribe((event) => {
  if (event.type === 'order.created') {
    console.log('New order received:', event.data);
  }
});
```

### 函式

| Function | Description |
|---|---|
| `publish(name, event)` | 發布具有特定名稱和有效負載的事件。 |
| `subscribe(callback)` | 訂閱所有事件，對接收到的每個事件執行回呼函式。 |
| `unsubscribe(callback)` | 移除先前註冊的事件訂閱者。 |

---

## 中介軟體

SDK 提供了一套預先設定的 Express.js 中介軟體，以處理常見的 Web 伺服器任務，如身份驗證、會話管理和安全性。

```javascript 使用中介軟體 icon=logos:javascript
import express from 'express';
import middlewares from '@blocklet/sdk/middlewares';

const app = express();

// Session middleware must be used before auth middleware
app.use(middlewares.session());

// Protect a route, requiring 'admin' role
app.get('/admin', middlewares.auth({ roles: ['admin'] }), (req, res) => {
  res.send('Welcome, admin!');
});
```

### 可用的中介軟體

| Middleware | Description |
|---|---|
| `session()` | 從權杖或存取金鑰解析和驗證使用者會話，將使用者資訊附加到 `req.session`。 |
| `auth(rules)` | 根據角色和權限保護路由。如果使用者未被授權，則拋出 403 Forbidden 錯誤。 |
| `user()` | 一個輕量級的中介軟體，如果存在有效的會話，則將使用者資訊附加到 `req.user`，但不會阻止未經身份驗證的請求。 |
| `component()` | 用於保護僅能由同一 blocklet 內的其他元件存取的路由的中介軟體。 |
| `csrf()` | 實作 CSRF（跨站請求偽造）保護。 |
| `sitemap()` | 為您的應用程式產生一個 `sitemap.xml` 檔案。 |
| `fallback()` | 一個用於單頁應用程式（SPA）的備用中介軟體，為未知路由提供 `index.html`。 |

---

## 元件工具程式

這些工具程式專為元件間通訊和 URL 管理而設計。

```javascript 呼叫另一個元件 icon=logos:javascript
import component from '@blocklet/sdk/component';

async function fetchUserDataFromProfileComponent() {
  try {
    const response = await component.call({
      name: 'profile-component-did', // The DID of the target component
      path: '/api/user-data',
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    console.error('Failed to call component:', error);
  }
}
```

### 主要函式

| Function | Description |
|---|---|
| `call(options, retryOptions)` | 向同一 blocklet 內的另一個元件發出安全的 HTTP 請求。 |
| `getUrl(...parts)` | 為目前元件內的路徑建構一個絕對的公共 URL。 |
| `getRelativeUrl(...parts)` | 為目前元件內的路徑建構一個相對 URL。 |
| `getResources(options)` | 檢索 blocklet 可用的資源元件列表。 |
| `waitForComponentRunning(name, timeout)` | 等到指定的元件正在執行且可達。 |

---

## 設定與環境

透過 `config` 匯出存取您的 blocklet 的設定、環境變數和元件中繼資料。

```javascript 存取環境資料 icon=logos:javascript
import config from '@blocklet/sdk/config';

// Access environment variables
const appName = config.env.appName;
const appUrl = config.env.appUrl;

// Access the list of other components
const allComponents = config.components;
const databaseComponent = config.components.find(c => c.name === 'database');
```

### 主要屬性

| Property | Description |
|---|---|
| `config.env` | 一個包含環境變數和應用程式設定的物件（例如，`appName`、`appUrl`、`isComponent`）。 |
| `config.components` | 一個物件陣列，其中每個物件包含有關已掛載元件的中繼資料（例如，`did`、`name`、`status`、`mountPoint`）。 |
| `config.logger` | 一個記錄器實例（`info`、`warn`、`error`、`debug`）。 |
| `config.events` | 一個 `EventEmitter`，當 blocklet 的設定或元件列表變更時觸發。 |

---

## 錢包工具程式

`getWallet` 函式提供了一種從環境中提供的私鑰輕鬆建立錢包實例的方法。這些錢包對於任何加密操作（如簽署資料）都至關重要。

```javascript 建立錢包 icon=logos:javascript
import getWallet from '@blocklet/sdk/wallet';

// Get the default wallet for the current application instance
const wallet = getWallet();
console.log('Wallet Address:', wallet.address);

// Get the permanent wallet associated with the blocklet's DID
const permanentWallet = getWallet.getPermanentWallet();
console.log('Permanent Wallet Address:', permanentWallet.address);
```

### 函式

| Function | Description |
|---|---|
| `getWallet(type, sk)` | 建立一個錢包實例。預設情況下，它使用應用程式的執行階段私鑰（`BLOCKLET_APP_SK`）。 |
| `getWallet.getPermanentWallet()` | 獲取從永久私鑰（`BLOCKLET_APP_PSK`）派生的錢包的捷徑。 |
| `getWallet.getEthereumWallet(permanent)` | 建立一個與以太坊相容的錢包。 |

---

## 安全工具程式

SDK 包含一個 `security` 模組，其中包含用於常見加密任務（如加密和回應簽署）的輔助函式。

```javascript 加密資料 icon=logos:javascript
import security from '@blocklet/sdk/security';

const sensitiveData = 'This is a secret message';

// Encrypt data using the blocklet's encryption key
const encrypted = security.encrypt(sensitiveData);

// Decrypt it later
const decrypted = security.decrypt(encrypted);

console.log(decrypted === sensitiveData); // true
```

### 函式

| Function | Description |
|---|---|
| `encrypt(message, password, salt)` | 使用 AES 加密字串。預設使用 `BLOCKLET_APP_EK` 和 `BLOCKLET_DID`。 |
| `decrypt(message, password, salt)` | 解密使用 `encrypt` 加密的字串。 |
| `signResponse(data)` | 使用 blocklet 的錢包簽署資料負載，並新增簽名中繼資料。 |
| `verifyResponse(data)` | 驗證使用 `signResponse` 簽署的回應的簽名。 |
