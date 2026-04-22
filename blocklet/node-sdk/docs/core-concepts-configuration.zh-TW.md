# 設定與環境

Blocklet SDK 提供了一種強大而統一的方式來管理您應用程式的設定和環境變數。它將來自多個來源的設定匯總到一個單一、易於使用的介面中，確保您的 blocklet 能夠存取所有必要的資訊，從應用程式元資料到元件特定的設定。

本節將涵蓋存取這些資訊的兩個主要匯出：`env` 物件和 `components` 儲存庫。

## env 物件

`env` 物件是一個集中式的唯讀容器，用於存放您元件在執行階段可用的所有設定變數。SDK 透過合併來自多個來源的設定來自動填充此物件，包括預設值、應用程式層級的設定以及元件特定的環境檔案。

您只需從 SDK 匯入 `env` 即可存取任何設定屬性。

```javascript icon=logos:javascript
import { env } from '@blocklet/sdk';

console.log(`Running in app: ${env.appName}`);
console.log(`My data directory is at: ${env.dataDir}`);

// Access user-defined preferences from the blocklet's settings page
const userApiKey = env.preferences.apiKey;
```

### 關鍵環境屬性

雖然 `env` 物件包含許多屬性，但以下是一些最常用的屬性：

<x-field data-name="appName" data-type="string" data-desc="父應用程式的名稱。"></x-field>
<x-field data-name="appUrl" data-type="string" data-desc="應用程式的完整公開 URL。"></x-field>
<x-field data-name="componentDid" data-type="string" data-desc="目前元件的分散式識別碼 (DID)。"></x-field>
<x-field data-name="isComponent" data-type="boolean" data-desc="一個旗標，如果程式碼在元件上下文中執行，則為 `true`。"></x-field>
<x-field data-name="dataDir" data-type="string" data-desc="元件專用資料儲存目錄的絕對路徑。"></x-field>
<x-field data-name="cacheDir" data-type="string" data-desc="元件專用快取目錄的絕對路徑。"></x-field>
<x-field data-name="serverVersion" data-type="string" data-desc="應用程式執行所在的 Blocklet Server 的版本。"></x-field>
<x-field data-name="preferences" data-type="Record<string, any>" data-desc="一個物件，包含使用者從 blocklet 設定頁面設定的自訂設定值。"></x-field>


## components 儲存庫

`components` 儲存庫是一個陣列，提供關於在同一個應用程式實例中執行的所有其他元件的即時資訊。這對於元件間通訊至關重要，允許一個元件發現另一個元件的端點和狀態。

```javascript icon=logos:javascript
import { components } from '@blocklet/sdk';

// Find a running API service component to make a request
const apiService = components.find(c => c.name === 'api-service' && c.status === 1);

if (apiService) {
  const apiUrl = apiService.webEndpoint;
  console.log(`Found API service at: ${apiUrl}`);
  // Now you can make a request to this URL
}
```

### 元件屬性

`components` 陣列中的每個物件都包含有關元件的詳細資訊：

<x-field data-name="did" data-type="string" data-desc="元件的分散式識別碼 (DID)。"></x-field>
<x-field data-name="name" data-type="string" data-desc="元件的名稱，定義在其 `blocklet.yml` 中。"></x-field>
<x-field data-name="mountPoint" data-type="string" data-desc="元件掛載的 URL 路徑 (例如 `/admin`、`/api`)。"></x-field>
<x-field data-name="webEndpoint" data-type="string" data-desc="元件的完整、可公開存取的 URL。"></x-field>
<x-field data-name="status" data-type="number" data-desc="元件的目前狀態 (例如 `1` 表示執行中，`0` 表示已停止)。"></x-field>


## 設定載入流程

SDK 透過分層來自不同來源的設定來建構 `env` 物件。每個後續的來源都可以覆寫前面來源的值，提供一個清晰且可預測的優先順序。

<!-- DIAGRAM_IMAGE_START:architecture:16:9 -->
![Configuration & Environment](assets/diagram/configuration-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

這種分層方法提供了靈活性，讓開發人員和管理員可以在不同層級設定 blocklet。

## 動態更新

設定並非靜態的。Blocklet SDK 會監聽由 Blocklet Server 推送的執行階段變更。例如，如果使用者在 blocklet 的設定頁面上更新了某個設定，SDK 將自動更新 `env` 物件並發出一個事件。

您可以使用匯出的 `events` 發射器來監聽這些變更。

```javascript icon=logos:javascript
import { events, Events } from '@blocklet/sdk';

// Listen for any updates to the environment or preferences
events.on(Events.envUpdate, (updatedValues) => {
  console.log('Configuration was updated:', updatedValues);
  // You can now react to the change, e.g., re-initialize a service
});
```

這讓您能夠建構可以在不需重新啟動的情況下對設定變更做出反應的應用程式。

---

現在您已經了解如何存取設定和環境變數，您可以探索如何將它們用於更具體的任務。一個常見的用例是管理密碼學金鑰和錢包，這將在下一節中介紹。

<x-card data-title="下一步：錢包管理" data-icon="lucide:wallet" data-href="/core-concepts/wallet" data-cta="閱讀更多">
  學習如何建立和管理用於簽名和身份驗證的錢包實例。
</x-card>