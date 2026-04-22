# API 參考

`@blocklet/meta` 函式庫提供了一套全面的實用函式，用於以程式化方式與 `blocklet.yml` 元資料進行互動。這些輔助函式簡化了常見任務，例如解析、驗證、資料操作和安全操作。無論您是在建構開發工具、自訂 blocklet 執行環境，還是與 Blocklet 生態系統互動的應用程式，這些 API 都提供了必要的建構基礎。

本節作為所有匯出函式的詳細參考，按其核心功能進行分組。要完整了解這些函式所操作的元資料結構，請參閱 [Blocklet 規範 (blocklet.yml)](./spec.md)。

探索以下類別以找到您需要的特定函式。每個部分都提供了詳細的解釋、參數和使用範例，以幫助您快速上手。

<x-cards data-columns="2">
  <x-card data-title="解析與驗證" data-icon="lucide:scan-line" data-href="/api/parsing-validation">
    用於讀取、解析和驗證 `blocklet.yml` 檔案的函式。包含 `parse`、`validateMeta`、`fixAndValidateService` 及其他驗證輔助函式。
  </x-card>
  <x-card data-title="元資料輔助函式" data-icon="lucide:file-cog" data-href="/api/metadata-helpers">
    用於從遠端 URL 取得和處理 blocklet 元資料的實用工具。包含 `getBlockletMetaByUrl` 和 `getSourceUrlsFromConfig`。
  </x-card>
  <x-card data-title="元件與狀態實用工具" data-icon="lucide:cuboid" data-href="/api/component-state-utilities">
    一系列用於處理 blocklet 狀態物件的輔助函式，例如遍歷元件樹、尋找特定元件和提取資訊。
  </x-card>
  <x-card data-title="DID 與錢包實用工具" data-icon="lucide:wallet" data-href="/api/did-wallet-utilities">
    在 blocklet 上下文中處理 DID 和錢包的函式，包括建立特定於 blocklet 的 DID、產生錢包和提取使用者資訊。
  </x-card>
  <x-card data-title="安全實用工具" data-icon="lucide:shield-check" data-href="/api/security-utilities">
    用於密碼學操作的函式，例如簽署回應、驗證簽名以及管理元資料的多重簽名驗證。
  </x-card>
  <x-card data-title="導覽實用工具" data-icon="lucide:navigation" data-href="/api/navigation-utilities">
    用於解析和處理 blocklet 元資料和狀態中的 `navigation` 屬性，以建構動態使用者介面的函式。
  </x-card>
  <x-card data-title="URL 與路徑實用工具" data-icon="lucide:link" data-href="/api/url-path-utilities">
    用於建立 URL 友善字串和驗證 URL 路徑的輔助函式，有助於產生乾淨且有效的路由。
  </x-card>
  <x-card data-title="檔案實用工具" data-icon="lucide:files" data-href="/api/file-utilities">
    用於在檔案系統上讀取、寫入和定位 `blocklet.yml` 檔案的低階函式，以及用於檔案驗證的自訂 Joi 擴充功能。
  </x-card>
  <x-card data-title="雜項實用工具" data-icon="lucide:box" data-href="/api/misc-utilities">
    一系列其他有用的實用工具，包括通訊通道輔助函式和身份圖示 (Blockies) 產生。
  </x-card>
</x-cards>