# 入門指南

本指南將引導您完成安裝 `@blocklet/js-sdk` 並進行首次 API 呼叫的基本步驟。我們的目標是讓您在幾分鐘內就能上手。

## 安裝

首先，您需要將 SDK 新增到您的專案中。您可以使用您偏好的套件管理器：

```bash 安裝 icon=mdi:bash
npm install @blocklet/js-sdk

# or

yarn add @blocklet/js-sdk

# or

pnpm add @blocklet/js-sdk
```

## 基本用法

SDK 的設計簡單明瞭。兩個最常見的使用案例是存取核心 Blocklet 服務（如使用者驗證）以及向您自己的 Blocklet 後端發出經過驗證的請求。

### 存取核心服務

使用 SDK 最簡單的方法是匯入 `getBlockletSDK` 單例工廠。此函式可確保您在整個應用程式中始終獲得相同的 SDK 實例，從而簡化狀態管理。

以下是如何使用它來擷取目前使用者的個人資料：

```javascript 取得使用者個人資料 icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

async function fetchUserProfile() {
  try {
    const { data: userProfile } = await sdk.user.getProfile();
    console.log('User Profile:', userProfile);
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
  }
}

fetchUserProfile();
```

`sdk` 實例提供了對各種服務的存取，例如 `user`、`userSession`、`blocklet` 等。這些服務為您處理與知名的 Blocklet 服務端點的通訊。

### 向您的 Blocklet 發出 API 請求

為了與您自己的 Blocklet 後端 API 進行通訊，SDK 提供了 `createAxios` 和 `createFetch` 輔助函式。它們是 Axios 和原生 Fetch API 的封裝，預先配置了進行驗證請求所需的一切。

它們會自動處理：
- 為您的元件設定正確的 `baseURL`。
- 將會話權杖附加到 `Authorization` 標頭。
- 包含用於安全性的 `x-csrf-token`。
- 在會話權杖過期時自動刷新。

以下是如何使用 `createAxios` 為您的後端建立 API 客戶端：

```javascript 建立 API 客戶端 icon=logos:javascript
import { createAxios } from '@blocklet/js-sdk';

// 為您的 Blocklet 建立一個已配置的 Axios 實例
const apiClient = createAxios();

async function fetchData() {
  try {
    // 向您自己的後端發出請求，例如 GET /api/posts
    const response = await apiClient.get('/api/posts');
    console.log('Posts:', response.data);
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
}

fetchData();
```

透過此設定，您無需手動管理權杖或標頭。SDK 會無縫地處理驗證流程。

## 後續步驟

您現在已經學會如何安裝 `@blocklet/js-sdk` 並在兩種最常見的情境中使用它。要深入了解，我們建議您探索以下指南：

<x-cards>
  <x-card data-title="發出 API 請求" data-icon="lucide:file-code-2" data-href="/guides/making-api-requests">
    深入了解 `createAxios` 和 `createFetch` 的進階配置，包括錯誤處理和請求參數。
  </x-card>
  <x-card data-title="驗證" data-icon="lucide:key-round" data-href="/guides/authentication">
    了解 SDK 如何在底層管理會話和刷新權杖，以保持使用者登入狀態。
  </x-card>
</x-cards>