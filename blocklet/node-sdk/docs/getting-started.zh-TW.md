# 入門指南

本指南將引導您完成安裝 Blocklet SDK 的基本步驟，並讓一個最精簡的應用程式啟動並運行。我們的目標是幫助您在幾分鐘內從零開始，建立一個可運作的範例。

## 先決條件

在開始之前，請確保您已設定一個 Blocklet 專案。如果您還沒有，請遵循 [Blocklet 開發文件](https://www.arcblock.io/docs/createblocklet/create-single-blocklet) 來建立一個。

## 步驟 1：安裝 SDK

導覽至您的 Blocklet 專案目錄，並將 `@blocklet/sdk` 套件新增為依賴項。

```bash Terminal icon=lucide:terminal
npm install @blocklet/sdk

# 或使用 yarn
yarn add @blocklet/sdk
```

## 步驟 2：了解環境

Blocklet SDK 依賴於應用程式執行時由 Blocklet Server 自動注入的環境變數。這些變數為您的應用程式提供其環境的上下文，例如其 App ID、名稱和密鑰。

SDK 包含一個工具程式，用於驗證所有必要的環境變數是否存在。雖然您通常不需要手動設定這些變數，但了解它們是件好事。

以下是 SDK 使用的一些關鍵環境變數：

| 變數名稱 | 說明 |
| :--- | :--- |
| `BLOCKLET_APP_ID` | 您的 Blocklet 的唯一識別碼。 |
| `BLOCKLET_APP_SK` | 您的 Blocklet 的密鑰，用於簽署請求。 |
| `BLOCKLET_APP_NAME` | 您的 Blocklet 的名稱。 |
| `BLOCKLET_APP_URL` | 您的 Blocklet 的公開 URL。 |
| `BLOCKLET_DATA_DIR` | 您的 Blocklet 可儲存持久性資料的目錄。 |
| `ABT_NODE_DID` | Blocklet 執行所在節點的 DID。 |

有關設定的更詳細資訊，請參閱 [設定與環境](./core-concepts-configuration.md) 指南。

## 步驟 3：建立一個最精簡的伺服器

現在，讓我們建立一個簡單的 Express.js 伺服器，來看看 SDK 的實際運作。建立一個名為 `app.js`（或您專案的主要進入點）的檔案，並加入以下程式碼。

此範例展示了如何：
1.  從 SDK 匯入 `env` 物件以存取環境資訊。
2.  設定一個基本的 Express 伺服器。
3.  建立一個根端點，回傳 Blocklet 的 App Name。

```javascript app.js icon=logos:javascript
const express = require('express');
const { env } = require('@blocklet/sdk');

// 全域錯誤處理器是正式版應用程式的一個良好實踐。
process
  .on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
    process.exit(1);
  })
  .on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', (reason)?.message || reason);
    process.exit(1);
  });

const app = express();
const port = process.env.BLOCKLET_PORT || 3000;

app.get('/', (req, res) => {
  // env 物件提供了對所有 Blocklet 環境變數的型別化存取。
  res.send(`Hello from ${env.appName}!`);
});

app.listen(port, () => {
  console.log(`Blocklet listening on port ${port}`);
  console.log(`Visit your Blocklet at: ${env.appUrl}`);
});
```

## 步驟 4：執行您的 Blocklet

伺服器程式碼準備就緒後，您現在可以執行您的 Blocklet。使用 Blocklet CLI 啟動開發伺服器：

```bash Terminal icon=lucide:terminal
blocklet dev
```

伺服器啟動後，您會看到一條包含存取您應用程式 URL 的訊息。在瀏覽器中開啟該 URL，您應該會看到訊息：`Hello from [Your Blocklet Name]!`

## 後續步驟

恭喜！您已成功設定 Blocklet SDK 並建立了一個最精簡的應用程式。

為了繼續學習，我們建議您探索驅動 SDK 的基本概念。

<x-card data-title="核心概念" data-icon="lucide:graduation-cap" data-href="/core-concepts" data-cta="閱讀更多">
了解驅動 Blocklet SDK 的基本概念，從設定管理到錢包處理和安全性。
</x-card>