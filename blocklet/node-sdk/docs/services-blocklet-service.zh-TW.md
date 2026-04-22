# Blocklet 服務

`BlockletService` 是一個功能強大的客戶端，作為您的 blocklet 與底層 ABT Node 服務互動的主要介面。它將複雜的 GraphQL 查詢和 HTTP 請求包裝成一個簡潔、基於 promise 的 JavaScript API，從而簡化了使用者管理、工作階段處理、基於角色的存取控制 (RBAC) 和檢索 blocklet 元資料等任務。

此服務對於建構能夠充分利用 Blocklet 平台強大功能的安全且功能豐富的應用程式至關重要。在深入了解此服務之前，建議先理解我們[身份驗證](./authentication.md)指南中涵蓋的概念。

### 運作原理

您應用程式中的 `BlockletService` 客戶端與在 ABT 節點上運行的 `blocklet-service` 進行通訊。所有請求都會使用 blocklet 的憑證自動進行身份驗證，確保對核心功能的安全存取。

<!-- DIAGRAM_IMAGE_START:architecture:16:9 -->
![Blocklet Service](assets/diagram/blocklet-service-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## 開始使用

若要使用此服務，只需匯入並實例化它即可。客戶端將根據 Blocklet Server 提供的環境變數自動進行設定。

```javascript 開始使用 icon=logos:javascript
import BlockletService from '@blocklet/sdk/service/blocklet';

const client = new BlockletService();

async function main() {
  const { user } = await client.getOwner();
  console.log('Blocklet 擁有者:', user.fullName);
}

main();
```

## 工作階段管理

### login

驗證使用者並啟動一個工作階段。

**參數**

<x-field data-name="params" data-type="object" data-required="true" data-desc="登入憑證或資料。"></x-field>

**傳回值**

<x-field data-name="Promise<object>" data-type="Promise<object>" data-desc="一個包含工作階段和使用者資訊的物件。">
  <x-field data-name="user" data-type="object" data-desc="已驗證使用者的個人資料。"></x-field>
  <x-field data-name="token" data-type="string" data-desc="工作階段的存取權杖。"></x-field>
  <x-field data-name="refreshToken" data-type="string" data-desc="用於延長工作階段的更新權杖。"></x-field>
  <x-field data-name="visitorId" data-type="string" data-required="false" data-desc="訪客/裝置的唯一識別碼。"></x-field>
</x-field>

### refreshSession

使用更新權杖來更新過期的工作階段。

**參數**

<x-field-group>
  <x-field data-name="refreshToken" data-type="string" data-required="true" data-desc="來自先前工作階段的更新權杖。"></x-field>
  <x-field data-name="visitorId" data-type="string" data-required="false" data-desc="訪客/裝置的唯一識別碼。"></x-field>
</x-field-group>

**傳回值**

<x-field data-name="Promise<object>" data-type="Promise<object>" data-desc="一個包含新工作階段和使用者資訊的物件。">
  <x-field data-name="user" data-type="object" data-desc="已驗證使用者的個人資料。"></x-field>
  <x-field data-name="token" data-type="string" data-desc="新的存取權杖。"></x-field>
  <x-field data-name="refreshToken" data-type="string" data-desc="新的更新權杖。"></x-field>
  <x-field data-name="provider" data-type="string" data-desc="登入提供者（例如：'wallet'）。"></x-field>
</x-field>

### switchProfile

更新使用者的個人資料資訊。

**參數**

<x-field-group>
  <x-field data-name="did" data-type="string" data-required="true" data-desc="要更新的使用者的 DID。"></x-field>
  <x-field data-name="profile" data-type="object" data-required="true" data-desc="一個包含要更新的個人資料欄位的物件。">
    <x-field data-name="avatar" data-type="string" data-required="false" data-desc="新的頭像 URL。"></x-field>
    <x-field data-name="email" data-type="string" data-required="false" data-desc="新的電子郵件地址。"></x-field>
    <x-field data-name="fullName" data-type="string" data-required="false" data-desc="新的全名。"></x-field>
  </x-field>
</x-field-group>

**傳回值**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="一個包含更新後使用者個人資料的物件。"></x-field>

## 使用者管理

### getUser

根據使用者的 DID 檢索單一使用者的個人資料。

**參數**

<x-field-group>
  <x-field data-name="did" data-type="string" data-required="true" data-desc="要檢索的使用者的唯一 DID。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="查詢的可選設定。">
    <x-field data-name="enableConnectedAccount" data-type="boolean" data-required="false" data-desc="若為 true，則包含使用者已連結帳戶的詳細資訊（例如：OAuth 提供者）。"></x-field>
    <x-field data-name="includeTags" data-type="boolean" data-required="false" data-desc="若為 true，則包含與使用者關聯的任何標籤。"></x-field>
  </x-field>
</x-field-group>

**傳回值**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="一個包含使用者個人資料的物件。">
  <x-field data-name="user" data-type="object" data-desc="使用者個人資料物件。"></x-field>
</x-field>

### getUsers

檢索分頁的使用者列表，支援篩選和排序。

**參數**

<x-field data-name="args" data-type="object" data-required="false" data-desc="一個包含查詢、排序和分頁選項的物件。">
  <x-field data-name="paging" data-type="object" data-desc="分頁選項。">
    <x-field data-name="page" data-type="number" data-desc="要檢索的頁碼。"></x-field>
    <x-field data-name="pageSize" data-type="number" data-desc="每頁的使用者數量。"></x-field>
  </x-field>
  <x-field data-name="query" data-type="object" data-desc="篩選條件。">
    <x-field data-name="role" data-type="string" data-desc="按使用者角色篩選。"></x-field>
    <x-field data-name="approved" data-type="boolean" data-desc="按批准狀態篩選。"></x-field>
    <x-field data-name="search" data-type="string" data-desc="用於比對使用者欄位的搜尋字串。"></x-field>
  </x-field>
  <x-field data-name="sort" data-type="object" data-desc="排序條件。">
    <x-field data-name="updatedAt" data-type="number" data-desc="按更新時間戳排序。`1` 為升序，`-1` 為降序。"></x-field>
    <x-field data-name="createdAt" data-type="number" data-desc="按建立時間戳排序。`1` 為升序，`-1` 為降序。"></x-field>
    <x-field data-name="lastLoginAt" data-type="number" data-desc="按最後登入時間戳排序。`1` 為升序，`-1` 為降序。"></x-field>
  </x-field>
</x-field>

**傳回值**

<x-field data-name="ResponseUsers" data-type="Promise<object>" data-desc="一個分頁的使用者物件列表。">
  <x-field data-name="users" data-type="TUserInfo[]" data-desc="一個使用者個人資料物件的陣列。"></x-field>
  <x-field data-name="paging" data-type="object" data-desc="分頁資訊。">
    <x-field data-name="total" data-type="number" data-desc="使用者總數。"></x-field>
    <x-field data-name="pageSize" data-type="number" data-desc="每頁的使用者數量。"></x-field>
    <x-field data-name="page" data-type="number" data-desc="目前頁碼。"></x-field>
  </x-field>
</x-field>

### getUsersCount

取得使用者總數。

**傳回值**

<x-field data-name="ResponseGetUsersCount" data-type="Promise<object>" data-desc="一個包含使用者總數的物件。">
  <x-field data-name="count" data-type="number" data-desc="使用者總數。"></x-field>
</x-field>

### getUsersCountPerRole

取得每個角色的使用者數量。

**傳回值**

<x-field data-name="ResponseGetUsersCountPerRole" data-type="Promise<object>" data-desc="一個包含每個角色使用者數量的物件。">
  <x-field data-name="counts" data-type="TKeyValue[]" data-desc="一個物件陣列，其中每個物件都有一個 `key`（角色名稱）和 `value`（使用者數量）。"></x-field>
</x-field>

### getOwner

檢索 blocklet 擁有者的個人資料。

**傳回值**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="一個包含擁有者使用者個人資料的物件。"></x-field>

### updateUserApproval

批准或撤銷使用者對 blocklet 的存取權限。

**參數**

<x-field-group>
  <x-field data-name="did" data-type="string" data-required="true" data-desc="要更新的使用者的 DID。"></x-field>
  <x-field data-name="approved" data-type="boolean" data-required="true" data-desc="設定為 `true` 表示批准，`false` 表示撤銷。"></x-field>
</x-field-group>

**傳回值**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="一個包含更新後使用者個人資料的物件。"></x-field>

### updateUserTags

更新與使用者關聯的標籤。

**參數**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="did" data-type="string" data-required="true" data-desc="使用者的 DID。"></x-field>
  <x-field data-name="tags" data-type="number[]" data-required="true" data-desc="一個要與使用者關聯的標籤 ID 陣列。"></x-field>
</x-field>

**傳回值**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="一個包含更新後使用者個人資料的物件。"></x-field>

### updateUserExtra

更新使用者的額外元資料。

**參數**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="did" data-type="string" data-required="true" data-desc="使用者的 DID。"></x-field>
  <x-field data-name="remark" data-type="string" data-required="false" data-desc="關於使用者的備註或說明。"></x-field>
  <x-field data-name="extra" data-type="string" data-required="false" data-desc="一個用於儲存自訂資料的 JSON 字串。"></x-field>
</x-field>

**傳回值**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="一個包含更新後使用者個人資料的物件。"></x-field>

### updateUserInfo

更新使用者的一般資訊。需要有效的使用者工作階段 cookie。

**參數**

<x-field-group>
  <x-field data-name="userInfo" data-type="object" data-required="true" data-desc="一個包含要更新的使用者欄位的物件。必須包含使用者的 `did`。"></x-field>
  <x-field data-name="options" data-type="object" data-required="true" data-desc="請求選項，包含標頭。">
    <x-field data-name="headers" data-type="object" data-required="true">
      <x-field data-name="cookie" data-type="string" data-required="true" data-desc="使用者的工作階段 cookie。"></x-field>
    </x-field>
  </x-field>
</x-field-group>

**傳回值**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="一個包含更新後使用者個人資料的物件。"></x-field>

### updateUserAddress

更新使用者的實際地址。需要有效的使用者工作階段 cookie。

**參數**

<x-field-group>
  <x-field data-name="args" data-type="object" data-required="true" data-desc="一個包含使用者 DID 和地址詳細資訊的物件。">
    <x-field data-name="did" data-type="string" data-required="true" data-desc="使用者的 DID。"></x-field>
    <x-field data-name="address" data-type="object" data-required="false" data-desc="使用者的地址。">
      <x-field data-name="country" data-type="string" data-desc="國家"></x-field>
      <x-field data-name="province" data-type="string" data-desc="州/省"></x-field>
      <x-field data-name="city" data-type="string" data-desc="城市"></x-field>
      <x-field data-name="postalCode" data-type="string" data-desc="郵遞區號"></x-field>
      <x-field data-name="line1" data-type="string" data-desc="地址第一行"></x-field>
      <x-field data-name="line2" data-type="string" data-desc="地址第二行"></x-field>
    </x-field>
  </x-field>
  <x-field data-name="options" data-type="object" data-required="true" data-desc="請求選項，包含標頭。">
    <x-field data-name="headers" data-type="object" data-required="true">
      <x-field data-name="cookie" data-type="string" data-required="true" data-desc="使用者的工作階段 cookie。"></x-field>
    </x-field>
  </x-field>
</x-field-group>

**傳回值**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="一個包含更新後使用者個人資料的物件。"></x-field>

## 使用者工作階段

### getUserSessions

檢索使用者的有效工作階段列表。

**參數**

<x-field data-name="args" data-type="object" data-required="false" data-desc="一個包含查詢和分頁選項的物件。">
  <x-field data-name="paging" data-type="object" data-desc="分頁選項。"></x-field>
  <x-field data-name="query" data-type="object" data-desc="篩選條件。">
    <x-field data-name="userDid" data-type="string" data-desc="按使用者 DID 篩選。"></x-field>
    <x-field data-name="status" data-type="string" data-desc="按工作階段狀態篩選。"></x-field>
  </x-field>
</x-field>

**傳回值**

<x-field data-name="ResponseUserSessions" data-type="Promise<object>" data-desc="一個分頁的使用者工作階段列表。">
  <x-field data-name="list" data-type="TUserSession[]" data-desc="一個工作階段物件的陣列。"></x-field>
  <x-field data-name="paging" data-type="object" data-desc="分頁資訊。"></x-field>
</x-field>

### getUserSessionsCount

取得使用者工作階段的總數，可選篩選條件。

**參數**

<x-field data-name="args" data-type="object" data-required="false" data-desc="一個包含查詢選項的物件。">
  <x-field data-name="query" data-type="object" data-desc="篩選條件。">
    <x-field data-name="userDid" data-type="string" data-desc="按使用者 DID 篩選。"></x-field>
  </x-field>
</x-field>

**傳回值**

<x-field data-name="ResponseUserSessionsCount" data-type="Promise<object>" data-desc="一個包含工作階段數量的物件。">
  <x-field data-name="count" data-type="number" data-desc="工作階段總數。"></x-field>
</x-field>

## 社交與社群

### getUserFollowers

檢索正在追蹤特定使用者的使用者列表。需要有效的使用者工作階段 cookie。

**參數**

<x-field-group>
  <x-field data-name="args" data-type="object" data-required="true" data-desc="查詢選項。">
    <x-field data-name="userDid" data-type="string" data-required="true" data-desc="要檢索其追蹤者的使用者的 DID。"></x-field>
    <x-field data-name="paging" data-type="object" data-required="false" data-desc="分頁選項。"></x-field>
  </x-field>
  <x-field data-name="options" data-type="object" data-required="true" data-desc="請求選項，包含標頭。">
    <x-field data-name="headers" data-type="object" data-required="true">
      <x-field data-name="cookie" data-type="string" data-required="true" data-desc="使用者的工作階段 cookie。"></x-field>
    </x-field>
  </x-field>
</x-field-group>

**傳回值**

<x-field data-name="ResponseUserFollows" data-type="Promise<object>" data-desc="一個分頁的追蹤者使用者列表。"></x-field>

### getUserFollowing

檢索特定使用者正在追蹤的使用者列表。需要有效的使用者工作階段 cookie。

**參數**

<x-field-group>
  <x-field data-name="args" data-type="object" data-required="true" data-desc="查詢選項。">
    <x-field data-name="userDid" data-type="string" data-required="true" data-desc="要檢索其追蹤列表的使用者的 DID。"></x-field>
    <x-field data-name="paging" data-type="object" data-required="false" data-desc="分頁選項。"></x-field>
  </x-field>
  <x-field data-name="options" data-type="object" data-required="true" data-desc="請求選項，包含標頭。">
    <x-field data-name="headers" data-type="object" data-required="true">
      <x-field data-name="cookie" data-type="string" data-required="true" data-desc="使用者的工作階段 cookie。"></x-field>
    </x-field>
  </x-field>
</x-field-group>

**傳回值**

<x-field data-name="ResponseUserFollows" data-type="Promise<object>" data-desc="一個分頁的被追蹤使用者列表。"></x-field>

### getUserFollowStats

取得使用者的追蹤者和正在追蹤的數量。需要有效的使用者工作階段 cookie。

**參數**

<x-field-group>
  <x-field data-name="args" data-type="object" data-required="true" data-desc="查詢選項。">
    <x-field data-name="userDids" data-type="string[]" data-required="true" data-desc="一個使用者 DID 的陣列。"></x-field>
  </x-field>
  <x-field data-name="options" data-type="object" data-required="true" data-desc="請求選項，包含標頭。">
    <x-field data-name="headers" data-type="object" data-required="true">
      <x-field data-name="cookie" data-type="string" data-required="true" data-desc="使用者的工作階段 cookie。"></x-field>
    </x-field>
  </x-field>
</x-field-group>

**傳回值**

<x-field data-name="ResponseUserRelationCount" data-type="Promise<object>" data-desc="一個包含追蹤者和正在追蹤數量的物件。"></x-field>

### checkFollowing

檢查一個使用者是否正在追蹤一個或多個其他使用者。

**參數**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="followerDid" data-type="string" data-required="true" data-desc="潛在追蹤者的 DID。"></x-field>
  <x-field data-name="userDids" data-type="string[]" data-required="true" data-desc="一個要檢查的使用者 DID 陣列。"></x-field>
</x-field>

**傳回值**

<x-field data-name="ResponseCheckFollowing" data-type="Promise<object>" data-desc="一個物件，其鍵為使用者 DID，值為表示追蹤狀態的布林值。"></x-field>

### followUser

讓一個使用者追蹤另一個使用者。

**參數**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="followerDid" data-type="string" data-required="true" data-desc="正在追蹤的使用者的 DID。"></x-field>
  <x-field data-name="userDid" data-type="string" data-required="true" data-desc="要被追蹤的使用者的 DID。"></x-field>
</x-field>

**傳回值**

<x-field data-name="GeneralResponse" data-type="Promise<object>" data-desc="一個表示成功或失敗的一般回應物件。"></x-field>

### unfollowUser

讓一個使用者取消追蹤另一個使用者。

**參數**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="followerDid" data-type="string" data-required="true" data-desc="正在取消追蹤的使用者的 DID。"></x-field>
  <x-field data-name="userDid" data-type="string" data-required="true" data-desc="要被取消追蹤的使用者的 DID。"></x-field>
</x-field>

**傳回值**

<x-field data-name="GeneralResponse" data-type="Promise<object>" data-desc="一個表示成功或失敗的一般回應物件。"></x-field>

### getUserInvites

檢索由特定使用者邀請的使用者列表。需要有效的使用者工作階段 cookie。

**參數**

<x-field-group>
  <x-field data-name="args" data-type="object" data-required="true" data-desc="查詢選項。">
    <x-field data-name="userDid" data-type="string" data-required="true" data-desc="邀請者的 DID。"></x-field>
    <x-field data-name="paging" data-type="object" data-required="false" data-desc="分頁選項。"></x-field>
  </x-field>
  <x-field data-name="options" data-type="object" data-required="true" data-desc="請求選項，包含標頭。">
    <x-field data-name="headers" data-type="object" data-required="true">
      <x-field data-name="cookie" data-type="string" data-required="true" data-desc="使用者的工作階段 cookie。"></x-field>
    </x-field>
  </x-field>
</x-field-group>

**傳回值**

<x-field data-name="ResponseUsers" data-type="Promise<object>" data-desc="一個分頁的受邀使用者列表。"></x-field>

## 標籤管理

### getTags

檢索所有可用的使用者標籤列表。

**參數**

<x-field data-name="args" data-type="object" data-required="false">
  <x-field data-name="paging" data-type="object" data-required="false" data-desc="分頁選項。"></x-field>
</x-field>

**傳回值**

<x-field data-name="ResponseTags" data-type="Promise<object>" data-desc="一個分頁的標籤物件列表。">
  <x-field data-name="tags" data-type="TTag[]" data-desc="一個標籤物件的陣列。"></x-field>
  <x-field data-name="paging" data-type="object" data-desc="分頁資訊。"></x-field>
</x-field>

### createTag

建立一個新的使用者標籤。

**參數**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="tag" data-type="object" data-required="true">
    <x-field data-name="title" data-type="string" data-required="true" data-desc="標籤的標題。"></x-field>
    <x-field data-name="description" data-type="string" data-required="false" data-desc="標籤的描述。"></x-field>
    <x-field data-name="color" data-type="string" data-required="false" data-desc="標籤的十六進位顏色代碼。"></x-field>
  </x-field>
</x-field>

**傳回值**

<x-field data-name="ResponseTag" data-type="Promise<object>" data-desc="一個包含新建立標籤的物件。"></x-field>

### updateTag

更新現有的使用者標籤。

**參數**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="tag" data-type="object" data-required="true">
    <x-field data-name="id" data-type="number" data-required="true" data-desc="要更新的標籤 ID。"></x-field>
    <x-field data-name="title" data-type="string" data-required="false" data-desc="新的標題。"></x-field>
    <x-field data-name="description" data-type="string" data-required="false" data-desc="新的描述。"></x-field>
    <x-field data-name="color" data-type="string" data-required="false" data-desc="新的顏色。"></x-field>
  </x-field>
</x-field>

**傳回值**

<x-field data-name="ResponseTag" data-type="Promise<object>" data-desc="一個包含更新後標籤的物件。"></x-field>

### deleteTag

刪除一個使用者標籤。

**參數**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="tag" data-type="object" data-required="true">
    <x-field data-name="id" data-type="number" data-required="true" data-desc="要刪除的標籤 ID。"></x-field>
  </x-field>
</x-field>

**傳回值**

<x-field data-name="ResponseTag" data-type="Promise<object>" data-desc="一個包含已刪除標籤的物件。"></x-field>

## 基於角色的存取控制 (RBAC)

### getRoles

檢索所有可用角色的列表。

**傳回值**

<x-field data-name="ResponseRoles" data-type="Promise<object>" data-desc="一個包含角色列表的物件。">
  <x-field data-name="roles" data-type="TRole[]" data-desc="一個角色物件的陣列。"></x-field>
</x-field>

### getRole

根據名稱檢索單一角色。

**參數**

<x-field data-name="name" data-type="string" data-required="true" data-desc="角色的唯一名稱。"></x-field>

**傳回值**

<x-field data-name="ResponseRole" data-type="Promise<object>" data-desc="一個包含角色詳細資訊的物件。"></x-field>

### createRole

建立一個新角色。

**參數**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="name" data-type="string" data-required="true" data-desc="角色的唯一識別碼（例如：`editor`）。"></x-field>
  <x-field data-name="title" data-type="string" data-required="true" data-desc="人類可讀的標題（例如：`內容編輯器`）。"></x-field>
  <x-field data-name="description" data-type="string" data-required="false" data-desc="對角色用途的簡要描述。"></x-field>
</x-field>

**傳回值**

<x-field data-name="ResponseRole" data-type="Promise<object>" data-desc="一個包含新建立角色的物件。"></x-field>

### updateRole

更新現有角色。

**參數**

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="要更新的角色名稱。"></x-field>
  <x-field data-name="updates" data-type="object" data-required="true" data-desc="一個包含要更新欄位的物件。">
    <x-field data-name="title" data-type="string" data-required="false" data-desc="新的標題。"></x-field>
    <x-field data-name="description" data-type="string" data-required="false" data-desc="新的描述。"></x-field>
  </x-field>
</x-field-group>

**傳回值**

<x-field data-name="ResponseRole" data-type="Promise<object>" data-desc="一個包含更新後角色的物件。"></x-field>

### deleteRole

刪除一個角色。

**參數**

<x-field data-name="name" data-type="string" data-required="true" data-desc="要刪除的角色名稱。"></x-field>

**傳回值**

<x-field data-name="GeneralResponse" data-type="Promise<object>" data-desc="一個表示成功或失敗的一般回應物件。"></x-field>

### getPermissions

檢索所有可用權限的列表。

**傳回值**

<x-field data-name="ResponsePermissions" data-type="Promise<object>" data-desc="一個包含權限列表的物件。">
  <x-field data-name="permissions" data-type="TPermission[]" data-desc="一個權限物件的陣列。"></x-field>
</x-field>

### getPermissionsByRole

檢索授予特定角色的所有權限。

**參數**

<x-field data-name="role" data-type="string" data-required="true" data-desc="角色的名稱。"></x-field>

**傳回值**

<x-field data-name="ResponsePermissions" data-type="Promise<object>" data-desc="一個包含該角色權限列表的物件。"></x-field>

### createPermission

建立一個新權限。

**參數**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="name" data-type="string" data-required="true" data-desc="權限的唯一名稱（例如：`post:create`）。"></x-field>
  <x-field data-name="description" data-type="string" data-required="false" data-desc="描述該權限允許的操作。"></x-field>
</x-field>

**傳回值**

<x-field data-name="ResponsePermission" data-type="Promise<object>" data-desc="一個包含新建立權限的物件。"></x-field>

### updatePermission

更新現有權限。

**參數**

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="要更新的權限名稱。"></x-field>
  <x-field data-name="updates" data-type="object" data-required="true">
    <x-field data-name="description" data-type="string" data-required="false" data-desc="權限的新描述。"></x-field>
  </x-field>
</x-field-group>

**傳回值**

<x-field data-name="ResponsePermission" data-type="Promise<object>" data-desc="一個包含更新後權限的物件。"></x-field>

### deletePermission

刪除一個權限。

**參數**

<x-field data-name="name" data-type="string" data-required="true" data-desc="要刪除的權限名稱。"></x-field>

**傳回值**

<x-field data-name="GeneralResponse" data-type="Promise<object>" data-desc="一個表示成功或失敗的一般回應物件。"></x-field>

### grantPermissionForRole

將一個權限指派給一個角色。

**參數**

<x-field-group>
  <x-field data-name="role" data-type="string" data-required="true" data-desc="角色的名稱。"></x-field>
  <x-field data-name="permission" data-type="string" data-required="true" data-desc="要授予的權限名稱。"></x-field>
</x-field-group>

**傳回值**

<x-field data-name="GeneralResponse" data-type="Promise<object>" data-desc="一個表示成功或失敗的一般回應物件。"></x-field>

### revokePermissionFromRole

從一個角色中撤銷一個權限。

**參數**

<x-field-group>
  <x-field data-name="role" data-type="string" data-required="true" data-desc="角色的名稱。"></x-field>
  <x-field data-name="permission" data-type="string" data-required="true" data-desc="要撤銷的權限名稱。"></x-field>
</x-field-group>

**傳回值**

<x-field data-name="GeneralResponse" data-type="Promise<object>" data-desc="一個表示成功或失敗的一般回應物件。"></x-field>

### updatePermissionsForRole

用一組新的權限取代角色的所有現有權限。

**參數**

<x-field-group>
  <x-field data-name="role" data-type="string" data-required="true" data-desc="角色的名稱。"></x-field>
  <x-field data-name="permissions" data-type="string[]" data-required="true" data-desc="一個要為該角色設定的權限名稱陣列。"></x-field>
</x-field-group>

**傳回值**

<x-field data-name="ResponseRole" data-type="Promise<object>" data-desc="一個包含更新後角色的物件。"></x-field>

### hasPermission

檢查一個角色是否具有特定權限。

**參數**

<x-field-group>
  <x-field data-name="role" data-type="string" data-required="true" data-desc="要檢查的角色名稱。"></x-field>
  <x-field data-name="permission" data-type="string" data-required="true" data-desc="要驗證的權限名稱。"></x-field>
</x-field-group>

**傳回值**

<x-field data-name="BooleanResponse" data-type="Promise<object>" data-desc="一個帶有布林值 `result` 屬性的物件。">
  <x-field data-name="result" data-type="boolean" data-desc="若角色具有該權限，則為 `true`，否則為 `false`。"></x-field>
</x-field>

## Passport 管理

### issuePassportToUser

向使用者發行一個新的 passport，並為他們指派一個角色。

**參數**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="userDid" data-type="string" data-required="true" data-desc="接收 passport 的使用者的 DID。"></x-field>
  <x-field data-name="role" data-type="string" data-required="true" data-desc="要透過此 passport 指派的角色。"></x-field>
</x-field>

**傳回值**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="一個包含更新後使用者個人資料的物件，包括新的 passport。"></x-field>

### enableUserPassport

為使用者啟用一個先前被撤銷的 passport。

**參數**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="userDid" data-type="string" data-required="true" data-desc="使用者的 DID。"></x-field>
  <x-field data-name="passportId" data-type="string" data-required="true" data-desc="要啟用的 passport 的 ID。"></x-field>
</x-field>

**傳回值**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="一個包含更新後使用者個人資料的物件。"></x-field>

### revokeUserPassport

撤銷使用者的 passport。

**參數**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="userDid" data-type="string" data-required="true" data-desc="使用者的 DID。"></x-field>
  <x-field data-name="passportId" data-type="string" data-required="true" data-desc="要撤銷的 passport 的 ID。"></x-field>
</x-field>

**傳回值**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="一個包含更新後使用者個人資料的物件。"></x-field>

### removeUserPassport

永久移除使用者的 passport。

**參數**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="userDid" data-type="string" data-required="true" data-desc="使用者的 DID。"></x-field>
  <x-field data-name="passportId" data-type="string" data-required="true" data-desc="要移除的 passport 的 ID。"></x-field>
</x-field>

**傳回值**

<x-field data-name="GeneralResponse" data-type="Promise<object>" data-desc="一個表示成功或失敗的一般回應物件。"></x-field>

## Blocklet 與元件資訊

### getBlocklet

檢索目前 blocklet 的元資料和狀態。

**參數**

<x-field-group>
  <x-field data-name="attachRuntimeInfo" data-type="boolean" data-default="false" data-required="false" data-desc="若為 `true`，則包含執行階段資訊，如 CPU 和記憶體使用情況。"></x-field>
  <x-field data-name="useCache" data-type="boolean" data-default="true" data-required="false" data-desc="若為 `false`，則繞過快取以擷取最新資料。"></x-field>
</x-field-group>

**傳回值**

<x-field data-name="ResponseBlocklet" data-type="Promise<object>" data-desc="一個包含 blocklet 狀態和元資料的物件。"></x-field>

### getComponent

透過其 DID 檢索目前 blocklet 中特定元件的狀態。

**參數**

<x-field data-name="did" data-type="string" data-required="true" data-desc="要檢索的元件的 DID。"></x-field>

**傳回值**

<x-field data-name="ComponentState" data-type="Promise<object>" data-desc="一個包含元件狀態和元資料的物件。"></x-field>

### getTrustedDomains

檢索用於聯合登入的受信任網域列表。

**傳回值**

<x-field data-name="string[]" data-type="Promise<string[]>" data-desc="一個受信任網域 URL 的陣列。"></x-field>

### getVault

檢索並驗證 blocklet 的 vault 資訊。

**傳回值**

<x-field data-name="vault" data-type="Promise<string>" data-desc="如果驗證成功，則為 vault 字串。"></x-field>

### clearCache

根據模式清除節點上的快取資料。

**參數**

<x-field data-name="args" data-type="object" data-required="false">
  <x-field data-name="pattern" data-type="string" data-required="false" data-desc="一個用於比對快取鍵以進行移除的模式。"></x-field>
</x-field>

**傳回值**

<x-field data-name="ResponseClearCache" data-type="Promise<object>" data-desc="一個包含已移除快取鍵列表的物件。">
  <x-field data-name="removed" data-type="string[]" data-desc="一個從快取中移除的鍵的陣列。"></x-field>
</x-field>

## 存取金鑰管理

### createAccessKey

為程式化存取建立一個新的存取金鑰。

**參數**

<x-field data-name="params" data-type="object" data-required="true">
  <x-field data-name="remark" data-type="string" data-required="false" data-desc="存取金鑰的描述。"></x-field>
  <x-field data-name="passport" data-type="string" data-required="false" data-desc="要與金鑰關聯的角色/passport。預設為 'guest'。"></x-field>
</x-field>

**傳回值**

<x-field data-name="ResponseCreateAccessKey" data-type="Promise<object>" data-desc="一個包含新建立的存取金鑰和密鑰的物件。"></x-field>

### getAccessKey

檢索單一存取金鑰的詳細資訊。

**參數**

<x-field data-name="params" data-type="object" data-required="true">
  <x-field data-name="accessKeyId" data-type="string" data-required="true" data-desc="要檢索的存取金鑰 ID。"></x-field>
</x-field>

**傳回值**

<x-field data-name="ResponseAccessKey" data-type="Promise<object>" data-desc="一個包含存取金鑰詳細資訊的物件。"></x-field>

### getAccessKeys

檢索存取金鑰列表。

**參數**

<x-field data-name="params" data-type="object" data-required="false">
  <x-field data-name="paging" data-type="object" data-required="false" data-desc="分頁選項。"></x-field>
</x-field>

**傳回值**

<x-field data-name="ResponseAccessKeys" data-type="Promise<object>" data-desc="一個分頁的存取金鑰物件列表。"></x-field>

### verifyAccessKey

驗證存取金鑰是否有效。

**參數**

<x-field data-name="params" data-type="object" data-required="true">
  <x-field data-name="accessKeyId" data-type="string" data-required="true" data-desc="要驗證的存取金鑰 ID。"></x-field>
</x-field>

**傳回值**

<x-field data-name="ResponseAccessKey" data-type="Promise<object>" data-desc="如果有效，則為一個包含存取金鑰詳細資訊的物件。"></x-field>

---

在掌握 `BlockletService` 後，您可能會想探索如何向您的使用者傳送訊息。請前往[通知服務](./services-notification-service.md)指南以了解更多資訊。
