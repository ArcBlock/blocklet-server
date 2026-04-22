# 通知服務

通知服務是 Blocklet SDK 的核心元件，讓您的應用程式能夠傳送各種類型的通知給使用者，並訂閱即時事件。此服務作為底層 ABT Node 通知功能的介面，處理從簡單的使用者訊息到傳送到 DID 錢包、電子郵件和其他管道的豐富互動式通知等所有事務。

無論您需要提醒使用者重要事件、傳送交易性電子郵件，或是向所有已連線的客戶端廣播訊息，通知服務都提供了一個統一且直接的 API。

<!-- DIAGRAM_IMAGE_START:architecture:16:9 -->
![Notification Service](assets/diagram/notification-service-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## API 參考

### sendToUser

直接向一個或多個由其 DID 標識的使用者傳送通知。這是針對性使用者通訊的主要方法。

#### 參數

<x-field-group>
  <x-field data-name="receiver" data-type="string | string[]" data-required="true">
    <x-field-desc markdown>接收者的 DID。可以是一個 DID 字串、一個 DID 陣列，或使用 `*` 傳送給該 blocklet 的所有使用者。</x-field-desc>
  </x-field>
  <x-field data-name="notification" data-type="TNotification | TNotification[]" data-required="true">
    <x-field-desc markdown>要傳送的通知物件或通知物件陣列。詳細結構請參閱 [通知物件 (`TNotification`)](#the-notification-object-tnotification) 章節。</x-field-desc>
  </x-field>
  <x-field data-name="options" data-type="TSendOptions" data-required="false">
    <x-field-desc markdown>傳送通知的額外選項。</x-field-desc>
    <x-field data-name="keepForOfflineUser" data-type="boolean" data-desc="若為 true，通知將被儲存並在使用者上線時傳送。"></x-field>
    <x-field data-name="locale" data-type="string" data-desc="通知的地區設定（例如：'en'、'zh'）。"></x-field>
    <x-field data-name="channels" data-type="('app' | 'email' | 'push' | 'webhook')[]" data-desc="指定透過哪些管道傳送通知。"></x-field>
    <x-field data-name="ttl" data-type="number" data-desc="訊息的存活時間，單位為分鐘（0-7200）。超過此時間後，訊息將過期。"></x-field>
    <x-field data-name="allowUnsubscribe" data-type="boolean" data-desc="若為 true，則允許使用者取消訂閱此類型的通知。"></x-field>
  </x-field>
</x-field-group>

#### 回傳值

<x-field data-name="Promise<object>" data-type="Promise" data-desc="一個 promise，成功傳送後會解析並回傳伺服器的回應物件。"></x-field>

#### 範例

```javascript Send a simple notification icon=logos:javascript
import notification from '@blocklet/sdk/service/notification';

async function notifyUser(userDid) {
  try {
    const result = await notification.sendToUser(userDid, {
      type: 'notification',
      title: 'Hello from SDK!',
      body: 'This is a test notification sent to a specific user.',
      severity: 'info',
    });
    console.log('通知傳送成功：', result);
  } catch (error) {
    console.error('傳送通知失敗：', error);
  }
}
```

#### 範例回應

```json
{
  "status": "ok",
  "message": "通知已傳送給 1 位使用者。"
}
```

### sendToMail

透過電子郵件向一個或多個接收者傳送通知。通知物件的結構與 `sendToUser` 相同。

#### 參數

<x-field-group>
  <x-field data-name="receiver" data-type="string | string[]" data-required="true" data-desc="單一電子郵件地址或電子郵件地址陣列。"></x-field>
  <x-field data-name="notification" data-type="TNotification" data-required="true" data-desc="通知物件。`title` 用作電子郵件主旨，`body` 或 `attachments` 構成電子郵件內容。"></x-field>
  <x-field data-name="options" data-type="TSendOptions" data-required="false" data-desc="與 `sendToUser` 相同的傳送選項。"></x-field>
</x-field-group>

#### 回傳值

<x-field data-name="Promise<object>" data-type="Promise" data-desc="一個 promise，會解析並回傳伺服器的回應物件。"></x-field>

#### 範例

```javascript Send an email notification icon=logos:javascript
import notification from '@blocklet/sdk/service/notification';

async function emailUser(userEmail) {
  try {
    const result = await notification.sendToMail(userEmail, {
      type: 'notification',
      title: 'Your Weekly Report is Ready',
      body: 'Please log in to your dashboard to view the report.',
    });
    console.log('電子郵件傳送成功：', result);
  } catch (error) {
    console.error('傳送電子郵件失敗：', error);
  }
}
```

#### 範例回應

```json
{
  "status": "ok",
  "message": "電子郵件傳送成功。"
}
```

### broadcast

向連接到特定 WebSocket 頻道的客戶端廣播訊息。預設情況下，它會傳送到 blocklet 的公共頻道。

#### 參數

<x-field-group>
  <x-field data-name="notification" data-type="TNotificationInput" data-required="true" data-desc="要廣播的通知物件。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false">
    <x-field-desc markdown>控制廣播的選項。</x-field-desc>
    <x-field data-name="channel" data-type="string">
      <x-field-desc markdown>要廣播到的頻道。預設為 blocklet 的公共頻道，可透過 `getAppPublicChannel(did)` 取得。</x-field-desc>
    </x-field>
    <x-field data-name="event" data-type="string" data-default="message" data-desc="在客戶端觸發的事件名稱。"></x-field>
    <x-field data-name="socketId" data-type="string" data-desc="若提供，則僅將訊息傳送至此特定的 socket 連線。"></x-field>
    <x-field data-name="userDid" data-type="string" data-desc="若提供，則僅將訊息傳送至使用此 DID 驗證的 socket。"></x-field>
  </x-field>
</x-field-group>

#### 回傳值

<x-field data-name="Promise<object>" data-type="Promise" data-desc="一個 promise，會解析並回傳伺服器的回應。"></x-field>

#### 範例

```javascript Broadcast a message icon=logos:javascript
import notification from '@blocklet/sdk/service/notification';

function broadcastUpdate() {
  notification.broadcast(
    {
      type: 'passthrough',
      passthroughType: 'system_update',
      data: { message: 'A new version is available. Please refresh.' },
    },
    { event: 'system-update' }
  );
}
```

#### 範例回應

```json
{
  "status": "ok",
  "message": "廣播已傳送。"
}
```

### sendToRelay

透過中繼服務將訊息傳送到特定主題，從而實現不同元件甚至不同 blocklet 之間的即時、基於主題的通訊。

#### 參數

<x-field-group>
  <x-field data-name="topic" data-type="string" data-required="true" data-desc="要發佈事件的主題。"></x-field>
  <x-field data-name="event" data-type="string" data-required="true" data-desc="正在傳送的事件名稱。"></x-field>
  <x-field data-name="data" data-type="any" data-required="true" data-desc="事件的負載資料。"></x-field>
</x-field-group>

#### 回傳值

<x-field data-name="Promise<object>" data-type="Promise" data-desc="一個 promise，會解析並回傳伺服器的回應。"></x-field>

#### 範例

```javascript Send a relay message icon=logos:javascript
import notification from '@blocklet/sdk/service/notification';

async function publishNewArticle(article) {
  try {
    await notification.sendToRelay('articles', 'new-published', {
      id: article.id,
      title: article.title,
    });
    console.log('中繼訊息已傳送。');
  } catch (error) {
    console.error('傳送中繼訊息失敗：', error);
  }
}
```

#### 範例回應

```json
{
  "status": "ok",
  "message": "中繼訊息已傳送。"
}
```

### on

訂閱從 ABT Node 推播的一般事件，例如內部 blocklet 事件或團隊相關事件。通知服務為此功能使用 `EventEmitter` 介面。

#### 參數

<x-field-group>
  <x-field data-name="event" data-type="string" data-required="true" data-desc="要監聽的事件名稱。"></x-field>
  <x-field data-name="callback" data-type="Function" data-required="true" data-desc="事件觸發時要執行的函式。"></x-field>
</x-field-group>

#### 範例

```javascript Listen for team member removal icon=logos:javascript
import notification from '@blocklet/sdk/service/notification';
import { TeamEvents } from '@blocklet/constant';

function onMemberRemoved(data) {
  console.log('Team member removed:', data.user.did);
  // 新增更新應用程式狀態的邏輯
}

// 訂閱事件
notification.on(TeamEvents.MEMBER_REMOVED, onMemberRemoved);
```

### off

移除先前用 `on` 新增的事件監聽器。

#### 參數

<x-field-group>
  <x-field data-name="event" data-type="string" data-required="true" data-desc="要停止監聽的事件名稱。"></x-field>
  <x-field data-name="callback" data-type="Function" data-required="true" data-desc="要移除的特定監聽器函式。"></x-field>
</x-field-group>

#### 範例

```javascript
// 若要取消訂閱前一個範例
// notification.off(TeamEvents.MEMBER_REMOVED, onMemberRemoved);
```

### _message.on

這是一個特殊用途的監聽器，專門用於直接傳送到您 blocklet 私人訊息頻道的訊息。它對於處理針對 blocklet 本身的直接回應或命令很有用。

#### 參數

<x-field-group>
  <x-field data-name="event" data-type="string" data-required="true" data-desc="要監聽的傳入訊息的 `type`。"></x-field>
  <x-field data-name="callback" data-type="Function" data-required="true" data-desc="收到指定類型訊息時要執行的函式。"></x-field>
</x-field-group>

#### 範例

```javascript Listen for direct messages icon=logos:javascript
import notification from '@blocklet/sdk/service/notification';

function handleDirectMessage(response) {
  console.log('Received direct message:', response);
}

// 來自 messageChannel 的 'message' 事件會以 response.type 作為事件名稱來觸發
// 例如，如果 response.type 是 'payment_confirmation'，這裡的事件就是 'payment_confirmation'
notification._message.on('payment_confirmation', handleDirectMessage);
```

### _message.off

移除先前用 `_message.on` 新增的直接訊息監聽器。

#### 參數

<x-field-group>
  <x-field data-name="event" data-type="string" data-required="true" data-desc="要停止監聽的訊息類型。"></x-field>
  <x-field data-name="callback" data-type="Function" data-required="true" data-desc="要移除的特定監聽器函式。"></x-field>
</x-field-group>

## 通知物件 (`TNotification`)

通知物件是一個彈性的資料結構，定義了通知的內容和外觀。其結構可以針對不同的使用案例進行客製化。

<x-field-group>
  <x-field data-name="type" data-type="'notification' | 'connect' | 'feed' | 'hi' | 'passthrough'" data-required="true">
    <x-field-desc markdown>通知的主要類型，它決定了其整體目的和結構。</x-field-desc>
  </x-field>
  <x-field data-name="title" data-type="string" data-desc="通知的標題。用於 `notification` 類型。"></x-field>
  <x-field data-name="body" data-type="string" data-desc="通知的主要內容/本文。用於 `notification` 類型。"></x-field>
  <x-field data-name="severity" data-type="'normal' | 'success' | 'error' | 'warning'" data-desc="嚴重性級別，會影響通知在錢包中的外觀。用於 `notification` 類型。"></x-field>
  <x-field data-name="attachments" data-type="TNotificationAttachment[]">
    <x-field-desc markdown>一個富內容附件陣列。這些附件會在 DID 錢包中以區塊形式呈現。</x-field-desc>
    <x-field data-name="type" data-type="string" data-required="true">
      <x-field-desc markdown>附件的類型。可以是 `asset`、`vc`、`token`、`text`、`image`、`divider`、`transaction`、`dapp`、`link` 或 `section`。</x-field-desc>
    </x-field>
    <x-field data-name="data" data-type="object">
      <x-field-desc markdown>附件的資料負載，會因類型而異（例如，`text` 附件在這裡會有一個 `text` 屬性）。</x-field-desc>
    </x-field>
  </x-field>
  <x-field data-name="actions" data-type="TNotificationAction[]">
    <x-field-desc markdown>一個要與通知一起顯示的動作按鈕陣列。</x-field-desc>
    <x-field data-name="name" data-type="string" data-required="true" data-desc="動作的識別碼。"></x-field>
    <x-field data-name="title" data-type="string" data-desc="按鈕上顯示的文字。"></x-field>
    <x-field data-name="link" data-type="string" data-desc="點擊按鈕時要開啟的 URL。"></x-field>
  </x-field>
  <x-field data-name="activity" data-type="TNotificationActivity">
    <x-field-desc markdown>一個描述社交活動的物件，例如評論或追蹤。這是表示社交互動的一種結構化方式。</x-field-desc>
    <x-field data-name="type" data-type="'comment' | 'like' | 'follow' | 'tips' | 'mention' | 'assign' | 'un_assign'" data-required="true" data-desc="活動類型。"></x-field>
    <x-field data-name="actor" data-type="string" data-required="true" data-desc="執行此動作的使用者的 DID。"></x-field>
    <x-field data-name="target" data-type="TActivityTarget" data-required="true" data-desc="執行動作的目標物件（例如，一篇部落格文章）。"></x-field>
  </x-field>
  <x-field data-name="url" data-type="string" data-desc="`connect` 類型為必填。DID Connect 會話的 URL。"></x-field>
  <x-field data-name="checkUrl" data-type="string" data-desc="`connect` 類型為選填。一個用於檢查會話狀態的 URL。"></x-field>
  <x-field data-name="feedType" data-type="string" data-desc="`feed` 類型為必填。一個用於識別 feed 類型的字串。"></x-field>
  <x-field data-name="passthroughType" data-type="string" data-desc="`passthrough` 類型為必填。一個用於識別 passthrough 資料類型的字串。"></x-field>
  <x-field data-name="data" data-type="object" data-desc="`feed` 和 `passthrough` 類型為必填。這些類型的資料負載。"></x-field>
</x-field-group>