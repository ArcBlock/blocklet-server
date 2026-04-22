# DID 与 Wallet 实用工具

本节提供了与去中心化标识符 (DID) 和加密钱包相关的实用函数的详细参考。这些辅助函数对于管理 Blocklet 的身份、生成特定于应用的钱包以及从用户会话中提取身份信息至关重要。

## Blocklet 身份与 Wallet 生成

这些函数用于创建和管理 Blocklet 自身的核心身份和加密钱包。

### toBlockletDid

将字符串或 Buffer 转换为有效的 Blocklet DID。如果输入已经是有效的 DID，则原样返回。否则，它会从输入中生成一个类型为 `ROLE_ANY` 的 DID。

**参数**

<x-field-group>
  <x-field data-name="name" data-type="string | Buffer" data-required="true" data-desc="要转换为 DID 的字符串或 Buffer。"></x-field>
</x-field-group>

**返回**

<x-field-group>
  <x-field data-name="did" data-type="string" data-desc="一个有效的 DID。"></x-field>
</x-field-group>

**示例**

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

为 Blocklet 生成一个钱包对象。这对于任何需要签名的操作（例如，向其他服务进行身份验证或创建可验证凭证）都是一个关键函数。该钱包可以从 Blocklet 的 DID 与节点的密钥组合派生，也可以直接从作为环境变量提供的自定义密钥派生。

**参数**

<x-field-group>
  <x-field data-name="didOrSk" data-type="string" data-required="true" data-desc="Blocklet 的 DID 或自定义密钥。如果它不是一个有效的 DID，则被视为密钥。"></x-field>
  <x-field data-name="nodeSk" data-type="string" data-required="false" data-desc="如果 didOrSk 是 DID，则此项为必需。底层 Blocklet Server 节点的密钥。"></x-field>
  <x-field data-name="type" data-type="DIDType | 'default' | 'eth' | 'ethereum'" data-required="false" data-desc="要生成的钱包类型。支持 'ethereum' 或 'eth' 用于与以太坊兼容的钱包。默认为标准的 ArcBlock 类型。"></x-field>
  <x-field data-name="index" data-type="number" data-required="false" data-default="0" data-desc="派生索引，在从 DID 和节点 SK 生成钱包时使用。"></x-field>
</x-field-group>

**返回**

<x-field-group>
  <x-field data-name="wallet" data-type="WalletObject" data-desc="一个 OCAP 钱包对象，包含地址、公钥、密钥和签名方法。"></x-field>
</x-field-group>

**示例：从 DID 和节点 SK 生成**

```javascript Generating from DID icon=mdi:wallet
import getApplicationWallet from '@blocklet/meta/lib/wallet';

const blockletDid = 'z8iZ...'; // The Blocklet's DID from its metadata
const nodeSk = '...'; // The secret key of the Blocklet Server node

const wallet = getApplicationWallet(blockletDid, nodeSk);

console.log('Wallet Address:', wallet.address);
console.log('Wallet Type:', wallet.type);
```

**示例：从自定义 SK 生成**

```javascript Generating from Custom SK icon=mdi:key-variant
import getApplicationWallet from '@blocklet/meta/lib/wallet';

// Typically loaded from process.env.BLOCKLET_APP_SK
const customSk = '...'; 
const wallet = getApplicationWallet(customSk);

console.log('Wallet Address:', wallet.address);
```

### getBlockletInfo

这是一个高级实用程序，它解析 Blocklet 的状态对象以提取一套全面的元数据，并可选择性地生成其钱包。它整合了来自 `blocklet.yml`、环境变量和服务器配置的信息。

**参数**

<x-field-group>
  <x-field data-name="state" data-type="BlockletState" data-required="true" data-desc="Blocklet 的状态对象，通常在 Blocklet 的后端钩子或路由中可用。"></x-field>
  <x-field data-name="nodeSk" data-type="string" data-required="false" data-desc="Blocklet Server 节点的密钥。如果 returnWallet 为 true 且环境中未设置自定义 SK，则此项为必需。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="配置选项。">
    <x-field data-name="returnWallet" data-type="boolean" data-required="false" data-default="true" data-desc="如果为 true，该函数将生成并包含 wallet 和 permanentWallet 对象。"></x-field>
  </x-field>
</x-field-group>

**返回**

<x-field-group>
  <x-field data-name="info" data-type="object" data-desc="一个包含 Blocklet 信息的对象。">
    <x-field data-name="did" data-type="string" data-desc="来自 meta.did 的 Blocklet DID。"></x-field>
    <x-field data-name="name" data-type="string" data-desc="Blocklet 的显示名称。"></x-field>
    <x-field data-name="version" data-type="string" data-desc="Blocklet 版本。"></x-field>
    <x-field data-name="description" data-type="string" data-desc="Blocklet 描述。"></x-field>
    <x-field data-name="appUrl" data-type="string" data-desc="配置的应用程序 URL。"></x-field>
    <x-field data-name="secret" data-type="string" data-desc="用于会话管理的派生密钥哈希。"></x-field>
    <x-field data-name="wallet" data-type="WalletObject | null" data-desc="主应用程序钱包（如果 returnWallet 为 false，则为 null）。"></x-field>
    <x-field data-name="permanentWallet" data-type="WalletObject | null" data-desc="如果设置了 BLOCKLET_APP_PSK，则为永久钱包，否则与 wallet 相同。"></x-field>
    <x-field data-name="passportColor" data-type="string" data-desc="通行证的颜色方案。"></x-field>
    <x-field data-name="tenantMode" data-type="string" data-desc="应用程序的租户模式。"></x-field>
  </x-field>
</x-field-group>

**示例**

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

## 用户身份与账户辅助函数

这些实用函数旨在从 `UserInfo` 对象中轻松提取 DID 和账户信息，该对象通常在 Blocklet 的已认证路由中的 `req.user` 中可用。

### User Info 实用函数

一组用于访问用户身份配置文件不同部分的辅助函数。

| 函数 | 描述 |
|---|---|
| `getPermanentDid(user)` | 返回用户的主要永久 DID。 |
| `getConnectedAccounts(user)` | 返回连接到用户配置文件的所有账户的数组。 |
| `getConnectedDids(user)` | 返回所有已连接账户的 DID 数组。 |
| `getWallet(user)` | 查找并返回用户连接的钱包账户对象。 |
| `getWalletDid(user)` | 一个便捷函数，用于获取用户连接的钱包的 DID。 |
| `getSourceProvider(user)` | 返回用户在当前会话中使用的提供商（例如 `wallet`）。 |
| `getSourceProviders(user)` | 返回用户已连接的所有提供商的数组。 |

**示例**

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

这些实用工具为在您的 Blocklet 中管理身份和安全提供了基础构建块。要了解如何使用这些钱包进行数据签名和验证，请继续阅读[安全实用工具](./api-security-utilities.md)部分。