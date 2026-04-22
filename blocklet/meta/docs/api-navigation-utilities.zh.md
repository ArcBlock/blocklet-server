# 导航工具

这些函数是在基于 Blocklet 的应用程序中构建动态用户界面的引擎。它们解析并处理来自 blocklet 元数据（`blocklet.yml`）及其当前状态的 `navigation` 属性，将主 blocklet 及其所有子组件的导航项聚合为一个统一的、可供渲染的结构。

这些工具解决的核心挑战是复杂性管理。在复合应用程序中，每个组件都可以声明自己的导航项。这些工具能够智能地合并这些声明，根据每个组件的挂载点解析路径前缀，处理国际化（i18n），过滤掉重复或不可访问的项，并将所有内容组织到逻辑区域（如 `header`、`footer`、`userCenter`）中。

## 核心处理流程

下图说明了来自不同来源的原始导航元数据如何被转换为最终的、结构化的 UI 列表的高层处理过程。

<!-- DIAGRAM_IMAGE_START:flowchart:16:9 -->
![Navigation Utilities](assets/diagram/navigation-utilities-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## 主要函数

### `parseNavigation(blocklet, options)`

这是处理导航数据的主要函数。它协调整个工作流程，从解析 `blocklet.yml` 文件中的内置导航，到将它们与存储在数据库中的用户自定义项合并。

**参数**

<x-field-group>
  <x-field data-name="blocklet" data-type="object" data-required="true" data-desc="完整的 blocklet 状态对象，包括 `meta`、`children` 和 `settings.navigations`。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="用于解析过程的可选配置。">
    <x-field data-name="beforeProcess" data-type="(data: any) => any" data-required="false" data-desc="一个可选函数，用于在压缩和修补内置导航列表之前对其进行预处理。"></x-field>
  </x-field>
</x-field-group>

**返回值**

一个包含已处理导航数据的对象：

<x-field-group>
  <x-field data-name="navigationList" data-type="NavigationItem[]" data-desc="最终合并和清理后的导航项列表，可供渲染。这是主要输出。"></x-field>
  <x-field data-name="components" data-type="ComponentItem[]" data-desc="一个包含所有声明了导航的子组件的数组，包括它们的名称、链接和标题。"></x-field>
  <x-field data-name="builtinList" data-type="NavigationItem[]" data-desc="仅从 `blocklet.yml` 文件派生出的已处理导航项列表，在与设置中的自定义导航合并之前。"></x-field>
</x-field-group>

**使用示例**

```javascript 基本用法 icon=logos:javascript
import { parseNavigation } from '@blocklet/meta/lib/navigation';

// 一个简化的 blocklet 状态对象
const blockletState = {
  did: 'z1...',
  meta: {
    name: 'my-app',
    title: 'My App',
    navigation: [
      { id: 'home', title: 'Home', link: '/' },
      { id: 'dashboard', title: 'Dashboard', component: 'dashboard-blocklet' },
    ],
  },
  children: [
    {
      did: 'z2...',
      mountPoint: '/dashboard',
      meta: {
        name: 'dashboard-blocklet',
        title: 'Dashboard',
        navigation: [
          { id: 'overview', title: 'Overview', link: '/overview' },
        ],
      },
    },
  ],
  settings: {
    // 来自数据库的自定义导航项
    navigations: [
      {
        id: 'external-link',
        title: 'External Site',
        link: 'https://example.com',
        section: 'header',
        from: 'db',
        visible: true,
      },
    ],
  },
};

const { navigationList, components } = parseNavigation(blockletState);

console.log(navigationList);
/*
输出一个类似这样的结构化数组：
[
  { id: '/home', title: 'Home', link: '/', ... },
  {
    id: '/dashboard/overview',
    title: 'Overview',
    link: '/dashboard/overview',
    component: 'dashboard-blocklet',
    ...
  },
  { id: 'external-link', title: 'External Site', ... }
]
*/
console.log(components);
/*
输出组件信息：
[
  {
    did: 'z2...',
    name: 'dashboard-blocklet',
    link: '/dashboard',
    title: 'Dashboard',
    ...
  }
]
*/
```

## 辅助函数

虽然 `parseNavigation` 是一个一体化解决方案，但该库也导出了几个底层的辅助函数。这些函数对于您可能需要对导航数据执行自定义操作的高级用例非常有用。

<x-cards data-columns="2">
  <x-card data-title="deepWalk" data-icon="lucide:git-commit">
    一个通用工具，用于递归遍历树状对象，并对每个节点应用回调函数。
  </x-card>
  <x-card data-title="flattenNavigation" data-icon="lucide:merge">
    将嵌套的导航树转换为扁平数组，可选地指定转换深度。
  </x-card>
  <x-card data-title="nestNavigationList" data-icon="lucide:git-branch-plus">
    从一个扁平数组中重建嵌套的导航树，数组中的项目具有 `parent` ID 属性。
  </x-card>
  <x-card data-title="splitNavigationBySection" data-icon="lucide:columns">
    将属于多个区域的导航项分解为每个区域的独立项。
  </x-card>
  <x-card data-title="filterNavigation" data-icon="lucide:filter">
    通过移除标记为 `visible: false` 的项目或组件缺失的项目来过滤导航列表。
  </x-card>
  <x-card data-title="joinLink" data-icon="lucide:link">
    智能地将父链接与子链接组合起来，正确处理前缀和绝对 URL。
  </x-card>
</x-cards>

### `flattenNavigation(list, options)`

此函数接收一个导航项树，并将其扁平化为单层数组。它对于准备导航数据以在不支持深度嵌套的菜单中显示或为了更轻松地进行处理特别有用。

**参数**

<x-field-group>
  <x-field data-name="list" data-type="NavigationItem[]" data-required="true" data-desc="树状结构的导航列表。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="用于扁平化的配置选项。">
    <x-field data-name="depth" data-type="number" data-default="1" data-required="false" data-desc="树应被扁平化的深度。深度为 1 表示完全扁平化。"></x-field>
    <x-field data-name="transform" data-type="(current, parent) => any" data-required="false" data-desc="一个在扁平化过程中转换每个项目的函数。"></x-field>
  </x-field>
</x-field-group>

**示例**

```javascript 扁平化导航树 icon=logos:javascript
const nestedNav = [
  {
    id: 'parent1',
    title: 'Parent 1',
    items: [
      { id: 'child1a', title: 'Child 1a' },
      { id: 'child1b', title: 'Child 1b' },
    ],
  },
];

const flatNav = flattenNavigation(nestedNav, { depth: 2 }); // 扁平化至 2 级深度

console.log(flatNav);
/*
[
  { id: 'parent1', title: 'Parent 1' },
  { id: 'child1a', title: 'Child 1a' },
  { id: 'child1b', title: 'Child 1b' }
]
*/
```

### `nestNavigationList(list)`

`flattenNavigation` 的逆向操作。此函数接收一个扁平的导航项数组，其中子项通过 `parent` ID 引用其父项，并重建原始的树形结构。

**参数**

<x-field data-name="list" data-type="NavigationItem[]" data-required="true" data-desc="一个包含 `id` 和 `parent` 属性的扁平导航项数组。"></x-field>

**示例**

```javascript 从扁平列表构建树 icon=logos:javascript
const flatNav = [
  { id: 'parent1', title: 'Parent 1', section: 'header' },
  { id: 'child1a', title: 'Child 1a', parent: 'parent1', section: 'header' },
  { id: 'root2', title: 'Root 2', section: 'header' },
];

const nestedNav = nestNavigationList(flatNav);

console.log(nestedNav);
/*
[
  {
    id: 'parent1',
    title: 'Parent 1',
    section: 'header',
    items: [ { id: 'child1a', title: 'Child 1a', ... } ],
  },
  { id: 'root2', title: 'Root 2', section: 'header' },
]
*/
```

---

这些工具为在复杂的、基于组件的应用程序中管理导航提供了一个全面的工具包。要了解如何格式化这些导航项中使用的 URL 和路径，请继续阅读 [URL 和路径工具](./api-url-path-utilities.md) 文档。
