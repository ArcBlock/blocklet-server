# 總覽

「@blocklet/js-sdk」是一個全面的 JavaScript 函式庫，旨在簡化與 Blocklet 服務的互動。無論您是建構前端應用程式還是後端服務，此 SDK 都提供了一套強大的工具來處理身份驗證、會話管理和 API 通訊，讓您能專注於建構功能，而無需處理底層細節。

它透過抽象化權杖管理的複雜性，並為常見任務提供直觀、高階的服務，從而簡化了整個過程。

## 核心功能

此 SDK 圍繞幾個關鍵原則建構，旨在讓您的開發體驗盡可能順暢。

<x-cards data-columns="3">
  <x-card data-title="簡化的 API 請求" data-icon="lucide:send">
    提供 `createAxios` 和 `createFetch` 輔助工具，這些工具已預先配置好進行身份驗證 API 呼叫所需的一切，包括基礎 URL 和攔截器。
  </x-card>
  <x-card data-title="自動權杖管理" data-icon="lucide:key-round">
    自動處理會話權杖和刷新權杖的生命週期。它會透明地更新過期的權杖，確保您的應用程式在無需手動干預的情況下保持驗證狀態。
  </x-card>
  <x-card data-title="模組化服務架構" data-icon="lucide:blocks">
    將功能組織成不同的服務，如 `AuthService`、`UserSessionService` 和 `BlockletService`，提供一個清晰且有組織的 API 介面。
  </x-card>
</x-cards>

## 運作方式

您的應用程式與 SDK 的服務和請求輔助工具互動。SDK 則負責管理與 Blocklet API 的所有通訊，並在底層處理身份驗證和權杖更新的複雜性。這種架構確保您的應用程式程式碼保持簡潔，並專注於業務邏輯。

<!-- DIAGRAM_IMAGE_START:architecture:16:9 -->
![Overview](assets/diagram/overview-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## 開始使用

準備好將 SDK 整合到您的專案中了嗎？我們的「開始使用」指南將引導您完成安裝過程，並幫助您在幾分鐘內完成第一次 API 呼叫。

<x-card data-title="開始使用" data-icon="lucide:rocket" data-href="/getting-started" data-cta="開始建構">
  遵循我們的逐步指南來安裝 SDK 並設定您的應用程式。
</x-card>