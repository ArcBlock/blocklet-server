# 类型定义

Blocklet SDK 是强类型的，可帮助您编写更健壮、更易于维护的代码。本节提供了在使用用户会话、通知、事件和 blocklet 配置时会遇到的最常见 TypeScript 类型和接口的参考。了解这些类型将有助于确保类型安全，并有效利用 IDE 的自动完成功能。

## 会话和用户类型

这些类型是管理应用程序中用户身份验证和身份的基础。

### SessionUser

`SessionUser` 对象由会话中间件附加到 `request` 对象（作为 `req.user`）。它包含有关当前登录用户的基本信息。

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

<x-field data-name="did" data-type="string" data-required="true" data-desc="用户的去中心化标识符（DID）。"></x-field>
<x-field data-name="role" data-type="string | undefined" data-required="false" data-desc="分配给用户的角色（例如，'admin'、'owner'、'guest'）。"></x-field>
<x-field data-name="provider" data-type="string" data-required="true" data-desc="用于登录的身份验证提供程序（例如，'wallet'）。"></x-field>
<x-field data-name="fullName" data-type="string" data-required="true" data-desc="用户的全名。"></x-field>
<x-field data-name="walletOS" data-type="string" data-required="true" data-desc="用户钱包的操作系统。"></x-field>
<x-field data-name="emailVerified" data-type="boolean" data-required="false" data-desc="指示用户的电子邮件是否已验证。"></x-field>
<x-field data-name="phoneVerified" data-type="boolean" data-required="false" data-desc="指示用户的电话是否已验证。"></x-field>
<x-field data-name="method" data-type="AuthMethod" data-required="false" data-desc="使用的身份验证方法。常见值为 'loginToken'、'componentCall'、'signedToken'、'accessKey'。"></x-field>
<x-field data-name="kyc" data-type="number" data-required="false" data-desc="用户 KYC 状态的数字表示。"></x-field>

### TUserInfo

`TUserInfo` 类型提供了用户个人资料的全面视图，包括其身份、联系信息、登录历史和相关的安全凭证。

<x-field data-name="did" data-type="string" data-required="true" data-desc="用户的去中心化标识符（DID）。"></x-field>
<x-field data-name="pk" data-type="string" data-required="true" data-desc="用户的公钥。"></x-field>
<x-field data-name="role" data-type="string" data-required="true" data-desc="用户的主要角色。"></x-field>
<x-field data-name="avatar" data-type="string" data-required="true" data-desc="用户头像图片的 URL。"></x-field>
<x-field data-name="fullName" data-type="string" data-required="true" data-desc="用户的全名。"></x-field>
<x-field data-name="email" data-type="string" data-required="true" data-desc="用户的电子邮件地址。"></x-field>
<x-field data-name="approved" data-type="boolean" data-required="true" data-desc="指示用户帐户是否已获批准。"></x-field>
<x-field data-name="createdAt" data-type="number" data-required="true" data-desc="用户创建时的时间戳。"></x-field>
<x-field data-name="lastLoginAt" data-type="number" data-required="true" data-desc="用户上次登录的时间戳。"></x-field>
<x-field data-name="passports" data-type="TPassport[]" data-required="true" data-desc="颁发给用户的护照数组。"></x-field>
<x-field data-name="connectedAccounts" data-type="TConnectedAccount[]" data-required="true" data-desc="链接到用户个人资料的外部帐户列表。"></x-field>


## 通知类型

使用[通知服务](./services-notification-service.md)时，您将使用这些类型来构建和向用户发送消息。

### TNotification

这是定义通知的主要接口。它包括控制通知内容、外观和行为所需的所有字段。

<x-field data-name="id" data-type="string" data-required="false" data-desc="通知的唯一标识符。"></x-field>
<x-field data-name="title" data-type="string" data-required="false" data-desc="通知的主标题。"></x-field>
<x-field data-name="body" data-type="string" data-required="false" data-desc="通知的主要内容或消息。"></x-field>
<x-field data-name="type" data-type="'notification' | 'connect' | 'feed' | 'hi' | 'passthrough'" data-required="false" data-desc="通知的类型，这会影响其处理和呈现方式。"></x-field>
<x-field data-name="severity" data-type="'normal' | 'success' | 'error' | 'warning'" data-required="false" data-desc="严重性级别，通常用于对通知进行颜色编码。"></x-field>
<x-field data-name="actions" data-type="TNotificationAction[]" data-required="false" data-desc="包含在通知中的交互式操作按钮数组。"></x-field>
<x-field data-name="attachments" data-type="TNotificationAttachment[]" data-required="false" data-desc="丰富内容附件的数组，例如图片、文本块或链接。"></x-field>
<x-field data-name="activity" data-type="TNotificationActivity" data-required="false" data-desc="描述触发通知的社交活动，如评论或关注。"></x-field>
<x-field data-name="url" data-type="string" data-required="false" data-desc="单击通知时要导航到的 URL。"></x-field>


### TNotificationAttachment

附件允许您向通知中添加丰富的结构化内容。

<x-field data-name="type" data-type="'asset' | 'vc' | 'token' | 'text' | 'image' | 'divider' | 'transaction' | 'dapp' | 'link' | 'section'" data-required="true" data-desc="要显示的内容类型。"></x-field>
<x-field data-name="data" data-type="any" data-required="false" data-desc="附件的数据负载，具体取决于类型。例如，'image' 类型将具有一个带有 url 属性的对象。"></x-field>
<x-field data-name="fields" data-type="any" data-required="false" data-desc="要在附件中显示的其他字段，通常用于 'section' 类型。"></x-field>

**示例：图片附件**
```json
{
  "type": "image",
  "data": {
    "url": "https://path.to/your/image.png",
    "alt": "图片的描述性文本"
  }
}
```

### TNotificationAction

操作是可添加到通知中的交互式按钮，允许用户直接响应。

<x-field data-name="name" data-type="string" data-required="true" data-desc="操作的名称，通常用作标识符。"></x-field>
<x-field data-name="title" data-type="string" data-required="false" data-desc="按钮上显示的文本。如果未提供，则默认为 name。"></x-field>
<x-field data-name="link" data-type="string" data-required="false" data-desc="单击按钮时要导航到的 URL。"></x-field>
<x-field data-name="color" data-type="string" data-required="false" data-desc="按钮的文本颜色。"></x-field>
<x-field data-name="bgColor" data-type="string" data-required="false" data-desc="按钮的背景颜色。"></x-field>


## 事件类型

在使用事件总线时，事件使用 `TEvent` 接口进行结构化。

### TEvent

此接口定义了在 Blocklet 生态系统中发出和使用的事件的结构。

<x-field data-name="id" data-type="string" data-required="true" data-desc="事件实例的唯一标识符。"></x-field>
<x-field data-name="type" data-type="string" data-required="true" data-desc="事件类型名称（例如，'user:created'、'post:published'）。"></x-field>
<x-field data-name="time" data-type="Date" data-required="true" data-desc="事件发生时的时间戳。"></x-field>
<x-field data-name="source" data-type="unknown" data-required="true" data-desc="事件的来源或发起者。"></x-field>
<x-field data-name="spec_version" data-type="string" data-required="true" data-desc="CloudEvents 规范版本。"></x-field>
<x-field data-name="object_id" data-type="string" data-required="false" data-desc="事件所属对象的 ID。"></x-field>
<x-field data-name="object_type" data-type="string" data-required="false" data-desc="事件所属对象的类型。"></x-field>
<x-field data-name="data" data-type="object" data-required="true" data-desc="事件的负载，包含有关所发生事件的详细信息。"></x-field>

## 配置和状态类型

这些类型定义了 blocklet 的配置对象和状态信息的结构。

### WindowBlocklet

在客户端，`window.blocklet` 对象提供了有关正在运行的 blocklet 的基本上下文。该对象类型为 `WindowBlocklet`。

<x-field data-name="did" data-type="string" data-required="true" data-desc="blocklet 实例的 DID。"></x-field>
<x-field data-name="appId" data-type="string" data-required="true" data-desc="应用程序 ID。"></x-field>
<x-field data-name="appName" data-type="string" data-required="true" data-desc="应用程序的显示名称。"></x-field>
<x-field data-name="appUrl" data-type="string" data-required="true" data-desc="应用程序的公共 URL。"></x-field>
<x-field data-name="webWalletUrl" data-type="string" data-required="true" data-desc="关联的网络钱包的 URL。"></x-field>
<x-field data-name="isComponent" data-type="boolean" data-required="true" data-desc="如果 blocklet 作为另一个 blocklet 的组件运行，则为 true。"></x-field>
<x-field data-name="prefix" data-type="string" data-required="true" data-desc="blocklet 路由的 URL 前缀。"></x-field>
<x-field data-name="theme" data-type="TTheme" data-required="true" data-desc="UI 的当前主题设置。"></x-field>
<x-field data-name="navigation" data-type="TNavigationItem[]" data-required="true" data-desc="应用程序菜单的导航项数组。"></x-field>


### TBlockletState

此类型表示服务器上 blocklet 实例的完整状态，包括其元数据、状态、配置以及与其他组件的关系。

<x-field data-name="meta" data-type="TBlockletMeta" data-required="false" data-desc="blocklet 的元数据，来自其 blocklet.yml 文件。"></x-field>
<x-field data-name="status" data-type="enum_pb.BlockletStatusMap" data-required="true" data-desc="blocklet 的当前运行状态（例如，'running'、'stopped'）。"></x-field>
<x-field data-name="port" data-type="number" data-required="true" data-desc="blocklet 正在运行的端口。"></x-field>
<x-field data-name="appDid" data-type="string" data-required="true" data-desc="blocklet 实例的 DID。"></x-field>
<x-field data-name="children" data-type="TComponentState[]" data-required="true" data-desc="如果此 blocklet 有子组件，则为组件状态数组。"></x-field>
<x-field data-name="settings" data-type="TBlockletSettings" data-required="false" data-desc="用户为 blocklet 配置的设置。"></x-field>
<x-field data-name="environments" data-type="TConfigEntry[]" data-required="true" data-desc="为 blocklet 配置的环境变量列表。"></x-field>