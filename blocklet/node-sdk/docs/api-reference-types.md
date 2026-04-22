# Type Definitions

The Blocklet SDK is strongly typed to help you write more robust and maintainable code. This section provides a reference for the most common TypeScript types and interfaces you'll encounter when working with user sessions, notifications, events, and blocklet configurations. Understanding these types will help ensure type safety and leverage your IDE's autocompletion features effectively.

## Session & User Types

These types are fundamental for managing user authentication and identity within your application.

### SessionUser

The `SessionUser` object is attached to the `request` object (as `req.user`) by the session middleware. It contains essential information about the currently logged-in user.

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

<x-field data-name="did" data-type="string" data-required="true" data-desc="The user's Decentralized Identifier (DID)."></x-field>
<x-field data-name="role" data-type="string | undefined" data-required="false" data-desc="The role assigned to the user (e.g., 'admin', 'owner', 'guest')."></x-field>
<x-field data-name="provider" data-type="string" data-required="true" data-desc="The authentication provider used for login (e.g., 'wallet')."></x-field>
<x-field data-name="fullName" data-type="string" data-required="true" data-desc="The user's full name."></x-field>
<x-field data-name="walletOS" data-type="string" data-required="true" data-desc="The operating system of the user's wallet."></x-field>
<x-field data-name="emailVerified" data-type="boolean" data-required="false" data-desc="Indicates if the user's email has been verified."></x-field>
<x-field data-name="phoneVerified" data-type="boolean" data-required="false" data-desc="Indicates if the user's phone has been verified."></x-field>
<x-field data-name="method" data-type="AuthMethod" data-required="false" data-desc="The authentication method used. Common values are 'loginToken', 'componentCall', 'signedToken', 'accessKey'."></x-field>
<x-field data-name="kyc" data-type="number" data-required="false" data-desc="A numeric representation of the user's KYC status."></x-field>

### TUserInfo

The `TUserInfo` type provides a comprehensive view of a user's profile, including their identity, contact information, login history, and associated security credentials.

<x-field data-name="did" data-type="string" data-required="true" data-desc="The user's Decentralized Identifier (DID)."></x-field>
<x-field data-name="pk" data-type="string" data-required="true" data-desc="The user's public key."></x-field>
<x-field data-name="role" data-type="string" data-required="true" data-desc="The primary role of the user."></x-field>
<x-field data-name="avatar" data-type="string" data-required="true" data-desc="URL to the user's avatar image."></x-field>
<x-field data-name="fullName" data-type="string" data-required="true" data-desc="The user's full name."></x-field>
<x-field data-name="email" data-type="string" data-required="true" data-desc="The user's email address."></x-field>
<x-field data-name="approved" data-type="boolean" data-required="true" data-desc="Indicates if the user account has been approved."></x-field>
<x-field data-name="createdAt" data-type="number" data-required="true" data-desc="Timestamp of when the user was created."></x-field>
<x-field data-name="lastLoginAt" data-type="number" data-required="true" data-desc="Timestamp of the user's last login."></x-field>
<x-field data-name="passports" data-type="TPassport[]" data-required="true" data-desc="An array of passports issued to the user."></x-field>
<x-field data-name="connectedAccounts" data-type="TConnectedAccount[]" data-required="true" data-desc="A list of external accounts linked to the user's profile."></x-field>


## Notification Types

When using the [Notification Service](./services-notification-service.md), you will work with these types to construct and send messages to users.

### TNotification

This is the main interface for defining a notification. It includes all the necessary fields to control the content, appearance, and behavior of a notification.

<x-field data-name="id" data-type="string" data-required="false" data-desc="A unique identifier for the notification."></x-field>
<x-field data-name="title" data-type="string" data-required="false" data-desc="The main title of the notification."></x-field>
<x-field data-name="body" data-type="string" data-required="false" data-desc="The main content or message of the notification."></x-field>
<x-field data-name="type" data-type="'notification' | 'connect' | 'feed' | 'hi' | 'passthrough'" data-required="false" data-desc="The type of notification, which can affect its handling and presentation."></x-field>
<x-field data-name="severity" data-type="'normal' | 'success' | 'error' | 'warning'" data-required="false" data-desc="The severity level, often used to color-code the notification."></x-field>
<x-field data-name="actions" data-type="TNotificationAction[]" data-required="false" data-desc="An array of interactive action buttons to include in the notification."></x-field>
<x-field data-name="attachments" data-type="TNotificationAttachment[]" data-required="false" data-desc="An array of rich content attachments, such as images, text blocks, or links."></x-field>
<x-field data-name="activity" data-type="TNotificationActivity" data-required="false" data-desc="Describes a social activity, like a comment or follow, that triggered the notification."></x-field>
<x-field data-name="url" data-type="string" data-required="false" data-desc="A URL to navigate to when the notification is clicked."></x-field>


### TNotificationAttachment

Attachments allow you to add rich, structured content to your notifications.

<x-field data-name="type" data-type="'asset' | 'vc' | 'token' | 'text' | 'image' | 'divider' | 'transaction' | 'dapp' | 'link' | 'section'" data-required="true" data-desc="The type of content to display."></x-field>
<x-field data-name="data" data-type="any" data-required="false" data-desc="The data payload for the attachment, which varies depending on the type. For example, an 'image' type would have an object with a url property."></x-field>
<x-field data-name="fields" data-type="any" data-required="false" data-desc="Additional fields to display within the attachment, often used for 'section' types."></x-field>

**Example: Image Attachment**
```json
{
  "type": "image",
  "data": {
    "url": "https://path.to/your/image.png",
    "alt": "Descriptive text for the image"
  }
}
```

### TNotificationAction

Actions are interactive buttons that can be added to a notification, allowing users to respond directly.

<x-field data-name="name" data-type="string" data-required="true" data-desc="The name of the action, often used as an identifier."></x-field>
<x-field data-name="title" data-type="string" data-required="false" data-desc="The text displayed on the button. Defaults to name if not provided."></x-field>
<x-field data-name="link" data-type="string" data-required="false" data-desc="The URL to navigate to when the button is clicked."></x-field>
<x-field data-name="color" data-type="string" data-required="false" data-desc="The text color of the button."></x-field>
<x-field data-name="bgColor" data-type="string" data-required="false" data-desc="The background color of the button."></x-field>


## Event Types

When working with the event bus, events are structured using the `TEvent` interface.

### TEvent

This interface defines the structure for events emitted and consumed within the Blocklet ecosystem.

<x-field data-name="id" data-type="string" data-required="true" data-desc="A unique identifier for the event instance."></x-field>
<x-field data-name="type" data-type="string" data-required="true" data-desc="The event type name (e.g., 'user:created', 'post:published')."></x-field>
<x-field data-name="time" data-type="Date" data-required="true" data-desc="The timestamp when the event occurred."></x-field>
<x-field data-name="source" data-type="unknown" data-required="true" data-desc="The source or originator of the event."></x-field>
<x-field data-name="spec_version" data-type="string" data-required="true" data-desc="The CloudEvents specification version."></x-field>
<x-field data-name="object_id" data-type="string" data-required="false" data-desc="The ID of the object that the event pertains to."></x-field>
<x-field data-name="object_type" data-type="string" data-required="false" data-desc="The type of the object that the event pertains to."></x-field>
<x-field data-name="data" data-type="object" data-required="true" data-desc="The payload of the event, containing details about what happened."></x-field>

## Configuration & State Types

These types define the structure of configuration objects and state information for your blocklet.

### WindowBlocklet

On the client-side, the `window.blocklet` object provides essential context about the running blocklet. This object is typed as `WindowBlocklet`.

<x-field data-name="did" data-type="string" data-required="true" data-desc="The DID of the blocklet instance."></x-field>
<x-field data-name="appId" data-type="string" data-required="true" data-desc="The application ID."></x-field>
<x-field data-name="appName" data-type="string" data-required="true" data-desc="The display name of the application."></x-field>
<x-field data-name="appUrl" data-type="string" data-required="true" data-desc="The public URL of the application."></x-field>
<x-field data-name="webWalletUrl" data-type="string" data-required="true" data-desc="The URL of the associated web wallet."></x-field>
<x-field data-name="isComponent" data-type="boolean" data-required="true" data-desc="true if the blocklet is running as a component of another blocklet."></x-field>
<x-field data-name="prefix" data-type="string" data-required="true" data-desc="The URL prefix for the blocklet's routes."></x-field>
<x-field data-name="theme" data-type="TTheme" data-required="true" data-desc="The current theme settings for the UI."></x-field>
<x-field data-name="navigation" data-type="TNavigationItem[]" data-required="true" data-desc="An array of navigation items for the application menu."></x-field>


### TBlockletState

This type represents the complete state of a blocklet instance on the server, including its metadata, status, configuration, and relationship with other components.

<x-field data-name="meta" data-type="TBlockletMeta" data-required="false" data-desc="The metadata of the blocklet, from its blocklet.yml file."></x-field>
<x-field data-name="status" data-type="enum_pb.BlockletStatusMap" data-required="true" data-desc="The current running status of the blocklet (e.g., 'running', 'stopped')."></x-field>
<x-field data-name="port" data-type="number" data-required="true" data-desc="The port the blocklet is running on."></x-field>
<x-field data-name="appDid" data-type="string" data-required="true" data-desc="The DID of the blocklet instance."></x-field>
<x-field data-name="children" data-type="TComponentState[]" data-required="true" data-desc="An array of component states if this blocklet has children."></x-field>
<x-field data-name="settings" data-type="TBlockletSettings" data-required="false" data-desc="The user-configured settings for the blocklet."></x-field>
<x-field data-name="environments" data-type="TConfigEntry[]" data-required="true" data-desc="A list of environment variables configured for the blocklet."></x-field>