# Blocklet 规范 (blocklet.yml)

`blocklet.yml` 文件是每个 Blocklet 的核心。它是一个 YAML 清单，定义了有关应用程序的所有基本元数据，是 Blocklet Server 和生态系统中其他工具的唯一真实来源。

可以把它看作是 Node.js 世界中 `package.json` 的等价物，但其范围已扩展到涵盖去中心化应用程序的整个生命周期和配置。它详细说明了从 Blocklet 的身份和版本到其运行方式、暴露的 Web 界面、对其他 Blocklet 的依赖关系以及如何与用户界面集成的一切。

本规范是 `blocklet.yml` 中每个可用字段的权威参考。无论您是构建一个简单的静态网站还是一个复杂的多服务应用程序，一个格式良好的 `blocklet.yml` 都是确保其正确、可预测运行的第一步。

### 基本示例

这是一个最小化的 `blocklet.yml` 文件，用于说明其基本结构。下面各节将详细解释每个字段。

```yaml blocklet.yml icon=logos:yaml
# Blocklet 的核心身份
did: z8iZpA63mBCy9j82Vf9aL3a8u9b5c7d9e1f2
name: my-awesome-blocklet
version: 1.0.0

# 人类可读的元数据
title: My Awesome Blocklet
description: 一个用于演示核心概念的简单 Blocklet。

# Blocklet 的执行方式
main: api/index.js

# Blocklet 如何暴露到 Web
interfaces:
  - type: web
    name: publicUrl
    path: /
    prefix: '*'
    port: BLOCKLET_PORT
    protocol: http

# 系统要求
requirements:
  server: ">=1.16.0"
  os: "*"
  cpu: "*"
```

### 规范章节

`blocklet.yml` 规范按属性的逻辑分组进行组织。浏览以下各节，可获得每个字段、其用途和有效值的全面指南。

<x-cards data-columns="3">
  <x-card data-title="核心元数据" data-href="/spec/core-metadata" data-icon="lucide:package">
    定义 Blocklet 身份的基本属性，如名称、DID、版本和描述。
  </x-card>
  <x-card data-title="人员与所有权" data-href="/spec/people-ownership" data-icon="lucide:users">
    指定 Blocklet 的作者、贡献者和维护者。
  </x-card>
  <x-card data-title="分发与链接" data-href="/spec/distribution-links" data-icon="lucide:link">
    用于分发包、源代码仓库、主页和文档链接的字段。
  </x-card>
  <x-card data-title="执行与环境" data-href="/spec/execution-environment" data-icon="lucide:terminal">
    配置运行时引擎、系统要求、环境变量和生命周期脚本。
  </x-card>
  <x-card data-title="接口与服务" data-href="/spec/interfaces-services" data-icon="lucide:network">
    定义 Blocklet 如何向外界公开网页、API 和其他端点。
  </x-card>
  <x-card data-title="组合（组件）" data-href="/spec/composition" data-icon="lucide:boxes">
    通过将其他 Blocklet 作为组件来组合成复杂的应用程序。
  </x-card>
  <x-card data-title="UI 与主题" data-href="/spec/ui-theming" data-icon="lucide:palette">
    定义导航项和主题设置，以无缝集成 Blocklet 的 UI。
  </x-card>
  <x-card data-title="商业化" data-href="/spec/monetization" data-icon="lucide:dollar-sign">
    为您的 Blocklet 配置定价、收入分成和基于 NFT 的购买。
  </x-card>
  <x-card data-title="安全与资源" data-href="/spec/security-resources" data-icon="lucide:shield">
    通过签名确保元数据完整性，并使用资源字段定义共享资产。
  </x-card>
</x-cards>

---

现在您对 `blocklet.yml` 结构有了大致了解，可以深入研究上述特定部分以查找您需要的详细信息。有关与此元数据进行编程交互的信息，请参阅 [API 参考](./api.md)。