# FederatedService

`FederatedService` 提供了一个用于与统一登录站点群设置进行交互的 API。它允许您检索有关控制登录会话的“主”应用和用户正在交互的“当前”应用的信息。这对于创建诸如统一应用切换器之类的功能，或了解用户在相连的 Blocklet 群组中的会话上下文至关重要。

统一登录站点群（Federated Login Group）允许多个 Blocklet 共享一个用户会话，为用户在它们之间导航时提供无缝体验。一个 Blocklet 作为主应用处理身份验证，而其他 Blocklet 则是成员。

<!-- DIAGRAM_IMAGE_START:architecture:16:9 -->
![FederatedService](assets/diagram/federated-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## 常见用例：构建应用切换器

`FederatedService` 最常见的用例是构建一个 UI 组件，列出群组中的所有应用，允许用户轻松地在它们之间切换。`getApps()` 方法就是专为此目的设计的。

```javascript Example: Fetching Apps for a UI Component icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

// 获取统一登录站点群中的所有应用列表
// 主应用将始终位于列表的第一个。
const apps = sdk.federated.getApps();

console.log('可用应用：', apps);

// 然后，您可以使用此 'apps' 数组来渲染下拉菜单、
// 侧边栏或任何其他导航组件。
apps.forEach(app => {
  console.log(`应用名称: ${app.appName}, URL: ${app.appUrl}`);
});
```

## API 参考

### getApps()

检索与当前统一登录上下文相关的应用列表。它智能地结合了主应用和当前应用，确保在启用统一登录时主应用始终排在第一位。

**返回**

<x-field data-name="" data-type="Array<AppInfo | ServerInfo>">
  <x-field-desc markdown>应用信息对象的数组。如果启用了统一登录，主应用始终是第一个元素。</x-field-desc>
</x-field>

**示例**

```javascript icon=logos:javascript
const appList = sdk.federated.getApps();
console.log(appList);
```

**示例响应**

```json
[
  {
    "appId": "z1masterAppDid",
    "appName": "主应用",
    "appDescription": "该群组的主应用。",
    "appLogo": "/assets/logo.png",
    "appPid": "z8tmasterAppPid",
    "appUrl": "https://master.example.com",
    "version": "1.2.0",
    "sourceAppPid": "z8tmasterAppPid",
    "provider": "wallet"
  },
  {
    "appId": "z1currentAppDid",
    "appName": "当前成员应用",
    "appDescription": "您当前正在使用的应用。",
    "appLogo": "/assets/logo.png",
    "appPid": "z8tcurrentAppPid",
    "appUrl": "https://member.example.com",
    "version": "1.0.0",
    "sourceAppPid": null,
    "provider": "wallet"
  }
]
```

### getCurrentApp()

获取当前正在运行的应用信息。这可以是一个标准的 Blocklet，也可以是 Blocklet Server 本身。

**返回**

<x-field data-name="" data-type="AppInfo | ServerInfo | null">
  <x-field-desc markdown>包含当前应用详细信息的对象，如果无法确定，则为 `null`。</x-field-desc>
</x-field>

**示例**

```javascript icon=logos:javascript
const currentApp = sdk.federated.getCurrentApp();
if (currentApp) {
  console.log(`您当前位于：${currentApp.appName}`);
}
```

### getFederatedApp()

获取统一登录站点群中主应用的信息。如果当前应用不属于统一登录站点群，此方法将返回 `null`。

**返回**

<x-field data-name="" data-type="AppInfo | null">
  <x-field-desc markdown>包含主应用详细信息的对象，如果未处于统一登录模式，则为 `null`。</x-field-desc>
</x-field>

**示例**

```javascript icon=logos:javascript
const masterApp = sdk.federated.getFederatedApp();
if (masterApp) {
  console.log(`主应用是：${masterApp.appName}`);
}
```

### getFederatedEnabled()

检查统一登录站点群功能是否已启用并获得用户批准。

**返回**

<x-field data-name="" data-type="boolean">
  <x-field-desc markdown>如果统一登录已配置且状态为“已批准”，则返回 `true`，否则返回 `false`。</x-field-desc>
</x-field>

**示例**

```javascript icon=logos:javascript
const isFederated = sdk.federated.getFederatedEnabled();
if (isFederated) {
  console.log('统一登录已激活。');
} else {
  console.log('这是一个独立应用。');
}
```

### getTrustedDomains()

异步获取为统一登录站点群配置的受信任域列表。

**返回**

<x-field data-name="" data-type="Promise<Array<string>>">
  <x-field-desc markdown>一个解析为受信任域字符串数组的 Promise。</x-field-desc>
</x-field>

**示例**

```javascript icon=logos:javascript
async function logTrustedDomains() {
  try {
    const domains = await sdk.federated.getTrustedDomains();
    console.log('受信任的域：', domains);
  } catch (error) {
    console.error('获取受信任的域失败：', error);
  }
}

logTrustedDomains();
```

### getBlockletData()

异步获取并解析来自给定应用 URL 的 `__blocklet__.js` 元数据文件。此方法包含缓存以避免冗余的网络请求。

**参数**

<x-field-group>
  <x-field data-name="appUrl" data-type="string" data-required="true" data-desc="您想获取其数据的 Blocklet 的基本 URL。"></x-field>
  <x-field data-name="force" data-type="boolean" data-default="false" data-required="false" data-desc="如果为 true，则绕过缓存并获取最新数据。"></x-field>
</x-field-group>

**返回**

<x-field data-name="" data-type="Promise<any | null>">
  <x-field-desc markdown>一个解析为从 `__blocklet__.js` 解析出的 JSON 数据的 Promise，失败时为 `null`。</x-field-desc>
</x-field>

**示例**

```javascript icon=logos:javascript
async function fetchMetadata(url) {
  const metadata = await sdk.federated.getBlockletData(url);
  if (metadata) {
    console.log(`${url} 的元数据：`, metadata.name, metadata.version);
  }
}

fetchMetadata('https://some-blocklet.example.com');
```

## 类型

这些是 `FederatedService` 方法返回的主要数据结构。

### AppInfo

代表一个标准的 Blocklet 应用。

```typescript AppInfo Type icon=material-symbols:data-object-outline
type AppInfo = {
  appId: string;
  appName: string;
  appDescription: string;
  appLogo: string;
  appPid: string;
  appUrl: string;
  version: string;
  sourceAppPid: string;
  provider: string;
};
```

### ServerInfo

代表 Blocklet Server 实例。

```typescript ServerInfo Type icon=material-symbols:data-object-outline
type ServerInfo = {
  appId: string;
  appName: string;
  appDescription: string;
  appUrl: string;
  sourceAppPid: string;
  provider: string;
  type: 'server';
};
```

---

现在您已了解如何使用统一登录应用，您可能希望管理用户在不同设备上的登录会话。请继续阅读 [UserSessionService](./api-services-user-session.md) 文档以了解更多信息。