# DID 與錢包工具

本節提供與去中心化識別碼 (DID) 和密碼學錢包相關的工具函式的詳細參考。這些輔助工具對於管理 Blocklet 的身分、生成應用程式專用錢包以及從使用者會話中提取身分資訊至關重要。

## Blocklet 身分與錢包生成

這些函式用於建立和管理 Blocklet 本身的核心身分和密碼學錢包。

### toBlockletDid

將字串或緩衝區轉換為有效的 Blocklet DID。如果輸入已經是有效的 DID，則按原樣返回。否則，它會從輸入中生成一個 `ROLE_ANY` 類型的 DID。

**參數**

<x-field-group>
  <x-field data-name="name" data-type="string | Buffer" data-required="true" data-desc="要轉換為 DID 的字串或緩衝區。"></x-field>
</x-field-group>

**返回**

<x-field-group>
  <x-field data-name="did" data-type="string" data-desc="一個有效的 DID。"></x-field>
</x-field-group>

**範例**

```javascript toBlockletDid Example icon=mdi:identifier
import toBlockletDid from '@blocklet/meta/lib/did';

// 從字串名稱生成 DID
const blockletName = 'my-awesome-blocklet';
const did = toBlockletDid(blockletName);

console.log(did); // 例如 'z8ia1m4f5z3a...'

// 它也適用於現有的有效 DID
const existingDid = 'z8iZge7d4a4s9d5z...';
const result = toBlockletDid(existingDid);

console.log(result === existingDid); // true
```

### getApplicationWallet

為 Blocklet 生成一個錢包物件。這對於任何需要簽名的操作（例如與其他服務進行身份驗證或創建可驗證憑證）都是一個關鍵函式。錢包可以從 Blocklet 的 DID 結合節點的私鑰衍生而來，也可以直接從作為環境變數提供的自訂私鑰衍生而來。

**參數**

<x-field-group>
  <x-field data-name="didOrSk" data-type="string" data-required="true" data-desc="Blocklet 的 DID 或自訂私鑰。如果它不是一個有效的 DID，則會被視為私鑰。"></x-field>
  <x-field data-name="nodeSk" data-type="string" data-required="false" data-desc="如果 didOrSk 是 DID，則為必填。底層 Blocklet Server 節點的私鑰。"></x-field>
  <x-field data-name="type" data-type="DIDType | 'default' | 'eth' | 'ethereum'" data-required="false" data-desc="要生成的錢包類型。支援 'ethereum' 或 'eth' 以生成與以太坊相容的錢包。預設為標準的 ArcBlock 類型。"></x-field>
  <x-field data-name="index" data-type="number" data-required="false" data-default="0" data-desc="衍生索引，用於從 DID 和節點 SK 生成錢包時。"></x-field>
</x-field-group>

**返回**

<x-field-group>
  <x-field data-name="wallet" data-type="WalletObject" data-desc="一個 OCAP 錢包物件，包含地址、公鑰、私鑰和簽名方法。"></x-field>
</x-field-group>

**範例：從 DID 和節點 SK 生成**

```javascript Generating from DID icon=mdi:wallet
import getApplicationWallet from '@blocklet/meta/lib/wallet';

const blockletDid = 'z8iZ...'; // 來自其元資料的 Blocklet DID
const nodeSk = '...'; // Blocklet Server 節點的私鑰

const wallet = getApplicationWallet(blockletDid, nodeSk);

console.log('Wallet Address:', wallet.address);
console.log('Wallet Type:', wallet.type);
```

**範例：從自訂 SK 生成**

```javascript Generating from Custom SK icon=mdi:key-variant
import getApplicationWallet from '@blocklet/meta/lib/wallet';

// 通常從 process.env.BLOCKLET_APP_SK 載入
const customSk = '...'; 
const wallet = getApplicationWallet(customSk);

console.log('Wallet Address:', wallet.address);
```

### getBlockletInfo

這是一個高階工具，它會解析 Blocklet 的狀態物件以提取一套全面的元資料，並可選擇性地生成其錢包。它整合了來自 `blocklet.yml`、環境變數和伺服器配置的資訊。

**參數**

<x-field-group>
  <x-field data-name="state" data-type="BlockletState" data-required="true" data-desc="Blocklet 的狀態物件，通常在 Blocklet 的後端掛鉤或路由中可用。"></x-field>
  <x-field data-name="nodeSk" data-type="string" data-required="false" data-desc="Blocklet Server 節點的私鑰。如果 returnWallet 為 true 且環境中未設定自訂 SK，則為必填。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="設定選項。">
    <x-field data-name="returnWallet" data-type="boolean" data-required="false" data-default="true" data-desc="如果為 true，該函式將生成並包含錢包和 permanentWallet 物件。"></x-field>
  </x-field>
</x-field-group>

**返回**

<x-field-group>
  <x-field data-name="info" data-type="object" data-desc="一個包含 Blocklet 資訊的物件。">
    <x-field data-name="did" data-type="string" data-desc="來自 meta.did 的 Blocklet DID。"></x-field>
    <x-field data-name="name" data-type="string" data-desc="Blocklet 的顯示名稱。"></x-field>
    <x-field data-name="version" data-type="string" data-desc="Blocklet 版本。"></x-field>
    <x-field data-name="description" data-type="string" data-desc="Blocklet 描述。"></x-field>
    <x-field data-name="appUrl" data-type="string" data-desc="已設定的應用程式 URL。"></x-field>
    <x-field data-name="secret" data-type="string" data-desc="用於會話管理的衍生秘密雜湊值。"></x-field>
    <x-field data-name="wallet" data-type="WalletObject | null" data-desc="主要應用程式錢包（如果 returnWallet 為 false，則為 null）。"></x-field>
    <x-field data-name="permanentWallet" data-type="WalletObject | null" data-desc="如果設定了 BLOCKLET_APP_PSK，則為永久錢包，否則與錢包相同。"></x-field>
    <x-field data-name="passportColor" data-type="string" data-desc="數位錢包的配色方案。"></x-field>
    <x-field data-name="tenantMode" data-type="string" data-desc="應用程式的租戶模式。"></x-field>
  </x-field>
</x-field-group>

**範例**

```javascript getBlockletInfo Example icon=mdi:information
import getBlockletInfo from '@blocklet/meta/lib/info';

// 假設 'blockletState' 和 'nodeSk' 在您的上下文中可用

try {
  const info = getBlockletInfo(blockletState, nodeSk);

  console.log(`Blocklet Name: ${info.name}`);
  console.log(`Blocklet DID: ${info.did}`);
  console.log(`App Wallet Address: ${info.wallet.address}`);

  // 當不需要錢包時
  const infoWithoutWallet = getBlockletInfo(blockletState, nodeSk, { returnWallet: false });
  console.log(infoWithoutWallet.wallet); // null
} catch (error) {
  console.error('Failed to get Blocklet info:', error.message);
}
```

## 使用者身分與帳戶輔助工具

這些工具函式旨在輕鬆地從 `UserInfo` 物件中提取 DID 和帳戶資訊，該物件通常在 Blocklet 的已驗證路由中的 `req.user` 中可用。

### 使用者資訊工具函式

一組用於存取使用者身分設定檔不同部分的輔助工具。

| 函式 | 說明 |
|---|---|
| `getPermanentDid(user)` | 返回使用者的主要永久 DID。 |
| `getConnectedAccounts(user)` | 返回連接到使用者個人資料的所有帳戶的陣列。 |
| `getConnectedDids(user)` | 返回所有已連接帳戶的 DID 陣列。 |
| `getWallet(user)` | 尋找並返回使用者已連接的錢包帳戶物件。 |
| `getWalletDid(user)` | 一個方便的函式，用於獲取使用者已連接錢包的 DID。 |
| `getSourceProvider(user)` | 返回使用者用於當前會話的提供者（例如，`wallet`）。 |
| `getSourceProviders(user)` | 返回使用者已連接的所有提供者的陣列。 |

**範例**

```javascript User Info Helpers icon=mdi:account-details
import {
  getPermanentDid,
  getConnectedDids,
  getWalletDid,
  getSourceProvider,
} from '@blocklet/meta/lib/did-utils';

// 模擬的 UserInfo 物件（在真實應用程式中，這將是 req.user）
const mockUser = {
  did: 'z...userPermanentDid',
  sourceProvider: 'wallet',
  connectedAccounts: [
    {
      provider: 'wallet',
      did: 'z...userWalletDid',
      // ... 其他錢包帳戶詳細資訊
    },
    {
      provider: 'github',
      did: 'z...userGithubDid',
      // ... 其他 github 帳戶詳細資訊
    },
  ],
  // ... 其他 UserInfo 屬性
};

const permanentDid = getPermanentDid(mockUser);
console.log('Permanent DID:', permanentDid); // 'z...userPermanentDid'

const walletDid = getWalletDid(mockUser);
console.log('Wallet DID:', walletDid); // 'z...userWalletDid'

const allDids = getConnectedDids(mockUser);
console.log('All Connected DIDs:', allDids); // ['z...userWalletDid', 'z...userGithubDid']

const loginProvider = getSourceProvider(mockUser);
console.log('Logged in with:', loginProvider); // 'wallet'
```

---

這些工具提供了在您的 Blocklet 中管理身分和安全性的基礎建構模塊。要了解如何使用這些錢包進行資料簽名和驗證，請前往 [安全性工具](./api-security-utilities.md) 部分。
