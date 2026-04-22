# DID & Wallet Utilities

This section provides a detailed reference for utility functions related to Decentralized Identifiers (DIDs) and cryptographic wallets. These helpers are essential for managing a Blocklet's identity, generating application-specific wallets, and extracting identity information from user sessions.

## Blocklet Identity & Wallet Generation

These functions are used to create and manage the core identity and cryptographic wallet of the Blocklet itself.

### toBlockletDid

Converts a string or a Buffer into a valid Blocklet DID. If the input is already a valid DID, it is returned as is. Otherwise, it generates a DID of type `ROLE_ANY` from the input.

**Parameters**

<x-field-group>
  <x-field data-name="name" data-type="string | Buffer" data-required="true" data-desc="The string or buffer to be converted into a DID."></x-field>
</x-field-group>

**Returns**

<x-field-group>
  <x-field data-name="did" data-type="string" data-desc="A valid DID."></x-field>
</x-field-group>

**Example**

```javascript toBlockletDid Example icon=mdi:identifier
import toBlockletDid from '@blocklet/meta/lib/did';

// Generate a DID from a string name
const blockletName = 'my-awesome-blocklet';
const did = toBlockletDid(blockletName);

console.log(did); // e.g., 'z8ia1m4f5z3a...'

// It also works with existing valid DIDs
const existingDid = 'z8iZge7d4a4s9d5z...';
const result = toBlockletDid(existingDid);

console.log(result === existingDid); // true
```

### getApplicationWallet

Generates a wallet object for the Blocklet. This is a critical function for any operation that requires signing, such as authenticating with other services or creating verifiable credentials. The wallet can be derived either from the Blocklet's DID in combination with the node's secret key or directly from a custom secret key provided as an environment variable.

**Parameters**

<x-field-group>
  <x-field data-name="didOrSk" data-type="string" data-required="true" data-desc="The Blocklet's DID or a custom secret key. If it's not a valid DID, it's treated as a secret key."></x-field>
  <x-field data-name="nodeSk" data-type="string" data-required="false" data-desc="Required if didOrSk is a DID. The secret key of the underlying Blocklet Server node."></x-field>
  <x-field data-name="type" data-type="DIDType | 'default' | 'eth' | 'ethereum'" data-required="false" data-desc="The type of wallet to generate. Supports 'ethereum' or 'eth' for Ethereum-compatible wallets. Defaults to the standard ArcBlock type."></x-field>
  <x-field data-name="index" data-type="number" data-required="false" data-default="0" data-desc="The derivation index, used when generating the wallet from a DID and node SK."></x-field>
</x-field-group>

**Returns**

<x-field-group>
  <x-field data-name="wallet" data-type="WalletObject" data-desc="An OCAP wallet object with address, publicKey, secretKey, and signing methods."></x-field>
</x-field-group>

**Example: Generating from DID and Node SK**

```javascript Generating from DID icon=mdi:wallet
import getApplicationWallet from '@blocklet/meta/lib/wallet';

const blockletDid = 'z8iZ...'; // The Blocklet's DID from its metadata
const nodeSk = '...'; // The secret key of the Blocklet Server node

const wallet = getApplicationWallet(blockletDid, nodeSk);

console.log('Wallet Address:', wallet.address);
console.log('Wallet Type:', wallet.type);
```

**Example: Generating from a Custom SK**

```javascript Generating from Custom SK icon=mdi:key-variant
import getApplicationWallet from '@blocklet/meta/lib/wallet';

// Typically loaded from process.env.BLOCKLET_APP_SK
const customSk = '...'; 
const wallet = getApplicationWallet(customSk);

console.log('Wallet Address:', wallet.address);
```

### getBlockletInfo

This is a high-level utility that parses a Blocklet's state object to extract a comprehensive set of metadata and, optionally, generate its wallet. It consolidates information from `blocklet.yml`, environment variables, and server configurations.

**Parameters**

<x-field-group>
  <x-field data-name="state" data-type="BlockletState" data-required="true" data-desc="The Blocklet's state object, typically available in a Blocklet's backend hooks or routes."></x-field>
  <x-field data-name="nodeSk" data-type="string" data-required="false" data-desc="The secret key of the Blocklet Server node. Required if returnWallet is true and a custom SK is not set in the environment."></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="Configuration options.">
    <x-field data-name="returnWallet" data-type="boolean" data-required="false" data-default="true" data-desc="If true, the function will generate and include the wallet and permanentWallet objects."></x-field>
  </x-field>
</x-field-group>

**Returns**

<x-field-group>
  <x-field data-name="info" data-type="object" data-desc="An object containing the Blocklet's information.">
    <x-field data-name="did" data-type="string" data-desc="Blocklet's DID from meta.did."></x-field>
    <x-field data-name="name" data-type="string" data-desc="Display name of the Blocklet."></x-field>
    <x-field data-name="version" data-type="string" data-desc="Blocklet version."></x-field>
    <x-field data-name="description" data-type="string" data-desc="Blocklet description."></x-field>
    <x-field data-name="appUrl" data-type="string" data-desc="The configured application URL."></x-field>
    <x-field data-name="secret" data-type="string" data-desc="A derived secret hash for session management."></x-field>
    <x-field data-name="wallet" data-type="WalletObject | null" data-desc="The primary application wallet (null if returnWallet is false)."></x-field>
    <x-field data-name="permanentWallet" data-type="WalletObject | null" data-desc="A permanent wallet if BLOCKLET_APP_PSK is set, otherwise same as wallet."></x-field>
    <x-field data-name="passportColor" data-type="string" data-desc="Color scheme for the passport."></x-field>
    <x-field data-name="tenantMode" data-type="string" data-desc="The tenant mode of the application."></x-field>
  </x-field>
</x-field-group>

**Example**

```javascript getBlockletInfo Example icon=mdi:information
import getBlockletInfo from '@blocklet/meta/lib/info';

// Assuming 'blockletState' and 'nodeSk' are available in your context

try {
  const info = getBlockletInfo(blockletState, nodeSk);

  console.log(`Blocklet Name: ${info.name}`);
  console.log(`Blocklet DID: ${info.did}`);
  console.log(`App Wallet Address: ${info.wallet.address}`);

  // When wallet is not needed
  const infoWithoutWallet = getBlockletInfo(blockletState, nodeSk, { returnWallet: false });
  console.log(infoWithoutWallet.wallet); // null
} catch (error) {
  console.error('Failed to get Blocklet info:', error.message);
}
```

## User Identity & Account Helpers

These utility functions are designed to easily extract DID and account information from a `UserInfo` object, which is typically available in `req.user` within an authenticated route in a Blocklet.

### User Info Utility Functions

A collection of helpers to access different parts of a user's identity profile.

| Function | Description |
|---|---|
| `getPermanentDid(user)` | Returns the user's primary, permanent DID. |
| `getConnectedAccounts(user)` | Returns an array of all accounts connected to the user's profile. |
| `getConnectedDids(user)` | Returns an array of DIDs from all connected accounts. |
| `getWallet(user)` | Finds and returns the user's connected wallet account object. |
| `getWalletDid(user)` | A convenience function to get the DID of the user's connected wallet. |
| `getSourceProvider(user)` | Returns the provider the user used for the current session (e.g., `wallet`). |
| `getSourceProviders(user)` | Returns an array of all providers the user has connected. |

**Example**

```javascript User Info Helpers icon=mdi:account-details
import {
  getPermanentDid,
  getConnectedDids,
  getWalletDid,
  getSourceProvider,
} from '@blocklet/meta/lib/did-utils';

// Mock UserInfo object (in a real app, this would be req.user)
const mockUser = {
  did: 'z...userPermanentDid',
  sourceProvider: 'wallet',
  connectedAccounts: [
    {
      provider: 'wallet',
      did: 'z...userWalletDid',
      // ... other wallet account details
    },
    {
      provider: 'github',
      did: 'z...userGithubDid',
      // ... other github account details
    },
  ],
  // ... other UserInfo properties
};

const permanentDid = getPermanentDid(mockUser);
console.log('Permanent DID:', permanentDid); // 'z...userPermanentDid'

const walletDid = getWalletDid(mockUser);
console.log('Wallet DID:', walletDid); // 'z...userWalletDid'

const allDids = getConnectedDids(mockUser);
console.log('All Connected DIDs:', allDids); // ['z...userWalletDid', 'z...userGithubDid']

const loginProvider = getSourceProvider(mockUser);
console.log('Logged in with:', loginProvider); // 'wallet'
```

---

These utilities provide the fundamental building blocks for managing identity and security within your Blocklet. To learn how to use these wallets for signing and verifying data, proceed to the [Security Utilities](./api-security-utilities.md) section.
