# 类型

本节提供了 `@blocklet/js-sdk` 导出的核心 TypeScript 类型和接口的详细参考。在您的项目中使用这些类型可以帮助您利用 TypeScript 的静态分析和自动完成功能，以获得更好的开发体验。

## 核心 Blocklet 类型

这些类型定义了 Blocklet 应用程序及其组件的基本结构。

### Blocklet

表示 Blocklet 的完整元数据和配置。当应用程序在 Blocklet Server 环境中运行时，此对象通常作为 `window.blocklet` 全局可用。

<x-field-group>
<x-field data-name="did" data-type="string" data-required="true" data-desc="Blocklet 的去中心化标识符 (DID)。"></x-field>
<x-field data-name="appId" data-type="string" data-required="true" data-desc="应用程序 ID，也是主组件的 DID。"></x-field>
<x-field data-name="appPk" data-type="string" data-required="true" data-desc="与应用程序关联的公钥。"></x-field>
<x-field data-name="appIds" data-type="string[]" data-required="false" data-desc="关联的应用程序 ID 列表，用于联合登录组。"></x-field>
<x-field data-name="appPid" data-type="string" data-required="true" data-desc="应用程序的进程 ID。"></x-field>
<x-field data-name="appName" data-type="string" data-required="true" data-desc="应用程序的人类可读名称。"></x-field>
<x-field data-name="appDescription" data-type="string" data-required="true" data-desc="应用程序的简短描述。"></x-field>
<x-field data-name="appLogo" data-type="string" data-required="true" data-desc="指向应用程序徽标（方形）的 URL。"></x-field>
<x-field data-name="appLogoRect" data-type="string" data-required="true" data-desc="指向应用程序徽标（矩形）的 URL。"></x-field>
<x-field data-name="appUrl" data-type="string" data-required="true" data-desc="托管应用程序的主 URL。"></x-field>
<x-field data-name="domainAliases" data-type="string[]" data-required="false" data-desc="应用程序的备用域名。"></x-field>
<x-field data-name="isComponent" data-type="boolean" data-required="true" data-desc="指示该 Blocklet 是否是另一个 Blocklet 的组件。"></x-field>
<x-field data-name="prefix" data-type="string" data-required="true" data-desc="Blocklet 路由的 URL 前缀。"></x-field>
<x-field data-name="groupPrefix" data-type="string" data-required="true" data-desc="联合登录组的 URL 前缀。"></x-field>
<x-field data-name="pageGroup" data-type="string" data-required="true" data-desc="此页面所属的组。"></x-field>
<x-field data-name="version" data-type="string" data-required="true" data-desc="Blocklet 的版本。"></x-field>
<x-field data-name="mode" data-type="string" data-required="true" data-desc="Blocklet 的运行模式（例如，'development'、'production'）。"></x-field>
<x-field data-name="tenantMode" data-type="'single' | 'multiple'" data-required="true" data-desc="Blocklet 的租户模式。"></x-field>
<x-field data-name="theme" data-type="BlockletTheme" data-required="true" data-desc="Blocklet 的主题配置。"></x-field>
<x-field data-name="navigation" data-type="BlockletNavigation[]" data-required="true" data-desc="Blocklet UI 的导航项数组。"></x-field>
<x-field data-name="preferences" data-type="Record<string, any>" data-required="true" data-desc="用户可配置的偏好设置。"></x-field>
<x-field data-name="languages" data-type="{ code: string; name: string }[]" data-required="true" data-desc="支持的语言列表。"></x-field>
<x-field data-name="passportColor" data-type="string" data-required="true" data-desc="DID 钱包通行证中使用的主要颜色。"></x-field>
<x-field data-name="componentMountPoints" data-type="BlockletComponent[]" data-required="true" data-desc="此 Blocklet 挂载的子组件列表。"></x-field>
<x-field data-name="alsoKnownAs" data-type="string[]" data-required="true" data-desc="备用标识符列表。"></x-field>
<x-field data-name="trustedFactories" data-type="string[]" data-required="true" data-desc="受信任的工厂 DID 列表。"></x-field>
<x-field data-name="status" data-type="string" data-required="true" data-desc="Blocklet 当前的运行状态。"></x-field>
<x-field data-name="serverDid" data-type="string" data-required="true" data-desc="Blocklet Server 实例的 DID。"></x-field>
<x-field data-name="serverVersion" data-type="string" data-required="true" data-desc="Blocklet Server 的版本。"></x-field>
<x-field data-name="componentId" data-type="string" data-required="true" data-desc="组件的 ID。"></x-field>
<x-field data-name="webWalletUrl" data-type="string" data-required="true" data-desc="基于 Web 的 DID 钱包的 URL。"></x-field>
<x-field data-name="updatedAt" data-type="number" data-required="true" data-desc="上次更新的时间戳。"></x-field>
<x-field data-name="settings" data-type="BlockletSettings" data-required="true" data-desc="Blocklet 的详细设置。"></x-field>
</x-field-group>

### BlockletSettings

包含 Blocklet 的各种设置，包括会话管理、联合登录组配置和 OAuth 提供商详细信息。

<x-field-group>
<x-field data-name="session" data-type="object" data-required="true" data-desc="会话配置。">
  <x-field data-name="ttl" data-type="number" data-required="true" data-desc="会话的生存时间（秒）。"></x-field>
  <x-field data-name="cacheTtl" data-type="number" data-required="true" data-desc="缓存的生存时间（秒）。"></x-field>
</x-field>
<x-field data-name="federated" data-type="object" data-required="true" data-desc="联合登录组配置。">
  <x-field data-name="master" data-type="object" data-required="true" data-desc="有关组中主应用程序的信息。">
    <x-field data-name="appId" data-type="string" data-required="true" data-desc="主应用程序 ID。"></x-field>
    <x-field data-name="appPid" data-type="string" data-required="true" data-desc="主应用程序进程 ID。"></x-field>
    <x-field data-name="appName" data-type="string" data-required="true" data-desc="主应用程序名称。"></x-field>
    <x-field data-name="appDescription" data-type="string" data-required="true" data-desc="主应用程序描述。"></x-field>
    <x-field data-name="appUrl" data-type="string" data-required="true" data-desc="主应用程序 URL。"></x-field>
    <x-field data-name="appLogo" data-type="string" data-required="true" data-desc="主应用程序徽标 URL。"></x-field>
    <x-field data-name="version" data-type="string" data-required="true" data-desc="主应用程序版本。"></x-field>
  </x-field>
  <x-field data-name="config" data-type="Record<string, any>" data-required="true" data-desc="联合组的附加配置。"></x-field>
</x-field>
<x-field data-name="oauth" data-type="Record<string, { enabled: boolean; [x: string]: any }>" data-required="true" data-desc="OAuth 提供商配置，以提供商名称为键。"></x-field>
</x-field-group>

### BlockletComponent

描述挂载在父 Blocklet 中的组件。它继承了 `TComponentInternalInfo` 的属性。

<x-field-group>
<x-field data-name="status" data-type="keyof typeof BlockletStatus" data-required="true" data-desc="组件的运行状态（例如，'running'、'stopped'）。"></x-field>
</x-field-group>

## 用户和身份验证类型

这些类型由 `AuthService` 用于管理用户个人资料、设置和与身份验证相关的数据。

### UserPublicInfo

表示用户的基本公开个人资料信息。

<x-field-group>
<x-field data-name="avatar" data-type="string" data-required="true" data-desc="用户头像图片的 URL。"></x-field>
<x-field data-name="did" data-type="string" data-required="true" data-desc="用户的去中心化标识符 (DID)。"></x-field>
<x-field data-name="fullName" data-type="string" data-required="true" data-desc="用户的全名。"></x-field>
<x-field data-name="sourceAppPid" data-type="string | null" data-required="true" data-desc="如果适用，用户来源应用程序的进程 ID。"></x-field>
</x-field-group>

### NotificationConfig

定义用户的通知偏好，包括 webhook 配置和通知渠道。

<x-field-group>
<x-field data-name="webhooks" data-type="Webhook[]" data-required="false" data-desc="已配置的 webhook 数组。"></x-field>
<x-field data-name="notifications" data-type="object" data-required="false" data-desc="特定渠道的通知设置。">
  <x-field data-name="email" data-type="boolean" data-required="false" data-desc="启用或禁用电子邮件通知。"></x-field>
  <x-field data-name="wallet" data-type="boolean" data-required="false" data-desc="启用或禁用 DID 钱包通知。"></x-field>
  <x-field data-name="phone" data-type="boolean" data-required="false" data-desc="启用或禁用电话通知。"></x-field>
</x-field>
</x-field-group>

### Webhook

定义单个 webhook 配置的结构。

<x-field-group>
<x-field data-name="type" data-type="'slack' | 'api'" data-required="true" data-desc="webhook 端点的类型。"></x-field>
<x-field data-name="url" data-type="string" data-required="true" data-desc="将发送 webhook 通知的 URL。"></x-field>
</x-field-group>

### PrivacyConfig

表示用户隐私设置的对象，其中键对应于特定的隐私选项。

<x-field-group>
<x-field data-name="[key]" data-type="boolean" data-required="true" data-desc="表示隐私设置的动态键，其布尔值指示是否启用。"></x-field>
</x-field-group>

### SpaceGateway

定义 DID Space 网关的属性。

<x-field-group>
<x-field data-name="did" data-type="string" data-required="true" data-desc="空间网关的 DID。"></x-field>
<x-field data-name="name" data-type="string" data-required="true" data-desc="空间网关的名称。"></x-field>
<x-field data-name="url" data-type="string" data-required="true" data-desc="空间网关的公共 URL。"></x-field>
<x-field data-name="endpoint" data-type="string" data-required="true" data-desc="空间网关的 API 端点。"></x-field>
</x-field-group>

## 会话管理类型

这些类型由 `UserSessionService` 用于管理跨不同设备和应用程序的用户登录会话。

### UserSession

表示单个用户登录会话，包含有关设备、应用程序和用户的详细信息。

<x-field-group>
<x-field data-name="appName" data-type="string" data-required="true" data-desc="会话所属应用程序的名称。"></x-field>
<x-field data-name="appPid" data-type="string" data-required="true" data-desc="会话所属应用程序的进程 ID。"></x-field>
<x-field data-name="extra" data-type="object" data-required="true" data-desc="关于会话的附加元数据。">
  <x-field data-name="walletOS" data-type="'android' | 'ios' | 'web'" data-required="true" data-desc="用于登录的钱包的操作系统。"></x-field>
</x-field>
<x-field data-name="id" data-type="string" data-required="true" data-desc="会话的唯一标识符。"></x-field>
<x-field data-name="lastLoginIp" data-type="string" data-required="true" data-desc="上次登录的 IP 地址。"></x-field>
<x-field data-name="passportId" data-type="string | null" data-required="true" data-desc="用于登录的通行证 ID。"></x-field>
<x-field data-name="ua" data-type="string" data-required="true" data-desc="客户端的 User-Agent 字符串。"></x-field>
<x-field data-name="createdAt" data-type="string" data-required="false" data-desc="创建会话时的 ISO 字符串时间戳。"></x-field>
<x-field data-name="updatedAt" data-type="string" data-required="true" data-desc="上次会话活动的 ISO 字符串时间戳。"></x-field>
<x-field data-name="status" data-type="string" data-required="false" data-desc="会话的当前状态（例如，'online'、'expired'）。"></x-field>
<x-field data-name="user" data-type="UserSessionUser" data-required="false" data-desc="与会话关联的用户的详细信息。"></x-field>
<x-field data-name="userDid" data-type="string" data-required="true" data-desc="用户的 DID。"></x-field>
<x-field data-name="visitorId" data-type="string" data-required="true" data-desc="设备/浏览器的唯一标识符。"></x-field>
</x-field-group>

### UserSessionUser

包含与 `UserSession` 关联的详细用户信息。

<x-field-group>
<x-field data-name="avatar" data-type="string" data-required="true" data-desc="用户头像图片的 URL。"></x-field>
<x-field data-name="did" data-type="string" data-required="true" data-desc="用户的去中心化标识符 (DID)。"></x-field>
<x-field data-name="email" data-type="string" data-required="true" data-desc="用户的电子邮件地址。"></x-field>
<x-field data-name="fullName" data-type="string" data-required="true" data-desc="用户的全名。"></x-field>
<x-field data-name="pk" data-type="string" data-required="true" data-desc="用户的公钥。"></x-field>
<x-field data-name="remark" data-type="string" data-required="false" data-desc="关于用户的可选备注或注释。"></x-field>
<x-field data-name="role" data-type="string" data-required="true" data-desc="用户的角色（例如，'owner'、'admin'）。"></x-field>
<x-field data-name="roleTitle" data-type="string" data-required="true" data-desc="用户角色的显示标题。"></x-field>
<x-field data-name="sourceAppPid" data-type="string | null" data-required="true" data-desc="用户来源应用程序的进程 ID。"></x-field>
<x-field data-name="sourceProvider" data-type="'wallet' | 'auth0' | 'nft'" data-required="true" data-desc="用于身份验证的原始提供商。"></x-field>
</x-field-group>

### UserSessionList

用户会话列表的分页响应对象。

<x-field-group>
<x-field data-name="list" data-type="UserSession[]" data-required="true" data-desc="用户会话对象数组。"></x-field>
<x-field data-name="paging" data-type="object" data-required="true" data-desc="分页信息。">
  <x-field data-name="page" data-type="number" data-required="true" data-desc="当前页码。"></x-field>
  <x-field data-name="pageSize" data-type="number" data-required="true" data-desc="每页的项目数。"></x-field>
  <x-field data-name="total" data-type="number" data-required="true" data-desc="可用的会话总数。"></x-field>
</x-field>
</x-field-group>

## 全局和环境类型

这些类型定义了全局可用的对象和服务器环境配置。

### ServerEnv

表示服务器端环境变量，这些变量通常作为 `window.env` 暴露给客户端。

<x-field-group>
<x-field data-name="appId" data-type="string" data-required="true" data-desc="应用程序 ID。"></x-field>
<x-field data-name="appPid" data-type="string" data-required="true" data-desc="应用程序进程 ID。"></x-field>
<x-field data-name="appName" data-type="string" data-required="true" data-desc="应用程序名称。"></x-field>
<x-field data-name="appDescription" data-type="string" data-required="true" data-desc="应用程序描述。"></x-field>
<x-field data-name="apiPrefix" data-type="string" data-required="true" data-desc="后端 API 路由的前缀。"></x-field>
<x-field data-name="baseUrl" data-type="string" data-required="true" data-desc="应用程序的基础 URL。"></x-field>
</x-field-group>

### 全局窗口声明

SDK 依赖于在浏览器环境中运行时 `window` 对象中存在的某些全局变量。

```typescript TypeScript Definition icon=logos:typescript
declare global {
  interface Window {
    blocklet: Blocklet;
    env?: ServerEnv;
  }
}
```

## 实用工具类型

用于 API 请求和令牌管理的辅助类型。

### TokenResult

表示令牌刷新操作的成功结果。

<x-field-group>
<x-field data-name="nextToken" data-type="string" data-required="true" data-desc="新的会话令牌。"></x-field>
<x-field data-name="nextRefreshToken" data-type="string" data-required="true" data-desc="新的刷新令牌。"></x-field>
</x-field-group>

### RequestParams

定义了在使用 SDK 的 API 辅助函数发出请求时可以使用的通用参数。

<x-field-group>
<x-field data-name="lazy" data-type="boolean" data-required="false" data-desc="如果为 true，请求可能会被防抖或延迟。"></x-field>
<x-field data-name="lazyTime" data-type="number" data-required="false" data-desc="延迟请求的延迟时间（毫秒）。"></x-field>
<x-field data-name="componentDid" data-type="string" data-required="false" data-desc="请求目标组件的 DID。"></x-field>
</x-field-group>