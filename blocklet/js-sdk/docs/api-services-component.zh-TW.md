# ComponentService

`ComponentService` 提供了一個方便的 API，用於與掛載在主應用程式中的元件 blocklet 進行互動。它允許您擷取這些元件的中繼資料，並建構指向其頁面或 API 端點的絕對 URL。

此服務依賴於 blocklet 的中繼資料。要了解如何載入此中繼資料，請參閱 [BlockletService 文件](./api-services-blocklet.md)。

## 實例化

與其他服務不同，`ComponentService` 必須手動實例化。這是因為它依賴於 `window.blocklet` 物件，而該物件可能是非同步載入的。為確保該服務能夠存取完整的 blocklet 中繼資料，您應該在 `blocklet` 物件可用後再建立實例。

```javascript 實例化 ComponentService icon=logos:javascript
import { ComponentService } from '@blocklet/js-sdk';

// 假設 window.blocklet 已載入且可用
const componentService = new ComponentService();
```

## 方法

### getComponent()

擷取特定已掛載元件的完整中繼資料物件。

**參數**

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="元件的識別碼。可以是其名稱、標題或 did。"></x-field>
</x-field-group>

**傳回值**

<x-field-group>
  <x-field data-name="BlockletComponent | undefined" data-type="object" data-desc="如果找到，則為 BlockletComponent 物件，否則為 undefined。"></x-field>
</x-field-group>

**範例**

```javascript 取得元件中繼資料 icon=logos:javascript
// 模擬 window.blocklet 物件以供示範
window.blocklet = {
  componentMountPoints: [
    {
      did: 'z8iZzaC3ukTM81BCs4Ynawxbg1KAd3b3p6c7b',
      name: 'my-first-component',
      title: 'My First Component',
      mountPoint: '/components/my-first-component',
      status: 'started'
    },
    {
      did: 'z8iZzbF9tkyG27AQs5Ynawxbh2LBe4c4q7d8c',
      name: 'my-second-component',
      title: 'My Second Component',
      mountPoint: '/components/my-second-component',
      status: 'started'
    }
  ],
  // ... 其他 blocklet 屬性
};

const componentService = new ComponentService();

// 透過名稱尋找元件
const component = componentService.getComponent('my-first-component');
console.log(component);
```

**範例回應**

```json 回應 icon=mdi:code-json
{
  "did": "z8iZzaC3ukTM81BCs4Ynawxbg1KAd3b3p6c7b",
  "name": "my-first-component",
  "title": "My First Component",
  "mountPoint": "/components/my-first-component",
  "status": "started"
}
```

### getComponentMountPoint()

一個輔助方法，用於快速擷取元件的 `mountPoint`。掛載點是從主應用程式的網域提供元件服務的相對 URL 路徑。

**參數**

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="元件的識別碼（名稱、標題或 did）。"></x-field>
</x-field-group>

**傳回值**

<x-field-group>
  <x-field data-name="mountPoint" data-type="string" data-desc="元件的 mountPoint，以字串形式表示（例如 /components/my-component）。如果找不到元件，則傳回空字串。"></x-field>
</x-field-group>

**範例**

```javascript 取得掛載點 icon=logos:javascript
// 使用前一個範例中的同一個 componentService 實例
const mountPoint = componentService.getComponentMountPoint('my-first-component');

console.log(mountPoint);
// 預期輸出：/components/my-first-component
```

### getUrl()

建構一個指向元件內資源的完整絕對 URL。這是建立指向其他元件連結的建議方法，因為它能正確處理應用程式的基本 URL 和元件的特定掛載點。

**參數**

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="元件的識別碼（名稱、標題或 did）。"></x-field>
  <x-field data-name="...parts" data-type="string[]" data-required="false" data-desc="一個或多個要附加到元件 URL 的路徑區段。"></x-field>
</x-field-group>

**傳回值**

<x-field-group>
  <x-field data-name="url" data-type="string" data-desc="一個完整的絕對 URL，以字串形式表示。"></x-field>
</x-field-group>

**範例**

```javascript 建構元件 URL icon=logos:javascript
// 模擬 window.blocklet 物件
window.blocklet = {
  appUrl: 'https://myapp.did.abtnet.io',
  componentMountPoints: [
    {
      name: 'api-component',
      title: 'API Component',
      mountPoint: '/api/v1',
      // ... 其他屬性
    }
  ],
  // ... 其他屬性
};

const componentService = new ComponentService();

// 建構指向元件內 API 端點的 URL
const userApiUrl = componentService.getUrl('api-component', 'users', '123');
console.log(userApiUrl);
// 預期輸出：https://myapp.did.abtnet.io/api/v1/users/123

// 建構指向元件內頁面的 URL
const settingsPageUrl = componentService.getUrl('api-component', 'settings');
console.log(settingsPageUrl);
// 預期輸出：https://myapp.did.abtnet.io/api/v1/settings
```

## 類型

### BlockletComponent

此類型代表單一已掛載元件的中繼資料。

<x-field-group>
  <x-field data-name="did" data-type="string" data-required="true" data-desc="元件的去中心化識別碼（DID）。"></x-field>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="元件的名稱，定義於其 blocklet.yml 中。"></x-field>
  <x-field data-name="title" data-type="string" data-required="true" data-desc="元件的人類可讀標題。"></x-field>
  <x-field data-name="mountPoint" data-type="string" data-required="true" data-desc="元件相對於主應用程式 URL 的掛載 URL 路徑。"></x-field>
  <x-field data-name="status" data-type="string" data-required="true" data-desc="元件的目前狀態（例如 'started'、'stopped'）。"></x-field>
</x-field-group>

---

現在您已經了解如何與元件互動，您可能想學習如何管理聯合登入設定。詳情請參閱 [FederatedService 文件](./api-services-federated.md)。