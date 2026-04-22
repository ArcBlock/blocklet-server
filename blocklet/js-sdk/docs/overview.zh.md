# 概述

`@blocklet/js-sdk` 是一个功能全面的 JavaScript 库，旨在简化与 Blocklet 服务的交互。无论你是在构建前端应用还是后端服务，该 SDK 都提供了一套强大的工具来处理身份验证、会话管理和 API 通信，让你能够专注于功能构建，而无需处理底层细节。

它通过抽象令牌管理的复杂性并为常见任务提供直观的高级服务，简化了整个过程。

## 核心功能

该 SDK 围绕几个关键原则构建，旨在让你的开发体验尽可能顺畅。

<x-cards data-columns="3">
  <x-card data-title="简化的 API 请求" data-icon="lucide:send">
    提供 `createAxios` 和 `createFetch` 助手，这些助手预先配置了进行认证 API 调用所需的一切，包括基础 URL 和拦截器。
  </x-card>
  <x-card data-title="自动令牌管理" data-icon="lucide:key-round">
    自动处理会话令牌和刷新令牌的生命周期。它会透明地更新过期的令牌，确保你的应用在无需手动干预的情况下保持认证状态。
  </x-card>
  <x-card data-title="模块化服务架构" data-icon="lucide:blocks">
    将功能组织到不同的服务中，如 `AuthService`、`UserSessionService` 和 `BlockletService`，提供了一个清晰且有条理的 API 接口。
  </x-card>
</x-cards>

## 工作原理

你的应用与 SDK 的服务和请求助手进行交互。SDK 则负责管理与 Blocklet API 的所有通信，并在底层处理身份验证和令牌更新的复杂性。这种架构确保了你的应用代码保持简洁并专注于业务逻辑。

<!-- DIAGRAM_IMAGE_START:architecture:16:9 -->
![Overview](assets/diagram/overview-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## 开始使用

准备好将 SDK 集成到你的项目中了吗？我们的“开始使用”指南将引导你完成安装过程，并帮助你在几分钟内完成第一次 API 调用。

<x-card data-title="开始使用" data-icon="lucide:rocket" data-href="/getting-started" data-cta="开始构建">
  按照我们的分步指南安装 SDK 并配置你的应用。
</x-card>