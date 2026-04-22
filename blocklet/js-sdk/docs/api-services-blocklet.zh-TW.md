# BlockletService

`BlockletService` 提供了存取 blocklet 元資料的方法。此元資料由 `Blocklet` 物件表示，包含應用程式名稱、URL 前綴、版本和元件掛載點等基本資訊。

該服務可以透過兩種主要方式擷取此資訊：

1.  **客戶端：** 透過讀取全域 `window.blocklet` 物件，當您的程式碼在 blocklet 的前端執行時，該物件會自動可用。
2.  **遠端擷取：** 透過從指定的基礎 URL 擷取 blocklet 的元資料。這對於伺服器端情境或從外部應用程式與 blocklet 互動時非常有用。

為了提高效能，該服務為遠端擷取的 blocklet 資料實作了記憶體內快取，快取持續 60 秒。

---

## 方法

### getBlocklet()

擷取 blocklet 的元資料物件。此方法的行為會根據提供的參數而改變。

-   在客戶端無參數呼叫時，它會同步回傳 `window.blocklet`。
-   當使用 `baseUrl` 呼叫時，它會非同步地從遠端 URL 擷取元資料。

**參數**

<x-field-group>
  <x-field data-name="baseUrl" data-type="string" data-required="false" data-desc="要從中擷取元資料的 blocklet 的基礎 URL。伺服器端使用時為必要項。"></x-field>
  <x-field data-name="force" data-type="boolean" data-default="false" data-required="false" data-desc="如果為 true，將繞過快取並從遠端 URL 擷取最新資料。"></x-field>
</x-field-group>

**回傳值**

<x-field data-name="Promise<Blocklet> | Blocklet" data-type="Promise<Blocklet> | Blocklet" data-desc="在遠端擷取時，回傳一個解析為 blocklet 元資料物件的 Promise；在客戶端情境中，則直接回傳該物件。"></x-field>

**範例**

```javascript 在客戶端取得 Blocklet icon=logos:javascript
// 此程式碼假設在 blocklet 的前端環境中執行

async function logBlockletName() {
  try {
    // 在客戶端，如果資料已預先載入，getBlocklet() 可以是同步的
    const blocklet = await sdk.blocklet.getBlocklet();
    console.log('Blocklet 名稱：', blocklet.appName);
  } catch (error) {
    console.error('取得 blocklet 資訊失敗：', error);
  }
}

logBlockletName();
```

```javascript 從 URL 擷取 Blocklet icon=logos:javascript
async function fetchRemoteBlocklet(url) {
  try {
    console.log(`正在從 ${url} 擷取 blocklet 資訊...`);
    const blocklet = await sdk.blocklet.getBlocklet(url);
    console.log(`成功擷取：${blocklet.appName} v${blocklet.version}`);

    // 再次擷取，這次應該會從快取中讀取
    const cachedBlocklet = await sdk.blocklet.getBlocklet(url);
    console.log('從快取中擷取：', cachedBlocklet.appName);

    // 強制重新擷取，繞過快取
    const freshBlocklet = await sdk.blocklet.getBlocklet(url, true);
    console.log('強制重新擷取：', freshBlocklet.appName);
  } catch (error) {
    console.error('擷取遠端 blocklet 失敗：', error);
  }
}

fetchRemoteBlocklet('https://store.blocklet.dev');
```

### loadBlocklet()

這是一個客戶端工具方法，可動態地將 `__blocklet__.js` 指令碼注入文件的 `<head>` 中。此指令碼會填入 `window.blocklet` 物件，使元資料在全域範圍內可用。這對於本身不是 blocklet 但需要與 blocklet 互動的應用程式特別有用。

> 注意：在伺服器端（Node.js）環境中呼叫此方法將會失敗。

**回傳值**

<x-field data-name="Promise<void>" data-type="Promise<void>" data-desc="一個 Promise，當指令碼成功載入時解析，若發生錯誤則拒絕。"></x-field>

**範例**

```javascript 動態載入 Blocklet 指令碼 icon=logos:javascript
async function initializeBlockletData() {
  try {
    await sdk.blocklet.loadBlocklet();
    console.log('Blocklet 指令碼載入成功。');
    // 現在 window.blocklet 已可用
    console.log('Blocklet 名稱：', window.blocklet.appName);
  } catch (error) {
    console.error('載入 blocklet 指令碼失敗：', error);
  }
}

// 在瀏覽器環境中執行此函式
initializeBlockletData();
```

### getPrefix()

一個方便的方法，用於取得 blocklet 的 URL 前綴。前綴是 blocklet 服務的基礎路徑（例如 `/` 或 `/my-blocklet`）。

**參數**

<x-field data-name="blocklet" data-type="Blocklet" data-required="false" data-desc="一個可選的 Blocklet 物件。如果提供，將回傳其 prefix 屬性。"></x-field>

**回傳值**

<x-field data-name="string | null" data-type="string | null" data-desc="字串前綴（例如 '/app'）或預設的 '/'。在伺服器端環境中，若 window 不可用且未傳遞 blocklet 物件，則回傳 null。"></x-field>

**範例**

```javascript 取得 URL 前綴 icon=logos:javascript
// 假設這在 blocklet 內的客戶端執行
const prefix = sdk.blocklet.getPrefix();
console.log('目前的 blocklet 前綴：', prefix);

// 或者，您可以傳遞一個已經擷取的 Blocklet 物件
async function logPrefixForRemoteBlocklet(url) {
  const remoteBlocklet = await sdk.blocklet.getBlocklet(url);
  const remotePrefix = sdk.blocklet.getPrefix(remoteBlocklet);
  console.log(`${remoteBlocklet.appName} 的前綴是：`, remotePrefix);
}

logPrefixForRemoteBlocklet('https://store.blocklet.dev');
```

---

## Blocklet 物件

The `getBlocklet()` 方法回傳一個 `Blocklet` 物件，其中包含有關應用程式的全面元資料。以下是一些最常用的屬性。

<x-field-group>
  <x-field data-name="did" data-type="string" data-desc="blocklet 的去中心化識別碼 (DID)。"></x-field>
  <x-field data-name="appName" data-type="string" data-desc="應用程式的人類可讀名稱。"></x-field>
  <x-field data-name="appUrl" data-type="string" data-desc="應用程式的完整公開 URL。"></x-field>
  <x-field data-name="prefix" data-type="string" data-desc="blocklet 掛載的 URL 前綴。"></x-field>
  <x-field data-name="version" data-type="string" data-desc="blocklet 的版本（例如 '1.2.3'）。"></x-field>
  <x-field data-name="isComponent" data-type="boolean" data-desc="表示 blocklet 是否為一個元件。"></x-field>
  <x-field data-name="componentMountPoints" data-type="BlockletComponent[]" data-desc="由此 blocklet 掛載的元件陣列。"></x-field>
  <x-field data-name="theme" data-type="BlockletTheme" data-desc="包含主題設定（如顏色和標誌）的物件。"></x-field>
  <x-field data-name="navigation" data-type="BlockletNavigation[]" data-desc="用於 blocklet UI 的導覽項目陣列。"></x-field>
  <x-field data-name="serverDid" data-type="string" data-desc="執行此 blocklet 的 Blocklet Server 實例的 DID。"></x-field>
</x-field-group>

**回應範例**

```json Blocklet 物件範例 icon=mdi:code-json
{
  "did": "z8iZz...",
  "appId": "z1s...",
  "appName": "Blocklet 商店",
  "appDescription": "一個 blocklet 的市集",
  "appUrl": "https://store.blocklet.dev",
  "prefix": "/",
  "version": "1.16.29",
  "isComponent": false,
  "theme": {
    "logo": "logo.png",
    "colors": {
      "primary": "#4F6AF6"
    }
  },
  "navigation": [
    {
      "id": "home",
      "title": "首頁",
      "link": "/"
    }
  ],
  "componentMountPoints": [],
  "serverDid": "z2qaD...",
  "webWalletUrl": "https://web.abtwallet.io"
}
```

欲了解所有屬性的完整列表，請參閱 [類型](./api-types.md) 參考頁面。

---

## 後續步驟

現在您已經知道如何擷取 blocklet 元資料，您可能會想學習如何取得其掛載元件的資訊。請繼續下一節來了解 `ComponentService`。

<x-card data-title="ComponentService" data-icon="lucide:box" data-cta="閱讀更多" data-href="/api/services/component">
  用於取得已掛載元件資訊並為其建構 URL 的 API。
</x-card>