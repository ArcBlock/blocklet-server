# 通知服务

通知服务是 Blocklet SDK 的核心组件，使您的应用程序能够向用户发送各种类型的通知并订阅实时事件。该服务充当底层 ABT Node 通知功能的接口，处理从简单的用户消息到发送至 DID 钱包、电子邮件和其他渠道的丰富交互式通知的所有事务。

无论您需要提醒用户重要事件、发送交易性电子邮件，还是向所有连接的客户端广播消息，通知服务都提供了一个统一且简单的 API。

<!-- DIAGRAM_IMAGE_START:architecture:16:9 -->
![Notification Service](assets/diagram/notification-service-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## API 参考

### sendToUser

通过 DID 直接向一个或多个用户发送通知。这是用于定向用户通信的主要方法。

#### 参数

<x-field-group>
  <x-field data-name="receiver" data-type="string | string[]" data-required="true">
    <x-field-desc markdown>接收者的 DID。可以是一个 DID 字符串、一个 DID 数组，或使用 `*` 发送给该 blocklet 的所有用户。</x-field-desc>
  </x-field>
  <x-field data-name="notification" data-type="TNotification | TNotification[]" data-required="true">
    <x-field-desc markdown>要发送的通知对象或通知对象数组。详细结构请参见 [通知对象 (`TNotification`)](#the-notification-object-tnotification) 部分。</x-field-desc>
  </x-field>
  <x-field data-name="options" data-type="TSendOptions" data-required="false">
    <x-field-desc markdown>发送通知的附加选项。</x-field-desc>
    <x-field data-name="keepForOfflineUser" data-type="boolean" data-desc="如果为 true，通知将被存储并在用户上线时投递。"></x-field>
    <x-field data-name="locale" data-type="string" data-desc="通知的区域设置（例如 'en', 'zh'）。"></x-field>
    <x-field data-name="channels" data-type="('app' | 'email' | 'push' | 'webhook')[]" data-desc="指定通过哪些渠道投递通知。"></x-field>
    <x-field data-name="ttl" data-type="number" data-desc="消息的存活时间，单位为分钟（0-7200）。超过此时间后，消息将过期。"></x-field>
    <x-field data-name="allowUnsubscribe" data-type="boolean" data-desc="如果为 true，允许用户退订此类通知。"></x-field>
  </x-field>
</x-field-group>

#### 返回值

<x-field data-name="Promise<object>" data-type="Promise" data-desc="一个 promise，在成功发送后会解析为服务器的响应对象。"></x-field>

#### 示例

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
    console.log('Notification sent successfully:', result);
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}
```

#### 示例响应

```json
{
  "status": "ok",
  "message": "通知已发送给 1 个用户。"
}
```

### sendToMail

通过电子邮件向一个或多个收件人发送通知。通知对象的结构与 `sendToUser` 相同。

#### 参数

<x-field-group>
  <x-field data-name="receiver" data-type="string | string[]" data-required="true" data-desc="单个电子邮件地址或电子邮件地址数组。"></x-field>
  <x-field data-name="notification" data-type="TNotification" data-required="true" data-desc="通知对象。`title` 用作电子邮件主题，`body` 或 `attachments` 构成电子邮件内容。"></x-field>
  <x-field data-name="options" data-type="TSendOptions" data-required="false" data-desc="与 `sendToUser` 相同的发送选项。"></x-field>
</x-field-group>

#### 返回值

<x-field data-name="Promise<object>" data-type="Promise" data-desc="一个 promise，会解析为服务器的响应对象。"></x-field>

#### 示例

```javascript Send an email notification icon=logos:javascript
import notification from '@blocklet/sdk/service/notification';

async function emailUser(userEmail) {
  try {
    const result = await notification.sendToMail(userEmail, {
      type: 'notification',
      title: 'Your Weekly Report is Ready',
      body: 'Please log in to your dashboard to view the report.',
    });
    console.log('Email sent successfully:', result);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}
```

#### 示例响应

```json
{
  "status": "ok",
  "message": "电子邮件发送成功。"
}
```

### broadcast

向连接到特定 WebSocket 频道的客户端广播消息。默认情况下，它会发送到 blocklet 的公共频道。

#### 参数

<x-field-group>
  <x-field data-name="notification" data-type="TNotificationInput" data-required="true" data-desc="要广播的通知对象。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false">
    <x-field-desc markdown>控制广播的选项。</x-field-desc>
    <x-field data-name="channel" data-type="string">
      <x-field-desc markdown>要广播到的频道。默认为 blocklet 的公共频道，可通过 `getAppPublicChannel(did)` 获取。</x-field-desc>
    </x-field>
    <x-field data-name="event" data-type="string" data-default="message" data-desc="在客户端触发的事件名称。"></x-field>
    <x-field data-name="socketId" data-type="string" data-desc="如果提供，则仅将消息发送到此特定的套接字连接。"></x-field>
    <x-field data-name="userDid" data-type="string" data-desc="如果提供，则仅将消息发送到使用此 DID 身份验证的套接字。"></x-field>
  </x-field>
</x-field-group>

#### 返回值

<x-field data-name="Promise<object>" data-type="Promise" data-desc="一个 promise，会解析为服务器的响应。"></x-field>

#### 示例

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

#### 示例响应

```json
{
  "status": "ok",
  "message": "广播已发送。"
}
```

### sendToRelay

通过中继服务将消息发送到特定主题，从而实现不同组件甚至不同 blocklet 之间的实时、基于主题的通信。

#### 参数

<x-field-group>
  <x-field data-name="topic" data-type="string" data-required="true" data-desc="要发布事件的主题。"></x-field>
  <x-field data-name="event" data-type="string" data-required="true" data-desc="正在发送的事件的名称。"></x-field>
  <x-field data-name="data" data-type="any" data-required="true" data-desc="事件的负载数据。"></x-field>
</x-field-group>

#### 返回值

<x-field data-name="Promise<object>" data-type="Promise" data-desc="一个 promise，会解析为服务器的响应。"></x-field>

#### 示例

```javascript Send a relay message icon=logos:javascript
import notification from '@blocklet/sdk/service/notification';

async function publishNewArticle(article) {
  try {
    await notification.sendToRelay('articles', 'new-published', {
      id: article.id,
      title: article.title,
    });
    console.log('Relay message sent.');
  } catch (error) {
    console.error('Failed to send relay message:', error);
  }
}
```

#### 示例响应

```json
{
  "status": "ok",
  "message": "中继消息已发送。"
}
```

### on

订阅从 ABT Node 推送的通用事件，例如内部 blocklet 事件或与团队相关的事件。通知服务为此功能使用 `EventEmitter` 接口。

#### 参数

<x-field-group>
  <x-field data-name="event" data-type="string" data-required="true" data-desc="要监听的事件名称。"></x-field>
  <x-field data-name="callback" data-type="Function" data-required="true" data-desc="事件触发时执行的函数。"></x-field>
</x-field-group>

#### 示例

```javascript Listen for team member removal icon=logos:javascript
import notification from '@blocklet/sdk/service/notification';
import { TeamEvents } from '@blocklet/constant';

function onMemberRemoved(data) {
  console.log('Team member removed:', data.user.did);
  // Add logic to update application state
}

// Subscribe to the event
notification.on(TeamEvents.MEMBER_REMOVED, onMemberRemoved);
```

### off

移除先前用 `on` 添加的事件监听器。

#### 参数

<x-field-group>
  <x-field data-name="event" data-type="string" data-required="true" data-desc="要停止监听的事件名称。"></x-field>
  <x-field data-name="callback" data-type="Function" data-required="true" data-desc="要移除的特定监听器函数。"></x-field>
</x-field-group>

#### 示例

```javascript
// To unsubscribe from the previous example
// notification.off(TeamEvents.MEMBER_REMOVED, onMemberRemoved);
```

### _message.on

这是一个专门用于监听直接发送到你的 blocklet 私有消息频道的消息的特殊用途监听器。它对于处理旨在用于 blocklet 本身的直接响应或命令非常有用。

#### 参数

<x-field-group>
  <x-field data-name="event" data-type="string" data-required="true" data-desc="要监听的传入消息的 `type`。"></x-field>
  <x-field data-name="callback" data-type="Function" data-required="true" data-desc="接收到指定类型的消息时执行的函数。"></x-field>
</x-field-group>

#### 示例

```javascript Listen for direct messages icon=logos:javascript
import notification from '@blocklet/sdk/service/notification';

function handleDirectMessage(response) {
  console.log('Received direct message:', response);
}

// The 'message' event from the messageChannel is emitted with the response.type as the event name
// e.g., if response.type is 'payment_confirmation', the event here is 'payment_confirmation'
notification._message.on('payment_confirmation', handleDirectMessage);
```

### _message.off

移除用 `_message.on` 添加的直接消息监听器。

#### 参数

<x-field-group>
  <x-field data-name="event" data-type="string" data-required="true" data-desc="要停止监听的消息类型。"></x-field>
  <x-field data-name="callback" data-type="Function" data-required="true" data-desc="要移除的特定监听器函数。"></x-field>
</x-field-group>

## 通知对象 (`TNotification`)

通知对象是一个灵活的数据结构，用于定义通知的内容和外观。其结构可以针对不同的用例进行定制。

<x-field-group>
  <x-field data-name="type" data-type="'notification' | 'connect' | 'feed' | 'hi' | 'passthrough'" data-required="true">
    <x-field-desc markdown>通知的主要类型，它决定了其总体目的和结构。</x-field-desc>
  </x-field>
  <x-field data-name="title" data-type="string" data-desc="通知的标题。用于 `notification` 类型。"></x-field>
  <x-field data-name="body" data-type="string" data-desc="通知的主要内容/正文。用于 `notification` 类型。"></x-field>
  <x-field data-name="severity" data-type="'normal' | 'success' | 'error' | 'warning'" data-desc="严重性级别，可能会影响通知在钱包中的外观。用于 `notification` 类型。"></x-field>
  <x-field data-name="attachments" data-type="TNotificationAttachment[]">
    <x-field-desc markdown>一个富内容附件数组。这些附件在 DID 钱包中呈现为块。</x-field-desc>
    <x-field data-name="type" data-type="string" data-required="true">
      <x-field-desc markdown>附件的类型。可以是 `asset`、`vc`、`token`、`text`、`image`、`divider`、`transaction`、`dapp`、`link` 或 `section`。</x-field-desc>
    </x-field>
    <x-field data-name="data" data-type="object">
      <x-field-desc markdown>附件的数据负载，其内容因类型而异（例如，`text` 类型的附件在这里会有一个 `text` 属性）。</x-field-desc>
    </x-field>
  </x-field>
  <x-field data-name="actions" data-type="TNotificationAction[]">
    <x-field-desc markdown>一个与通知一同显示的操作按钮数组。</x-field-desc>
    <x-field data-name="name" data-type="string" data-required="true" data-desc="操作的标识符。"></x-field>
    <x-field data-name="title" data-type="string" data-desc="按钮上显示的文本。"></x-field>
    <x-field data-name="link" data-type="string" data-desc="点击按钮时打开的 URL。"></x-field>
  </x-field>
  <x-field data-name="activity" data-type="TNotificationActivity">
    <x-field-desc markdown>一个描述社交活动的对象，例如评论或关注。这是一种表示社交互动的结构化方式。</x-field-desc>
    <x-field data-name="type" data-type="'comment' | 'like' | 'follow' | 'tips' | 'mention' | 'assign' | 'un_assign'" data-required="true" data-desc="活动类型。"></x-field>
    <x-field data-name="actor" data-type="string" data-required="true" data-desc="执行操作的用户的 DID。"></x-field>
    <x-field data-name="target" data-type="TActivityTarget" data-required="true" data-desc="操作所作用的对象（例如，一篇博客文章）。"></x-field>
  </x-field>
  <x-field data-name="url" data-type="string" data-desc="`connect` 类型必需。DID Connect 会话的 URL。"></x-field>
  <x-field data-name="checkUrl" data-type="string" data-desc="`connect` 类型可选。用于检查会话状态的 URL。"></x-field>
  <x-field data-name="feedType" data-type="string" data-desc="`feed` 类型必需。一个标识 feed 类型的字符串。"></x-field>
  <x-field data-name="passthroughType" data-type="string" data-desc="`passthrough` 类型必需。一个标识 passthrough 数据类型的字符串。"></x-field>
  <x-field data-name="data" data-type="object" data-desc="`feed` 和 `passthrough` 类型必需。这些类型的数据负载。"></x-field>
</x-field-group>