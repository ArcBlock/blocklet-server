# DID Connect

The Blocklet SDK provides a streamlined way to integrate decentralized identity into your application using DID Connect. This allows users to log in securely and manage their data using a DID Wallet, offering a passwordless and user-centric authentication experience. The core components for this functionality are `WalletAuthenticator` and `WalletHandler`.

These utilities are built upon the robust `@arcblock/did-connect-js` library, simplifying the setup process within the Blocklet environment.

### How It Works

The typical DID Connect login flow involves the user, your application's frontend and backend, and the user's DID Wallet.

<!-- DIAGRAM_IMAGE_START:sequence:4:3 -->
![DID Connect](assets/diagram/did-connect-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## Basic Setup

Setting up DID Connect in your Blocklet is straightforward. You need to instantiate the `WalletAuthenticator` and `WalletHandler`, providing a storage mechanism for session data.

Here is a typical setup in an Express.js application:

```javascript Basic DID Connect Setup icon=logos:javascript
import path from 'path';
import AuthStorage from '@arcblock/did-connect-storage-nedb';
import WalletAuthenticator from '@blocklet/sdk/lib/wallet-authenticator';
import WalletHandler from '@blocklet/sdk/lib/wallet-handler';

// 1. Initialize the authenticator
export const authenticator = new WalletAuthenticator();

// 2. Initialize the handler with the authenticator and a storage solution
export const handlers = new WalletHandler({
  authenticator,
  tokenStorage: new AuthStorage({
    dbPath: path.join(process.env.BLOCKLET_DATA_DIR, 'auth.db'),
  }),
});

// 3. Mount the handlers to your Express app
// app.use('/api/did/auth', handlers);
```

**Code Breakdown:**

1.  **`WalletAuthenticator`**: This class is responsible for creating and managing DID Connect sessions. It generates the data that will be encoded into the QR code displayed to the user.
2.  **`@arcblock/did-connect-storage-nedb`**: This is a file-based storage adapter for persisting session tokens. It's a convenient choice for Blocklets as it stores data within the blocklet's data directory (`BLOCKLET_DATA_DIR`).
3.  **`WalletHandler`**: This class handles the entire authentication lifecycle. It manages session creation, status updates (e.g., when a user scans the QR code), and the final authentication response from the wallet.

## Configuration

The `WalletHandler` constructor accepts an options object to customize its behavior. Here are some of the key parameters:

<x-field-group>
  <x-field data-name="authenticator" data-type="WalletAuthenticator" data-required="true" data-desc="An instance of WalletAuthenticator."></x-field>
  <x-field data-name="tokenStorage" data-type="object" data-required="true" data-desc="A storage instance for persisting session tokens, e.g., AuthStorage from '@arcblock/did-connect-storage-nedb'."></x-field>
  <x-field data-name="autoConnect" data-type="boolean" data-default="true" data-required="false">
    <x-field-desc markdown>If `true`, returning users who have previously connected their wallet can log in automatically without needing to scan the QR code again. This is achieved by sending a push notification to their wallet.</x-field-desc>
  </x-field>
  <x-field data-name="connectedDidOnly" data-type="boolean" data-default="false" data-required="false">
    <x-field-desc markdown>If `true`, only the DID of the currently logged-in user (if any) can be used to connect. This is useful for scenarios where a user needs to link a wallet to an existing account.</x-field-desc>
  </x-field>
</x-field-group>

### Customizing App Information

When a user scans the QR code, their DID Wallet displays information about your application, such as its name, description, and icon. The SDK automatically populates this using your blocklet's metadata. However, you can override this information by passing an `appInfo` function to the `WalletAuthenticator` constructor.

```javascript Customizing App Info icon=logos:javascript
import WalletAuthenticator from '@blocklet/sdk/lib/wallet-authenticator';

const authenticator = new WalletAuthenticator({
  async appInfo() {
    // This function can return custom app info
    // The returned object will be merged with the default info
    return {
      name: 'My Custom App Name',
      description: 'A custom description for the DID Connect request.',
      icon: 'https://my-app.com/logo.png',
    };
  },
});
```

## Further Reading

The `WalletAuthenticator` and `WalletHandler` provided by the Blocklet SDK are convenient wrappers for the more comprehensive `@arcblock/did-connect-js` library. For advanced use cases, deeper customization, or a more thorough understanding of the underlying mechanics, please refer to the official DID Connect SDK documentation.

<x-card data-title="DID Connect SDK Documentation" data-icon="lucide:book-open" data-href="https://www.arcblock.io/docs/did-connect-sdk/en/did-connect-sdk-overview" data-cta="Read More">
  Explore the full capabilities of the DID Connect protocol and its JavaScript SDKs for building powerful decentralized applications.
</x-card>

After a user successfully authenticates, the next step is to manage their session within your application. The Blocklet SDK provides a robust middleware for this purpose.

To learn how to verify user sessions and protect your routes, proceed to the next section on [Session Middleware](./authentication-session-middleware.md).