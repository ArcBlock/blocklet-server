# ComponentService

`ComponentService` 提供了一个便捷的 API，用于与主应用中挂载的组件 blocklet 进行交互。它允许您检索这些组件的元数据，并构建指向其页面或 API 端点的绝对 URL。

该服务依赖于 blocklet 的元数据。要了解如何加载此元数据，请参阅 [BlockletService 文档](./api-services-blocklet.md)。

## 实例化

与其他服务不同，`ComponentService` 必须手动实例化。这是因为它依赖于 `window.blocklet` 对象，该对象可能是异步加载的。为确保该服务能够访问完整的 blocklet 元数据，您应在 `blocklet` 对象可用后创建实例。

```javascript 实例化 ComponentService icon=logos:javascript
import { ComponentService } from '@blocklet/js-sdk';

// 假设 window.blocklet 已加载并可用
const componentService = new ComponentService();
```

## 方法

### getComponent()

检索特定挂载组件的完整元数据对象。

**参数**

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="组件的标识符。可以是其名称、标题或 DID。"></x-field>
</x-field-group>

**返回**

<x-field-group>
  <x-field data-name="BlockletComponent | undefined" data-type="object" data-desc="如果找到，则为 BlockletComponent 对象，否则为 undefined。"></x-field>
</x-field-group>

**示例**

```javascript 获取组件元数据 icon=logos:javascript
// 为演示目的模拟 window.blocklet 对象
window.blocklet = {
  componentMountPoints: [
    {
      did: 'z8iZzaC3ukTM81BCs4Ynawxbg1KAd3b3p6c7b',
      name: 'my-first-component',
      title: 'My First Component',
      mountPoint: '/components/my-first-component',
      status: 'started'
    },
    {
      did: 'z8iZzbF9tkyG27AQs5Ynawxbh2LBe4c4q7d8c',
      name: 'my-second-component',
      title: 'My Second Component',
      mountPoint: '/components/my-second-component',
      status: 'started'
    }
  ],
  // ... 其他 blocklet 属性
};

const componentService = new ComponentService();

// 按名称查找组件
const component = componentService.getComponent('my-first-component');
console.log(component);
```

**响应示例**

```json 响应 icon=mdi:code-json
{
  "did": "z8iZzaC3ukTM81BCs4Ynawxbg1KAd3b3p6c7b",
  "name": "my-first-component",
  "title": "My First Component",
  "mountPoint": "/components/my-first-component",
  "status": "started"
}
```

### getComponentMountPoint()

一个辅助方法，用于快速检索组件的 `mountPoint`。挂载点是组件从主应用域提供服务的相对 URL 路径。

**参数**

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="组件的标识符（名称、标题或 DID）。"></x-field>
</x-field-group>

**返回**

<x-field-group>
  <x-field data-name="mountPoint" data-type="string" data-desc="组件的 `mountPoint`，以字符串形式表示（例如，/components/my-component）。如果未找到组件，则返回空字符串。"></x-field>
</x-field-group>

**示例**

```javascript 获取挂载点 icon=logos:javascript
// 使用前一个示例中的同一个 componentService 实例
const mountPoint = componentService.getComponentMountPoint('my-first-component');

console.log(mountPoint);
// 预期输出: /components/my-first-component
```

### getUrl()

构建一个指向组件内资源的完整绝对 URL。这是创建指向其他组件链接的推荐方式，因为它能正确处理应用程序的基本 URL 和组件的特定挂载点。

**参数**

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="组件的标识符（名称、标题或 DID）。"></x-field>
  <x-field data-name="...parts" data-type="string[]" data-required="false" data-desc="一个或多个要附加到组件 URL 的路径段。"></x-field>
</x-field-group>

**返回**

<x-field-group>
  <x-field data-name="url" data-type="string" data-desc="一个完整的绝对 URL 字符串。"></x-field>
</x-field-group>

**示例**

```javascript 构建组件 URL icon=logos:javascript
// 模拟 window.blocklet 对象
window.blocklet = {
  appUrl: 'https://myapp.did.abtnet.io',
  componentMountPoints: [
    {
      name: 'api-component',
      title: 'API Component',
      mountPoint: '/api/v1',
      // ... 其他属性
    }
  ],
  // ... 其他属性
};

const componentService = new ComponentService();

// 构建指向组件内 API 端点的 URL
const userApiUrl = componentService.getUrl('api-component', 'users', '123');
console.log(userApiUrl);
// 预期输出: https://myapp.did.abtnet.io/api/v1/users/123

// 构建指向组件内页面的 URL
const settingsPageUrl = componentService.getUrl('api-component', 'settings');
console.log(settingsPageUrl);
// 预期输出: https://myapp.did.abtnet.io/api/v1/settings
```

## 类型

### BlockletComponent

此类型表示单个挂载组件的元数据。

<x-field-group>
  <x-field data-name="did" data-type="string" data-required="true" data-desc="组件的去中心化标识符 (DID)。"></x-field>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="组件的名称，在其 blocklet.yml 中定义。"></x-field>
  <x-field data-name="title" data-type="string" data-required="true" data-desc="组件的人类可读标题。"></x-field>
  <x-field data-name="mountPoint" data-type="string" data-required="true" data-desc="组件相对于主应用 URL 的挂载 URL 路径。"></x-field>
  <x-field data-name="status" data-type="string" data-required="true" data-desc="组件的当前状态（例如，'started'、'stopped'）。"></x-field>
</x-field-group>

---

现在您已经了解如何与组件交互，您可能想学习如何管理联合登录设置。更多详情请参阅 [FederatedService 文档](./api-services-federated.md)。