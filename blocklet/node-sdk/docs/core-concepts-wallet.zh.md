# 钱包管理

在 Blocklet SDK 中，钱包是一个基本的加密对象，代表了你的应用程序的身份。它对于签署数据、验证请求以及与区块链网络交互至关重要。SDK 提供了一个强大而便捷的工具 `getWallet`，可以直接从你的应用程序的环境变量中创建和管理钱包实例。

无论你使用的是 ArcBlock 的原生 DID 还是以太坊，该工具都抽象了处理不同加密曲线和密钥格式的复杂性。钱包的密钥来源于 Blocklet Server 设置的环境变量，你可以在[配置与环境](./core-concepts-configuration.md)文档中了解更多信息。

## getWallet 工具

`getWallet` 函数是创建 `WalletObject` 的主要方法。默认情况下，它使用应用程序的标准密钥（`BLOCKLET_APP_SK`）和从环境中配置的链类型（`CHAIN_TYPE` 或 `BLOCKLET_WALLET_TYPE`）。

```javascript Basic Usage icon=logos:javascript
import getWallet from '@blocklet/sdk/lib/wallet';

// Create a wallet instance using environment variables
const appWallet = getWallet();

// Now you can use the wallet to sign data
const signature = appWallet.sign('data to be signed');
```

该工具足够智能，可以根据配置处理不同的区块链类型。

### 参数

虽然 `getWallet` 可以直接使用环境变量，但你也可以通过传递参数来覆盖其行为。

<x-field data-name="type" data-type="DIDTypeShortcut" data-required="false" data-desc="钱包的 DID 类型。可以是 'ethereum' 或 'arcblock'（或 'default'）。默认为 CHAIN_TYPE 或 BLOCKLET_WALLET_TYPE 环境变量的值。"></x-field>

<x-field data-name="appSk" data-type="string" data-required="false" data-desc="应用程序的十六进制格式密钥。默认为 BLOCKLET_APP_SK 环境变量的值。"></x-field>


### 为特定链创建钱包

你可以通过提供 `type` 参数来明确请求特定链类型的钱包。

```javascript Creating an Ethereum Wallet icon=logos:javascript
import getWallet from '@blocklet/sdk/lib/wallet';

// Explicitly create an Ethereum wallet using the default secret key
const ethWallet = getWallet('ethereum');
```

## 专门的钱包辅助工具

`getWallet` 函数还附带了几个用于常见用例的辅助方法。

### `getWallet.getPermanentWallet()`

某些操作可能需要更稳定、长期的身份。为此，Blocklet Server 提供了一个永久密钥（`BLOCKLET_APP_PSK`）。这个辅助工具使用此永久密钥创建一个钱包。

```javascript Using the Permanent Wallet icon=logos:javascript
import getWallet from '@blocklet/sdk/lib/wallet';

const permanentWallet = getWallet.getPermanentWallet();
```

### `getWallet.getEthereumWallet(permanent)`

这是创建以太坊钱包的便捷快捷方式。它接受一个可选的布尔参数，用于指定是否使用永久密钥。

```javascript Creating Ethereum Wallets icon=logos:javascript
import getWallet from '@blocklet/sdk/lib/wallet';

// Get the standard Ethereum wallet (uses BLOCKLET_APP_SK)
const standardEthWallet = getWallet.getEthereumWallet();

// Get the permanent Ethereum wallet (uses BLOCKLET_APP_PSK)
const permanentEthWallet = getWallet.getEthereumWallet(true);
```

### `getWallet.getPkWallet()`

在某些情况下，你可能需要使用钱包的公钥（`BLOCKLET_APP_PK`）来验证签名，而无需访问密钥。`getPkWallet` 辅助工具从公钥创建一个只读的钱包实例。

```javascript Creating a Wallet from a Public Key icon=logos:javascript
import getWallet from '@blocklet/sdk/lib/wallet';

// Create a wallet from the app's public key
const pkWallet = getWallet.getPkWallet();

// This wallet can be used to verify signatures, but not to sign data
// const isValid = pkWallet.verify('data', signature);
```

## 性能与缓存

为实现最佳性能，`getWallet` 工具内置了一个 LRU（最近最少使用）缓存。它根据钱包的类型和密钥最多缓存四个钱包实例，确保使用相同参数的重复调用速度极快。此缓存是自动处理的，因此你无需自行实现。

---

在对钱包管理有了扎实的理解之后，你现在已经具备了在你的 blocklet 中处理加密操作的能力。下一个合理的步骤是了解如何使用这些钱包来保护你的应用程序。

<x-card data-title="下一步：安全工具" data-icon="lucide:shield-check" data-href="/core-concepts/security" data-cta="阅读更多">
了解如何使用钱包加密数据和签署 API 响应。
</x-card>