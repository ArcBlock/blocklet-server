# Notification Service

The Notification Service is a core component of the Blocklet SDK, enabling your application to send various types of notifications to users and subscribe to real-time events. This service acts as an interface to the underlying ABT Node notification capabilities, handling everything from simple user messages to rich, interactive notifications delivered to DID Wallets, email, and other channels.

Whether you need to alert a user about an important event, send a transactional email, or broadcast a message to all connected clients, the Notification Service provides a unified and straightforward API.

<!-- DIAGRAM_IMAGE_START:architecture:16:9 -->
![Notification Service](assets/diagram/notification-service-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## API Reference

### sendToUser

Sends a notification directly to one or more users identified by their DIDs. This is the primary method for targeted user communication.

#### Parameters

<x-field-group>
  <x-field data-name="receiver" data-type="string | string[]" data-required="true">
    <x-field-desc markdown>The DID of the recipient. Can be a single DID string, an array of DIDs, or `*` to send to all users of the blocklet.</x-field-desc>
  </x-field>
  <x-field data-name="notification" data-type="TNotification | TNotification[]" data-required="true">
    <x-field-desc markdown>The notification object or an array of notification objects to send. See the [The Notification Object (`TNotification`)](#the-notification-object-tnotification) section for a detailed structure.</x-field-desc>
  </x-field>
  <x-field data-name="options" data-type="TSendOptions" data-required="false">
    <x-field-desc markdown>Additional options for sending the notification.</x-field-desc>
    <x-field data-name="keepForOfflineUser" data-type="boolean" data-desc="If true, the notification will be stored and delivered when the user comes online."></x-field>
    <x-field data-name="locale" data-type="string" data-desc="The locale for the notification (e.g., 'en', 'zh')."></x-field>
    <x-field data-name="channels" data-type="('app' | 'email' | 'push' | 'webhook')[]" data-desc="Specify which channels to deliver the notification through."></x-field>
    <x-field data-name="ttl" data-type="number" data-desc="Time to live for the message in minutes (0-7200). After this time, the message expires."></x-field>
    <x-field data-name="allowUnsubscribe" data-type="boolean" data-desc="If true, allows the user to unsubscribe from this type of notification."></x-field>
  </x-field>
</x-field-group>

#### Returns

<x-field data-name="Promise<object>" data-type="Promise" data-desc="A promise that resolves with the response object from the server upon successful sending."></x-field>

#### Example

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

#### Example Response

```json
{
  "status": "ok",
  "message": "Notification sent to 1 user(s)."
}
```

### sendToMail

Sends a notification to one or more recipients via email. The notification object structure is the same as `sendToUser`.

#### Parameters

<x-field-group>
  <x-field data-name="receiver" data-type="string | string[]" data-required="true" data-desc="A single email address or an array of email addresses."></x-field>
  <x-field data-name="notification" data-type="TNotification" data-required="true" data-desc="The notification object. The `title` is used as the email subject and `body` or `attachments` form the email content."></x-field>
  <x-field data-name="options" data-type="TSendOptions" data-required="false" data-desc="Same sending options as `sendToUser`."></x-field>
</x-field-group>

#### Returns

<x-field data-name="Promise<object>" data-type="Promise" data-desc="A promise that resolves with the response object from the server."></x-field>

#### Example

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

#### Example Response

```json
{
  "status": "ok",
  "message": "Email sent successfully."
}
```

### broadcast

Broadcasts a message to clients connected to a specific WebSocket channel. By default, it sends to the blocklet's public channel.

#### Parameters

<x-field-group>
  <x-field data-name="notification" data-type="TNotificationInput" data-required="true" data-desc="The notification object to broadcast."></x-field>
  <x-field data-name="options" data-type="object" data-required="false">
    <x-field-desc markdown>Options to control the broadcast.</x-field-desc>
    <x-field data-name="channel" data-type="string">
      <x-field-desc markdown>The channel to broadcast to. Defaults to the blocklet's public channel, which can be retrieved with `getAppPublicChannel(did)`.</x-field-desc>
    </x-field>
    <x-field data-name="event" data-type="string" data-default="message" data-desc="The event name to emit on the client-side."></x-field>
    <x-field data-name="socketId" data-type="string" data-desc="If provided, sends the message only to this specific socket connection."></x-field>
    <x-field data-name="userDid" data-type="string" data-desc="If provided, sends the message only to sockets authenticated with this DID."></x-field>
  </x-field>
</x-field-group>

#### Returns

<x-field data-name="Promise<object>" data-type="Promise" data-desc="A promise that resolves with the server's response."></x-field>

#### Example

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

#### Example Response

```json
{
  "status": "ok",
  "message": "Broadcast sent."
}
```

### sendToRelay

Sends a message through the relay service to a specific topic, enabling real-time, topic-based communication between different components or even different blocklets.

#### Parameters

<x-field-group>
  <x-field data-name="topic" data-type="string" data-required="true" data-desc="The topic to publish the event to."></x-field>
  <x-field data-name="event" data-type="string" data-required="true" data-desc="The name of the event being sent."></x-field>
  <x-field data-name="data" data-type="any" data-required="true" data-desc="The payload data for the event."></x-field>
</x-field-group>

#### Returns

<x-field data-name="Promise<object>" data-type="Promise" data-desc="A promise that resolves with the server's response."></x-field>

#### Example

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

#### Example Response

```json
{
  "status": "ok",
  "message": "Relay message sent."
}
```

### on

Subscribes to general events, such as internal blocklet events or team-related events, pushed from the ABT Node. The Notification Service uses an `EventEmitter` interface for this functionality.

#### Parameters

<x-field-group>
  <x-field data-name="event" data-type="string" data-required="true" data-desc="The name of the event to listen for."></x-field>
  <x-field data-name="callback" data-type="Function" data-required="true" data-desc="The function to execute when the event is emitted."></x-field>
</x-field-group>

#### Example

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

Removes an event listener that was previously added with `on`.

#### Parameters

<x-field-group>
  <x-field data-name="event" data-type="string" data-required="true" data-desc="The name of the event to stop listening for."></x-field>
  <x-field data-name="callback" data-type="Function" data-required="true" data-desc="The specific listener function to remove."></x-field>
</x-field-group>

#### Example

```javascript
// To unsubscribe from the previous example
// notification.off(TeamEvents.MEMBER_REMOVED, onMemberRemoved);
```

### _message.on

This is a special-purpose listener specifically for messages sent directly to your blocklet's private message channel. It's useful for handling direct responses or commands intended for the blocklet itself.

#### Parameters

<x-field-group>
  <x-field data-name="event" data-type="string" data-required="true" data-desc="The `type` of the incoming message to listen for."></x-field>
  <x-field data-name="callback" data-type="Function" data-required="true" data-desc="The function to execute when a message of the specified type is received."></x-field>
</x-field-group>

#### Example

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

Removes a direct message listener that was added with `_message.on`.

#### Parameters

<x-field-group>
  <x-field data-name="event" data-type="string" data-required="true" data-desc="The message type to stop listening for."></x-field>
  <x-field data-name="callback" data-type="Function" data-required="true" data-desc="The specific listener function to remove."></x-field>
</x-field-group>

## The Notification Object (`TNotification`)

The notification object is a flexible data structure that defines the content and appearance of a notification. Its structure can be customized for different use cases.

<x-field-group>
  <x-field data-name="type" data-type="'notification' | 'connect' | 'feed' | 'hi' | 'passthrough'" data-required="true">
    <x-field-desc markdown>The primary type of the notification, which determines its overall purpose and structure.</x-field-desc>
  </x-field>
  <x-field data-name="title" data-type="string" data-desc="The title of the notification. Used for `notification` type."></x-field>
  <x-field data-name="body" data-type="string" data-desc="The main content/body of the notification. Used for `notification` type."></x-field>
  <x-field data-name="severity" data-type="'normal' | 'success' | 'error' | 'warning'" data-desc="The severity level, which can affect the notification's appearance in the wallet. Used for `notification` type."></x-field>
  <x-field data-name="attachments" data-type="TNotificationAttachment[]">
    <x-field-desc markdown>An array of rich content attachments. These are rendered as blocks in the DID Wallet.</x-field-desc>
    <x-field data-name="type" data-type="string" data-required="true">
      <x-field-desc markdown>Type of the attachment. Can be `asset`, `vc`, `token`, `text`, `image`, `divider`, `transaction`, `dapp`, `link`, or `section`.</x-field-desc>
    </x-field>
    <x-field data-name="data" data-type="object">
      <x-field-desc markdown>The data payload for the attachment, which varies by type (e.g., a `text` attachment would have a `text` property here).</x-field-desc>
    </x-field>
  </x-field>
  <x-field data-name="actions" data-type="TNotificationAction[]">
    <x-field-desc markdown>An array of action buttons to be displayed with the notification.</x-field-desc>
    <x-field data-name="name" data-type="string" data-required="true" data-desc="An identifier for the action."></x-field>
    <x-field data-name="title" data-type="string" data-desc="The text displayed on the button."></x-field>
    <x-field data-name="link" data-type="string" data-desc="A URL to open when the button is clicked."></x-field>
  </x-field>
  <x-field data-name="activity" data-type="TNotificationActivity">
    <x-field-desc markdown>An object describing a social activity, like a comment or a follow. This is a structured way to represent social interactions.</x-field-desc>
    <x-field data-name="type" data-type="'comment' | 'like' | 'follow' | 'tips' | 'mention' | 'assign' | 'un_assign'" data-required="true" data-desc="Type of activity."></x-field>
    <x-field data-name="actor" data-type="string" data-required="true" data-desc="The DID of the user who performed the action."></x-field>
    <x-field data-name="target" data-type="TActivityTarget" data-required="true" data-desc="The object on which the action was performed (e.g., a blog post)."></x-field>
  </x-field>
  <x-field data-name="url" data-type="string" data-desc="Required for `connect` type. The URL for the DID Connect session."></x-field>
  <x-field data-name="checkUrl" data-type="string" data-desc="Optional for `connect` type. A URL to check the session status."></x-field>
  <x-field data-name="feedType" data-type="string" data-desc="Required for `feed` type. A string identifying the type of feed."></x-field>
  <x-field data-name="passthroughType" data-type="string" data-desc="Required for `passthrough` type. A string identifying the type of passthrough data."></x-field>
  <x-field data-name="data" data-type="object" data-desc="Required for `feed` and `passthrough` types. The data payload for these types."></x-field>
</x-field-group>