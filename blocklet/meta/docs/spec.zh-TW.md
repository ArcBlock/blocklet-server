# Blocklet 規範 (blocklet.yml)

`blocklet.yml` 檔案是每個 Blocklet 的核心。它是一個 YAML 清單，定義了您應用程式的所有基本元數據，作為 Blocklet Server 和生態系統中其他工具的唯一真實來源。

您可以將其視為 Node.js 世界中 `package.json` 的對應物，但其範圍擴展到涵蓋去中心化應用程式的完整生命週期和配置。它詳細說明了從 Blocklet 的身份和版本到其運行方式、公開的 Web 介面、對其他 Blocklet 的依賴以及如何與使用者介面整合的所有內容。

本規範是 `blocklet.yml` 中每個可用欄位的權威參考。無論您是建置一個簡單的靜態網站還是一個複雜的多服務應用程式，一個格式良好的 `blocklet.yml` 都是確保其正確、可預測運行的第一步。

### 基本範例

以下是一個最小的 `blocklet.yml` 檔案，以說明其基本結構。每個欄位在下面的章節中都有詳細解釋。

```yaml blocklet.yml icon=logos:yaml
# Blocklet 的核心身份
did: z8iZpA63mBCy9j82Vf9aL3a8u9b5c7d9e1f2
name: my-awesome-blocklet
version: 1.0.0

# 人類可讀的元數據
title: My Awesome Blocklet
description: 一個簡單的 Blocklet，用於展示核心概念。

# Blocklet 的執行方式
main: api/index.js

# Blocklet 如何對外暴露
interfaces:
  - type: web
    name: publicUrl
    path: /
    prefix: '*'
    port: BLOCKLET_PORT
    protocol: http

# 系統需求
requirements:
  server: ">=1.16.0"
  os: "*"
  cpu: "*"
```

### 規範章節

`blocklet.yml` 規範被組織成屬性的邏輯分組。探索以下章節，以獲得每個欄位、其目的和有效值的全面指南。

<x-cards data-columns="3">
  <x-card data-title="核心元數據" data-href="/spec/core-metadata" data-icon="lucide:package">
    定義您 blocklet 身份的基本屬性，如名稱、DID、版本和描述。
  </x-card>
  <x-card data-title="人員與所有權" data-href="/spec/people-ownership" data-icon="lucide:users">
    指定 blocklet 的作者、貢獻者和維護者。
  </x-card>
  <x-card data-title="分發與連結" data-href="/spec/distribution-links" data-icon="lucide:link">
    用於分發套件、原始碼儲存庫、首頁和文件連結的欄位。
  </x-card>
  <x-card data-title="執行與環境" data-href="/spec/execution-environment" data-icon="lucide:terminal">
    配置執行引擎、系統需求、環境變數和生命週期腳本。
  </x-card>
  <x-card data-title="介面與服務" data-href="/spec/interfaces-services" data-icon="lucide:network">
    定義您的 blocklet 如何向外界公開網頁、API 和其他端點。
  </x-card>
  <x-card data-title="組合 (元件)" data-href="/spec/composition" data-icon="lucide:boxes">
    透過將您的 blocklet 與其他 blocklet 作為元件組合，來建置複雜的應用程式。
  </x-card>
  <x-card data-title="UI 與主題" data-href="/spec/ui-theming" data-icon="lucide:palette">
    定義導航項目和主題設定，以無縫整合您的 blocklet 的 UI。
  </x-card>
  <x-card data-title="商業化" data-href="/spec/monetization" data-icon="lucide:dollar-sign">
    為您的 blocklet 配置定價、收益分成和基於 NFT 的購買。
  </x-card>
  <x-card data-title="安全性與資源" data-href="/spec/security-resources" data-icon="lucide:shield">
    使用簽名確保元數據完整性，並使用資源欄位定義共享資產。
  </x-card>
</x-cards>

---

現在您對 `blocklet.yml` 的結構有了概覽，請深入研究以上特定章節以找到您需要的詳細資訊。有關此元數據的程式化互動，請參閱 [API 參考](./api.md)。