# API Reference

Welcome to the Blocklet SDK API Reference. This section provides a detailed breakdown of all the modules, classes, functions, and utilities exported by the SDK. Whether you're managing users, sending notifications, or securing your application, you'll find the necessary details here.

For a practical, task-based approach to using these APIs, please see our [Guides](./guides.md). For detailed TypeScript definitions, refer to the [Type Definitions](./api-reference-types.md) section.

## Main Exports

The Blocklet SDK is organized into several modules, each providing a specific set of functionalities. Here’s a quick overview of the primary modules you'll be working with.

<x-cards data-columns="2">
  <x-card data-title="BlockletService" data-icon="lucide:server">
    A powerful client for interacting with the underlying Blocklet Server API to manage users, roles, permissions, and more.
  </x-card>
  <x-card data-title="NotificationService" data-icon="lucide:bell-ring">
    Handles real-time communication, allowing you to send notifications to users and listen for system-wide events.
  </x-card>
  <x-card data-title="EventBus" data-icon="lucide:git-merge">
    An event-driven messaging system for communication between different parts of your application.
  </x-card>
  <x-card data-title="Middlewares" data-icon="lucide:layers">
    A collection of pre-built Express.js middlewares for handling sessions, authentication, CSRF protection, and more.
  </x-card>
  <x-card data-title="Component Utilities" data-icon="lucide:puzzle">
    Functions to facilitate secure communication between different components within your blocklet.
  </x-card>
  <x-card data-title="Config & Env" data-icon="lucide:settings">
    Access runtime configuration, environment variables, and information about other components.
  </x-card>
  <x-card data-title="Wallet Utilities" data-icon="lucide:wallet">
    Tools for creating and managing wallet instances, essential for signing and authentication.
  </x-card>
  <x-card data-title="Security Utilities" data-icon="lucide:shield">
    Provides essential security functions like data encryption/decryption and response signing.
  </x-card>
</x-cards>

---

## BlockletService

The `BlockletService` is a client that provides a comprehensive API for managing users, roles, permissions, and other core blocklet functionalities. It acts as an interface to the Blocklet Server's GraphQL API.

```javascript Service Initialization icon=logos:javascript
import { BlockletService } from '@blocklet/sdk';

const blockletService = new BlockletService();

async function getOwnerInfo() {
  const { user } = await blockletService.getOwner();
  console.log('Owner:', user);
}
```

### Key Methods

The service exposes a wide range of methods. Here are some of the most commonly used ones:

| Method | Description |
|---|---|
| `login(data)` | Authenticates a user with the provided credentials. |
| `refreshSession(data)` | Refreshes a user's session using a refresh token. |
| `getUser(did, options)` | Retrieves a single user's profile by their DID. |
| `getUsers(args)` | Retrieves a paginated list of users. |
| `getOwner()` | Retrieves the blocklet owner's profile. |
| `updateUserApproval(did, approved)` | Approves or disapproves a user's access. |
| `createRole(args)` | Creates a new user role with a name, title, and description. |
| `getRoles()` | Retrieves a list of all available roles. |
| `deleteRole(name)` | Deletes a role by its name. |
| `grantPermissionForRole(roleName, permissionName)` | Grants a specific permission to a role. |
| `revokePermissionFromRole(roleName, permissionName)` | Revokes a permission from a role. |
| `hasPermission(role, permission)` | Checks if a role has a specific permission. |
| `getPermissions()` | Retrieves a list of all available permissions. |
| `getBlocklet(attachRuntimeInfo)` | Fetches metadata and settings for the current blocklet. |
| `getComponent(did)` | Retrieves the metadata for a specific component. |
| `createAccessKey(params)` | Creates a new access key for programmatic access. |
| `verifyAccessKey(params)` | Verifies the validity of an access key. |

For a full list of methods and their parameters, please refer to the [Type Definitions](./api-reference-types.md).

---

## NotificationService

The `NotificationService` enables real-time communication. You can send notifications directly to users or broadcast messages to public channels. It also allows you to listen for system events.

```javascript Sending a Notification icon=logos:javascript
import NotificationService from '@blocklet/sdk/service/notification';

async function notifyUser(userId, message) {
  const notification = {
    type: 'info',
    title: 'New Update',
    content: message,
  };
  await NotificationService.sendToUser(userId, notification);
}
```

### Main Functions

| Function | Description |
|---|---|
| `sendToUser(receiver, notification, options)` | Sends a direct notification to one or more users. |
| `sendToMail(receiver, notification, options)` | Sends a notification to a user's email. |
| `broadcast(notification, options)` | Broadcasts a message to the blocklet's public channel. |
| `on(event, callback)` | Subscribes to a system event (e.g., component updates, user events). |
| `off(event, callback)` | Unsubscribes from a system event. |

---

## EventBus

The `EventBus` provides a simple publish-subscribe mechanism for communication within your application, helping you build decoupled, event-driven features.

```javascript Publishing an Event icon=logos:javascript
import EventBus from '@blocklet/sdk/service/eventbus';

// In one part of your app
async function publishOrderCreated(orderData) {
  await EventBus.publish('order.created', { data: orderData });
}

// In another part of your app
EventBus.subscribe((event) => {
  if (event.type === 'order.created') {
    console.log('New order received:', event.data);
  }
});
```

### Functions

| Function | Description |
|---|---|
| `publish(name, event)` | Publishes an event with a specific name and payload. |
| `subscribe(callback)` | Subscribes to all events, executing the callback for each one received. |
| `unsubscribe(callback)` | Removes a previously registered event subscriber. |

---

## Middlewares

The SDK provides a suite of pre-configured Express.js middlewares to handle common web server tasks like authentication, session management, and security.

```javascript Using Middlewares icon=logos:javascript
import express from 'express';
import middlewares from '@blocklet/sdk/middlewares';

const app = express();

// Session middleware must be used before auth middleware
app.use(middlewares.session());

// Protect a route, requiring 'admin' role
app.get('/admin', middlewares.auth({ roles: ['admin'] }), (req, res) => {
  res.send('Welcome, admin!');
});
```

### Available Middlewares

| Middleware | Description |
|---|---|
| `session()` | Parses and verifies user sessions from tokens or access keys, attaching user info to `req.session`. |
| `auth(rules)` | Protects routes based on roles and permissions. Throws a 403 Forbidden error if the user is not authorized. |
| `user()` | A lightweight middleware that attaches user information to `req.user` if a valid session exists, but does not block unauthenticated requests. |
| `component()` | Middleware for securing routes that are only accessible by other components within the same blocklet. |
| `csrf()` | Implements CSRF (Cross-Site Request Forgery) protection. |
| `sitemap()` | Generates a `sitemap.xml` file for your application. |
| `fallback()` | A fallback middleware for Single Page Applications (SPAs) that serves `index.html` for unknown routes. |

---

## Component Utilities

These utilities are designed for inter-component communication and URL management.

```javascript Calling Another Component icon=logos:javascript
import component from '@blocklet/sdk/component';

async function fetchUserDataFromProfileComponent() {
  try {
    const response = await component.call({
      name: 'profile-component-did', // The DID of the target component
      path: '/api/user-data',
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    console.error('Failed to call component:', error);
  }
}
```

### Main Functions

| Function | Description |
|---|---|
| `call(options, retryOptions)` | Makes a secure HTTP request to another component within the same blocklet. |
| `getUrl(...parts)` | Constructs an absolute public URL for a path within the current component. |
| `getRelativeUrl(...parts)` | Constructs a relative URL for a path within the current component. |
| `getResources(options)` | Retrieves a list of resource components available to the blocklet. |
| `waitForComponentRunning(name, timeout)` | Waits until a specified component is running and reachable. |

---

## Config & Env

Access your blocklet's configuration, environment variables, and component metadata through the `config` export.

```javascript Accessing Environment Data icon=logos:javascript
import config from '@blocklet/sdk/config';

// Access environment variables
const appName = config.env.appName;
const appUrl = config.env.appUrl;

// Access the list of other components
const allComponents = config.components;
const databaseComponent = config.components.find(c => c.name === 'database');
```

### Key Properties

| Property | Description |
|---|---|
| `config.env` | An object containing environment variables and application settings (e.g., `appName`, `appUrl`, `isComponent`). |
| `config.components` | An array of objects, where each object contains metadata about a mounted component (e.g., `did`, `name`, `status`, `mountPoint`). |
| `config.logger` | A logger instance (`info`, `warn`, `error`, `debug`). |
| `config.events` | An `EventEmitter` that fires when the blocklet's configuration or component list changes. |

---

## Wallet Utilities

The `getWallet` function provides an easy way to create wallet instances from the secret keys provided in the environment. These wallets are essential for any cryptographic operations, such as signing data.

```javascript Creating a Wallet icon=logos:javascript
import getWallet from '@blocklet/sdk/wallet';

// Get the default wallet for the current application instance
const wallet = getWallet();
console.log('Wallet Address:', wallet.address);

// Get the permanent wallet associated with the blocklet's DID
const permanentWallet = getWallet.getPermanentWallet();
console.log('Permanent Wallet Address:', permanentWallet.address);
```

### Functions

| Function | Description |
|---|---|
| `getWallet(type, sk)` | Creates a wallet instance. By default, it uses the application's runtime secret key (`BLOCKLET_APP_SK`). |
| `getWallet.getPermanentWallet()` | A shortcut to get the wallet derived from the permanent secret key (`BLOCKLET_APP_PSK`). |
| `getWallet.getEthereumWallet(permanent)` | Creates an Ethereum-compatible wallet. |

---

## Security Utilities

The SDK includes a `security` module with helper functions for common cryptographic tasks like encryption and response signing.

```javascript Encrypting Data icon=logos:javascript
import security from '@blocklet/sdk/security';

const sensitiveData = 'This is a secret message';

// Encrypt data using the blocklet's encryption key
const encrypted = security.encrypt(sensitiveData);

// Decrypt it later
const decrypted = security.decrypt(encrypted);

console.log(decrypted === sensitiveData); // true
```

### Functions

| Function | Description |
|---|---|
| `encrypt(message, password, salt)` | Encrypts a string using AES. Uses `BLOCKLET_APP_EK` and `BLOCKLET_DID` by default. |
| `decrypt(message, password, salt)` | Decrypts a string that was encrypted with `encrypt`. |
| `signResponse(data)` | Signs a data payload with the blocklet's wallet, adding signature metadata. |
| `verifyResponse(data)` | Verifies the signature of a response signed with `signResponse`. |
