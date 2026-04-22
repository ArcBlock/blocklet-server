# 概覽

`@blocklet/meta` 是 Blocklet 生態系中的一個基礎函式庫，作為管理 blocklet 元資料的權威工具組。它為 `blocklet.yml` 清單檔案建立了正式規範，並提供了一套全面的工具函式，用於以程式化方式解析、驗證、修復及與此元資料互動。

該函式庫的核心是確保每個 blocklet 都以一致、可靠且機器可讀的方式進行描述。這種標準化是整個 Blocklet 生態系的動力來源，從執行您應用程式的 Blocklet Server 到協助您建構應用程式的開發者工具。

<!-- DIAGRAM_IMAGE_START:architecture:16:9 -->
![Overview](assets/diagram/overview-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

本文件分為兩個主要部分，反映了該函式庫本身的雙重目的。

## Blocklet 規範：`blocklet.yml`

`blocklet.yml` 檔案是 blocklet 的藍圖。它是一個宣告式清單，您可以在其中定義應用程式的各個方面。`@blocklet/meta` 函式庫包含用於驗證此檔案的正式綱要，確保 Blocklet 平台可以正確地安裝、設定、執行及管理您的應用程式。您可以定義的關鍵方面包括：

- **核心身份**：`name`、`version` 以及 blocklet 獨有的去中心化 ID (`did`)。
- **呈現方式**：`title`、`description`、`logo` 以及用於在應用程式商店中顯示的螢幕截圖。
- **執行環境**：執行階段 `engine`（例如 Node.js）、生命週期 `scripts`（如 `pre-start`）以及必要的 `environments` 變數。
- **網路與服務**：公開的 Web `interfaces`、內部服務以及必要的連接埠。
- **組合**：要作為 `components` 包含的其他 blocklet 列表，以實現模組化應用程式設計。
- **使用者介面**：用於與儀表板整合的 `navigation` 連結，以及用於視覺一致性的 `theme` 設定。
- **營利**：用於設定價格和收入共享的 `payment` 詳細資訊。
- **安全性**：用於驗證元資料完整性和作者身份的加密 `signatures`。

## 工具組：程式化存取

除了定義規範，`@blocklet/meta` 還為開發者提供了一套豐富的 JavaScript/TypeScript 函式，用於處理 blocklet 的元資料和狀態。這個工具組對於建構與 Blocklet 生態系互動的自訂工具、外掛程式或複雜應用程式至關重要。

這些工具可分為幾個主要類別：

- **解析與驗證**：諸如 `parse` 和 `validateMeta` 等函式，讓您能從磁碟讀取 `blocklet.yml` 檔案，並根據官方綱要驗證其內容。
- **元資料輔助函式**：一系列用於自動修復常見格式問題、格式化個人物件、解析儲存庫 URL 等的函式。
- **元件與狀態工具**：一套強大的輔助函式（`forEachBlocklet`、`findComponent`、`getAppUrl` 等），用於遍歷執行中 blocklet 及其元件的狀態，這對於建構管理儀表板和動態應用程式至關重要。
- **DID 與錢包工具**：用於處理與 blocklet 相關的去中心化識別碼（DID）和加密錢包的函式，例如 `toBlockletDid` 和 `getBlockletWallet`。
- **安全性**：諸如 `signResponse` 和 `verifyResponse` 等工具，用於簽署和驗證資料，以確保完整性和真實性。

## 下一步？

<x-cards data-columns="3">
  <x-card data-title="入門指南" data-href="/getting-started" data-icon="lucide:rocket">
    安裝函式庫，並在幾分鐘內解析您的第一個 `blocklet.yml` 檔案。
  </x-card>
  <x-card data-title="Blocklet 規範 (blocklet.yml)" data-href="/spec" data-icon="lucide:book-marked">
    深入了解 `blocklet.yml` 清單檔案中每個欄位的完整參考資料。
  </x-card>
  <x-card data-title="API 參考" data-href="/api" data-icon="lucide:code-2">
    探索函式庫中所有可用工具函式的詳細文件。
  </x-card>
</x-cards>