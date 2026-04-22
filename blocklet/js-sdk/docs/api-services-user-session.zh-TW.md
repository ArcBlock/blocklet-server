# UserSessionService

`UserSessionService` 提供了一個 API，用於獲取和管理使用者在不同裝置和應用程式中的登入會話。此服務對於建構允許使用者查看其活動登入位置、查看哪些裝置存取了其帳戶以及管理這些會話的功能至關重要。

如需有關使用此服務的實用指南，請參閱[管理使用者會話](./guides-managing-user-sessions.md)指南。

## 方法

### getMyLoginSessions()

檢索目前使用者自己的登入會話的分頁列表。

**參數**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="包含設定選項的物件。">
    <x-field data-name="appUrl" data-type="string" data-required="false" data-desc="要查詢的應用程式的基本 URL。"></x-field>
  </x-field>
  <x-field data-name="params" data-type="UserSessionQuery" data-required="false" data-default="{ page: 1, pageSize: 10 }" data-desc="用於分頁和篩選的物件。">
    <x-field data-name="page" data-type="number" data-required="true" data-desc="要檢索的頁碼。"></x-field>
    <x-field data-name="pageSize" data-type="number" data-required="true" data-desc="每頁的項目數。"></x-field>
    <x-field data-name="status" data-type="'online' | 'expired' | 'offline'" data-required="false" data-desc="按狀態篩選會話。"></x-field>
  </x-field>
</x-field-group>

**傳回值**

<x-field data-name="Promise<UserSessionList>" data-type="Promise" data-desc="一個解析為包含會話列表和分頁詳細資訊的物件的 Promise。"></x-field>

**範例**

```javascript 獲取我的線上會話 icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

async function fetchMySessions() {
  try {
    const sessionData = await sdk.userSession.getMyLoginSessions(
      {},
      { page: 1, pageSize: 5, status: 'online' }
    );
    console.log('線上會話：', sessionData.list);
    console.log('總線上會話數：', sessionData.paging.total);
  } catch (error) {
    console.error('獲取會話失敗：', error);
  }
}

fetchMySessions();
```

**範例回應**

```json
{
  "list": [
    {
      "id": "z8V...",
      "appName": "My Blocklet",
      "appPid": "my-blocklet-pid",
      "lastLoginIp": "192.168.1.1",
      "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...",
      "updatedAt": "2023-10-27T10:00:00.000Z",
      "status": "online",
      "userDid": "zNK..."
    }
  ],
  "paging": {
    "page": 1,
    "pageSize": 5,
    "total": 1
  }
}
```

### getUserSessions()

檢索特定使用者 DID 的所有登入會話。此方法通常在管理情境中使用。

**參數**

<x-field data-name="options" data-type="object" data-required="true" data-desc="包含使用者 DID 和可選應用程式 URL 的物件。">
  <x-field data-name="did" data-type="string" data-required="true" data-desc="要獲取其會話的使用者的 DID。"></x-field>
  <x-field data-name="appUrl" data-type="string" data-required="false" data-desc="要查詢的應用程式的基本 URL。"></x-field>
</x-field>

**傳回值**

<x-field data-name="Promise<UserSession[]>" data-type="Promise" data-desc="一個解析為 UserSession 物件陣列的 Promise。"></x-field>

**範例**

```javascript 為特定使用者獲取會話 icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

async function fetchUserSessions(userDid) {
  try {
    const sessions = await sdk.userSession.getUserSessions({ did: userDid });
    console.log(`使用者 ${userDid} 的會話：`, sessions);
  } catch (error) {
    console.error('獲取使用者會話失敗：', error);
  }
}

fetchUserSessions('zNK...userDid...'); // 請替換為有效的使用者 DID
```

**範例回應**

```json
[
  {
    "id": "z8V...",
    "appName": "My Blocklet",
    "appPid": "my-blocklet-pid",
    "lastLoginIp": "192.168.1.1",
    "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...",
    "updatedAt": "2023-10-27T10:00:00.000Z",
    "status": "online",
    "userDid": "zNK..."
  }
]
```

### loginByUserSession()

根據現有的使用者會話 ID 啟動新的登入。這可用於跨相關應用程式的無縫登入等功能。

**參數**

<x-field data-name="options" data-type="object" data-required="true" data-desc="包含登入所需會話詳細資訊的物件。">
  <x-field data-name="id" data-type="string" data-required="true" data-desc="用於登入的現有會話 ID。"></x-field>
  <x-field data-name="appPid" data-type="string" data-required="true" data-desc="正在登入的應用程式的 PID。"></x-field>
  <x-field data-name="userDid" data-type="string" data-required="true" data-desc="與會話關聯的使用者的 DID。"></x-field>
  <x-field data-name="passportId" data-type="string" data-required="true" data-desc="使用者通行證的 ID。"></x-field>
  <x-field data-name="appUrl" data-type="string" data-required="false" data-desc="應用程式的基本 URL。"></x-field>
</x-field>

**傳回值**

<x-field data-name="Promise<UserSession[]>" data-type="Promise" data-desc="一個解析為包含新使用者會話的陣列的 Promise。"></x-field>

**範例**

```javascript 使用現有會話登入 icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

async function loginWithSession(sessionDetails) {
  try {
    const newSessions = await sdk.userSession.loginByUserSession(sessionDetails);
    console.log('成功使用新會話登入：', newSessions[0]);
  } catch (error) {
    console.error('透過會話登入失敗：', error);
  }
}

const existingSession = {
  id: 'session_id_to_use',
  appPid: 'target_app_pid',
  userDid: 'zNK...userDid...',
  passportId: 'passport_id_string'
};

loginWithSession(existingSession);
```

## 資料結構

以下是 `UserSessionService` 使用的主要資料結構。

### UserSession

代表使用者在特定應用程式中的單個登入會話。

<x-field-group>
  <x-field data-name="id" data-type="string" data-required="true" data-desc="會話的唯一識別碼。"></x-field>
  <x-field data-name="appName" data-type="string" data-required="true" data-desc="會話來源的應用程式名稱。"></x-field>
  <x-field data-name="appPid" data-type="string" data-required="true" data-desc="應用程式的 PID。"></x-field>
  <x-field data-name="lastLoginIp" data-type="string" data-required="true" data-desc="此會話的最後已知 IP 位址。"></x-field>
  <x-field data-name="ua" data-type="string" data-required="true" data-desc="用戶端裝置的使用者代理字串。"></x-field>
  <x-field data-name="createdAt" data-type="string" data-required="false" data-desc="會話建立時的時間戳。"></x-field>
  <x-field data-name="updatedAt" data-type="string" data-required="true" data-desc="此會話最後活動的時間戳。"></x-field>
  <x-field data-name="status" data-type="'online' | 'expired' | 'offline'" data-required="false" data-desc="會話的目前狀態。"></x-field>
  <x-field data-name="user" data-type="UserSessionUser" data-required="false" data-desc="關於使用者的詳細資訊。"></x-field>
  <x-field data-name="userDid" data-type="string" data-required="true" data-desc="擁有此會話的使用者的 DID。"></x-field>
  <x-field data-name="visitorId" data-type="string" data-required="true" data-desc="訪客/裝置的識別碼。"></x-field>
  <x-field data-name="passportId" data-type="string | null" data-required="true" data-desc="使用者通行證的 ID。"></x-field>
  <x-field data-name="extra" data-type="object" data-required="true" data-desc="附加元資料。">
    <x-field data-name="walletOS" data-type="'android' | 'ios' | 'web'" data-required="true" data-desc="所用錢包的作業系統。"></x-field>
  </x-field>
</x-field-group>

### UserSessionUser

包含與會話關聯的使用者的詳細資訊。

<x-field-group>
  <x-field data-name="did" data-type="string" data-required="true" data-desc="使用者的去中心化識別碼 (DID)。"></x-field>
  <x-field data-name="fullName" data-type="string" data-required="true" data-desc="使用者的全名。"></x-field>
  <x-field data-name="email" data-type="string" data-required="true" data-desc="使用者的電子郵件地址。"></x-field>
  <x-field data-name="avatar" data-type="string" data-required="true" data-desc="使用者頭像圖片的 URL。"></x-field>
  <x-field data-name="pk" data-type="string" data-required="true" data-desc="使用者的公鑰。"></x-field>
  <x-field data-name="role" data-type="string" data-required="true" data-desc="使用者在應用程式中的角色（例如，'owner'，'admin'）。"></x-field>
  <x-field data-name="roleTitle" data-type="string" data-required="true" data-desc="使用者角色的顯示標題。"></x-field>
  <x-field data-name="sourceProvider" data-type="'wallet' | 'auth0' | 'nft'" data-required="true" data-desc="用於身份驗證的提供者。"></x-field>
  <x-field data-name="sourceAppPid" data-type="string | null" data-required="true" data-desc="提供使用者資料來源的應用程式的 PID。"></x-field>
  <x-field data-name="remark" data-type="string" data-required="false" data-desc="關於使用者的任何備註或註釋。"></x-field>
</x-field-group>

### UserSessionList

使用者會話的分頁列表。

<x-field-group>
  <x-field data-name="list" data-type="UserSession[]" data-required="true" data-desc="使用者會話物件的陣列。"></x-field>
  <x-field data-name="paging" data-type="object" data-required="true" data-desc="包含分頁詳細資訊的物件。">
    <x-field data-name="page" data-type="number" data-required="true" data-desc="目前頁碼。"></x-field>
    <x-field data-name="pageSize" data-type="number" data-required="true" data-desc="每頁的項目數。"></x-field>
    <x-field data-name="total" data-type="number" data-required="true" data-desc="項目總數。"></x-field>
  </x-field>
</x-field-group>

### UserSessionQuery

用於篩選和分頁會話查詢的物件。

<x-field-group>
  <x-field data-name="page" data-type="number" data-required="true" data-desc="要檢索的頁碼。"></x-field>
  <x-field data-name="pageSize" data-type="number" data-required="true" data-desc="每頁的會話數。"></x-field>
  <x-field data-name="status" data-type="'online' | 'expired' | 'offline'" data-required="false" data-desc="按狀態篩選會話。"></x-field>
</x-field-group>