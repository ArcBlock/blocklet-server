# 元件與狀態工具程式

`@blocklet/meta` 函式庫提供了一套全面的工具函式，旨在簡化與 `BlockletState` 物件的互動。Blocklet，特別是複合型 Blocklet，會被表示為一個元件樹。這些工具程式提供了強大且高效的方法來遍歷此樹、尋找特定元件、檢查其狀態，以及提取用於執行時期操作、UI 渲染和管理任務的關鍵資訊。

本節涵蓋了樹狀遍歷、元件搜尋、狀態檢查、配置管理和資訊提取等函式。

## 樹狀遍歷

這些函式允許您迭代 Blocklet 應用程式的元件樹。它們對於對每個元件應用操作或匯總資料至關重要。

### `forEachBlocklet` & `forEachBlockletSync`

核心的遍歷函式。`forEachBlocklet` 是非同步的，可以序列（預設）或並行執行，而 `forEachBlockletSync` 則是其同步對應版本。

```typescript Function Signature icon=logos:typescript
function forEachBlocklet(
  blocklet: TComponentPro,
  cb: (blocklet: TComponentPro, context: object) => any,
  options?: {
    parallel?: boolean;
    concurrencyLimit?: number;
    sync?: boolean;
  }
): Promise<any> | null;

function forEachBlockletSync(
  blocklet: any,
  cb: Function
): void;
```

回呼函式 `cb` 會接收當前的元件和一個包含 `{ parent, root, level, ancestors, id }` 的上下文物件。

**範例：收集所有元件的 DID**

```javascript icon=logos:javascript
import { forEachBlockletSync } from '@blocklet/meta/lib/util';

const appState = {
  meta: { did: 'z1' },
  children: [
    { meta: { did: 'z2' } },
    {
      meta: { did: 'z3' },
      children: [{ meta: { did: 'z4' } }],
    },
  ],
};

const allDids = [];
forEachBlockletSync(appState, (component) => {
  if (component.meta?.did) {
    allDids.push(component.meta.did);
  }
});

console.log(allDids);
// Output: ['z1', 'z2', 'z3', 'z4']
```

### `forEachChild` & `forEachChildSync`

這些是 `forEachBlocklet` 的包裝函式，可以方便地迭代 Blocklet 的所有後代，並跳過根 Blocklet 本身（其中 `level > 0`）。

## 尋找與篩選元件

在狀態樹中定位特定元件是一個常見的需求。這些函式提供了多種基於不同條件尋找一個或多個元件的方法。

### `findComponent`

一個通用的搜尋函式，它會遍歷元件樹並返回第一個滿足所提供謂詞函式的元件。

```typescript Function Signature icon=logos:typescript
function findComponent(
  blocklet: TComponent,
  isEqualFn: (component: TComponent, context: { ancestors: Array<TComponent> }) => boolean
): TComponent | null;
```

**範例：透過 `bundleName` 尋找元件**

```javascript icon=logos:javascript
import { findComponent } from '@blocklet/meta/lib/util';

const appState = {
  meta: { did: 'z1', bundleName: 'app' },
  children: [
    { meta: { did: 'z2', bundleName: 'component-a' } },
    { meta: { did: 'z3', bundleName: 'component-b' } },
  ],
};

const componentB = findComponent(
  appState,
  (component) => component.meta?.bundleName === 'component-b'
);

console.log(componentB.meta.did);
// Output: 'z3'
```

### `findComponentById`

`findComponent` 的一個特化版本，透過其唯一的複合 ID（例如 `app-did/component-did`）尋找元件。

```typescript Function Signature icon=logos:typescript
function findComponentById(
  blocklet: TComponent,
  componentId: string | string[]
): TComponent | null;
```

### `filterComponentsV2`

迭代應用程式的直接子元件，並返回一個包含所有滿足謂詞函式的元件陣列。

## 身份與命名

這些工具程式有助於生成和檢索應用程式狀態中元件的各種識別碼和名稱。

| Function | Description |
|---|---|
| `getComponentId` | 使用其祖先的 DID 為元件建構一個唯一的、基於路徑的 ID（例如 `root_did/child_did`）。 |
| `getComponentName` | 使用其祖先的名稱為元件建構一個唯一的、基於路徑的名稱。 |
| `getParentComponentName` | 從給定的元件名稱路徑中提取父元件的名稱。 |
| `getAppName` | 檢索 Blocklet 的顯示名稱，優先使用 `BLOCKLET_APP_NAME` 環境變數而非元資料。 |
| `getAppDescription` | 檢索 Blocklet 的描述，優先使用 `BLOCKLET_APP_DESCRIPTION`。 |
| `getComponentProcessId` | 為元件生成一個檔案系統安全的進程 ID，對長名稱使用 MD5 雜湊以防止檔案系統錯誤。 |

## 配置與狀態管理

管理配置至關重要，尤其是在可以共享設定的複合 Blocklet 中。這些輔助函式簡化了此過程。

### `getSharedConfigObj`

計算應用程式中特定元件的共享配置物件。它會智慧地合併來自父應用程式和標記為 `shared: true` 的同級元件的配置。

### `getAppMissingConfigs` & `getComponentMissingConfigs`

這些函式對於驗證至關重要。它們會掃描一個應用程式或單一元件，並返回所有被標記為 `required: true` 但尚未直接或透過共享配置機制賦值的配置列表。

**範例：檢查缺失的配置**

```javascript icon=logos:javascript
import { getAppMissingConfigs } from '@blocklet/meta/lib/util';

const appWithMissingConfig = {
  meta: { did: 'z1' },
  children: [
    {
      meta: { did: 'z2' },
      configs: [
        { key: 'API_KEY', required: true, value: null, description: 'Service API Key' },
      ],
    },
  ],
};

const missing = getAppMissingConfigs(appWithMissingConfig);

console.log(missing);
// Output: [{ did: 'z2', key: 'API_KEY', description: 'Service API Key' }]
```

### `wipeSensitiveData`

一個以安全為中心的工具程式，它會創建 Blocklet 狀態物件的深度複製副本並編輯所有敏感資訊。它會將標記為 `secure: true` 的欄位值和某些敏感環境變數（如 `BLOCKLET_APP_SK`）的值替換為 `__encrypted__`。

## 狀態檢查

這些布林函式提供了一種簡單的方法來檢查 Blocklet 或元件的當前狀態，而無需直接處理原始狀態碼。

| Function | Description | Corresponding Statuses |
|---|---|---|
| `isRunning` | 檢查元件是否處於穩定的執行中狀態。 | `running` |
| `isInProgress` | 檢查元件是否處於過渡狀態。 | `downloading`、`installing`、`starting`、`stopping`、`upgrading` 等。 |
| `isBeforeInstalled` | 檢查元件是否尚未完成首次安裝。 | `added`、`waiting`、`downloading`、`installing` |
| `isAccessible` | 檢查元件的 Web 介面是否可能可以存取。 | `running`、`waiting`、`downloading` |

## 介面與服務發現

用於尋找在 Blocklet 元資料中定義的介面和服務的工具程式。

| Function | Description |
|---|---|
| `findWebInterface` | 在元件的元資料中尋找類型為 `web` 的第一個介面。 |
| `findDockerInterface` | 在元件的元資料中尋找類型為 `docker` 的第一個介面。 |
| `findWebInterfacePort` | 檢索對應到元件 Web 介面的主機埠號。 |
| `getBlockletServices` | 返回一個扁平化列表，包含在 Blocklet 中所有元件上定義的所有服務，包括其名稱、協定和埠號詳細資訊。 |

## 資訊提取

這些函式從原始 Blocklet 狀態中提取特定的、經過處理的資訊。

### `getComponentsInternalInfo`

此函式會遍歷一個 Blocklet 應用程式，並返回一個結構化陣列，其中包含每個元件的關鍵內部詳細資訊。這對於系統管理和服務間通訊非常有用。

**返回**

<x-field-group>
  <x-field data-name="components" data-type="array" data-desc="一個包含內部元件資訊物件的陣列。">
    <x-field data-name="title" data-type="string" data-desc="元件的顯示標題。"></x-field>
    <x-field data-name="did" data-type="string" data-desc="元件的唯一 DID。"></x-field>
    <x-field data-name="name" data-type="string" data-desc="元件的機器可讀名稱。"></x-field>
    <x-field data-name="version" data-type="string" data-desc="元件的版本。"></x-field>
    <x-field data-name="mountPoint" data-type="string" data-desc="元件掛載的 URL 路徑。"></x-field>
    <x-field data-name="status" data-type="number" data-desc="元件的數字狀態碼。"></x-field>
    <x-field data-name="port" data-type="number" data-desc="分配給元件 Web 介面的主機埠號。"></x-field>
    <x-field data-name="containerPort" data-type="string" data-desc="Web 介面的內部容器埠號。"></x-field>
    <x-field data-name="resourcesV2" data-type="array" data-desc="與元件捆綁的資源資產列表。">
      <x-field data-name="path" data-type="string" data-desc="資源的絕對路徑。"></x-field>
      <x-field data-name="public" data-type="boolean" data-desc="表示資源是否可公開存取。"></x-field>
    </x-field>
    <x-field data-name="group" data-type="string" data-desc="元件的功能群組（例如 'gateway'、'dapp'）。"></x-field>
  </x-field>
</x-field-group>

### `getMountPoints`

掃描整個元件樹，並返回一個結構化列表，包含所有具有掛載點的元件，從而可以輕鬆地建立導航或路由表。

### `getAppUrl`

透過分析其 `site.domainAliases` 來確定 Blocklet 應用程式的主要、面向使用者的 URL。它會智慧地對網域進行排序，以優先考慮可存取的、非受保護的 URL。

## 其他工具程式

其他有用的檢查和輔助函式的集合。

| Function | Description |
|---|---|
| `isFreeBlocklet` | 檢查 Blocklet 的支付價格是否為零。 |
| `isDeletableBlocklet` | 根據 `BLOCKLET_DELETABLE` 環境變數檢查是否允許刪除 Blocklet。 |
| `hasRunnableComponent` | 確定應用程式是否包含任何可以執行的非閘道元件。 |
| `isExternalBlocklet` | 檢查 Blocklet 是否由外部控制器管理。 |
| `isGatewayBlocklet` | 檢查元件的群組是否為 `gateway`。 |
| `isPackBlocklet` | 檢查元件的群組是否為 `pack`。 |
| `hasStartEngine` | 檢查元件的元資料是否定義了可啟動的引擎（例如 `main` 或 `docker.image`）。 |
| `hasMountPoint` | 根據元件的配置確定其是否應該有掛載點。 |
| `getBlockletChainInfo` | 從 Blocklet 及其子元件中提取並整合鏈配置（類型、ID、主機）。 |
| `checkPublicAccess`| 檢查 Blocklet 的安全配置是否允許公開存取。 |
