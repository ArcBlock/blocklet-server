# DID Connect

Blocklet SDK 提供了一種簡化的方式，使用 DID Connect 將去中心化身份整合到您的應用程式中。這讓使用者可以使用 DID 錢包安全地登入並管理他們的資料，提供了一種無密碼且以使用者為中心的驗證體驗。此功能的核心元件是 `WalletAuthenticator` 和 `WalletHandler`。

這些工具程式建立在強大的 `@arcblock/did-connect-js` 函式庫之上，簡化了在 Blocklet 環境中的設定過程。

### 運作原理

典型的 DID Connect 登入流程涉及使用者、您應用程式的前端和後端，以及使用者的 DID 錢包。

<!-- DIAGRAM_IMAGE_START:sequence:4:3 -->
![DID Connect](assets/diagram/did-connect-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## 基本設定

在您的 Blocklet 中設定 DID Connect 非常簡單。您需要實例化 `WalletAuthenticator` 和 `WalletHandler`，並為會話資料提供一個儲存機制。

這是在 Express.js 應用程式中的典型設定：

```javascript Basic DID Connect Setup icon=logos:javascript
import path from 'path';
import AuthStorage from '@arcblock/did-connect-storage-nedb';
import WalletAuthenticator from '@blocklet/sdk/lib/wallet-authenticator';
import WalletHandler from '@blocklet/sdk/lib/wallet-handler';

// 1. 初始化 authenticator
export const authenticator = new WalletAuthenticator();

// 2. 使用 authenticator 和儲存解決方案初始化 handler
export const handlers = new WalletHandler({
  authenticator,
  tokenStorage: new AuthStorage({
    dbPath: path.join(process.env.BLOCKLET_DATA_DIR, 'auth.db'),
  }),
});

// 3. 將 handlers 掛載到您的 Express 應用程式
// app.use('/api/did/auth', handlers);
```

**程式碼分解：**

1.  **`WalletAuthenticator`**：此類別負責建立和管理 DID Connect 會話。它會產生將被編碼到顯示給使用者的 QR Code 中的資料。
2.  **`@arcblock/did-connect-storage-nedb`**：這是一個基於檔案的儲存適配器，用於持久化會話權杖。對於 Blocklet 而言，這是一個方便的選擇，因為它將資料儲存在 blocklet 的資料目錄（`BLOCKLET_DATA_DIR`）中。
3.  **`WalletHandler`**：此類別處理整個驗證生命週期。它管理會話的建立、狀態更新（例如，當使用者掃描 QR Code 時），以及來自錢包的最終驗證回應。

## 設定

`WalletHandler` 建構函式接受一個選項物件來自訂其行為。以下是一些關鍵參數：

<x-field-group>
  <x-field data-name="authenticator" data-type="WalletAuthenticator" data-required="true" data-desc="一個 WalletAuthenticator 的實例。"></x-field>
  <x-field data-name="tokenStorage" data-type="object" data-required="true" data-desc="一個用於持久化會話權杖的儲存實例，例如來自 '@arcblock/did-connect-storage-nedb' 的 AuthStorage。"></x-field>
  <x-field data-name="autoConnect" data-type="boolean" data-default="true" data-required="false">
    <x-field-desc markdown>如果為 `true`，先前已連接過錢包的回訪使用者可以自動登入，無需再次掃描 QR Code。這是透過向他們的錢包發送推播通知來實現的。</x-field-desc>
  </x-field>
  <x-field data-name="connectedDidOnly" data-type="boolean" data-default="false" data-required="false">
    <x-field-desc markdown>如果為 `true`，只有當前登入使用者（如果有的話）的 DID 可以用來連接。這對於使用者需要將錢包連結到現有帳戶的場景很有用。</x-field-desc>
  </x-field>
</x-field-group>

### 自訂應用程式資訊

當使用者掃描 QR Code 時，他們的 DID 錢包會顯示有關您應用程式的資訊，例如其名稱、描述和圖示。SDK 會使用您的 blocklet 元資料自動填入這些資訊。但是，您可以透過將 `appInfo` 函數傳遞給 `WalletAuthenticator` 的建構函式來覆寫這些資訊。

```javascript Customizing App Info icon=logos:javascript
import WalletAuthenticator from '@blocklet/sdk/lib/wallet-authenticator';

const authenticator = new WalletAuthenticator({
  async appInfo() {
    // 此函數可以回傳自訂的應用程式資訊
    // 回傳的物件將與預設資訊合併
    return {
      name: 'My Custom App Name',
      description: 'A custom description for the DID Connect request.',
      icon: 'https://my-app.com/logo.png',
    };
  },
});
```

## 延伸閱讀

`WalletAuthenticator` 和 `WalletHandler` 是 Blocklet SDK 提供的便利封裝，基於更全面的 `@arcblock/did-connect-js` 函式庫。對於進階用例、更深度的自訂，或想更透徹地了解底層機制，請參考官方的 DID Connect SDK 文件。

<x-card data-title="DID Connect SDK 文件" data-icon="lucide:book-open" data-href="https://www.arcblock.io/docs/did-connect-sdk/en/did-connect-sdk-overview" data-cta="閱讀更多">
  探索 DID Connect 協議及其 JavaScript SDK 的全部功能，以建構功能強大的去中心化應用程式。
</x-card>

在使用者成功驗證後，下一步是在您的應用程式中管理他們的會話。Blocklet SDK 為此提供了一個強大的中介軟體。

要了解如何驗證使用者會話並保護您的路由，請繼續閱讀下一節關於 [會話中介軟體](./authentication-session-middleware.md)。