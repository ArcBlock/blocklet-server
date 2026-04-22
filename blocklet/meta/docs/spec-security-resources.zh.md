# 安全与资源

安全和资源管理对于创建可信赖且可互操作的 Blocklet至关重要。`blocklet.yml` 规范为此提供了两个关键字段：`signatures` 用于确保元数据的完整性和真实性，`resource` 用于定义和捆绑共享资产，以便与其他 Blocklet 组合。

本节介绍了这些字段的规范，并介绍了由 `@blocklet/meta` 提供的用于处理它们的使用工具函数。

## 签名

`signatures` 字段包含一个数字签名数组，为 Blocklet 的元数据创建一个可验证的信任链。此机制可防止未经授权的修改，并确认发布者（如开发者和 Blocklet Store）的身份。链中的每个签名都会对核心元数据以及任何后续签名进行加密签名，确保整个修改历史都是防篡改的。

### 多重签名流程

发布过程中的典型多重签名工作流包括：开发者对初始元数据进行签名，然后由 Blocklet Store 验证该签名，添加分发信息，并附加自己的签名。

<!-- DIAGRAM_IMAGE_START:flowchart:16:9 -->
![Security & Resources](assets/diagram/security-resources-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

### 规范

`signatures` 字段是一个签名对象数组。每个对象具有以下结构：

```yaml blocklet.yml icon=lucide:shield-check
signatures:
  - type: 'ED25519'
    name: 'dev'
    signer: 'z8qa...'
    pk: 'z28n...'
    created: '2023-10-27T10:00:00.000Z'
    sig: 'z24e...'
    excludes: []
  - type: 'ED25519'
    name: 'store'
    signer: 'z8qR...'
    pk: 'z29c...'
    created: '2023-10-27T10:05:00.000Z'
    sig: 'z25a...'
    appended:
      - 'dist'
      - 'stats'
```

<x-field-group>
  <x-field data-name="type" data-type="string" data-required="true" data-desc="用于签名的加密算法（例如，'ED25519'）。"></x-field>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="签名的角色的可读名称（例如，'dev'、'store'）。"></x-field>
  <x-field data-name="signer" data-type="string" data-required="true" data-desc="创建签名的实体的 DID。"></x-field>
  <x-field data-name="pk" data-type="string" data-required="true" data-desc="与签名者 DID 对应的公钥。"></x-field>
  <x-field data-name="created" data-type="string" data-required="true" data-desc="创建签名时的 ISO 8601 时间戳。"></x-field>
  <x-field data-name="sig" data-type="string" data-required="true" data-desc="base58 编码的签名字符串。"></x-field>
  <x-field data-name="excludes" data-type="string[]" data-required="false" data-desc="一个顶级字段名称数组，用于在签名之前从元数据中排除。"></x-field>
  <x-field data-name="appended" data-type="string[]" data-required="false" data-desc="一个顶级字段名称数组，由该签名者添加到元数据中。下一个签名者将使用此信息来正确验证上一个签名。"></x-field>
  <x-field data-name="delegatee" data-type="string" data-required="false" data-desc="如果签名是通过委托进行的，则为受托人的 DID。"></x-field>
  <x-field data-name="delegateePk" data-type="string" data-required="false" data-desc="受托人的公钥。"></x-field>
  <x-field data-name="delegation" data-type="string" data-required="false" data-desc="授权 `delegatee` 代表 `signer` 签名的委托令牌 (JWT)。"></x-field>
</x-field-group>

## 资源管理

`resource` 字段允许 Blocklet 声明其可以导出的共享数据类型，并捆绑来自其他 Blocklet 的资源。这是实现一个可组合、可互操作的生态系统的基础，在该生态系统中，Blocklet 可以无缝共享数据和功能。

### 规范

```yaml blocklet.yml icon=lucide:boxes
resource:
  exportApi: '/api/resources'
  types:
    - type: 'posts'
      description: 'A collection of blog posts.'
    - type: 'images'
      description: 'A gallery of images.'
  bundles:
    - did: 'z2qa...'
      type: 'user-profiles'
      public: true
```

<x-field data-name="resource" data-type="object">
  <x-field-desc markdown>包含用于定义可导出类型和捆绑资源的属性。</x-field-desc>
  <x-field data-name="exportApi" data-type="string" data-required="false" data-desc="一个 API 端点的路径，其他 Blocklet 可以调用该端点以获取导出的资源。"></x-field>
  <x-field data-name="types" data-type="object[]" data-required="false" data-desc="此 Blocklet 可以导出的资源类型数组。最多限制为 10 种类型。">
    <x-field data-name="type" data-type="string" data-required="true" data-desc="资源类型的唯一标识符（例如，'posts'、'products'）。"></x-field>
    <x-field data-name="description" data-type="string" data-required="false" data-desc="资源类型的可读描述。"></x-field>
  </x-field>
  <x-field data-name="bundles" data-type="object[]" data-required="false" data-desc="从其他 Blocklet 导入的资源包数组。">
    <x-field data-name="did" data-type="string" data-required="true" data-desc="要包含的资源包的 DID。"></x-field>
    <x-field data-name="type" data-type="string" data-required="true" data-desc="从源捆绑的特定资源类型。"></x-field>
    <x-field data-name="public" data-type="boolean" data-required="false" data-desc="如果为 `true`，表示捆绑的资源是公开可访问的。"></x-field>
  </x-field>
</x-field>

## 相关 API 工具

`@blocklet/meta` 库提供了一套函数来处理 Blocklet 元数据和通信的安全方面。有关完整详细信息，请参阅 [安全工具 API 参考](./api-security-utilities.md)。

### 验证元数据签名

`verifyMultiSig` 函数是确保 `blocklet.yml` 文件完整性的主要工具。它处理 `signatures` 数组，验证链中的每个签名，以确认元数据未被篡改，并由声明的实体签名。

```javascript verifyMultiSig Example icon=lucide:shield-check
import verifyMultiSig from '@blocklet/meta/lib/verify-multi-sig';
import { TBlockletMeta } from '@blocklet/meta/lib/types';

async function checkMetadata(meta: TBlockletMeta) {
  const isValid = await verifyMultiSig(meta);
  if (isValid) {
    console.log('Blocklet 元数据是真实且未被篡改的。');
  } else {
    console.error('警告：Blocklet 元数据验证失败！');
  }
}
```

### 签名和验证 API 响应

为了保护 Blocklet 之间或 Blocklet 与客户端之间的通信安全，您可以使用 `signResponse` 和 `verifyResponse` 函数。这些辅助函数使用钱包对象对任何可 JSON 序列化的数据进行加密签名和验证，确保数据的完整性和发送者的真实性。

```javascript signResponse Example icon=lucide:pen-tool
import { signResponse, verifyResponse } from '@blocklet/meta/lib/security';
import { fromRandom } from '@ocap/wallet';

async function secureCommunicate() {
  const wallet = fromRandom(); // 你的 Blocklet 的钱包
  const data = { message: 'hello world', timestamp: Date.now() };

  // 签名
  const signedData = signResponse(data, wallet);
  console.log('签名后的数据:', signedData);

  // 验证
  const isVerified = await verifyResponse(signedData, wallet);
  console.log('验证结果:', isVerified); // true
}
```