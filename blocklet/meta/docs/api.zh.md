# API 参考

`@blocklet/meta` 库提供了一套全面的实用函数，用于以编程方式与 `blocklet.yml` 元数据进行交互。这些帮助函数简化了常见的任务，如解析、验证、数据操作和安全操作。无论您是构建开发工具、自定义 blocklet 运行时，还是与 Blocklet 生态系统交互的应用程序，这些 API 都提供了必要的构建模块。

本节作为所有导出函数的详细参考，按其核心功能分组。要全面了解这些函数所操作的元数据结构，请参阅 [Blocklet 规范 (blocklet.yml)](./spec.md)。

浏览以下类别，找到您需要的特定函数。每个部分都提供了详细的解释、参数和使用示例，以帮助您快速入门。

<x-cards data-columns="2">
  <x-card data-title="解析与验证" data-icon="lucide:scan-line" data-href="/api/parsing-validation">
    用于读取、解析和验证 `blocklet.yml` 文件的函数。包括 `parse`、`validateMeta`、`fixAndValidateService` 和其他验证帮助函数。
  </x-card>
  <x-card data-title="元数据帮助函数" data-icon="lucide:file-cog" data-href="/api/metadata-helpers">
    用于从远程 URL 获取和处理 blocklet 元数据的实用工具。包括 `getBlockletMetaByUrl` 和 `getSourceUrlsFromConfig`。
  </x-card>
  <x-card data-title="组件与状态实用工具" data-icon="lucide:cuboid" data-href="/api/component-state-utilities">
    一组用于处理 blocklet 状态对象的帮助函数，例如遍历组件树、查找特定组件和提取信息。
  </x-card>
  <x-card data-title="DID 与钱包实用工具" data-icon="lucide:wallet" data-href="/api/did-wallet-utilities">
    用于在 blocklet 上下文中处理 DID 和钱包的函数，包括创建特定于 blocklet 的 DID、生成钱包和提取用户信息。
  </x-card>
  <x-card data-title="安全实用工具" data-icon="lucide:shield-check" data-href="/api/security-utilities">
    用于加密操作的函数，例如签署响应、验证签名以及管理元数据的多重签名验证。
  </x-card>
  <x-card data-title="导航实用工具" data-icon="lucide:navigation" data-href="/api/navigation-utilities">
    用于解析和处理 blocklet 元数据和状态中的 `navigation` 属性以构建动态用户界面的函数。
  </x-card>
  <x-card data-title="URL 与路径实用工具" data-icon="lucide:link" data-href="/api/url-path-utilities">
    用于创建 URL 友好字符串和验证 URL 路径的帮助函数，有助于生成清晰有效的路由。
  </x-card>
  <x-card data-title="文件实用工具" data-icon="lucide:files" data-href="/api/file-utilities">
    用于在文件系统上读取、写入和定位 `blocklet.yml` 文件的底层函数，以及用于文件验证的自定义 Joi 扩展。
  </x-card>
  <x-card data-title="杂项实用工具" data-icon="lucide:box" data-href="/api/misc-utilities">
    一组其他有用的实用工具，包括通信渠道帮助函数和身份图标 (Blockies) 生成。
  </x-card>
</x-cards>