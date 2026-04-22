# 類型

本節為 `@blocklet/js-sdk` 匯出的核心 TypeScript 類型和介面提供了詳細的參考。在您的專案中使用這些類型，可以幫助您利用 TypeScript 的靜態分析和自動完成功能，以獲得更好的開發體驗。

## 核心 Blocklet 類型

這些類型定義了 Blocklet 應用程式及其元件的基本結構。

### Blocklet

代表一個 Blocklet 的完整元資料和設定。當應用程式在 Blocklet Server 環境中執行時，此物件通常可作為全域變數 `window.blocklet` 使用。

<x-field-group>
<x-field data-name="did" data-type="string" data-required="true" data-desc="Blocklet 的去中心化識別碼（DID）。"></x-field>
<x-field data-name="appId" data-type="string" data-required="true" data-desc="應用程式 ID，同時也是主要元件的 DID。"></x-field>
<x-field data-name="appPk" data-type="string" data-required="true" data-desc="與應用程式關聯的公鑰。"></x-field>
<x-field data-name="appIds" data-type="string[]" data-required="false" data-desc="關聯的應用程式 ID 列表，用於聯合登入群組。"></x-field>
<x-field data-name="appPid" data-type="string" data-required="true" data-desc="應用程式的程序 ID。"></x-field>
<x-field data-name="appName" data-type="string" data-required="true" data-desc="應用程式的人類可讀名稱。"></x-field>
<x-field data-name="appDescription" data-type="string" data-required="true" data-desc="應用程式的簡短描述。"></x-field>
<x-field data-name="appLogo" data-type="string" data-required="true" data-desc="應用程式標誌（方形）的 URL。"></x-field>
<x-field data-name="appLogoRect" data-type="string" data-required="true" data-desc="應用程式標誌（矩形）的 URL。"></x-field>
<x-field data-name="appUrl" data-type="string" data-required="true" data-desc="應用程式託管的主要 URL。"></x-field>
<x-field data-name="domainAliases" data-type="string[]" data-required="false" data-desc="應用程式的備用網域名稱。"></x-field>
<x-field data-name="isComponent" data-type="boolean" data-required="true" data-desc="表示該 Blocklet 是否為另一個 Blocklet 的元件。"></x-field>
<x-field data-name="prefix" data-type="string" data-required="true" data-desc="Blocklet 路由的 URL 前綴。"></x-field>
<x-field data-name="groupPrefix" data-type="string" data-required="true" data-desc="聯合登入群組的 URL 前綴。"></x-field>
<x-field data-name="pageGroup" data-type="string" data-required="true" data-desc="此頁面所屬的群組。"></x-field>
<x-field data-name="version" data-type="string" data-required="true" data-desc="Blocklet 的版本。"></x-field>
<x-field data-name="mode" data-type="string" data-required="true" data-desc="Blocklet 的執行模式（例如 'development'、'production'）。"></x-field>
<x-field data-name="tenantMode" data-type="'single' | 'multiple'" data-required="true" data-desc="Blocklet 的租賃模式。"></x-field>
<x-field data-name="theme" data-type="BlockletTheme" data-required="true" data-desc="Blocklet 的主題設定。"></x-field>
<x-field data-name="navigation" data-type="BlockletNavigation[]" data-required="true" data-desc="用於 Blocklet UI 的導覽項目陣列。"></x-field>
<x-field data-name="preferences" data-type="Record<string, any>" data-required="true" data-desc="使用者可設定的偏好設定。"></x-field>
<x-field data-name="languages" data-type="{ code: string; name: string }[]" data-required="true" data-desc="支援的語言列表。"></x-field>
<x-field data-name="passportColor" data-type="string" data-required="true" data-desc="DID 錢包護照中使用的主要顏色。"></x-field>
<x-field data-name="componentMountPoints" data-type="BlockletComponent[]" data-required="true" data-desc="由此 Blocklet 掛載的子元件列表。"></x-field>
<x-field data-name="alsoKnownAs" data-type="string[]" data-required="true" data-desc="備用識別碼列表。"></x-field>
<x-field data-name="trustedFactories" data-type="string[]" data-required="true" data-desc="受信任的工廠 DID 列表。"></x-field>
<x-field data-name="status" data-type="string" data-required="true" data-desc="Blocklet 目前的執行狀態。"></x-field>
<x-field data-name="serverDid" data-type="string" data-required="true" data-desc="Blocklet Server 實例的 DID。"></x-field>
<x-field data-name="serverVersion" data-type="string" data-required="true" data-desc="Blocklet Server 的版本。"></x-field>
<x-field data-name="componentId" data-type="string" data-required="true" data-desc="元件的 ID。"></x-field>
<x-field data-name="webWalletUrl" data-type="string" data-required="true" data-desc="網頁版 DID 錢包的 URL。"></x-field>
<x-field data-name="updatedAt" data-type="number" data-required="true" data-desc="上次更新的時間戳。"></x-field>
<x-field data-name="settings" data-type="BlockletSettings" data-required="true" data-desc="Blocklet 的詳細設定。"></x-field>
</x-field-group>

### BlockletSettings

包含 Blocklet 的各種設定，包括會話管理、聯合登入群組設定和 OAuth 提供者詳細資訊。

<x-field-group>
<x-field data-name="session" data-type="object" data-required="true" data-desc="會話設定。">
  <x-field data-name="ttl" data-type="number" data-required="true" data-desc="會話的存活時間（以秒為單位）。"></x-field>
  <x-field data-name="cacheTtl" data-type="number" data-required="true" data-desc="快取的存活時間（以秒為單位）。"></x-field>
</x-field>
<x-field data-name="federated" data-type="object" data-required="true" data-desc="聯合登入群組設定。">
  <x-field data-name="master" data-type="object" data-required="true" data-desc="群組中主應用程式的資訊。">
    <x-field data-name="appId" data-type="string" data-required="true" data-desc="主應用程式 ID。"></x-field>
    <x-field data-name="appPid" data-type="string" data-required="true" data-desc="主應用程式程序 ID。"></x-field>
    <x-field data-name="appName" data-type="string" data-required="true" data-desc="主應用程式名稱。"></x-field>
    <x-field data-name="appDescription" data-type="string" data-required="true" data-desc="主應用程式描述。"></x-field>
    <x-field data-name="appUrl" data-type="string" data-required="true" data-desc="主應用程式 URL。"></x-field>
    <x-field data-name="appLogo" data-type="string" data-required="true" data-desc="主應用程式標誌 URL。"></x-field>
    <x-field data-name="version" data-type="string" data-required="true" data-desc="主應用程式版本。"></x-field>
  </x-field>
  <x-field data-name="config" data-type="Record<string, any>" data-required="true" data-desc="聯合群組的額外設定。"></x-field>
</x-field>
<x-field data-name="oauth" data-type="Record<string, { enabled: boolean; [x: string]: any }>" data-required="true" data-desc="OAuth 提供者設定，以提供者名稱為鍵。"></x-field>
</x-field-group>

### BlockletComponent

描述一個掛載在父 Blocklet 中的元件。它繼承自 `TComponentInternalInfo` 的屬性。

<x-field-group>
<x-field data-name="status" data-type="keyof typeof BlockletStatus" data-required="true" data-desc="元件的執行狀態（例如 'running'、'stopped'）。"></x-field>
</x-field-group>

## 使用者與驗證類型

`AuthService` 使用這些類型來管理使用者個人資料、設定和與驗證相關的資料。

### UserPublicInfo

代表使用者的基本公開個人資料資訊。

<x-field-group>
<x-field data-name="avatar" data-type="string" data-required="true" data-desc="使用者頭像圖片的 URL。"></x-field>
<x-field data-name="did" data-type="string" data-required="true" data-desc="使用者的去中心化識別碼（DID）。"></x-field>
<x-field data-name="fullName" data-type="string" data-required="true" data-desc="使用者的全名。"></x-field>
<x-field data-name="sourceAppPid" data-type="string | null" data-required="true" data-desc="使用者來源應用程式的程序 ID（如果適用）。"></x-field>
</x-field-group>

### NotificationConfig

定義使用者的通知偏好設定，包括 webhook 設定和通知管道。

<x-field-group>
<x-field data-name="webhooks" data-type="Webhook[]" data-required="false" data-desc="已設定的 webhook 陣列。"></x-field>
<x-field data-name="notifications" data-type="object" data-required="false" data-desc="特定管道的通知設定。">
  <x-field data-name="email" data-type="boolean" data-required="false" data-desc="啟用或停用電子郵件通知。"></x-field>
  <x-field data-name="wallet" data-type="boolean" data-required="false" data-desc="啟用或停用 DID 錢包通知。"></x-field>
  <x-field data-name="phone" data-type="boolean" data-required="false" data-desc="啟用或停用電話通知。"></x-field>
</x-field>
</x-field-group>

### Webhook

定義單一 webhook 設定的結構。

<x-field-group>
<x-field data-name="type" data-type="'slack' | 'api'" data-required="true" data-desc="webhook 端點的類型。"></x-field>
<x-field data-name="url" data-type="string" data-required="true" data-desc="將發送 webhook 通知的 URL。"></x-field>
</x-field-group>

### PrivacyConfig

代表使用者隱私設定的物件，其中鍵對應特定的隱私選項。

<x-field-group>
<x-field data-name="[key]" data-type="boolean" data-required="true" data-desc="代表隱私設定的動態鍵，其布林值表示是否啟用。"></x-field>
</x-field-group>

### SpaceGateway

定義 DID Space 閘道的屬性。

<x-field-group>
<x-field data-name="did" data-type="string" data-required="true" data-desc="空間閘道的 DID。"></x-field>
<x-field data-name="name" data-type="string" data-required="true" data-desc="空間閘道的名稱。"></x-field>
<x-field data-name="url" data-type="string" data-required="true" data-desc="空間閘道的公開 URL。"></x-field>
<x-field data-name="endpoint" data-type="string" data-required="true" data-desc="空間閘道的 API 端點。"></x-field>
</x-field-group>

## 會話管理類型

`UserSessionService` 使用這些類型來管理跨不同裝置和應用程式的使用者登入會話。

### UserSession

代表單一使用者登入會話，包含有關裝置、應用程式和使用者的詳細資訊。

<x-field-group>
<x-field data-name="appName" data-type="string" data-required="true" data-desc="會話所屬應用程式的名稱。"></x-field>
<x-field data-name="appPid" data-type="string" data-required="true" data-desc="會話所屬應用程式的程序 ID。"></x-field>
<x-field data-name="extra" data-type="object" data-required="true" data-desc="關於會話的額外元資料。">
  <x-field data-name="walletOS" data-type="'android' | 'ios' | 'web'" data-required="true" data-desc="用於登入的錢包作業系統。"></x-field>
</x-field>
<x-field data-name="id" data-type="string" data-required="true" data-desc="會話的唯一識別碼。"></x-field>
<x-field data-name="lastLoginIp" data-type="string" data-required="true" data-desc="上次登入的 IP 位址。"></x-field>
<x-field data-name="passportId" data-type="string | null" data-required="true" data-desc="用於登入的護照 ID。"></x-field>
<x-field data-name="ua" data-type="string" data-required="true" data-desc="客戶端的使用者代理字串。"></x-field>
<x-field data-name="createdAt" data-type="string" data-required="false" data-desc="會話建立時的 ISO 字串時間戳。"></x-field>
<x-field data-name="updatedAt" data-type="string" data-required="true" data-desc="上次會話活動的 ISO 字串時間戳。"></x-field>
<x-field data-name="status" data-type="string" data-required="false" data-desc="會話的目前狀態（例如 'online'、'expired'）。"></x-field>
<x-field data-name="user" data-type="UserSessionUser" data-required="false" data-desc="與會話關聯的使用者的詳細資訊。"></x-field>
<x-field data-name="userDid" data-type="string" data-required="true" data-desc="使用者的 DID。"></x-field>
<x-field data-name="visitorId" data-type="string" data-required="true" data-desc="裝置/瀏覽器的唯一識別碼。"></x-field>
</x-field-group>

### UserSessionUser

包含與 `UserSession` 相關的詳細使用者資訊。

<x-field-group>
<x-field data-name="avatar" data-type="string" data-required="true" data-desc="使用者頭像圖片的 URL。"></x-field>
<x-field data-name="did" data-type="string" data-required="true" data-desc="使用者的去中心化識別碼（DID）。"></x-field>
<x-field data-name="email" data-type="string" data-required="true" data-desc="使用者的電子郵件地址。"></x-field>
<x-field data-name="fullName" data-type="string" data-required="true" data-desc="使用者的全名。"></x-field>
<x-field data-name="pk" data-type="string" data-required="true" data-desc="使用者的公鑰。"></x-field>
<x-field data-name="remark" data-type="string" data-required="false" data-desc="關於使用者的選填備註或註記。"></x-field>
<x-field data-name="role" data-type="string" data-required="true" data-desc="使用者的角色（例如 'owner'、'admin'）。"></x-field>
<x-field data-name="roleTitle" data-type="string" data-required="true" data-desc="使用者角色的顯示標題。"></x-field>
<x-field data-name="sourceAppPid" data-type="string | null" data-required="true" data-desc="使用者來源應用程式的程序 ID。"></x-field>
<x-field data-name="sourceProvider" data-type="'wallet' | 'auth0' | 'nft'" data-required="true" data-desc="用於驗證的原始提供者。"></x-field>
</x-field-group>

### UserSessionList

用於使用者會話列表的分頁回應物件。

<x-field-group>
<x-field data-name="list" data-type="UserSession[]" data-required="true" data-desc="使用者會話物件的陣列。"></x-field>
<x-field data-name="paging" data-type="object" data-required="true" data-desc="分頁資訊。">
  <x-field data-name="page" data-type="number" data-required="true" data-desc="目前頁碼。"></x-field>
  <x-field data-name="pageSize" data-type="number" data-required="true" data-desc="每頁的項目數。"></x-field>
  <x-field data-name="total" data-type="number" data-required="true" data-desc="可用的會話總數。"></x-field>
</x-field>
</x-field-group>

## 全域與環境類型

這些類型定義了全域可用的物件和伺服器環境設定。

### ServerEnv

代表伺服器端的環境變數，這些變數通常以 `window.env` 的形式暴露給客戶端。

<x-field-group>
<x-field data-name="appId" data-type="string" data-required="true" data-desc="應用程式 ID。"></x-field>
<x-field data-name="appPid" data-type="string" data-required="true" data-desc="應用程式程序 ID。"></x-field>
<x-field data-name="appName" data-type="string" data-required="true" data-desc="應用程式名稱。"></x-field>
<x-field data-name="appDescription" data-type="string" data-required="true" data-desc="應用程式描述。"></x-field>
<x-field data-name="apiPrefix" data-type="string" data-required="true" data-desc="後端 API 路由的前綴。"></x-field>
<x-field data-name="baseUrl" data-type="string" data-required="true" data-desc="應用程式的基礎 URL。"></x-field>
</x-field-group>

### 全域 Window 宣告

當在瀏覽器環境中執行時，SDK 依賴於 `window` 物件中存在的某些全域變數。

```typescript TypeScript Definition icon=logos:typescript
declare global {
  interface Window {
    blocklet: Blocklet;
    env?: ServerEnv;
  }
}
```

## 工具類型

用於 API 請求和權杖管理的輔助類型。

### TokenResult

代表權杖更新操作的成功結果。

<x-field-group>
<x-field data-name="nextToken" data-type="string" data-required="true" data-desc="新的會話權杖。"></x-field>
<x-field data-name="nextRefreshToken" data-type="string" data-required="true" data-desc="新的更新權杖。"></x-field>
</x-field-group>

### RequestParams

定義了在使用 SDK 的 API 輔助工具發出請求時可以使用的通用參數。

<x-field-group>
<x-field data-name="lazy" data-type="boolean" data-required="false" data-desc="如果為 true，請求可能會被延遲或延後執行。"></x-field>
<x-field data-name="lazyTime" data-type="number" data-required="false" data-desc="延遲請求的延遲時間（以毫秒為單位）。"></x-field>
<x-field data-name="componentDid" data-type="string" data-required="false" data-desc="請求目標元件的 DID。"></x-field>
</x-field-group>