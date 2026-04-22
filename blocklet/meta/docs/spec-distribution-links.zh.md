# 分发与链接

本节涵盖了 `blocklet.yml` 中用于定义 Blocklet 如何打包分发以及提供其源代码、主页、文档和其他资源基本链接的字段。正确配置这些字段对于 Blocklet 的可发现性、用户信任以及融入 Blocklet 生态系统至关重要。

## 分发包 (`dist`)

`dist` 对象包含有关 Blocklet 捆绑包的信息。这些数据通常由 `blocklet publish` 命令自动生成和添加，并由 Blocklet Store 用于下载和验证 Blocklet。

它确保了用户安装的 Blocklet 包的完整性和真实性。

### 模式

<x-field-group>
  <x-field data-name="dist" data-type="object" data-required="false" data-desc="包含有关 Blocklet 捆绑包的信息。">
    <x-field data-name="tarball" data-type="string" data-required="true" data-desc="可以下载压缩的 Blocklet 捆绑包（.tar.gz）的 URL。"></x-field>
    <x-field data-name="integrity" data-type="string" data-required="true" data-desc="一个子资源完整性字符串（例如，SHA-512 哈希值），用于验证下载包的内容。"></x-field>
    <x-field data-name="size" data-type="number" data-required="false" data-desc="压缩包的大小，单位为字节。"></x-field>
  </x-field>
</x-field-group>

### 示例

```yaml blocklet.yml icon=mdi:package-variant
# 此字段通常在发布过程中自动生成
dist:
  tarball: https://store.blocklet.dev/uploads/z123abc.tar.gz
  integrity: sha512-Vbf...Q==
  size: 1234567
```

## 源代码仓库 (`repository`)

`repository` 字段指定了 Blocklet 源代码的位置。强烈建议填写此字段，因为它允许用户和贡献者审查代码、报告问题和做出贡献。

您可以提供一个简单的 URL 字符串或一个更详细的对象。

### 模式

<x-field data-name="repository" data-type="string | object" data-required="false" data-desc="指定 Blocklet 源代码的位置。">
  <x-field-desc markdown>可以是一个简单的 URL 字符串或一个包含详细属性的对象。系统通常可以从标准 URL 字符串中解析出类型。</x-field-desc>
  <x-field data-name="type" data-type="string" data-required="true" data-desc="版本控制系统的类型（例如，'git'、'https'、'svn'）。"></x-field>
  <x-field data-name="url" data-type="string" data-required="true" data-desc="仓库的 URL。"></x-field>
  <x-field data-name="directory" data-type="string" data-required="false" data-desc="在 monorepo 中 Blocklet 包的路径。"></x-field>
</x-field>

### 示例：简单 URL

如果您提供一个字符串，它将被自动解析以确定仓库类型。

```yaml blocklet.yml icon=mdi:git
repository: https://github.com/arcblock/blocklet-spec.git
```

### 示例：对象格式

当您需要更明确地指定或在 monorepo 中时，使用对象格式非常有用。

```yaml blocklet.yml icon=mdi:git
repository:
  type: git
  url: https://github.com/arcblock/blocklet-framework.git
  directory: packages/blocklet-spec
```

## 网站链接与支持

这些字段提供了重要外部资源的直接链接，以增强用户支持和社区参与度。

<x-field-group>
  <x-field data-name="homepage" data-type="string" data-required="false" data-desc="Blocklet 的官方主页或营销页面。"></x-field>
  <x-field data-name="documentation" data-type="string" data-required="false" data-desc="指向 Blocklet 详细文档网站的链接。"></x-field>
  <x-field data-name="community" data-type="string" data-required="false" data-desc="指向社区论坛、Discord 服务器或其他讨论平台的链接。"></x-field>
  <x-field data-name="support" data-type="string" data-required="false" data-desc="供用户获取帮助的 URL 或电子邮件地址。"></x-field>
</x-field-group>

### 示例

```yaml blocklet.yml icon=mdi:web
homepage: https://www.arcblock.io/
documentation: https://docs.arcblock.io/
community: https://community.arcblock.io/
support: support@arcblock.io
```

## 推广素材

这些字段用于在 Blocklet Store 中展示您的 Blocklet，为用户提供其特性和功能的可视化预览。

<x-field-group>
  <x-field data-name="screenshots" data-type="string[]" data-required="false" data-desc="一个 URL 数组，指向展示 Blocklet UI 或功能的图片。"></x-field>
  <x-field data-name="videos" data-type="string[]" data-required="false">
    <x-field-desc markdown>一个最多包含 3 个推广视频 URL 的数组。仅支持 YouTube 和 Vimeo 链接。</x-field-desc>
  </x-field>
  <x-field data-name="logoUrl" data-type="string" data-required="false" data-desc="指向 Blocklet 标志的直接 URL。这通常由发布过程生成和上传。"></x-field>
</x-field-group>

### 示例

```yaml blocklet.yml icon=mdi:image-multiple
screenshots:
  - https://meta.blocklet.dev/screenshots/1.png
  - https://meta.blocklet.dev/screenshots/2.png
videos:
  - https://www.youtube.com/watch?v=xxxxxxxx
logoUrl: https://meta.blocklet.dev/logo.png
```

## 使用统计 (`stats`)

`stats` 对象包含 Blocklet 的使用指标。与 `dist` 字段一样，这通常由 Blocklet Store 管理，不应手动设置。

### 模式

<x-field-group>
  <x-field data-name="stats" data-type="object" data-required="false" data-desc="包含 Blocklet 的使用指标，由 Blocklet Store 管理。">
    <x-field data-name="downloads" data-type="number" data-required="false" data-desc="Blocklet 被下载的总次数。"></x-field>
    <x-field data-name="star" data-type="number" data-default="0" data-required="false" data-desc="Blocklet 收到的星标或点赞数。"></x-field>
    <x-field data-name="purchases" data-type="number" data-default="0" data-required="false" data-desc="Blocklet 被购买的次数。"></x-field>
  </x-field>
</x-field-group>

### 示例

```yaml blocklet.yml icon=mdi:chart-bar
# 此字段由 Blocklet Store 管理
stats:
  downloads: 10500
  star: 250
  purchases: 120
```

---

配置好这些字段后，您的 Blocklet 就准备好分发了。下一步是定义它如何运行。

<x-card data-title="下一步：执行与环境" data-icon="lucide:terminal" data-cta="阅读更多" data-href="/spec/execution-environment">
了解如何配置 Blocklet 的引擎、运行时要求、环境变量和启动脚本。
</x-card>