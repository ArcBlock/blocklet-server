# 组合 (组件)

Blocklet 组合是一项强大的功能，它允许你通过组装更小的、独立的 Blocklet 来构建复杂的模块化应用程序。这种方法促进了可重用性、关注点分离和更轻松的维护。`blocklet.yml` 文件中的 `components` 属性是此功能的基础，用于定义一个 Blocklet 对其他 Blocklet 的依赖关系。

## 核心概念：父子关系

组合的核心是建立一种父子关系。一个主 Blocklet（父级）可以声明一个它需要运行的其他 Blocklet（子级或组件）的列表。当用户安装父 Blocklet 时，Blocklet Server 会自动解析、获取并安装其所有必需的组件，从而将多个部分组合成一个单一、内聚的应用程序。

<!-- DIAGRAM_IMAGE_START:architecture:16:9 -->
![Composition (Components)](assets/diagram/composition-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## `components` 属性规范

`components` 属性是一个对象数组，其中每个对象定义一个子 Blocklet。以下是每个组件对象的关键字段：

<x-field-group>
  <x-field data-name="source" data-type="object" data-required="true">
    <x-field-desc markdown>指定在哪里找到组件。它包含一个 `url` 或一个 `store` 和 `name`。</x-field-desc>
  </x-field>
  <x-field data-name="required" data-type="boolean" data-required="false">
    <x-field-desc markdown>如果为 `true`，则父 Blocklet 在没有此组件的情况下无法安装或启动。默认为 `false`。</x-field-desc>
  </x-field>
  <x-field data-name="title" data-type="string" data-required="false">
    <x-field-desc markdown>在安装过程中为组件建议的显示标题。用户可以覆盖此值。</x-field-desc>
  </x-field>
  <x-field data-name="description" data-type="string" data-required="false">
    <x-field-desc markdown>在安装过程中为组件建议的描述。</x-field-desc>
  </x-field>
  <x-field data-name="mountPoint" data-type="string" data-required="false">
    <x-field-desc markdown>建议组件应挂载的 URL 路径前缀。例如，后端服务的 `/api`。用户可以在设置过程中更改此项。</x-field-desc>
  </x-field>
  <x-field data-name="name" data-type="string" data-required="false" data-deprecated="true">
    <x-field-desc markdown>用于向后兼容的旧字段。建议依赖 `source` 对象中的 `name`。</x-field-desc>
  </x-field>
</x-field-group>

### 定义组件的 `source`

`source` 对象是必需的，它告诉 Blocklet Server 如何定位和下载组件。它有两种主要形式：

1.  **从 Blocklet Store (推荐)**：这是标准方法。你需要指定 Store 的 URL、组件的名称和一个版本范围。
    <x-field-group>
      <x-field data-name="store" data-type="string" data-required="true" data-desc="Blocklet Store API 的 URL。"></x-field>
      <x-field data-name="name" data-type="string" data-required="true" data-desc="组件 Blocklet 的唯一名称。"></x-field>
      <x-field data-name="version" data-type="string" data-required="false" data-default="latest">
        <x-field-desc markdown>一个语义化版本范围 (例如 `^1.2.3`, `~2.0.0`, `latest`)。</x-field-desc>
      </x-field>
    </x-field-group>

2.  **从直接 URL**：这允许你直接链接到组件的清单文件 (`blocklet.yml` 或 `blocklet.json`) 或其 tarball 包。
    <x-field-group>
      <x-field data-name="url" data-type="string | string[]" data-required="true" data-desc="单个 URL 字符串或用于冗余的 URL 字符串数组。"></x-field>
      <x-field data-name="version" data-type="string" data-required="false">
        <x-field-desc markdown>一个语义化版本范围，用于与链接的清单文件中指定的版本进行验证。</x-field-desc>
      </x-field>
    </x-field-group>

### `blocklet.yml` 配置示例

以下是一个片段，演示了如何在你的 `blocklet.yml` 文件中声明组件。

```yaml blocklet.yml icon=mdi:file-document-outline
name: 'my-composite-blog'
did: 'z8iZexampleDidForCompositeBlog'
version: '1.0.0'
title: '我的组合博客'
description: '一个由几个较小的 Blocklet 构建的博客应用程序。'

# ... 其他属性

components:
  # 从 Blocklet Store 获取的组件 (推荐)
  - name: 'blog-api-service' # 向后兼容的名称
    required: true
    title: '博客 API 服务'
    description: '处理所有后端逻辑和数据库交互。'
    mountPoint: '/api/blog'
    source:
      store: 'https://store.blocklet.dev/api/blocklets'
      name: 'blog-api-service'
      version: '^1.0.0'

  # 从直接 URL 获取的组件
  - name: 'blog-frontend-ui'
    required: true
    title: '博客用户界面'
    mountPoint: '/'
    source:
      url: 'https://github.com/me/blog-frontend/releases/download/v2.1.0/blocklet.yml'
      version: '2.1.0'
```

此配置定义了一个依赖于另外两个 Blocklet 的博客应用程序：一个后端 API 服务和一个前端 UI。两者都标记为 `required`。

## 依赖解析

Blocklet 组合可以嵌套；一个组件可以拥有自己的组件。为了管理这种复杂性，系统需要解析整个依赖树以确定正确的安装顺序。`@blocklet/meta` 库为此提供了一个实用函数。

### `getRequiredComponentsLayers()`

该函数遍历依赖关系图，并返回一个表示依赖层级的二维数组。这些数组从最低层级的依赖项到最高层级进行排序，确保基础组件在依赖于它们的组件之前安装。

**使用示例**

```javascript Resolving Dependency Order icon=logos:javascript
import { getRequiredComponentsLayers } from '@blocklet/meta';

// 所有可用 Blocklet 及其依赖项的简化列表
const allBlocklets = [
  {
    meta: { did: 'did:app:parent' },
    dependencies: [{ did: 'did:app:child', required: true }],
  },
  {
    meta: { did: 'did:app:child' },
    dependencies: [{ did: 'did:app:grandchild', required: true }],
  },
  {
    meta: { did: 'did:app:grandchild' },
    dependencies: [],
  },
  {
    meta: { did: 'did:app:optional_component' },
    dependencies: [],
  },
];

const layers = getRequiredComponentsLayers({
  targetDid: 'did:app:parent',
  children: allBlocklets,
});

console.log(layers);
// 预期输出：[['did:app:grandchild'], ['did:app:child']]
// 这意味着 'grandchild' 必须首先安装，然后是 'child'。
```

这个实用程序对于确保复杂、多层应用程序的稳定和可预测的安装过程至关重要。