# UI 与主题

本节详细介绍 `blocklet.yml` 文件中的 `navigation` 和 `theme` 属性。这些属性有助于定义 blocklet 对用户界面的贡献，控制其在菜单中的显示方式，并指定其外观和感觉，以确保一致的用户体验。

正确配置这些字段，能让 blocklet 无缝集成到更大的应用程序中，为用户提供清晰的导航路径，并遵循既定的视觉准则。

## 导航

`navigation` 属性是一个对象数组，用于定义 blocklet 面向用户的菜单结构。它允许您指定将合并到父应用程序导航（如页眉、页脚或仪表盘）中的导航链接。该系统是可组合的，意味着父 blocklet 可以引用子组件，子组件的导航项将被智能地集成到父结构中。

### 导航项属性

`navigation` 数组中的每一项都是一个对象，可以包含以下字段：

<x-field-group>
  <x-field data-name="id" data-type="string" data-required="false">
    <x-field-desc markdown>导航项的唯一标识符。虽然是可选的，但最好提供一个 `id`，特别是对于可能被其他 blocklet 引用或扩展的项。ID 必须符合 JavaScript 变量命名规则。</x-field-desc>
  </x-field>
  <x-field data-name="title" data-type="string | object" data-required="true">
    <x-field-desc markdown>为导航项显示的文本。可以是一个简单的字符串，也可以是一个用于国际化 (i18n) 的对象，其中键是区域设置代码（例如，`en`、`zh`）。</x-field-desc>
  </x-field>
  <x-field data-name="description" data-type="string | object" data-required="false">
    <x-field-desc markdown>导航项的工具提示或补充文本。它也以与 `title` 相同的方式支持 i18n。</x-field-desc>
  </x-field>
  <x-field data-name="link" data-type="string | object" data-required="false">
    <x-field-desc markdown>导航项的目标 URL。可以是一个相对路径（例如，`/profile`），它将根据 blocklet 的挂载点进行解析，也可以是一个绝对 URL（例如，`https://www.arcblock.io`）。它也支持 i18n。</x-field-desc>
  </x-field>
  <x-field data-name="component" data-type="string" data-required="false">
    <x-field-desc markdown>子组件 blocklet 的名称或 DID。指定后，此导航项将作为其子导航条目的容器，这些条目将嵌套在其下。</x-field-desc>
  </x-field>
  <x-field data-name="section" data-type="string | array" data-required="false">
    <x-field-desc markdown>指定导航项应出现在 UI 的哪个位置。单个项可以属于多个部分。有效值包括：`header`、`footer`、`bottom`、`social`、`dashboard`、`sessionManager`、`userCenter` 和 `bottomNavigation`。</x-field-desc>
  </x-field>
  <x-field data-name="role" data-type="string | array" data-required="false">
    <x-field-desc markdown>定义允许查看此导航项的角色，从而为 UI 启用基于角色的访问控制 (RBAC)。</x-field-desc>
  </x-field>
  <x-field data-name="icon" data-type="string" data-required="false">
    <x-field-desc markdown>用于在导航项标题旁边显示的图标标识符。</x-field-desc>
  </x-field>
  <x-field data-name="visible" data-type="boolean" data-required="false" data-default="true">
    <x-field-desc markdown>控制导航项的默认可见性。</x-field-desc>
  </x-field>
  <x-field data-name="private" data-type="boolean" data-required="false" data-default="false">
    <x-field-desc markdown>如果为 `true`，则此项仅在用户查看自己的个人资料或用户中心时可见，在查看其他用户的个人资料时不可见。</x-field-desc>
  </x-field>
  <x-field data-name="items" data-type="array" data-required="false">
    <x-field-desc markdown>一个嵌套的导航项对象数组，允许创建下拉菜单或子菜单。</x-field-desc>
  </x-field>
</x-field-group>

### 示例：基本导航

这是一个 `navigation` 配置示例，它定义了一个指向 blocklet 主页的主链接和一个在页脚中的外部链接。

```yaml blocklet.yml
name: 'my-blocklet'
did: 'z8iZuf...s92'
version: '1.0.0'
title: '我的 Blocklet'

interfaces:
  - type: 'web'
    name: 'publicUrl'
    path: '/'
    prefix: '*'
    port: 'BLOCKLET_PORT'

navigation:
  - title: '首页'
    link: '/'
    section: 'header'
  - title:
      en: 'My Account'
      zh: '我的账户'
    link: '/profile'
    section: 'userCenter'
    role: ['guest', 'user']
    private: true
  - title: '关于我们'
    link: 'https://www.arcblock.io'
    section: 'footer'
    icon: 'mdi:info-outline'
```

### 示例：可组合导航

此示例演示了父 blocklet 如何将其导航与子组件组合。“Dashboard”条目将自动拉取并嵌套 `my-dashboard-component` 中定义的导航项。

```yaml 父 Blocklet (blocklet.yml) icon=mdi:file-document
# ... (父 blocklet 元数据)

components:
  - name: 'my-dashboard-component'
    source:
      store: 'https://store.arcblock.io/api'
      name: 'my-dashboard-component'

navigation:
  - title: '首页'
    link: '/'
    section: 'header'
  - title: '仪表盘'
    component: 'my-dashboard-component' # 引用子组件
    section: 'dashboard'
```

```yaml 子组件 (my-dashboard-component/blocklet.yml) icon=mdi:file-document
# ... (子组件元数据)

navigation:
  - title: '概览'
    link: '/overview'
  - title: '设置'
    link: '/settings'
```

最终合并的导航结构将产生一个“Dashboard”菜单，其中包含“Overview”和“Settings”作为子项。

## 主题

`theme` 属性允许 blocklet 定义基本的视觉样式，例如背景颜色或图像，这些样式可以被宿主应用程序应用。这确保了 blocklet 的 UI 与整体美学保持一致。

### 主题属性

<x-field-group>
  <x-field data-name="background" data-type="string | object" data-required="false">
    <x-field-desc markdown>指定不同 UI 区域的背景。可以是一个用作默认值的单一字符串（URL 或颜色值），也可以是一个为特定部分定义背景的对象。</x-field-desc>
    <x-field data-name="header" data-type="string" data-required="false" data-desc="页眉部分的背景。"></x-field>
    <x-field data-name="footer" data-type="string" data-required="false" data-desc="页脚部分的背景。"></x-field>
    <x-field data-name="default" data-type="string" data-required="false" data-desc="其他区域的默认背景。"></x-field>
  </x-field>
</x-field-group>

### 示例：主题配置

此示例设置了默认背景颜色和页眉的特定图像。

```yaml blocklet.yml
name: 'my-themed-blocklet'
did: 'z8iZuf...s92'
version: '1.0.0'
title: '我的主题化 Blocklet'

theme:
  background:
    default: '#F5F5F5'
    header: 'url(/assets/header-background.png)'
    footer: '#333333'
```

---

通过利用 `navigation` 和 `theme` 属性，开发者可以创建不仅功能强大，而且能深度集成到最终用户的应用环境中，提供一致且直观体验的 blocklet。