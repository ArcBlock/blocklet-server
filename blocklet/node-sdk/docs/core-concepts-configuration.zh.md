# 配置与环境

Blocklet SDK 提供了一种强大而统一的方式来管理应用程序的配置和环境变量。它将来自多个来源的设置聚合到一个易于使用的界面中，确保您的 Blocklet 能够访问所有必要的信息，从应用程序元数据到特定于组件的设置。

本节将介绍用于访问这些信息的两个主要导出：`env` 对象和 `components` 存储。

## env 对象

`env` 对象是一个集中的、只读的容器，用于存放组件在运行时可用的所有配置变量。SDK 通过合并来自多个来源的配置来自动填充此对象，这些来源包括默认值、应用程序级设置和特定于组件的环境文件。

您只需从 SDK 导入 `env` 即可访问任何配置属性。

```javascript icon=logos:javascript
import { env } from '@blocklet/sdk';

console.log(`Running in app: ${env.appName}`);
console.log(`My data directory is at: ${env.dataDir}`);

// Access user-defined preferences from the blocklet's settings page
const userApiKey = env.preferences.apiKey;
```

### 关键环境属性

虽然 `env` 对象包含许多属性，但以下是一些最常用的属性：

<x-field data-name="appName" data-type="string" data-desc="父应用程序的名称。"></x-field>
<x-field data-name="appUrl" data-type="string" data-desc="应用程序的完整公共 URL。"></x-field>
<x-field data-name="componentDid" data-type="string" data-desc="当前组件的去中心化 ID (DID)。"></x-field>
<x-field data-name="isComponent" data-type="boolean" data-desc="如果代码在组件上下文中运行，则此标志为 `true`。"></x-field>
<x-field data-name="dataDir" data-type="string" data-desc="组件专用数据存储目录的绝对路径。"></x-field>
<x-field data-name="cacheDir" data-type="string" data-desc="组件专用缓存目录的绝对路径。"></x-field>
<x-field data-name="serverVersion" data-type="string" data-desc="应用程序运行所在的 Blocklet Server 的版本。"></x-field>
<x-field data-name="preferences" data-type="Record<string, any>" data-desc="一个包含用户从 Blocklet 设置页面设置的自定义配置值的对象。"></x-field>


## components 存储

`components` 存储是一个数组，提供有关在同一应用程序实例中运行的所有其他组件的实时信息。这对于组件间通信至关重要，允许一个组件发现另一个组件的端点和状态。

```javascript icon=logos:javascript
import { components } from '@blocklet/sdk';

// Find a running API service component to make a request
const apiService = components.find(c => c.name === 'api-service' && c.status === 1);

if (apiService) {
  const apiUrl = apiService.webEndpoint;
  console.log(`Found API service at: ${apiUrl}`);
  // Now you can make a request to this URL
}
```

### 组件属性

`components` 数组中的每个对象都包含有关组件的详细信息：

<x-field data-name="did" data-type="string" data-desc="组件的去中心化 ID (DID)。"></x-field>
<x-field data-name="name" data-type="string" data-desc="组件的名称，在其 `blocklet.yml` 中定义。"></x-field>
<x-field data-name="mountPoint" data-type="string" data-desc="组件挂载的 URL 路径（例如 `/admin`、`/api`）。"></x-field>
<x-field data-name="webEndpoint" data-type="string" data-desc="组件的完整、可公开访问的 URL。"></x-field>
<x-field data-name="status" data-type="number" data-desc="组件的当前状态（例如，`1` 表示正在运行，`0` 表示已停止）。"></x-field>


## 配置加载流程

SDK 通过分层来自不同来源的配置来构建 `env` 对象。每个后续来源都可以覆盖前一个来源的值，从而提供清晰且可预测的优先级顺序。

<!-- DIAGRAM_IMAGE_START:architecture:16:9 -->
![Configuration & Environment](assets/diagram/configuration-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

这种分层方法提供了灵活性，允许开发人员和管理员在不同级别上配置 Blocklet。

## 动态更新

配置不仅仅是静态的。Blocklet SDK 会监听由 Blocklet Server 推送的运行时更改。例如，如果用户在 Blocklet 的配置页面上更新了某个设置，SDK 将自动更新 `env` 对象并发出一个事件。

您可以使用导出的 `events` 发射器来监听这些更改。

```javascript icon=logos:javascript
import { events, Events } from '@blocklet/sdk';

// Listen for any updates to the environment or preferences
events.on(Events.envUpdate, (updatedValues) => {
  console.log('Configuration was updated:', updatedValues);
  // You can now react to the change, e.g., re-initialize a service
});
```

这使您能够构建可以对配置更改做出反应而无需重新启动的应用程序。

---

现在您已经了解了如何访问配置和环境变量，您可以探索如何将它们用于更具体的任务。一个常见的用例是管理加密密钥和钱包，下一节将对此进行介绍。

<x-card data-title="下一步：钱包管理" data-icon="lucide:wallet" data-href="/core-concepts/wallet" data-cta="阅读更多">
  学习如何创建和管理用于签名和身份验证的钱包实例。
</x-card>