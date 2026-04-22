# 核心元数据

核心元数据字段确立了 Blocklet 的基本身份。它们为在 Blocklet 生态系统中的识别、版本控制和可发现性提供了必要的一目了然的信息。每个 `blocklet.yml` 文件都必须定义这些基础属性才被视为有效。

---

## 身份与版本控制

这些字段唯一地标识您的 Blocklet 并跟踪其演变过程。

### `did`（去中心化身份标识）

`did` 是 Blocklet 的全局唯一且不可变的标识符。它在整个 ArcBlock 生态系统中充当其主键，确保每个 Blocklet 都可以被安全、明确地引用。

<x-field-group>
  <x-field data-name="did" data-type="string" data-required="true">
    <x-field-desc markdown>一个有效的去中心化身份标识。DID 的类型信息必须指定为 `RoleType.ROLE_BLOCKLET`。</x-field-desc>
  </x-field>
</x-field-group>

#### 验证规则

系统会验证所提供的 DID 不仅在语法上正确，而且具有适当的角色类型（`ROLE_BLOCKLET`），这是一个关键的安全和完整性特性。

```yaml blocklet.yml icon=mdi:code-tags
did: z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ
```

### `name`

`name` 是 Blocklet 的一个人类可读的标识符。虽然 `did` 是机器的规范标识符，但 `name` 为开发者和用户提供了一个方便、易记的别名。在旧版配置中，它也曾用于派生 Blocklet 的 DID。

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true">
    <x-field-desc markdown>一个唯一的名称，遵循 [npm 包命名规范](https://www.npmjs.com/package/validate-npm-package-name) 且不超过 32 个字符。</x-field-desc>
  </x-field>
</x-field-group>

#### `name` 与 `did` 之间的关系

理解 `name` 和 `did` 如何交互至关重要：

1.  **DID 优先（推荐）**：您提供一个有效的、预先注册的 Blocklet DID。这是现代且最稳健的方法。
2.  **名称优先（旧版支持）**：如果您提供一个 `name`，系统可以从中派生一个 DID。为使元数据有效，您的 `blocklet.yml` 中的 `did` 字段 **必须** 与从 `name` 生成的预期 DID 相匹配。不一致将导致验证错误。

```yaml blocklet.yml icon=mdi:code-tags
# 此名称用于显示，并可用于派生 DID
name: 'my-awesome-blocklet'

# 此 DID 必须是有效的 Blocklet DID。如果使用名称优先的方法，
# 它必须与从 'my-awesome-blocklet' 派生的 DID 相匹配。
did: z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ
```

### `version`

`version` 字段跟踪 Blocklet 的发布版本，从而为用户和其他 Blocklet 实现适当的依赖管理和版本控制。

<x-field-group>
  <x-field data-name="version" data-type="string" data-required="true">
    <x-field-desc markdown>Blocklet 版本，必须遵守 [语义化版本 2.0.0](https://semver.org/) 规范（例如 `1.2.3`, `2.0.0-beta.1`）。</x-field-desc>
  </x-field>
</x-field-group>

```yaml blocklet.yml icon=mdi:code-tags
version: '1.0.0'
```

### `specVersion`

该字段指定您的元数据文件所遵循的 `blocklet.yml` 规范的版本。这使得 Blocklet 运行时和工具能够正确解析和解释文件内容，确保前向兼容性。

<x-field-group>
  <x-field data-name="specVersion" data-type="string" data-required="false">
    <x-field-desc markdown>一个有效的 SemVer 字符串，表示规范版本，必须为 `1.0.0` 或更高。</x-field-desc>
  </x-field>
</x-field-group>

```yaml blocklet.yml icon=mdi:code-tags
specVersion: '1.2.0'
```

---

## 展示与分类

这些字段定义了您的 Blocklet 如何在用户界面中呈现以及如何进行分类。

### `title`

`title` 是 Blocklet 的一个易于显示的名称。它用于 Blocklet 商店、仪表盘和启动器等用户界面中，在这些地方，使用更具描述性或品牌化的名称比简短的 `name` 更为适宜。

<x-field-group>
  <x-field data-name="title" data-type="string" data-required="false">
    <x-field-desc markdown>一个简短、人类可读的标题。其长度计算会考虑 CJK 字符，且不得超过预定义的限制（`MAX_TITLE_LENGTH`）。更多详情，请参阅 [cjk-length](https://www.npmjs.com/package/cjk-length)。</x-field-desc>
  </x-field>
</x-field-group>

```yaml blocklet.yml icon=mdi:code-tags
title: 'My Awesome Blocklet'
```

### `description`

`description` 提供了 Blocklet 用途和功能的简明摘要。它广泛用于搜索结果和 UI 预览中，以帮助用户快速了解 Blocklet 的作用。

<x-field-group>
  <x-field data-name="description" data-type="string" data-required="true">
    <x-field-desc markdown>Blocklet 的简要摘要，长度在 3 到 160 个字符之间。</x-field-desc>
  </x-field>
</x-field-group>

```yaml blocklet.yml icon=mdi:code-tags
description: 'A Blocklet that provides amazing data visualization tools for your DID Space.'
```

### `logo`

该字段指定 Blocklet 标志的路径或 URL。该标志用于 Blocklet 商店、仪表盘和其他用户界面中的品牌展示。

<x-field-group>
  <x-field data-name="logo" data-type="string" data-required="false">
    <x-field-desc markdown>指向标志图像的相对路径或绝对 HTTP(S) URL。它不应指向系统内部使用的知名标志路径（`/.well-known/blocklet/logo`）。</x-field-desc>
  </x-field>
</x-field-group>

```yaml blocklet.yml icon=mdi:code-tags
# 使用 Blocklet 包内的相对路径
logo: 'images/logo.png'

# 或者使用绝对 URL
# logo: 'https://cdn.example.com/blocklet-logo.svg'
```

### `group`

`group` 字段对 Blocklet 进行分类，这有助于在注册中心和市场中进行组织和发现。

<x-field-group>
  <x-field data-name="group" data-type="string" data-required="false">
    <x-field-desc markdown>Blocklet 的类别。必须是预定义值之一。</x-field-desc>
  </x-field>
</x-field-group>

`group` 的有效值包括：

| 值 | 描述 |
|---|---|
| `dapp` | 一个去中心化应用。 |
| `static` | 一个静态网站或单页应用。 |
| `service` | 一个后端服务或 API。 |
| `component` | 一个可重用组件，旨在被其他 Blocklet 组合使用。 |

```yaml blocklet.yml icon=mdi:code-tags
# 将此 Blocklet 分类为去中心化应用。
group: 'dapp'
```

---

## 完整示例

以下是一个片段，展示了所有核心元数据字段在 `blocklet.yml` 文件中协同工作的情况。

```yaml blocklet.yml icon=mdi:code-tags
name: 'data-visualizer'
did: z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ # 对应于 'data-visualizer'
version: '1.2.0'
specVersion: '1.2.0'
title: 'Data Visualizer'
description: 'A Blocklet that provides amazing data visualization tools for your DID Space.'
logo: 'images/logo.svg'
group: 'dapp'
```

现在您已经了解了 Blocklet 的核心身份，下一节将介绍如何指定其创建者和维护者。

<x-card data-title="下一步：人员与所有权" data-icon="lucide:users" data-href="/spec/people-ownership" data-cta="阅读更多">
了解如何指定 Blocklet 的作者、贡献者和维护者。
</x-card>