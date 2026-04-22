# BlockletService

`BlockletService` 提供了访问 blocklet 元数据的方法。此元数据由 `Blocklet` 对象表示，包含应用程序名称、URL 前缀、版本和组件挂载点等基本信息。

该服务可以通过两种主要方式检索此信息：

1.  **客户端：** 通过读取全局 `window.blocklet` 对象，当你的代码在 blocklet 的前端运行时，该对象会自动可用。
2.  **远程获取：** 通过从指定的基 URL 获取 blocklet 的元数据。这对于服务器端环境或从外部应用程序与 blocklet 交互非常有用。

为了提高性能，该服务为远程获取的 blocklet 数据实现了一个内存缓存，持续时间为 60 秒。

---

## 方法

### getBlocklet()

获取 blocklet 的元数据对象。此方法的行为根据提供的参数而变化。

-   在客户端无参数调用时，它会同步返回 `window.blocklet`。
-   当使用 `baseUrl` 调用时，它会异步从远程 URL 获取元数据。

**参数**

<x-field-group>
  <x-field data-name="baseUrl" data-type="string" data-required="false" data-desc="从中获取元数据的 blocklet 的基 URL。服务器端使用时必需。"></x-field>
  <x-field data-name="force" data-type="boolean" data-default="false" data-required="false" data-desc="如果为 true，将绕过缓存并从远程 URL 获取最新数据。"></x-field>
</x-field-group>

**返回**

<x-field data-name="Promise<Blocklet> | Blocklet" data-type="Promise<Blocklet> | Blocklet" data-desc="远程获取时返回一个解析为 blocklet 元数据对象的 Promise，或在客户端上下文中直接返回该对象。"></x-field>

**示例**

```javascript 在客户端获取 Blocklet icon=logos:javascript
// 此代码假定它在 blocklet 的前端环境中运行

async function logBlockletName() {
  try {
    // 在客户端，如果数据已预加载，getBlocklet() 可以是同步的
    const blocklet = await sdk.blocklet.getBlocklet();
    console.log('Blocklet 名称:', blocklet.appName);
  } catch (error) {
    console.error('获取 blocklet 信息失败:', error);
  }
}

logBlockletName();
```

```javascript 从 URL 获取 Blocklet icon=logos:javascript
async function fetchRemoteBlocklet(url) {
  try {
    console.log(`正在从 ${url} 获取 blocklet 信息...`);
    const blocklet = await sdk.blocklet.getBlocklet(url);
    console.log(`成功获取: ${blocklet.appName} v${blocklet.version}`);

    // 再次获取，这次应该来自缓存
    const cachedBlocklet = await sdk.blocklet.getBlocklet(url);
    console.log('从缓存中获取:', cachedBlocklet.appName);

    // 强制重新获取，绕过缓存
    const freshBlocklet = await sdk.blocklet.getBlocklet(url, true);
    console.log('强制重新获取:', freshBlocklet.appName);
  } catch (error) {
    console.error('获取远程 blocklet 失败:', error);
  }
}

fetchRemoteBlocklet('https://store.blocklet.dev');
```

### loadBlocklet()

这是一个客户端实用方法，可将 `__blocklet__.js` 脚本动态注入到文档的 `<head>` 中。此脚本会填充 `window.blocklet` 对象，使元数据全局可用。这对于本身不是 blocklets 但需要与 blocklet 交互的应用程序特别有用。

> 注意：如果在服务器端（Node.js）环境中调用此方法，它将失败。

**返回**

<x-field data-name="Promise<void>" data-type="Promise<void>" data-desc="一个 Promise，在脚本成功加载时解析，如果出现错误则拒绝。"></x-field>

**示例**

```javascript 动态加载 Blocklet 脚本 icon=logos:javascript
async function initializeBlockletData() {
  try {
    await sdk.blocklet.loadBlocklet();
    console.log('Blocklet 脚本加载成功。');
    // 现在 window.blocklet 可用
    console.log('Blocklet 名称:', window.blocklet.appName);
  } catch (error) {
    console.error('加载 blocklet 脚本失败:', error);
  }
}

// 在浏览器环境中运行此函数
initializeBlockletData();
```

### getPrefix()

一个用于获取 blocklet URL 前缀的便捷方法。前缀是 blocklet 服务的基路径（例如 `/` 或 `/my-blocklet`）。

**参数**

<x-field data-name="blocklet" data-type="Blocklet" data-required="false" data-desc="一个可选的 Blocklet 对象。如果提供，将返回其 prefix 属性。"></x-field>

**返回**

<x-field data-name="string | null" data-type="string | null" data-desc="字符串前缀（例如 '/app'）或默认的 '/'。在 window 不可用且未传递 blocklet 对象的服务器端环境中，它返回 null。"></x-field>

**示例**

```javascript 获取 URL 前缀 icon=logos:javascript
// 假设此代码在 blocklet 内部的客户端运行
const prefix = sdk.blocklet.getPrefix();
console.log('当前 blocklet 前缀:', prefix);

// 或者，你可以传递一个已经获取的 Blocklet 对象
async function logPrefixForRemoteBlocklet(url) {
  const remoteBlocklet = await sdk.blocklet.getBlocklet(url);
  const remotePrefix = sdk.blocklet.getPrefix(remoteBlocklet);
  console.log(`${remoteBlocklet.appName} 的前缀是:`, remotePrefix);
}

logPrefixForRemoteBlocklet('https://store.blocklet.dev');
```

---

## Blocklet 对象

`getBlocklet()` 方法返回一个 `Blocklet` 对象，其中包含有关应用程序的全面元数据。以下是一些最常用的属性。

<x-field-group>
  <x-field data-name="did" data-type="string" data-desc="blocklet 的去中心化标识符（DID）。"></x-field>
  <x-field data-name="appName" data-type="string" data-desc="应用程序的人类可读名称。"></x-field>
  <x-field data-name="appUrl" data-type="string" data-desc="应用程序的完整公共 URL。"></x-field>
  <x-field data-name="prefix" data-type="string" data-desc="blocklet 挂载的 URL 前缀。"></x-field>
  <x-field data-name="version" data-type="string" data-desc="blocklet 的版本（例如 '1.2.3'）。"></x-field>
  <x-field data-name="isComponent" data-type="boolean" data-desc="指示 blocklet 是否为组件。"></x-field>
  <x-field data-name="componentMountPoints" data-type="BlockletComponent[]" data-desc="此 blocklet 挂载的组件数组。"></x-field>
  <x-field data-name="theme" data-type="BlockletTheme" data-desc="包含主题配置（如颜色和徽标）的对象。"></x-field>
  <x-field data-name="navigation" data-type="BlockletNavigation[]" data-desc="用于 blocklet UI 的导航项数组。"></x-field>
  <x-field data-name="serverDid" data-type="string" data-desc="运行 blocklet 的 Blocklet Server 实例的 DID。"></x-field>
</x-field-group>

**响应示例**

```json Blocklet 对象示例 icon=mdi:code-json
{
  "did": "z8iZz...",
  "appId": "z1s...",
  "appName": "Blocklet 商店",
  "appDescription": "一个 blocklets 的市场",
  "appUrl": "https://store.blocklet.dev",
  "prefix": "/",
  "version": "1.16.29",
  "isComponent": false,
  "theme": {
    "logo": "logo.png",
    "colors": {
      "primary": "#4F6AF6"
    }
  },
  "navigation": [
    {
      "id": "home",
      "title": "首页",
      "link": "/"
    }
  ],
  "componentMountPoints": [],
  "serverDid": "z2qaD...",
  "webWalletUrl": "https://web.abtwallet.io"
}
```

有关所有属性的完整列表，请参阅 [类型](./api-types.md) 参考页面。

---

## 后续步骤

现在你知道了如何检索 blocklet 元数据，你可能想了解如何获取其挂载组件的信息。请继续下一节，了解 `ComponentService`。

<x-card data-title="ComponentService" data-icon="lucide:box" data-cta="阅读更多" data-href="/api/services/component">
  用于获取有关已挂载组件信息并为其构建 URL 的 API。
</x-card>