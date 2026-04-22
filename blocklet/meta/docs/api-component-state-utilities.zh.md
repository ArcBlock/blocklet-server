# 组件与状态工具

`@blocklet/meta` 库提供了一套全面的工具函数，旨在简化与 `BlockletState` 对象的交互。Blocklet（尤其是复合型 Blocklet）被表示为一个组件树。这些工具提供了强大而高效的方法来遍历此树、查找特定组件、检查其状态以及为运行时操作、UI 渲染和管理任务提取关键信息。

本节涵盖了树遍历、组件搜索、状态检查、配置管理和信息提取的函数。

## 树遍历

这些函数允许您遍历 blocklet 应用的组件树。它们是将操作应用于每个组件或聚合数据的基础。

### `forEachBlocklet` 和 `forEachBlockletSync`

核心遍历函数。`forEachBlocklet` 是异步的，可以串行（默认）或并行运行，而 `forEachBlockletSync` 是其同步对应版本。

```typescript Function Signature icon=logos:typescript
function forEachBlocklet(
  blocklet: TComponentPro,
  cb: (blocklet: TComponentPro, context: object) => any,
  options?: {
    parallel?: boolean;
    concurrencyLimit?: number;
    sync?: boolean;
  }
): Promise<any> | null;

function forEachBlockletSync(
  blocklet: any,
  cb: Function
): void;
```

回调函数 `cb` 接收当前组件和一个包含 `{ parent, root, level, ancestors, id }` 的上下文对象。

**示例：收集所有组件的 DID**

```javascript icon=logos:javascript
import { forEachBlockletSync } from '@blocklet/meta/lib/util';

const appState = {
  meta: { did: 'z1' },
  children: [
    { meta: { did: 'z2' } },
    {
      meta: { did: 'z3' },
      children: [{ meta: { did: 'z4' } }],
    },
  ],
};

const allDids = [];
forEachBlockletSync(appState, (component) => {
  if (component.meta?.did) {
    allDids.push(component.meta.did);
  }
});

console.log(allDids);
// 输出：['z1', 'z2', 'z3', 'z4']
```

### `forEachChild` 和 `forEachChildSync`

这些是 `forEachBlocklet` 的封装函数，可以方便地遍历 blocklet 的所有后代，跳过根 blocklet 本身（其中 `level > 0`）。

## 查找和筛选组件

在状态树中定位特定组件是一个常见需求。这些函数提供了多种方法，可以根据不同标准查找一个或多个组件。

### `findComponent`

一个通用的搜索函数，它遍历组件树并返回第一个满足所提供谓词函数的组件。

```typescript Function Signature icon=logos:typescript
function findComponent(
  blocklet: TComponent,
  isEqualFn: (component: TComponent, context: { ancestors: Array<TComponent> }) => boolean
): TComponent | null;
```

**示例：通过 `bundleName` 查找组件**

```javascript icon=logos:javascript
import { findComponent } from '@blocklet/meta/lib/util';

const appState = {
  meta: { did: 'z1', bundleName: 'app' },
  children: [
    { meta: { did: 'z2', bundleName: 'component-a' } },
    { meta: { did: 'z3', bundleName: 'component-b' } },
  ],
};

const componentB = findComponent(
  appState,
  (component) => component.meta?.bundleName === 'component-b'
);

console.log(componentB.meta.did);
// 输出：'z3'
```

### `findComponentById`

`findComponent` 的一个特化版本，通过其唯一的复合 ID（例如 `app-did/component-did`）查找组件。

```typescript Function Signature icon=logos:typescript
function findComponentById(
  blocklet: TComponent,
  componentId: string | string[]
): TComponent | null;
```

### `filterComponentsV2`

遍历应用的直接子组件，并返回一个包含所有满足谓词函数的组件的数组。

## 身份与命名

这些工具帮助生成和检索应用状态内组件的各种标识符和名称。

| Function | Description |
|---|---|
| `getComponentId` | 使用其祖先的 DID 为组件构建一个唯一的、基于路径的 ID（例如 `root_did/child_did`）。 |
| `getComponentName` | 使用其祖先的名称为组件构建一个唯一的、基于路径的名称。 |
| `getParentComponentName` | 从给定的组件名称路径中提取父组件的名称。 |
| `getAppName` | 检索 blocklet 的显示名称，优先使用 `BLOCKLET_APP_NAME` 环境变量，其次是元数据。 |
| `getAppDescription` | 检索 blocklet 的描述，优先使用 `BLOCKLET_APP_DESCRIPTION`。 |
| `getComponentProcessId` | 为组件生成一个文件系统安全的进程 ID，对长名称使用 MD5 哈希以防止文件系统错误。 |

## 配置与状态管理

管理配置至关重要，尤其是在可以共享设置的复合 blocklet 中。这些辅助函数简化了此过程。

### `getSharedConfigObj`

为应用内的特定组件计算共享配置对象。它会智能地合并来自父应用和标记为 `shared: true` 的兄弟组件的配置。

### `getAppMissingConfigs` 和 `getComponentMissingConfigs`

这些函数对验证至关重要。它们扫描一个应用或单个组件，并返回所有标记为 `required: true` 但尚未被赋值（无论是直接赋值还是通过共享配置机制）的配置列表。

**示例：检查缺失的配置**

```javascript icon=logos:javascript
import { getAppMissingConfigs } from '@blocklet/meta/lib/util';

const appWithMissingConfig = {
  meta: { did: 'z1' },
  children: [
    {
      meta: { did: 'z2' },
      configs: [
        { key: 'API_KEY', required: true, value: null, description: 'Service API Key' },
      ],
    },
  ],
};

const missing = getAppMissingConfigs(appWithMissingConfig);

console.log(missing);
// 输出：[{ did: 'z2', key: 'API_KEY', description: 'Service API Key' }]
```

### `wipeSensitiveData`

一个以安全为中心的工具，它会创建 blocklet 状态对象的深层克隆并编辑所有敏感信息。它将标记为 `secure: true` 的字段值和某些敏感环境变量（如 `BLOCKLET_APP_SK`）的值替换为 `__encrypted__`。

## 状态检查

这些布尔函数提供了一种简单的方法来检查 blocklet 或组件的当前状态，而无需直接处理原始状态码。

| Function | Description | Corresponding Statuses |
|---|---|---|
| `isRunning` | 检查组件是否处于稳定的运行状态。 | `running` |
| `isInProgress` | 检查组件是否处于过渡状态。 | `downloading`、`installing`、`starting`、`stopping`、`upgrading` 等。 |
| `isBeforeInstalled` | 检查组件是否尚未完成首次安装。 | `added`、`waiting`、`downloading`、`installing` |
| `isAccessible` | 检查组件的 Web 界面是否可能被访问。 | `running`、`waiting`、`downloading` |

## 接口与服务发现

用于查找在 blocklet 元数据中定义的接口和服务的工具。

| Function | Description |
|---|---|
| `findWebInterface` | 在组件的元数据中查找类型为 `web` 的第一个接口。 |
| `findDockerInterface` | 在组件的元数据中查找类型为 `docker` 的第一个接口。 |
| `findWebInterfacePort` | 检索映射到组件 Web 接口的主机端口。 |
| `getBlockletServices` | 返回一个扁平化列表，其中包含 blocklet 中所有组件定义的所有服务，包括它们的名称、协议和端口详细信息。 |

## 信息提取

这些函数从原始 blocklet 状态中提取特定的、经过处理的信息。

### `getComponentsInternalInfo`

此函数遍历一个 blocklet 应用，并返回一个结构化数组，其中包含每个组件的关键内部详细信息。这对于系统管理和跨服务通信非常有用。

**返回**

<x-field-group>
  <x-field data-name="components" data-type="array" data-desc="一个内部组件信息对象的数组。">
    <x-field data-name="title" data-type="string" data-desc="组件的显示标题。"></x-field>
    <x-field data-name="did" data-type="string" data-desc="组件的唯一 DID。"></x-field>
    <x-field data-name="name" data-type="string" data-desc="组件的机器可读名称。"></x-field>
    <x-field data-name="version" data-type="string" data-desc="组件的版本。"></x-field>
    <x-field data-name="mountPoint" data-type="string" data-desc="组件挂载的 URL 路径。"></x-field>
    <x-field data-name="status" data-type="number" data-desc="组件的数字状态码。"></x-field>
    <x-field data-name="port" data-type="number" data-desc="分配给组件 Web 接口的主机端口。"></x-field>
    <x-field data-name="containerPort" data-type="string" data-desc="Web 接口的内部容器端口。"></x-field>
    <x-field data-name="resourcesV2" data-type="array" data-desc="与组件捆绑的资源资产列表。">
      <x-field data-name="path" data-type="string" data-desc="资源的绝对路径。"></x-field>
      <x-field data-name="public" data-type="boolean" data-desc="指示资源是否可公开访问。"></x-field>
    </x-field>
    <x-field data-name="group" data-type="string" data-desc="组件的功能组（例如 'gateway'、'dapp'）。"></x-field>
  </x-field>
</x-field-group>

### `getMountPoints`

扫描整个组件树，并返回一个结构化列表，其中包含所有具有挂载点的组件，从而可以轻松构建导航或路由表。

### `getAppUrl`

通过分析其 `site.domainAliases` 来确定 blocklet 应用的主要面向用户的 URL。它会智能地对域名进行排序，以优先选择可访问的、非受保护的 URL。

## 其他工具

其他有用的检查和辅助函数的集合。

| Function | Description |
|---|---|
| `isFreeBlocklet` | 检查 blocklet 的支付价格是否为零。 |
| `isDeletableBlocklet` | 根据 `BLOCKLET_DELETABLE` 环境变量检查是否允许删除 blocklet。 |
| `hasRunnableComponent` | 确定应用是否包含任何可以运行的非网关组件。 |
| `isExternalBlocklet` | 检查 blocklet 是否由外部控制器管理。 |
| `isGatewayBlocklet` | 检查组件的组是否为 `gateway`。 |
| `isPackBlocklet` | 检查组件的组是否为 `pack`。 |
| `hasStartEngine` | 检查组件的元数据是否定义了可启动的引擎（例如 `main` 或 `docker.image`）。 |
| `hasMountPoint` | 根据组件的配置确定其是否应具有挂载点。 |
| `getBlockletChainInfo` | 从 blocklet 及其子组件中提取并整合链配置（类型、id、主机）。 |
| `checkPublicAccess`| 检查 blocklet 的安全配置是否允许公共访问。 |
