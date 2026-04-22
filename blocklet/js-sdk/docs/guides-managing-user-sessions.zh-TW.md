# 管理使用者會話

`@blocklet/js-sdk` 提供了一個 `UserSessionService`，可協助您擷取和管理不同裝置上的使用者登入會話。這對於建立「安全性」或「裝置」等功能特別有用，使用者可以在這些頁面查看所有活動中的會話，並了解其帳號的使用情況。

本指南將引導您了解管理使用者會話的常見使用情境。

### 存取 UserSessionService

首先，取得 Blocklet SDK 的實例。`UserSessionService` 可透過 `userSession` 屬性取得。

```javascript SDK Initialization icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();
const userSessionService = sdk.userSession;
```

## 擷取您自己的登入會話

最常見的任務是擷取目前已驗證使用者的會話列表。`getMyLoginSessions` 方法可讓您執行此操作，並支援分頁和篩選功能。

```javascript Fetching the current user's sessions icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

async function fetchMySessions() {
  try {
    const sdk = getBlockletSDK();
    // 擷取第一頁的 10 個線上會話
    const result = await sdk.userSession.getMyLoginSessions({}, {
      page: 1,
      pageSize: 10,
      status: 'online', // 可選篩選條件：'online' | 'expired' | 'offline'
    });

    console.log(`Total online sessions: ${result.paging.total}`);
    result.list.forEach(session => {
      console.log(`- Session on ${session.ua} last active at ${session.updatedAt}`);
    });
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
  }
}

fetchMySessions();
```

### 參數

方法簽章為 `getMyLoginSessions({ appUrl?: string }, params: UserSessionQuery)`。第二個參數是一個查詢物件，包含以下參數：

<x-field-group>
  <x-field data-name="page" data-type="number" data-default="1" data-desc="要擷取的頁碼。"></x-field>
  <x-field data-name="pageSize" data-type="number" data-default="10" data-desc="每頁的會話數。"></x-field>
  <x-field data-name="status" data-type="'online' | 'expired' | 'offline'" data-required="false" data-desc="按目前狀態篩選會話。"></x-field>
</x-field-group>

### 回應

此方法會回傳一個解析為 `UserSessionList` 物件的 promise。

<x-field data-name="" data-type="object" data-desc="包含會話列表和分頁詳細資訊的回應物件。">
  <x-field data-name="list" data-type="UserSession[]" data-desc="使用者會話物件的陣列。">
    <x-field data-name="" data-type="object" data-desc="單一使用者會話物件。">
      <x-field data-name="id" data-type="string" data-desc="會話的唯一識別碼。"></x-field>
      <x-field data-name="appName" data-type="string" data-desc="建立會話的應用程式名稱。"></x-field>
      <x-field data-name="appPid" data-type="string" data-desc="應用程式的 Blocklet PID。"></x-field>
      <x-field data-name="lastLoginIp" data-type="string" data-desc="此會話的最後已知 IP 位址。"></x-field>
      <x-field data-name="ua" data-type="string" data-desc="用戶端裝置的 User-Agent 字串。"></x-field>
      <x-field data-name="updatedAt" data-type="string" data-desc="上次活動的時間戳。"></x-field>
      <x-field data-name="status" data-type="string" data-desc="會話的目前狀態（例如，'online'）。"></x-field>
      <x-field data-name="userDid" data-type="string" data-desc="與會話關聯的使用者 DID。"></x-field>
    </x-field>
  </x-field>
  <x-field data-name="paging" data-type="object" data-desc="分頁資訊。">
    <x-field data-name="page" data-type="number" data-desc="目前的頁碼。"></x-field>
    <x-field data-name="pageSize" data-type="number" data-desc="每頁的項目數。"></x-field>
    <x-field data-name="total" data-type="number" data-desc="符合查詢條件的會話總數。"></x-field>
  </x-field>
</x-field>


## 擷取特定使用者的會話

在某些情況下（例如管理員儀表板），您可能需要為目前登入使用者以外的使用者擷取登入會話。`getUserSessions` 方法可讓您透過提供使用者的 DID 來執行此操作。

```javascript Fetching sessions for a specific DID icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

async function fetchUserSessions(userDid) {
  try {
    const sdk = getBlockletSDK();
    const sessions = await sdk.userSession.getUserSessions({ did: userDid });

    console.log(`Found ${sessions.length} sessions for user ${userDid}:`);
    sessions.forEach(session => {
      console.log(`- Session ID: ${session.id}, App: ${session.appName}`);
    });
  } catch (error) {
    console.error(`Failed to fetch sessions for user ${userDid}:`, error);
  }
}

// 請替換為目標使用者的 DID
fetchUserSessions('zNK...some...user...did');
```

### 參數

<x-field-group>
  <x-field data-name="did" data-type="string" data-required="true" data-desc="要擷取其會話的使用者的 DID。"></x-field>
  <x-field data-name="appUrl" data-type="string" data-required="false" data-desc="應用程式的基礎 URL。預設為目前 Blocklet 的服務 URL。"></x-field>
</x-field-group>

### 回應

此方法會回傳一個解析為 `UserSession` 物件陣列的 promise。

<x-field data-name="" data-type="UserSession[]" data-desc="指定使用者的使用者會話物件陣列。">
  <x-field data-name="" data-type="object" data-desc="單一使用者會話物件。">
    <x-field data-name="id" data-type="string" data-desc="會話的唯一識別碼。"></x-field>
    <x-field data-name="appName" data-type="string" data-desc="建立會話的應用程式名稱。"></x-field>
    <x-field data-name="appPid" data-type="string" data-desc="應用程式的 Blocklet PID。"></x-field>
    <x-field data-name="ua" data-type="string" data-desc="用戶端裝置的 User-Agent 字串。"></x-field>
    <x-field data-name="updatedAt" data-type="string" data-desc="上次活動的時間戳。"></x-field>
    <x-field data-name="status" data-type="string" data-desc="會話的目前狀態。"></x-field>
    <x-field data-name="userDid" data-type="string" data-desc="與會話關聯的使用者 DID。"></x-field>
  </x-field>
</x-field>

---

本指南涵蓋了使用 SDK 擷取使用者會話資訊的主要方法。如需所有可用方法和詳細類型定義的完整列表，請參閱 [UserSessionService API 參考](./api-services-user-session.md)。