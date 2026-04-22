# 元件間通訊

在一個由多個元件組成的 Blocklet 應用程式中，讓它們能夠安全可靠地相互通訊至關重要。Blocklet SDK 提供了一個高階實用工具 `component.call`，專為此目的設計。此方法透過處理服務發現、請求簽署和自動重試，簡化了元件間的 API 呼叫。

這種方法比直接發起 HTTP 請求更為穩健，因為它抽象化了底層環境的複雜性，例如動態連接埠和 Docker 網路，同時確保所有通訊都經過驗證。

## 進行安全的 API 呼叫

元件間通訊的主要方法是 `component.call`。它作為 HTTP 客戶端（`axios`）的包裝器，但會自動注入必要的驗證標頭以驗證呼叫元件的身份。

### 基本用法

這是一個元件呼叫名為 'user-service' 的另一個元件上的 API 端點的基本範例。

```javascript 呼叫另一個元件 icon=logos:javascript
import component from '@blocklet/sdk/component';

async function getUserProfile(userId) {
  try {
    const response = await component.call({
      name: 'user-service', // 目標元件的名稱、DID 或標題
      method: 'GET',
      path: `/api/users/${userId}`,
    });

    console.log('使用者設定檔：', response.data);
    return response.data;
  } catch (error) {
    console.error('呼叫 user-service 失敗：', error.message);
  }
}
```

### 運作方式

`component.call` 函數透過幾個關鍵步驟簡化了通訊過程：

1.  **服務發現**：它在應用程式的元件註冊表中查詢目標元件（例如 'user-service'），以找到其目前位置和元資料。
2.  **端點解析**：它建構正確的內部 URL 以到達該元件，自動處理像 Docker 容器網路這樣的複雜性。
3.  **請求簽署**：在發送請求之前，它會自動添加特殊的 `x-component-*` 標頭。這些標頭包含一個使用呼叫元件的密鑰生成的簽名，以證明其身份。
4.  **API 呼叫**：它使用配置的方法、路徑和資料執行 HTTP 請求。
5.  **自動重試**：如果請求因暫時性伺服器錯誤（例如 5xx 狀態碼）而失敗，它將以遞增的延遲（指數退避）自動重試幾次請求。

此流程確保了通訊的可靠性和安全性。接收元件可以使用[會話中介軟體](./authentication-session-middleware.md)來驗證簽名並授權請求。

<!-- DIAGRAM_IMAGE_START:sequence:4:3 -->
![Component-to-Component Communication](assets/diagram/component-communication-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

### `call` 參數

`component.call` 函數接受一個包含以下屬性的選項物件：

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="要呼叫的目標元件的名稱、標題或 DID。"></x-field>
  <x-field data-name="method" data-type="string" data-default="POST" data-required="false" data-desc="請求的 HTTP 方法（例如 'GET'、'POST'、'PUT'、'DELETE'）。"></x-field>
  <x-field data-name="path" data-type="string" data-required="true" data-desc="目標元件上的 API 路徑（例如 '/api/v1/resource'）。"></x-field>
  <x-field data-name="data" data-type="any" data-required="false">
    <x-field-desc markdown>請求主體，通常與 `POST`、`PUT` 或 `PATCH` 方法一起使用。</x-field-desc>
  </x-field>
  <x-field data-name="params" data-type="any" data-required="false" data-desc="要附加到請求 URL 的 URL 查詢參數。"></x-field>
  <x-field data-name="headers" data-type="object" data-required="false" data-desc="要與請求一起發送的自訂標頭物件。"></x-field>
  <x-field data-name="timeout" data-type="number" data-required="false" data-desc="請求逾時時間（毫秒）。"></x-field>
  <x-field data-name="responseType" data-type="string" data-required="false" data-desc="伺服器將回應的資料類型。例如 'stream'。"></x-field>
</x-field-group>

### 傳回值

該函數返回一個 `Promise`，它會解析為一個 `AxiosResponse` 物件，其中包含 `data`、`status` 和 `headers` 等屬性。

## 進階用法

### 自訂重試行為

您可以透過將第二個參數傳遞給 `component.call` 來自訂自動重試邏輯。這對於適應端點的特定可靠性需求很有用。

```javascript 自訂重試選項 icon=lucide:refresh-cw
import component from '@blocklet/sdk/component';

const callOptions = {
  name: 'data-processor',
  method: 'POST',
  path: '/api/process',
  data: { job: 'some-long-job' },
};

const retryOptions = {
  retries: 5,       // 總共嘗試 5 次
  minTimeout: 1000, // 每次重試之間至少等待 1 秒
  factor: 2,        // 每次失敗嘗試後等待時間加倍
};

async function processData() {
  const response = await component.call(callOptions, retryOptions);
  return response.data;
}
```

`retryOptions` 物件可以有以下屬性：

<x-field-group>
  <x-field data-name="retries" data-type="number" data-default="3" data-desc="要進行的總嘗試次數。"></x-field>
  <x-field data-name="factor" data-type="number" data-default="2" data-desc="用於指數退避的指數因子。"></x-field>
  <x-field data-name="minTimeout" data-type="number" data-default="500" data-desc="每次重試之間的最小逾時時間（毫秒）。"></x-field>
  <x-field data-name="maxTimeout" data-type="number" data-default="5000" data-desc="每次重試之間的最大逾時時間（毫秒）。"></x-field>
  <x-field data-name="randomize" data-type="boolean" data-default="true" data-desc="是否隨機化逾時時間。"></x-field>
  <x-field data-name="onFailedAttempt" data-type="function" data-required="false" data-desc="每次失敗嘗試時都會被呼叫的回呼函數。"></x-field>
</x-field-group>

### 處理串流回應

對於返回串流的端點（例如，下載大型檔案），您可以設定 `responseType: 'stream'`。這讓您可以在資料到達時處理它，而無需在記憶體中緩衝整個回應。

```javascript 串流傳輸檔案 icon=lucide:file-down
import fs from 'fs';
import component from '@blocklet/sdk/component';

async function downloadBackup() {
  const response = await component.call({
    name: 'backup-service',
    method: 'GET',
    path: '/api/export',
    responseType: 'stream',
  });

  const writer = fs.createWriteStream('backup.zip');
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}
```

---

透過使用 `component.call`，您可以輕鬆建構穩健且安全的多元件應用程式。接下來的合理步驟是學習如何透過驗證這些傳入的呼叫來保護您的元件的 API 端點。有關詳細資訊，請參閱[會話中介軟體](./authentication-session-middleware.md)指南。