# 指南

欢迎阅读 @blocklet/js-sdk 的实践指南。本节旨在帮助您快速上手并完成常见任务。每个指南都提供了分步说明和代码示例，帮助您在 Blocklet 应用中集成关键功能，例如进行安全的 API 调用、处理用户身份验证和管理会话。

这些指南侧重于实际用例，帮助您自信地构建稳健的功能。

<x-cards data-columns="3">
  <x-card data-title="发起 API 请求" data-href="/guides/making-api-requests" data-icon="lucide:network">
    学习如何使用内置的 `createAxios` 和 `createFetch` 辅助函数，向 Blocklet 服务发起经过身份验证且可自动续期的 API 调用。
  </x-card>
  <x-card data-title="身份验证" data-href="/guides/authentication" data-icon="lucide:key-round">
    了解 SDK 如何自动处理会话令牌，以及如何使用 `AuthService` 管理用户个人资料、隐私和注销操作。
  </x-card>
  <x-card data-title="管理用户会话" data-href="/guides/managing-user-sessions" data-icon="lucide:smartphone">
    了解如何使用 `UserSessionService` 获取和管理用户在不同设备和应用上的登录会话。
  </x-card>
</x-cards>

## 后续步骤

在查阅了完成任务所需的指南后，您可能希望深入了解完整的 [API 参考](./api.md)，以详细了解 SDK 中提供的每个类、方法和类型。