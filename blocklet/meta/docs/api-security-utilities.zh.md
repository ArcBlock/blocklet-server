# 安全工具

`@blocklet/meta` 库提供了一套用于处理加密操作的安全工具。这些函数对于确保数据的完整性和真实性至关重要，特别是用于签署和验证 Blocklet 元数据和 API 响应。它们构成了 Blocklet 生态系统内信任的基石。

本节涵盖了用于简单请求/响应签名以及更复杂的多重签名和链式信任验证方案的函数。

---

## signResponse

为任何可 JSON 序列化的对象添加加密签名。此函数使用稳定的字符串化方法（`json-stable-stringify`）来确保负载在用提供的钱包对象签名之前是一致的。生成的签名被添加到对象的 `$signature` 键下，使其易于验证。

### 参数

<x-field-group>
  <x-field data-name="data" data-type="T extends Record<string, any>" data-required="true" data-desc="要签名的数据对象。"></x-field>
  <x-field data-name="wallet" data-type="WalletObject" data-required="true" data-desc="一个用于生成签名的 `@ocap/wallet` 实例。"></x-field>
</x-field-group>

### 返回值

<x-field data-name="T & { $signature: string }" data-type="object" data-desc="原始对象增加了 `$signature` 属性，其中包含加密签名字符串。"></x-field>

### 示例

```javascript 为数据对象签名 icon=lucide:shield-check
import { signResponse } from '@blocklet/meta';
import { fromRandom } from '@ocap/wallet';

// 创建一个新钱包用于签名
const wallet = fromRandom();

const myData = {
  user: wallet.did,
  action: 'updateProfile',
  timestamp: Date.now(),
};

const signedData = signResponse(myData, wallet);

console.log(signedData);
/*
输出:
{
  user: 'z...',
  action: 'updateProfile',
  timestamp: 1678886400000,
  $signature: '...'
}
*/
```

---

## verifyResponse

验证先前已签名对象的签名，通常使用 `signResponse`。它会自动将负载与 `$signature` 属性分离，使用相同的稳定字符串化方法重新计算负载的哈希值，并使用提供的钱包的公钥对其进行验证。

### 参数

<x-field-group>
  <x-field data-name="signed" data-type="T & { $signature?: string }" data-required="true" data-desc="包含待验证 `$signature` 的数据对象。"></x-field>
  <x-field data-name="wallet" data-type="WalletObject" data-required="true" data-desc="一个与用于签名的密钥对相对应的 `@ocap/wallet` 实例。"></x-field>
</x-field-group>

### 返回值

<x-field data-name="Promise<boolean>" data-type="Promise<boolean>" data-desc="一个 promise，如果签名有效，则解析为 `true`，否则解析为 `false`。"></x-field>

### 示例

```javascript 验证已签名的对象 icon=lucide:verified
import { signResponse, verifyResponse } from '@blocklet/meta';
import { fromRandom } from '@ocap/wallet';

async function main() {
  const wallet = fromRandom();
  const myData = { user: wallet.did, action: 'updateProfile' };

  // 1. 对数据进行签名
  const signedData = signResponse(myData, wallet);
  console.log('Signed Data:', signedData);

  // 2. 验证有效签名
  const isValid = await verifyResponse(signedData, wallet);
  console.log(`Signature is valid: ${isValid}`); // 预期：true

  // 3. 篡改数据并再次尝试验证
  const tamperedData = { ...signedData, action: 'grantAdminAccess' };
  const isTamperedValid = await verifyResponse(tamperedData, wallet);
  console.log(`Tampered signature is valid: ${isTamperedValid}`); // 预期：false
}

main();
```

---

## verifyMultiSig

一个用于验证已被多方签名的 blocklet 元数据（`blocklet.yml`）的复杂工具。它按顺序处理签名，遵循每个签名中的 `excludes` 和 `appended` 字段，以正确重建各方签署的确切负载。这允许一个协作且可审计的元数据创作过程，其中不同的参与者（例如，开发者、发布者、市场）可以贡献并签署元数据。

该函数还处理委托签名，其中一个 DID 通过 JWT（签名对象中的 `delegation` 字段）授权另一个 DID 代表其签名。

### 多重签名验证流程

<!-- DIAGRAM_IMAGE_START:flowchart:4:3 -->
![Security Utilities](assets/diagram/security-utilities-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

### 参数

<x-field-group>
  <x-field data-name="blockletMeta" data-type="TBlockletMeta" data-required="true" data-desc="完整的 blocklet 元数据对象，包括 `signatures` 数组。"></x-field>
</x-field-group>

### 返回值

<x-field data-name="Promise<boolean>" data-type="Promise<boolean>" data-desc="一个 promise，如果链中的所有签名根据多重签名规则都有效，则解析为 `true`，否则解析为 `false`。"></x-field>

### 示例

```javascript 验证带有多重签名的 Blocklet 元数据 icon=lucide:pen-tool
import verifyMultiSig from '@blocklet/meta/lib/verify-multi-sig';

async function verifyMetadata() {
  const blockletMeta = {
    name: 'my-multi-sig-blocklet',
    version: '1.0.0',
    description: 'A blocklet with multiple authors.',
    author: 'did:abt:z1...',
    signatures: [
      {
        // 开发者的签名
        signer: 'did:abt:z1...',
        pk: '...',
        sig: '...',
        // 第一个签名者在添加 `signatures` 和 `publisherInfo` *之前*签署内容。
        excludes: ['signatures', 'publisherInfo'], 
      },
      {
        // 发布者的签名，他可能会添加自己的字段。
        signer: 'did:abt:z2...',
        pk: '...',
        sig: '...',
        // 发布者在签名前添加了此字段。
        appended: ['publisherInfo'], 
      },
    ],
    publisherInfo: {
      name: 'Blocklet Store',
      did: 'did:abt:z2...',
    },
  };

  const isValid = await verifyMultiSig(blockletMeta);
  console.log(`Multi-signature metadata is valid: ${isValid}`);
}

verifyMetadata();
```

---

## verifyVault

为“vault”验证一个信任链，它代表特定应用程序上下文的一系列所有权或控制权变更。vault 中的每个条目都必须按时间顺序排列并进行加密签名。对于第一个条目之后的条目，签名必须由前一个所有者批准，从而创建一个不可中断、可验证的链。此机制对于安全、基于 DID 的资产或管理角色的所有权转移等功能至关重要。

### Vault 信任链

```d2 Vault 验证流程
direction: down

initial-approver: {
  label: "初始批准人\n（例如，应用 DID）"
  shape: c4-person
}

vault-1: {
  label: "Vault 1\n所有者：用户 A"
  shape: rectangle
}

vault-2: {
  label: "Vault 2\n所有者：用户 B"
  shape: rectangle
}

vault-3: {
  label: "Vault 3\n所有者：用户 C"
  shape: rectangle
}

initial-approver -> vault-1: "1. 批准用户 A 为第一所有者"
vault-1 -> vault-2: "2. 用户 A 批准用户 B 为下一所有者"
vault-2 -> vault-3: "3. 用户 B 批准用户 C 为最终所有者"

```

### 参数

<x-field-group>
  <x-field data-name="vaults" data-type="VaultRecord[]" data-required="true" data-desc="一个 vault 记录数组，按 `at` 时间戳按时间顺序排序。"></x-field>
  <x-field data-name="appPid" data-type="string" data-required="true" data-desc="应用程序的 DID 或 vault 上下文的唯一标识符。"></x-field>
  <x-field data-name="throwOnError" data-type="boolean" data-default="false" data-required="false" data-desc="如果为 `true`，函数将在验证失败时抛出错误，而不是返回空字符串。"></x-field>
</x-field-group>

### 返回值

<x-field data-name="Promise<string>" data-type="Promise<string>" data-desc="一个 promise，解析为链中最终有效所有者的 DID。除非 `throwOnError` 为 `true`，否则失败时返回空字符串。"></x-field>

### 示例

```javascript 验证所有权 Vault icon=lucide:lock-keyhole
import { verifyVault } from '@blocklet/meta';

// 一个应用程序 vault 链的简化示例
async function checkVault() {
  const vaults = [
    {
      pk: 'pk_user1',
      did: 'did:abt:user1',
      at: 1672531200,
      sig: 'sig_user1_commit',
      approverPk: 'pk_app',
      approverDid: 'did:abt:app',
      approverSig: 'sig_app_approve_user1',
    },
    {
      pk: 'pk_user2',
      did: 'did:abt:user2',
      at: 1672534800,
      sig: 'sig_user2_commit',
      // 由前一个所有者（user1）批准
      approverSig: 'sig_user1_approve_user2', 
    },
  ];
  const appDid = 'did:abt:app';

  try {
    const finalOwnerDid = await verifyVault(vaults, appDid);
    if (finalOwnerDid) {
      console.log(`Vault is valid. Final owner: ${finalOwnerDid}`);
      // 预期：Vault is valid. Final owner: did:abt:user2
    } else {
      console.error('Vault verification failed.');
    }
  } catch (error) {
    console.error('Vault verification threw an error:', error.message);
  }
}

checkVault();
```