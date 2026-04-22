# 入門指南

本指南簡要介紹如何使用 `@blocklet/meta` 函式庫。您將學習如何安裝該套件並執行最常見的任務：解析 `blocklet.yml` 檔案以在您的應用程式中存取其元資料。

### 先決條件

在開始之前，請確保您具備：

1.  一個 Node.js 開發環境。
2.  一個包含 `blocklet.yml` 檔案的 Blocklet 專案目錄。

在本指南中，我們假設您有一個名為 `my-blocklet` 的專案目錄，其中包含以下 `blocklet.yml` 檔案：

```yaml title="my-blocklet/blocklet.yml" icon=mdi:language-yaml
name: my-awesome-blocklet
version: 0.1.0
title: My Awesome Blocklet
description: A simple blocklet to demonstrate parsing.
author: 'Jane Doe <jane.doe@example.com>'
```

### 步驟 1：安裝

使用 Yarn 或 npm 將 `@blocklet/meta` 套件加入您的專案依賴項中。

```shell yarn
yarn add @blocklet/meta
```

或使用 npm：

```shell npm
npm install @blocklet/meta
```

### 步驟 2：解析 Blocklet 元資料

該函式庫的核心函式是 `parse`。它會從給定的目錄中讀取 `blocklet.yml`（或 `blocklet.yaml`），根據 Blocklet 規範驗證其內容，進行必要的修正（例如標準化 person 欄位），並返回一個乾淨的 JavaScript 物件。

在您的 `my-blocklet` 目錄旁邊建立一個名為 `index.js` 的檔案，並加入以下程式碼：

```javascript title="index.js" icon=logos:javascript
const path = require('path');
const { parse } = require('@blocklet/meta');

// 定義您的 blocklet 根目錄的路徑
const blockletDir = path.join(__dirname, 'my-blocklet');

try {
  // 解析元資料
  const meta = parse(blockletDir);

  // 列印解析後的元資料物件
  console.log('Successfully parsed blocklet meta:', meta);
} catch (error) {
  console.error('Failed to parse blocklet.yml:', error.message);
}
```

當您執行此腳本（`node index.js`）時，它將輸出解析後的元資料物件。

### 預期輸出

`parse` 函式不僅會讀取 YAML 檔案，還會將鍵名轉換為駝峰式命名（camelCase），並將像 `author` 這樣的複雜欄位格式化為結構化物件。

```json Output icon=mdi:code-json
{
  "name": "my-awesome-blocklet",
  "version": "0.1.0",
  "title": "My Awesome Blocklet",
  "description": "A simple blocklet to demonstrate parsing.",
  "author": {
    "name": "Jane Doe",
    "email": "jane.doe@example.com"
  },
  "specVersion": "1.0.0",
  "path": "/path/to/your/project/my-blocklet"
}
```

### 接下來呢？

您已成功安裝 `@blocklet/meta` 並解析了您的第一個 `blocklet.yml`。現在您可以探索更進階的主題。

<x-cards>
  <x-card data-title="Blocklet 規範 (blocklet.yml)" data-icon="lucide:file-text" data-href="/spec">
    了解所有可用欄位及其含義，以完全設定您的 blocklet 的行為和外觀。
  </x-card>
  <x-card data-title="API 參考" data-icon="lucide:book-open" data-href="/api">
    深入了解完整的 API 文件，探索用於驗證、檔案處理和安全性的其他實用工具。
  </x-card>
</x-cards>