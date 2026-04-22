# Types

This section provides a detailed reference for the core TypeScript types and interfaces exported by the `@blocklet/js-sdk`. Using these types in your project can help you leverage TypeScript's static analysis and autocompletion for a better development experience.

## Core Blocklet Types

These types define the fundamental structure of a Blocklet application and its components.

### Blocklet

Represents the complete metadata and configuration for a Blocklet. This object is typically available globally as `window.blocklet` when the application is running within the Blocklet Server environment.

<x-field-group>
<x-field data-name="did" data-type="string" data-required="true" data-desc="The decentralized identifier (DID) of the Blocklet."></x-field>
<x-field data-name="appId" data-type="string" data-required="true" data-desc="The application ID, which is also the main component's DID."></x-field>
<x-field data-name="appPk" data-type="string" data-required="true" data-desc="The public key associated with the application."></x-field>
<x-field data-name="appIds" data-type="string[]" data-required="false" data-desc="A list of associated application IDs, used in a Federated Login Group."></x-field>
<x-field data-name="appPid" data-type="string" data-required="true" data-desc="The process ID for the application."></x-field>
<x-field data-name="appName" data-type="string" data-required="true" data-desc="The human-readable name of the application."></x-field>
<x-field data-name="appDescription" data-type="string" data-required="true" data-desc="A short description of the application."></x-field>
<x-field data-name="appLogo" data-type="string" data-required="true" data-desc="URL to the application's logo (square)."></x-field>
<x-field data-name="appLogoRect" data-type="string" data-required="true" data-desc="URL to the application's logo (rectangular)."></x-field>
<x-field data-name="appUrl" data-type="string" data-required="true" data-desc="The primary URL where the application is hosted."></x-field>
<x-field data-name="domainAliases" data-type="string[]" data-required="false" data-desc="Alternative domain names for the application."></x-field>
<x-field data-name="isComponent" data-type="boolean" data-required="true" data-desc="Indicates if the Blocklet is a component of another Blocklet."></x-field>
<x-field data-name="prefix" data-type="string" data-required="true" data-desc="The URL prefix for the Blocklet's routes."></x-field>
<x-field data-name="groupPrefix" data-type="string" data-required="true" data-desc="The URL prefix for the Federated Login Group."></x-field>
<x-field data-name="pageGroup" data-type="string" data-required="true" data-desc="The group this page belongs to."></x-field>
<x-field data-name="version" data-type="string" data-required="true" data-desc="The version of the Blocklet."></x-field>
<x-field data-name="mode" data-type="string" data-required="true" data-desc="The running mode of the Blocklet (e.g., 'development', 'production')."></x-field>
<x-field data-name="tenantMode" data-type="'single' | 'multiple'" data-required="true" data-desc="The tenancy mode of the Blocklet."></x-field>
<x-field data-name="theme" data-type="BlockletTheme" data-required="true" data-desc="The theme configuration for the Blocklet."></x-field>
<x-field data-name="navigation" data-type="BlockletNavigation[]" data-required="true" data-desc="An array of navigation items for the Blocklet's UI."></x-field>
<x-field data-name="preferences" data-type="Record<string, any>" data-required="true" data-desc="User-configurable preferences."></x-field>
<x-field data-name="languages" data-type="{ code: string; name: string }[]" data-required="true" data-desc="A list of supported languages."></x-field>
<x-field data-name="passportColor" data-type="string" data-required="true" data-desc="The primary color used in the DID Wallet passport."></x-field>
<x-field data-name="componentMountPoints" data-type="BlockletComponent[]" data-required="true" data-desc="A list of child components mounted by this Blocklet."></x-field>
<x-field data-name="alsoKnownAs" data-type="string[]" data-required="true" data-desc="A list of alternative identifiers."></x-field>
<x-field data-name="trustedFactories" data-type="string[]" data-required="true" data-desc="A list of trusted factory DIDs."></x-field>
<x-field data-name="status" data-type="string" data-required="true" data-desc="The current running status of the Blocklet."></x-field>
<x-field data-name="serverDid" data-type="string" data-required="true" data-desc="The DID of the Blocklet Server instance."></x-field>
<x-field data-name="serverVersion" data-type="string" data-required="true" data-desc="The version of the Blocklet Server."></x-field>
<x-field data-name="componentId" data-type="string" data-required="true" data-desc="The ID of the component."></x-field>
<x-field data-name="webWalletUrl" data-type="string" data-required="true" data-desc="The URL of the web-based DID Wallet."></x-field>
<x-field data-name="updatedAt" data-type="number" data-required="true" data-desc="Timestamp of the last update."></x-field>
<x-field data-name="settings" data-type="BlockletSettings" data-required="true" data-desc="Detailed settings for the Blocklet."></x-field>
</x-field-group>

### BlockletSettings

Contains various settings for the Blocklet, including session management, Federated Login Group configurations, and OAuth provider details.

<x-field-group>
<x-field data-name="session" data-type="object" data-required="true" data-desc="Session configuration.">
  <x-field data-name="ttl" data-type="number" data-required="true" data-desc="Session time-to-live in seconds."></x-field>
  <x-field data-name="cacheTtl" data-type="number" data-required="true" data-desc="Cache time-to-live in seconds."></x-field>
</x-field>
<x-field data-name="federated" data-type="object" data-required="true" data-desc="Federated Login Group configuration.">
  <x-field data-name="master" data-type="object" data-required="true" data-desc="Information about the master application in the group.">
    <x-field data-name="appId" data-type="string" data-required="true" data-desc="Master application ID."></x-field>
    <x-field data-name="appPid" data-type="string" data-required="true" data-desc="Master application process ID."></x-field>
    <x-field data-name="appName" data-type="string" data-required="true" data-desc="Master application name."></x-field>
    <x-field data-name="appDescription" data-type="string" data-required="true" data-desc="Master application description."></x-field>
    <x-field data-name="appUrl" data-type="string" data-required="true" data-desc="Master application URL."></x-field>
    <x-field data-name="appLogo" data-type="string" data-required="true" data-desc="Master application logo URL."></x-field>
    <x-field data-name="version" data-type="string" data-required="true" data-desc="Master application version."></x-field>
  </x-field>
  <x-field data-name="config" data-type="Record<string, any>" data-required="true" data-desc="Additional configuration for the federated group."></x-field>
</x-field>
<x-field data-name="oauth" data-type="Record<string, { enabled: boolean; [x: string]: any }>" data-required="true" data-desc="OAuth provider configurations, keyed by provider name."></x-field>
</x-field-group>

### BlockletComponent

Describes a component that is mounted within a parent Blocklet. It inherits properties from `TComponentInternalInfo`.

<x-field-group>
<x-field data-name="status" data-type="keyof typeof BlockletStatus" data-required="true" data-desc="The running status of the component (e.g., 'running', 'stopped')."></x-field>
</x-field-group>

## User and Authentication Types

These types are used by the `AuthService` to manage user profiles, settings, and authentication-related data.

### UserPublicInfo

Represents the basic public profile information of a user.

<x-field-group>
<x-field data-name="avatar" data-type="string" data-required="true" data-desc="URL of the user's avatar image."></x-field>
<x-field data-name="did" data-type="string" data-required="true" data-desc="The user's decentralized identifier (DID)."></x-field>
<x-field data-name="fullName" data-type="string" data-required="true" data-desc="The user's full name."></x-field>
<x-field data-name="sourceAppPid" data-type="string | null" data-required="true" data-desc="The process ID of the application where the user originated, if applicable."></x-field>
</x-field-group>

### NotificationConfig

Defines a user's notification preferences, including webhook configurations and notification channels.

<x-field-group>
<x-field data-name="webhooks" data-type="Webhook[]" data-required="false" data-desc="An array of configured webhooks."></x-field>
<x-field data-name="notifications" data-type="object" data-required="false" data-desc="Channel-specific notification settings.">
  <x-field data-name="email" data-type="boolean" data-required="false" data-desc="Enable or disable email notifications."></x-field>
  <x-field data-name="wallet" data-type="boolean" data-required="false" data-desc="Enable or disable DID Wallet notifications."></x-field>
  <x-field data-name="phone" data-type="boolean" data-required="false" data-desc="Enable or disable phone notifications."></x-field>
</x-field>
</x-field-group>

### Webhook

Defines the structure for a single webhook configuration.

<x-field-group>
<x-field data-name="type" data-type="'slack' | 'api'" data-required="true" data-desc="The type of the webhook endpoint."></x-field>
<x-field data-name="url" data-type="string" data-required="true" data-desc="The URL to which the webhook notification will be sent."></x-field>
</x-field-group>

### PrivacyConfig

An object representing a user's privacy settings, where keys correspond to specific privacy options.

<x-field-group>
<x-field data-name="[key]" data-type="boolean" data-required="true" data-desc="A dynamic key representing a privacy setting, with a boolean value indicating if it's enabled."></x-field>
</x-field-group>

### SpaceGateway

Defines the properties of a DID Space gateway.

<x-field-group>
<x-field data-name="did" data-type="string" data-required="true" data-desc="The DID of the space gateway."></x-field>
<x-field data-name="name" data-type="string" data-required="true" data-desc="The name of the space gateway."></x-field>
<x-field data-name="url" data-type="string" data-required="true" data-desc="The public URL of the space gateway."></x-field>
<x-field data-name="endpoint" data-type="string" data-required="true" data-desc="The API endpoint of the space gateway."></x-field>
</x-field-group>

## Session Management Types

These types are used by the `UserSessionService` to manage user login sessions across different devices and applications.

### UserSession

Represents a single user login session, containing details about the device, application, and user.

<x-field-group>
<x-field data-name="appName" data-type="string" data-required="true" data-desc="Name of the application for the session."></x-field>
<x-field data-name="appPid" data-type="string" data-required="true" data-desc="Process ID of the application for the session."></x-field>
<x-field data-name="extra" data-type="object" data-required="true" data-desc="Additional metadata about the session.">
  <x-field data-name="walletOS" data-type="'android' | 'ios' | 'web'" data-required="true" data-desc="The operating system of the wallet used for login."></x-field>
</x-field>
<x-field data-name="id" data-type="string" data-required="true" data-desc="The unique identifier for the session."></x-field>
<x-field data-name="lastLoginIp" data-type="string" data-required="true" data-desc="The IP address of the last login."></x-field>
<x-field data-name="passportId" data-type="string | null" data-required="true" data-desc="The ID of the passport used for login."></x-field>
<x-field data-name="ua" data-type="string" data-required="true" data-desc="The User-Agent string of the client."></x-field>
<x-field data-name="createdAt" data-type="string" data-required="false" data-desc="ISO string timestamp of when the session was created."></x-field>
<x-field data-name="updatedAt" data-type="string" data-required="true" data-desc="ISO string timestamp of the last session activity."></x-field>
<x-field data-name="status" data-type="string" data-required="false" data-desc="The current status of the session (e.g., 'online', 'expired')."></x-field>
<x-field data-name="user" data-type="UserSessionUser" data-required="false" data-desc="Detailed information about the user associated with the session."></x-field>
<x-field data-name="userDid" data-type="string" data-required="true" data-desc="The DID of the user."></x-field>
<x-field data-name="visitorId" data-type="string" data-required="true" data-desc="A unique identifier for the device/browser."></x-field>
</x-field-group>

### UserSessionUser

Contains detailed user information associated with a `UserSession`.

<x-field-group>
<x-field data-name="avatar" data-type="string" data-required="true" data-desc="URL of the user's avatar image."></x-field>
<x-field data-name="did" data-type="string" data-required="true" data-desc="The user's decentralized identifier (DID)."></x-field>
<x-field data-name="email" data-type="string" data-required="true" data-desc="The user's email address."></x-field>
<x-field data-name="fullName" data-type="string" data-required="true" data-desc="The user's full name."></x-field>
<x-field data-name="pk" data-type="string" data-required="true" data-desc="The user's public key."></x-field>
<x-field data-name="remark" data-type="string" data-required="false" data-desc="An optional remark or note about the user."></x-field>
<x-field data-name="role" data-type="string" data-required="true" data-desc="The role of the user (e.g., 'owner', 'admin')."></x-field>
<x-field data-name="roleTitle" data-type="string" data-required="true" data-desc="The display title for the user's role."></x-field>
<x-field data-name="sourceAppPid" data-type="string | null" data-required="true" data-desc="The process ID of the application where the user originated."></x-field>
<x-field data-name="sourceProvider" data-type="'wallet' | 'auth0' | 'nft'" data-required="true" data-desc="The original provider used for authentication."></x-field>
</x-field-group>

### UserSessionList

A paginated response object for a list of user sessions.

<x-field-group>
<x-field data-name="list" data-type="UserSession[]" data-required="true" data-desc="An array of user session objects."></x-field>
<x-field data-name="paging" data-type="object" data-required="true" data-desc="Pagination information.">
  <x-field data-name="page" data-type="number" data-required="true" data-desc="The current page number."></x-field>
  <x-field data-name="pageSize" data-type="number" data-required="true" data-desc="The number of items per page."></x-field>
  <x-field data-name="total" data-type="number" data-required="true" data-desc="The total number of sessions available."></x-field>
</x-field>
</x-field-group>

## Global & Environment Types

These types define globally available objects and server environment configurations.

### ServerEnv

Represents server-side environment variables that are often exposed to the client-side as `window.env`.

<x-field-group>
<x-field data-name="appId" data-type="string" data-required="true" data-desc="The application ID."></x-field>
<x-field data-name="appPid" data-type="string" data-required="true" data-desc="The application process ID."></x-field>
<x-field data-name="appName" data-type="string" data-required="true" data-desc="The application name."></x-field>
<x-field data-name="appDescription" data-type="string" data-required="true" data-desc="The application description."></x-field>
<x-field data-name="apiPrefix" data-type="string" data-required="true" data-desc="The prefix for backend API routes."></x-field>
<x-field data-name="baseUrl" data-type="string" data-required="true" data-desc="The base URL of the application."></x-field>
</x-field-group>

### Global Window Declarations

The SDK relies on certain global variables being present in the `window` object when running in a browser environment.

```typescript TypeScript Definition icon=logos:typescript
declare global {
  interface Window {
    blocklet: Blocklet;
    env?: ServerEnv;
  }
}
```

## Utility Types

Helper types used for API requests and token management.

### TokenResult

Represents the successful result of a token refresh operation.

<x-field-group>
<x-field data-name="nextToken" data-type="string" data-required="true" data-desc="The new session token."></x-field>
<x-field data-name="nextRefreshToken" data-type="string" data-required="true" data-desc="The new refresh token."></x-field>
</x-field-group>

### RequestParams

Defines common parameters that can be used when making requests with the SDK's API helpers.

<x-field-group>
<x-field data-name="lazy" data-type="boolean" data-required="false" data-desc="If true, the request may be debounced or delayed."></x-field>
<x-field data-name="lazyTime" data-type="number" data-required="false" data-desc="The delay time in milliseconds for a lazy request."></x-field>
<x-field data-name="componentDid" data-type="string" data-required="false" data-desc="The DID of the component to target with the request."></x-field>
</x-field-group>