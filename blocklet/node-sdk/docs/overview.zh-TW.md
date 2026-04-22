# 總覽

Blocklet SDK (`@blocklet/sdk`) 是在 ArcBlock 平台上建構應用程式的必要工具包。它透過提供一套全面的實用工具、服務和中介軟體來處理 Blocklet 的核心功能，從而簡化了開發過程，讓您可以專注於應用程式的獨特功能。

無論您是建構一個簡單的靜態網站、一個複雜的 Web 服務，還是一個擴展其他應用程式的元件，Blocklet SDK 都提供了必要的抽象層，以便與底層的 Blocklet Server 環境無縫互動。

## 主要功能

此 SDK 設計旨在功能強大且易於使用，提供一系列功能來加速您的開發過程。

<x-cards data-columns="2">
  <x-card data-title="設定與環境" data-icon="lucide:settings">
    透過統一的 `env` 物件和 `config` 模組，輕鬆存取環境變數、應用程式設定以及有關其他執行中元件的資訊。
  </x-card>
  <x-card data-title="驗證與授權" data-icon="lucide:lock">
    整合去中心化身份，內建支援 DID Connect。使用強大的會話和授權中介軟體保護您的路由。
  </x-card>
  <x-card data-title="服務用戶端" data-icon="lucide:server">
    以程式化方式與 Blocklet Server 互動。使用 `BlockletService` 管理使用者、角色和權限，或使用 `NotificationService` 發送訊息。
  </x-card>
  <x-card data-title="Web 伺服器中介軟體" data-icon="lucide:shield-check">
    一套即用型 Express.js 中介軟體，用於處理常見任務，如 CSRF 保護、會話管理、網站地圖生成和 SPA 回退。
  </x-card>
</x-cards>

## 核心模組

Blocklet SDK 被組織成幾個關鍵模組，每個模組都有特定的用途：

*   **`BlockletService`**: 用於與 Blocklet Server 的 API 互動的用戶端。它允許您管理使用者、角色、權限、存取金鑰並檢索 blocklet 元資料。
*   **`config` & `env`**: 提供對您的 blocklet 執行階段設定的存取，包括環境變數、元件掛載點和應用程式設定。
*   **`middlewares`**: 一系列 Express.js 中介軟體，用於處理驗證 (`auth`)、會話 (`session`)、CSRF 保護 (`csrf`) 等。
*   **`WalletAuthenticator` & `WalletHandlers`**: 實作 DID Connect 的核心實用工具，讓使用者能夠使用其去中心化身份安全登入。更多詳細資訊，您也可以參考 [DID Connect SDK 文件](https://www.arcblock.io/docs/did-connect-sdk/en/did-connect-sdk-overview)。
*   **`getWallet`**: 一個實用函數，用於檢索 blocklet 的錢包實例，這對於簽署交易或訊息至關重要。
*   **`Security`**: 提供用於資料加密、解密和簽名驗證的輔助函數，確保應用程式內資料處理的安全性。

## 開始使用

準備好建構您的第一個 Blocklet 了嗎？請前往我們的[入門指南](./getting-started.md)，查看逐步教學，讓您在幾分鐘內就能開始執行。