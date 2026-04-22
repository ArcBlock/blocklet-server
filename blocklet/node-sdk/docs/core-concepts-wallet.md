# Wallet Management

In the Blocklet SDK, a wallet is a fundamental cryptographic object that represents your application's identity. It's essential for signing data, authenticating requests, and interacting with blockchain networks. The SDK provides a powerful and convenient utility, `getWallet`, to create and manage wallet instances directly from your application's environment variables.

This utility abstracts the complexities of handling different cryptographic curves and key formats, whether you're working with ArcBlock's native DID or Ethereum. The wallet's keys are sourced from the environment variables set by the Blocklet Server, which you can learn more about in the [Configuration & Environment](./core-concepts-configuration.md) documentation.

## The `getWallet` Utility

The `getWallet` function is the primary method for creating a `WalletObject`. By default, it uses the application's standard secret key (`BLOCKLET_APP_SK`) and the configured chain type (`CHAIN_TYPE` or `BLOCKLET_WALLET_TYPE`) from the environment.

```javascript Basic Usage icon=logos:javascript
import getWallet from '@blocklet/sdk/lib/wallet';

// Create a wallet instance using environment variables
const appWallet = getWallet();

// Now you can use the wallet to sign data
const signature = appWallet.sign('data to be signed');
```

The utility is smart enough to handle different blockchain types based on the configuration.

### Parameters

While `getWallet` works out-of-the-box with environment variables, you can override its behavior by passing parameters.

<x-field data-name="type" data-type="DIDTypeShortcut" data-required="false" data-desc="The DID type for the wallet. Can be 'ethereum' or 'arcblock' (or 'default'). Defaults to the value of the CHAIN_TYPE or BLOCKLET_WALLET_TYPE environment variable."></x-field>

<x-field data-name="appSk" data-type="string" data-required="false" data-desc="The application's secret key in hex format. Defaults to the value of the BLOCKLET_APP_SK environment variable."></x-field>


### Creating Wallets for Specific Chains

You can explicitly request a wallet for a specific chain type by providing the `type` parameter.

```javascript Creating an Ethereum Wallet icon=logos:javascript
import getWallet from '@blocklet/sdk/lib/wallet';

// Explicitly create an Ethereum wallet using the default secret key
const ethWallet = getWallet('ethereum');
```

## Specialized Wallet Helpers

The `getWallet` function also comes with several attached helper methods for common use cases.

### `getWallet.getPermanentWallet()`

Some operations may require a more stable, long-term identity. For this, Blocklet Server provides a permanent secret key (`BLOCKLET_APP_PSK`). This helper creates a wallet using this permanent key.

```javascript Using the Permanent Wallet icon=logos:javascript
import getWallet from '@blocklet/sdk/lib/wallet';

const permanentWallet = getWallet.getPermanentWallet();
```

### `getWallet.getEthereumWallet(permanent)`

This is a convenient shortcut for creating an Ethereum wallet. It accepts an optional boolean parameter to specify whether to use the permanent secret key.

```javascript Creating Ethereum Wallets icon=logos:javascript
import getWallet from '@blocklet/sdk/lib/wallet';

// Get the standard Ethereum wallet (uses BLOCKLET_APP_SK)
const standardEthWallet = getWallet.getEthereumWallet();

// Get the permanent Ethereum wallet (uses BLOCKLET_APP_PSK)
const permanentEthWallet = getWallet.getEthereumWallet(true);
```

### `getWallet.getPkWallet()`

In some scenarios, you may need to work with a wallet's public key (`BLOCKLET_APP_PK`) to verify a signature without having access to the secret key. The `getPkWallet` helper creates a read-only wallet instance from the public key.

```javascript Creating a Wallet from a Public Key icon=logos:javascript
import getWallet from '@blocklet/sdk/lib/wallet';

// Create a wallet from the app's public key
const pkWallet = getWallet.getPkWallet();

// This wallet can be used to verify signatures, but not to sign data
// const isValid = pkWallet.verify('data', signature);
```

## Performance and Caching

For optimal performance, the `getWallet` utility includes a built-in LRU (Least Recently Used) cache. It caches up to four wallet instances based on their type and secret key, ensuring that repeated calls with the same parameters are extremely fast. This caching is handled automatically, so you don't need to implement your own.

---

With a solid understanding of wallet management, you're now equipped to handle cryptographic operations in your blocklet. The next logical step is to see how these wallets are used to secure your application.

<x-card data-title="Next Step: Security Utilities" data-icon="lucide:shield-check" data-href="/core-concepts/security" data-cta="Read More">
Learn how to use the wallet for encrypting data and signing API responses.
</x-card>