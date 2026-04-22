# 指南

歡迎來到 @blocklet/js-sdk 的實用指南。本節旨在幫助您快速上手並執行常見任務。每個指南都提供了逐步說明和程式碼範例，以幫助您在 Blocklet 應用程式中整合關鍵功能，例如進行安全的 API 呼叫、處理使用者身份驗證和管理會話。

這些指南著重於真實世界的使用案例，幫助您自信地建構強大的功能。

<x-cards data-columns="3">
  <x-card data-title="發起 API 請求" data-href="/guides/making-api-requests" data-icon="lucide:network">
    學習如何使用內建的 `createAxios` 和 `createFetch` 輔助工具，向 Blocklet 服務發起經過身份驗證且會自動續約的 API 呼叫。
  </x-card>
  <x-card data-title="身份驗證" data-href="/guides/authentication" data-icon="lucide:key-round">
    了解 SDK 如何自動處理會話權杖，以及如何使用 `AuthService` 管理使用者個人資料、隱私和登出操作。
  </x-card>
  <x-card data-title="管理使用者會話" data-href="/guides/managing-user-sessions" data-icon="lucide:smartphone">
    探索如何使用 `UserSessionService` 擷取和管理使用者在不同裝置和應用程式中的登入會話。
  </x-card>
</x-cards>

## 後續步驟

在查閱完您需要完成的任務指南後，您可能會想深入了解完整的 [API 參考](./api.md)，其中詳細介紹了 SDK 中可用的每個類別、方法和類型。