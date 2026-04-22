# 型別定義

Blocklet SDK 是強型別的，可幫助您編寫更健壯且易於維護的程式碼。本節提供了在處理使用者會話、通知、事件和 blocklet 設定時會遇到的最常見 TypeScript 型別和介面的參考。了解這些型別將有助於確保型別安全，並有效地利用您 IDE 的自動完成功能。

## Session 與使用者型別

這些型別是管理應用程式內使用者驗證和身份的基礎。

### SessionUser

`SessionUser` 物件由 session 中介軟體附加到 `request` 物件上（作為 `req.user`）。它包含了當前登入使用者的基本資訊。

```typescript SessionUser Type Definition icon=logos:typescript
export type SessionUser = {
  did: string;
  role: string | undefined;
  provider: string;
  fullName: string;
  walletOS: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  method?: AuthMethod;
  kyc?: number;
  [key: string]: any;
};
```

<x-field data-name="did" data-type="string" data-required="true" data-desc="使用者的去中心化識別碼 (DID)。"></x-field>
<x-field data-name="role" data-type="string | undefined" data-required="false" data-desc="分配給使用者的角色（例如，'admin'、'owner'、'guest'）。"></x-field>
<x-field data-name="provider" data-type="string" data-required="true" data-desc="用於登入的身份驗證提供者（例如，'wallet'）。"></x-field>
<x-field data-name="fullName" data-type="string" data-required="true" data-desc="使用者的全名。"></x-field>
<x-field data-name="walletOS" data-type="string" data-required="true" data-desc="使用者錢包的作業系統。"></x-field>
<x-field data-name="emailVerified" data-type="boolean" data-required="false" data-desc="表示使用者的電子郵件是否已驗證。"></x-field>
<x-field data-name="phoneVerified" data-type="boolean" data-required="false" data-desc="表示使用者的電話是否已驗證。"></x-field>
<x-field data-name="method" data-type="AuthMethod" data-required="false" data-desc="使用的身份驗證方法。常見值為 'loginToken'、'componentCall'、'signedToken'、'accessKey'。"></x-field>
<x-field data-name="kyc" data-type="number" data-required="false" data-desc="使用者 KYC 狀態的數字表示。"></x-field>

### TUserInfo

`TUserInfo` 型別提供了使用者個人資料的全面視圖，包括其身份、聯絡資訊、登入歷史以及相關的安全憑證。

<x-field data-name="did" data-type="string" data-required="true" data-desc="使用者的去中心化識別碼 (DID)。"></x-field>
<x-field data-name="pk" data-type="string" data-required="true" data-desc="使用者的公鑰。"></x-field>
<x-field data-name="role" data-type="string" data-required="true" data-desc="使用者的主要角色。"></x-field>
<x-field data-name="avatar" data-type="string" data-required="true" data-desc="使用者頭像圖片的 URL。"></x-field>
<x-field data-name="fullName" data-type="string" data-required="true" data-desc="使用者的全名。"></x-field>
<x-field data-name="email" data-type="string" data-required="true" data-desc="使用者的電子郵件地址。"></x-field>
<x-field data-name="approved" data-type="boolean" data-required="true" data-desc="表示使用者帳戶是否已獲批准。"></x-field>
<x-field data-name="createdAt" data-type="number" data-required="true" data-desc="使用者建立時的時間戳。"></x-field>
<x-field data-name="lastLoginAt" data-type="number" data-required="true" data-desc="使用者上次登入的時間戳。"></x-field>
<x-field data-name="passports" data-type="TPassport[]" data-required="true" data-desc="發給使用者的護照陣列。"></x-field>
<x-field data-name="connectedAccounts" data-type="TConnectedAccount[]" data-required="true" data-desc="連結到使用者個人資料的外部帳戶列表。"></x-field>


## 通知型別

當使用[通知服務](./services-notification-service.md)時，您將使用這些型別來建構並向使用者傳送訊息。

### TNotification

這是定義通知的主要介面。它包含了控制通知內容、外觀和行為所需的所有欄位。

<x-field data-name="id" data-type="string" data-required="false" data-desc="通知的唯一識別碼。"></x-field>
<x-field data-name="title" data-type="string" data-required="false" data-desc="通知的主標題。"></x-field>
<x-field data-name="body" data-type="string" data-required="false" data-desc="通知的主要內容或訊息。"></x-field>
<x-field data-name="type" data-type="'notification' | 'connect' | 'feed' | 'hi' | 'passthrough'" data-required="false" data-desc="通知的型別，這會影響其處理和呈現方式。"></x-field>
<x-field data-name="severity" data-type="'normal' | 'success' | 'error' | 'warning'" data-required="false" data-desc="嚴重性等級，常用於為通知上色。"></x-field>
<x-field data-name="actions" data-type="TNotificationAction[]" data-required="false" data-desc="包含在通知中的互動式操作按鈕陣列。"></x-field>
<x-field data-name="attachments" data-type="TNotificationAttachment[]" data-required="false" data-desc="富內容附件的陣列，例如圖片、文字區塊或連結。"></x-field>
<x-field data-name="activity" data-type="TNotificationActivity" data-required="false" data-desc="描述觸發通知的社交活動，如評論或追蹤。"></x-field>
<x-field data-name="url" data-type="string" data-required="false" data-desc="點擊通知時要導航到的 URL。"></x-field>


### TNotificationAttachment

附件允許您向通知中添加豐富的結構化內容。

<x-field data-name="type" data-type="'asset' | 'vc' | 'token' | 'text' | 'image' | 'divider' | 'transaction' | 'dapp' | 'link' | 'section'" data-required="true" data-desc="要顯示的內容型別。"></x-field>
<x-field data-name="data" data-type="any" data-required="false" data-desc="附件的資料負載，其內容因型別而異。例如，'image' 型別將會有一個包含 url 屬性的物件。"></x-field>
<x-field data-name="fields" data-type="any" data-required="false" data-desc="在附件中顯示的附加欄位，常用於 'section' 型別。"></x-field>

**範例：圖片附件**
```json
{
  "type": "image",
  "data": {
    "url": "https://path.to/your/image.png",
    "alt": "圖片的描述性文字"
  }
}
```

### TNotificationAction

操作是可添加到通知中的互動式按鈕，允許使用者直接回應。

<x-field data-name="name" data-type="string" data-required="true" data-desc="操作的名稱，通常用作識別碼。"></x-field>
<x-field data-name="title" data-type="string" data-required="false" data-desc="按鈕上顯示的文字。如果未提供，則預設為 name。"></x-field>
<x-field data-name="link" data-type="string" data-required="false" data-desc="點擊按鈕時要導航到的 URL。"></x-field>
<x-field data-name="color" data-type="string" data-required="false" data-desc="按鈕的文字顏色。"></x-field>
<x-field data-name="bgColor" data-type="string" data-required="false" data-desc="按鈕的背景顏色。"></x-field>


## 事件型別

在使用事件匯流排時，事件使用 `TEvent` 介面進行結構化。

### TEvent

此介面定義了在 Blocklet 生態系統中發出和消費的事件結構。

<x-field data-name="id" data-type="string" data-required="true" data-desc="事件實例的唯一識別碼。"></x-field>
<x-field data-name="type" data-type="string" data-required="true" data-desc="事件型別名稱（例如，'user:created'、'post:published'）。"></x-field>
<x-field data-name="time" data-type="Date" data-required="true" data-desc="事件發生的時間戳。"></x-field>
<x-field data-name="source" data-type="unknown" data-required="true" data-desc="事件的來源或發起者。"></x-field>
<x-field data-name="spec_version" data-type="string" data-required="true" data-desc="CloudEvents 規範版本。"></x-field>
<x-field data-name="object_id" data-type="string" data-required="false" data-desc="事件相關物件的 ID。"></x-field>
<x-field data-name="object_type" data-type="string" data-required="false" data-desc="事件相關物件的型別。"></x-field>
<x-field data-name="data" data-type="object" data-required="true" data-desc="事件的負載，包含有關所發生事件的詳細資訊。"></x-field>

## 設定與狀態型別

這些型別定義了您的 blocklet 的設定物件和狀態資訊的結構。

### WindowBlocklet

在客戶端，`window.blocklet` 物件提供了有關正在執行的 blocklet 的基本上下文。此物件的型別為 `WindowBlocklet`。

<x-field data-name="did" data-type="string" data-required="true" data-desc="blocklet 實例的 DID。"></x-field>
<x-field data-name="appId" data-type="string" data-required="true" data-desc="應用程式 ID。"></x-field>
<x-field data-name="appName" data-type="string" data-required="true" data-desc="應用程式的顯示名稱。"></x-field>
<x-field data-name="appUrl" data-type="string" data-required="true" data-desc="應用程式的公開 URL。"></x-field>
<x-field data-name="webWalletUrl" data-type="string" data-required="true" data-desc="相關網頁錢包的 URL。"></x-field>
<x-field data-name="isComponent" data-type="boolean" data-required="true" data-desc="如果 blocklet 作為另一個 blocklet 的組件執行，則為 true。"></x-field>
<x-field data-name="prefix" data-type="string" data-required="true" data-desc="blocklet 路由的 URL 前綴。"></x-field>
<x-field data-name="theme" data-type="TTheme" data-required="true" data-desc="目前 UI 的主題設定。"></x-field>
<x-field data-name="navigation" data-type="TNavigationItem[]" data-required="true" data-desc="應用程式選單的導航項目陣列。"></x-field>


### TBlockletState

此型別表示伺服器上 blocklet 實例的完整狀態，包括其元資料、狀態、設定以及與其他組件的關係。

<x-field data-name="meta" data-type="TBlockletMeta" data-required="false" data-desc="blocklet 的元資料，來自其 blocklet.yml 檔案。"></x-field>
<x-field data-name="status" data-type="enum_pb.BlockletStatusMap" data-required="true" data-desc="blocklet 的目前執行狀態（例如，'running'、'stopped'）。"></x-field>
<x-field data-name="port" data-type="number" data-required="true" data-desc="blocklet 正在執行的連接埠。"></x-field>
<x-field data-name="appDid" data-type="string" data-required="true" data-desc="blocklet 實例的 DID。"></x-field>
<x-field data-name="children" data-type="TComponentState[]" data-required="true" data-desc="如果此 blocklet 有子組件，則為組件狀態的陣列。"></x-field>
<x-field data-name="settings" data-type="TBlockletSettings" data-required="false" data-desc="使用者為 blocklet 配置的設定。"></x-field>
<x-field data-name="environments" data-type="TConfigEntry[]" data-required="true" data-desc="為 blocklet 配置的環境變數列表。"></x-field>