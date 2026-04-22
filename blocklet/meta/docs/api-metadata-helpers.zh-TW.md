# 元資料輔助函式

這些工具函式是您從遠端來源獲取、處理和驗證 Blocklet 元資料的工具包。無論您是從商店 URL 還是本地檔案路徑解析 Blocklet，這些輔助函式對於任何需要與本地不存在的 Blocklet 互動的工具或應用程式（如啟動器、開發工具或註冊服務）都至關重要。

它們旨在處理網路請求、快取、驗證的複雜性，甚至在有多個來源可用時提供容錯功能。

## 核心獲取函式

這些函式是從一個或多個 URL 檢索 Blocklet 元資料的核心。

### getBlockletMetaByUrl

這是一個基礎函式，用於從單一 URL 獲取原始的 `blocklet.json` 內容。它支援 `http(s)://` 和 `file://` 協定。為了提高效能，成功獲取的結果會使用 LRU 快取機制儲存在記憶體中。

**參數**

<x-field-group>
  <x-field data-name="url" data-type="string" data-required="true" data-desc="指向 blocklet.json 檔案的 URL（http、https 或 file）。"></x-field>
</x-field-group>

**返回值**

<x-field data-name="" data-type="Promise<TBlockletMeta>" data-desc="一個解析為已解析的 Blocklet 元資料物件（TBlockletMeta）的 Promise。如果 URL 無法存取或內容不是有效的 JSON，則會拋出錯誤。"></x-field>

**範例**

```javascript 獲取原始元資料 icon=logos:javascript
import { getBlockletMetaByUrl } from '@blocklet/meta';

async function fetchMeta() {
  const metaUrl = 'https://store.blocklet.dev/api/blocklets/z8ia2vL3A9ACu4p2f2iF9yQWc9BvCzaWwx57p/blocklet.json';
  try {
    const meta = await getBlockletMetaByUrl(metaUrl);
    console.log(`成功獲取元資料：${meta.name}`);
    return meta;
  } catch (error) {
    console.error('獲取元資料失敗：', error.message);
  }
}

fetchMeta();
```

### getBlockletMetaFromUrl

這是一個更進階、更穩健的工具，建立在 `getBlockletMetaByUrl` 的基礎之上。它不僅會獲取元資料，還會執行驗證、清理資料（例如，移除 `htmlAst`），並可選擇性地確保相關的 `dist.tarball` URL 有效且可存取。這是大多數使用情境下推薦使用的函式。

**參數**

<x-field-group>
  <x-field data-name="url" data-type="string" data-required="true" data-desc="blocklet.json 檔案的 URL。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="一個可選的設定物件。">
    <x-field data-name="validateFn" data-type="Function" data-default="validateBlockletMeta" data-required="false" data-desc="一個用於驗證所獲取元資料的自訂函式。"></x-field>
    <x-field data-name="returnUrl" data-type="boolean" data-default="false" data-required="false" data-desc="如果為 true，函式將返回一個物件 { meta, url }。"></x-field>
    <x-field data-name="ensureTarball" data-type="boolean" data-default="true" data-required="false" data-desc="如果為 true，函式將透過發送 HEAD 請求來驗證 dist.tarball URL。"></x-field>
    <x-field data-name="logger" data-type="object" data-required="false" data-desc="用於偵錯目的的日誌記錄器實例（例如 console）。"></x-field>
  </x-field>
</x-field-group>

**返回值**

<x-field data-name="" data-type="Promise<any>" data-desc="一個解析為已驗證的 TBlockletMeta 物件的 Promise。如果 returnUrl 為 true，它將解析為 { meta: TBlockletMeta, url: string }。"></x-field>

**範例**

```javascript 獲取並驗證元資料 icon=logos:javascript
import { getBlockletMetaFromUrl } from '@blocklet/meta';

async function fetchAndValidateMeta() {
  const metaUrl = 'https://store.blocklet.dev/api/blocklets/z8ia2vL3A9ACu4p2f2iF9yQWc9BvCzaWwx57p/blocklet.json';
  try {
    const meta = await getBlockletMetaFromUrl(metaUrl, { ensureTarball: true });
    console.log(`成功驗證元資料：${meta.name}`);
    console.log(`Tarball URL 有效：${meta.dist.tarball}`);
  } catch (error) {
    console.error('獲取或驗證元資料失敗：', error.message);
  }
}

fetchAndValidateMeta();
```

### getBlockletMetaFromUrls

此函式透過接受一個 URL 陣列來提供容錯功能。它會嘗試同時從每個 URL 獲取元資料，並利用 `Promise.any` 返回第一個成功的結果。當一個 Blocklet 的元資料可能託管在多個位置（例如一個主註冊服務和一個備用註冊服務）時，這非常有用。

**參數**

<x-field-group>
  <x-field data-name="urls" data-type="string[]" data-required="true" data-desc="一個嘗試從中獲取的 URL 陣列。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="與 getBlockletMetaFromUrl 相同的選項物件。"></x-field>
</x-field-group>

**返回值**

<x-field data-name="" data-type="Promise<any>" data-desc="一個 Promise，它會以第一個成功獲取的結果進行解析。如果所有 URL 都失敗，該 Promise 將被拒絕，並附帶一個包含每次失敗原因的聚合錯誤。"></x-field>

**範例**

```javascript 使用備援獲取 icon=logos:javascript
import { getBlockletMetaFromUrls } from '@blocklet/meta';

async function fetchWithFallback() {
  const metaUrls = [
    'https://invalid-registry.com/blocklet.json', // 這會失敗
    'https://store.blocklet.dev/api/blocklets/z8ia2vL3A9ACu4p2f2iF9yQWc9BvCzaWwx57p/blocklet.json' // 這會成功
  ];

  try {
    const { meta, url } = await getBlockletMetaFromUrls(metaUrls, { returnUrl: true });
    console.log(`成功從 ${url} 獲取 ${meta.name} 的元資料`);
  } catch (error) {
    console.error('所有 URL 都失敗了：', error.message);
  }
}

fetchWithFallback();
```

## 組合輔助函式

這些輔助函式用於在複合應用程式中解析子 Blocklet 的元資料。

### getSourceUrlsFromConfig

這個工具對於 Blocklet 組合至關重要。當一個 Blocklet 定義了 `components` 時，此函式會解析元件的設定以產生一個潛在的 `blocklet.json` URL 列表。它可以解譯各種來源宣告，包括直接 URL、Blocklet Store 識別碼和解析後的 URL。

**參數**

<x-field-group>
  <x-field data-name="config" data-type="object" data-required="true" data-desc="來自 blocklet.yml 檔案中 components 部分的元件設定物件。"></x-field>
</x-field-group>

**返回值**

<x-field data-name="" data-type="string[]" data-desc="一個包含指定元件的潛在元資料 URL 的陣列。"></x-field>

**範例**

```javascript 解析元件元資料 URL icon=logos:javascript
import { getSourceUrlsFromConfig } from '@blocklet/meta';

// 來自父 Blocklet 元資料的元件設定範例
const componentConfig = {
  name: 'my-child-blocklet',
  source: {
    store: ['https://store.blocklet.dev/api', 'https://backup-store.com/api'],
    version: '1.2.0'
  }
};

const urls = getSourceUrlsFromConfig(componentConfig);

console.log(urls);
/* 輸出（DID 是從名稱派生的）：
[
  'https://store.blocklet.dev/api/blocklets/z2qa.../1.2.0/blocklet.json',
  'https://backup-store.com/api/blocklets/z2qa.../1.2.0/blocklet.json'
]
*/
```

## 驗證工具

本節包含核心獲取函式所使用的較低階工具。

### validateUrl

這是一個通用工具，用於檢查 URL 是否有效且可存取。它透過檢查檔案是否存在來支援 `file://`，並透過發送 `HEAD` 請求來驗證可存取性以及可選的 `content-type` 標頭，以支援 `http(s)://`。此函式的結果也會被快取。

**參數**

<x-field-group>
  <x-field data-name="url" data-type="string" data-required="true" data-desc="要驗證的 URL。"></x-field>
  <x-field data-name="expectedHttpResTypes" data-type="string[]" data-default="['application/json', 'text/plain']" data-required="false" data-desc="一個包含可接受的 HTTP 請求 content-type 值的陣列。"></x-field>
</x-field-group>

**返回值**

<x-field data-name="" data-type="Promise<boolean>" data-desc="一個 Promise，如果 URL 有效則解析為 true。如果驗證失敗（例如，找不到檔案、網路錯誤、非預期的內容類型），則會拋出錯誤。"></x-field>

**範例**

```javascript 驗證遠端資產 icon=logos:javascript
import { validateUrl } from '@blocklet/meta';

async function checkTarball(url) {
  try {
    await validateUrl(url, ['application/octet-stream', 'application/x-gzip']);
    console.log(`Tarball URL 有效且具有正確的內容類型：${url}`);
    return true;
  } catch (error) {
    console.error(`Tarball URL 驗證失敗：${error.message}`);
    return false;
  }
}

checkTarball('https://some-cdn.com/blocklet.tar.gz');
```