# 錢包管理

在 Blocklet SDK 中，錢包是一個基本的密碼學物件，代表您的應用程式的身份。它對於簽署資料、驗證請求以及與區塊鏈網路互動至關重要。SDK 提供了一個強大且方便的工具程式 `getWallet`，可以直接從您應用程式的環境變數中建立和管理錢包實例。

無論您是使用 ArcBlock 的原生 DID 還是以太坊，此工具程式都抽象化了處理不同密碼學曲線和金鑰格式的複雜性。錢包的金鑰來源於 Blocklet Server 設定的環境變數，您可以在 [設定與環境](./core-concepts-configuration.md) 文件中了解更多相關資訊。

## getWallet 工具程式

`getWallet` 函數是建立 `WalletObject` 的主要方法。預設情況下，它會使用環境中應用程式的標準私鑰 (`BLOCKLET_APP_SK`) 和設定的鏈類型 (`CHAIN_TYPE` 或 `BLOCKLET_WALLET_TYPE`)。

```javascript Basic Usage icon=logos:javascript
import getWallet from '@blocklet/sdk/lib/wallet';

// 使用環境變數建立錢包實例
const appWallet = getWallet();

// 現在您可以使用錢包來簽署資料
const signature = appWallet.sign('data to be signed');
```

此工具程式足夠智慧，可以根據設定處理不同的區塊鏈類型。

### 參數

雖然 `getWallet` 可以直接使用環境變數，但您也可以透過傳遞參數來覆寫其行為。

<x-field data-name="type" data-type="DIDTypeShortcut" data-required="false" data-desc="錢包的 DID 類型。可以是 'ethereum' 或 'arcblock'（或 'default'）。預設為 CHAIN_TYPE 或 BLOCKLET_WALLET_TYPE 環境變數的值。"></x-field>

<x-field data-name="appSk" data-type="string" data-required="false" data-desc="十六進位格式的應用程式私鑰。預設為 BLOCKLET_APP_SK 環境變數的值。"></x-field>


### 建立特定鏈的錢包

您可以透過提供 `type` 參數來明確請求特定鏈類型的錢包。

```javascript Creating an Ethereum Wallet icon=logos:javascript
import getWallet from '@blocklet/sdk/lib/wallet';

// 使用預設私鑰明確建立一個以太坊錢包
const ethWallet = getWallet('ethereum');
```

## 特殊化的錢包輔助工具

`getWallet` 函數還附帶了幾個用於常見使用案例的輔助方法。

### `getWallet.getPermanentWallet()`

某些操作可能需要更穩定、長期的身份。為此，Blocklet Server 提供了一個永久私鑰 (`BLOCKLET_APP_PSK`)。此輔助工具使用此永久金鑰建立錢包。

```javascript Using the Permanent Wallet icon=logos:javascript
import getWallet from '@blocklet/sdk/lib/wallet';

const permanentWallet = getWallet.getPermanentWallet();
```

### `getWallet.getEthereumWallet(permanent)`

這是建立以太坊錢包的便捷捷徑。它接受一個可選的布林值參數，以指定是否使用永久私鑰。

```javascript Creating Ethereum Wallets icon=logos:javascript
import getWallet from '@blocklet/sdk/lib/wallet';

// 取得標準以太坊錢包（使用 BLOCKLET_APP_SK）
const standardEthWallet = getWallet.getEthereumWallet();

// 取得永久以太坊錢包（使用 BLOCKLET_APP_PSK）
const permanentEthWallet = getWallet.getEthereumWallet(true);
```

### `getWallet.getPkWallet()`

在某些情況下，您可能需要在沒有私鑰的情況下，使用錢包的公鑰 (`BLOCKLET_APP_PK`) 來驗證簽名。`getPkWallet` 輔助工具從公鑰建立一個唯讀的錢包實例。

```javascript Creating a Wallet from a Public Key icon=logos:javascript
import getWallet from '@blocklet/sdk/lib/wallet';

// 從應用程式的公鑰建立錢包
const pkWallet = getWallet.getPkWallet();

// 此錢包可用於驗證簽名，但不能用於簽署資料
// const isValid = pkWallet.verify('data', signature);
```

## 效能與快取

為達最佳效能，`getWallet` 工具程式內建了一個 LRU（最近最少使用）快取。它會根據錢包的類型和私鑰快取最多四個錢包實例，確保使用相同參數的重複呼叫速度極快。此快取會自動處理，因此您無需自行實作。

---

在對錢包管理有了扎實的理解後，您現在已具備在您的 blocklet 中處理密碼學操作的能力。接下來的合理步驟是了解如何使用這些錢包來保護您的應用程式。

<x-card data-title="下一步：安全性工具" data-icon="lucide:shield-check" data-href="/core-concepts/security" data-cta="閱讀更多">
了解如何使用錢包加密資料和簽署 API 回應。
</x-card>