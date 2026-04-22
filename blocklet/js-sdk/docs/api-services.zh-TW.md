# 服務

`@blocklet/js-sdk` 由數個服務類別組成，每個類別負責特定的功能領域。這些服務作為不同 Blocklet API 端點的專用客戶端，提供了一種結構化且直觀的方式來與平台功能互動。

大多數核心服務都已預先初始化，並作為主 `BlockletSDK` 實例的屬性提供，您可以使用 `getBlockletSDK()` 函數來取得該實例。

```javascript 存取服務 icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

// 存取 AuthService 以取得使用者資訊
async function getUserProfile() {
  const profile = await sdk.user.getProfile();
  console.log(profile);
}

// 存取 BlockletService 以取得 blocklet 資訊
async function getBlockletMeta() {
  const meta = await sdk.blocklet.getMeta();
  console.log(meta);
}
```

下圖說明了 `BlockletSDK` 實例的結構及其與核心服務的關係。

<!-- DIAGRAM_IMAGE_START:architecture:1:1 -->
![Services](assets/diagram/services-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

以下是可用服務的完整列表。點擊任一服務即可查看其詳細的 API 參考文件。

<x-cards data-columns="2">
  <x-card data-title="AuthService" data-href="/api/services/auth" data-icon="lucide:user-cog">
    用於管理使用者個人資料、隱私設定、通知以及登出等驗證操作的 API。
  </x-card>
  <x-card data-title="BlockletService" data-href="/api/services/blocklet" data-icon="lucide:box">
    用於從 `window.blocklet` 或遠端 URL 取得和載入 blocklet 元資料的 API。
  </x-card>
  <x-card data-title="ComponentService" data-href="/api/services/component" data-icon="lucide:layout-template">
    用於獲取已掛載元件的資訊並為其建構 URL 的 API。
  </x-card>
  <x-card data-title="FederatedService" data-href="/api/services/federated" data-icon="lucide:network">
    用於與聯盟登入群組設定互動，並檢索有關主應用程式和當前應用程式資訊的 API。
  </x-card>
  <x-card data-title="TokenService" data-href="/api/services/token" data-icon="lucide:key-round">
    用於從儲存空間（Cookies 和 LocalStorage）取得、設定和移除工作階段權杖和刷新權杖的低階 API。
  </x-card>
  <x-card data-title="UserSessionService" data-href="/api/services/user-session" data-icon="lucide:users">
    用於取得和管理使用者登入工作階段的 API。
  </x-card>
</x-cards>

每個服務都為 Blocklet 平台的特定部分提供了一組重點方法。若要了解這些服務所回傳的資料結構和型別，請參閱 [型別](./api-types.md) 參考文件。