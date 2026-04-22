# 解析与验证

本节为用于读取、解析和验证 `blocklet.yml` 文件的函数提供了详细参考。这些实用工具是与 [Blocklet 规范](./spec.md) 交互的编程接口，可确保你的 blocklet 元数据正确、完整，并可供 Blocklet Server 和其他工具使用。

这些函数对于构建与 blocklet 交互的工具、在 CI/CD 管道中验证配置或以编程方式读取 blocklet 元数据至关重要。

## `parse`

`parse` 函数是从文件系统读取 blocklet 元数据的主要实用工具。它在给定目录中定位 `blocklet.yml`（或 `blocklet.yaml`）文件，读取其内容，应用一系列兼容性修复，并根据官方模式验证最终对象。

### 工作流

解析过程遵循几个关键步骤，以确保生成有效且一致的元数据对象。

<!-- DIAGRAM_IMAGE_START:flowchart:4:3 -->
![Parsing & Validation](assets/diagram/parsing-validation-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

### 签名

```typescript
function parse(
  dir: string,
  options?: {
    ensureFiles?: boolean;
    ensureDist?: boolean;
    ensureComponentStore?: boolean;
    extraRawAttrs?: any;
    schemaOptions?: any;
    defaultStoreUrl?: string | ((component: TComponent) => string);
    fix?: boolean;
  }
): TBlockletMeta;
```

### 参数

<x-field-group>
  <x-field data-name="dir" data-type="string" data-required="true" data-desc="包含 blocklet.yml 文件的 blocklet 目录路径。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="可选的配置对象。">
    <x-field data-name="ensureFiles" data-type="boolean" data-default="false" data-desc="如果为 true，则验证 `logo` 和 `files` 字段中列出的文件是否实际存在于文件系统中。"></x-field>
    <x-field data-name="ensureDist" data-type="boolean" data-default="false" data-desc="如果为 true，则要求 `dist` 字段在元数据中存在且有效。"></x-field>
    <x-field data-name="ensureComponentStore" data-type="boolean" data-default="true" data-desc="如果为 true，则确保任何来自 store 的组件都定义了 `source.store` URL。"></x-field>
    <x-field data-name="extraRawAttrs" data-type="object" data-desc="一个包含额外属性的对象，这些属性将在验证前合并到元数据中。可用于增强元数据，例如在注册表中。"></x-field>
    <x-field data-name="schemaOptions" data-type="object" data-desc="传递给底层 Joi 模式验证器的附加选项。"></x-field>
    <x-field data-name="defaultStoreUrl" data-type="string | function" data-desc="一个 URL，用作未指定 store 的组件的默认 store。可以是一个静态字符串或一个返回字符串的函数。"></x-field>
    <x-field data-name="fix" data-type="boolean" data-default="true" data-desc="如果为 true，则对元数据应用自动修复（例如，对 `person`、`repository`、`keywords`）。"></x-field>
  </x-field>
</x-field-group>

### 返回值

返回一个经过验证的 `TBlockletMeta` 对象。如果 `blocklet.yml` 文件未找到、是无效的 YAML 或模式验证失败，该函数将抛出一个带有描述性消息的 `Error`。

### 示例用法

```javascript parse-example.js icon=logos:javascript
import path from 'path';
import parse from '@blocklet/meta/lib/parse';

const blockletDir = path.join(__dirname, 'my-blocklet');

try {
  const meta = parse(blockletDir, {
    ensureFiles: true, // 确保 logo 存在
  });
  console.log('成功解析 blocklet：', meta.name, meta.version);
} catch (error) {
  console.error('解析 blocklet.yml 失败：', error.message);
}
```

---

## `validateMeta`

当你已经有一个 blocklet 元数据对象（例如，来自数据库或 API 响应）并且需要根据 blocklet 模式对其进行验证而无需从文件系统读取时，请使用 `validateMeta`。

### 签名

```typescript
function validateMeta(
  meta: any,
  options?: {
    ensureFiles?: boolean;
    ensureDist?: boolean;
    ensureComponentStore?: boolean;
    ensureName?: boolean;
    skipValidateDidName?: boolean;
    schemaOptions?: any;
  }
): TBlockletMeta;
```

### 参数

<x-field-group>
  <x-field data-name="meta" data-type="any" data-required="true" data-desc="要验证的原始 blocklet 元数据对象。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="一个可选的配置对象，类似于 parse。">
    <x-field data-name="ensureFiles" data-type="boolean" data-default="false" data-desc="如果为 true，则验证 `logo` 和 `files` 字段中列出的文件是否实际存在于文件系统中。"></x-field>
    <x-field data-name="ensureDist" data-type="boolean" data-default="false" data-desc="如果为 true，则要求 `dist` 字段在元数据中存在且有效。"></x-field>
    <x-field data-name="ensureComponentStore" data-type="boolean" data-default="true" data-desc="如果为 true，则确保任何来自 store 的组件都定义了 `source.store` URL。"></x-field>
    <x-field data-name="ensureName" data-type="boolean" data-default="false" data-desc="如果为 true，则要求 `name` 字段存在。"></x-field>
    <x-field data-name="skipValidateDidName" data-type="boolean" data-default="false" data-desc="如果为 true，并且 blocklet 名称是 DID 格式，它将跳过 DID 类型验证。"></x-field>
    <x-field data-name="schemaOptions" data-type="object" data-desc="传递给底层 Joi 模式验证器的附加选项。"></x-field>
  </x-field>
</x-field-group>

### 返回值

返回经过验证和清理的 `TBlockletMeta` 对象。如果元数据对象验证失败，则会抛出 `Error`。

### 示例用法

```javascript validate-example.js icon=logos:javascript
import validateMeta from '@blocklet/meta/lib/validate';

const rawMeta = {
  name: 'my-first-blocklet',
  version: '1.0.0',
  description: 'A simple blocklet.',
  did: 'z8iZpA529j4Jk1iA...',
  // ... 其他属性
};

try {
  const validatedMeta = validateMeta(rawMeta, { ensureName: true });
  console.log('元数据有效：', validatedMeta.title);
} catch (error) {
  console.error('无效的 blocklet 元数据：', error.message);
}
```

---

## `fixAndValidateService`

这是一个专门的辅助函数，用于验证元数据中 `interfaces` 数组每个条目内的 `services` 配置。主 `parse` 和 `validateMeta` 函数在内部调用此函数，但它也被导出，以备你可能需要独立处理服务配置的情况。

### 签名

```typescript
function fixAndValidateService(meta: TBlockletMeta): TBlockletMeta;
```

### 参数

<x-field data-name="meta" data-type="TBlockletMeta" data-required="true" data-desc="包含要验证的服务配置的 blocklet 元数据对象。"></x-field>

### 返回值

返回输入的 `TBlockletMeta` 对象，其服务配置已经过验证，并可能使用默认值进行了修改。如果任何服务配置无效，则会抛出 `Error`。

### 示例用法

```javascript service-validate-example.js icon=logos:javascript
import { fixAndValidateService } from '@blocklet/meta/lib/validate';

const meta = {
  // ... 其他元数据属性
  interfaces: [
    {
      type: 'web',
      name: 'publicUrl',
      path: '/',
      services: [
        {
          name: '@blocklet/service-auth',
          config: {
            // 认证服务配置
          },
        },
      ],
    },
  ],
};

try {
  const metaWithValidatedServices = fixAndValidateService(meta);
  console.log('服务配置有效。');
} catch (error) {
  console.error('无效的服务配置：', error.message);
}
```

---

## `validateBlockletEntry`

此实用函数验证 blocklet 的入口点（`main` 属性），以确保其针对其组类型（`dapp` 或 `static`）进行了正确配置。对于 `dapp`，它会检查所需文件是否存在或 `engine` 配置是否有效。对于 `static` blocklet，它会确保 `main` 目录存在。这是在解析后执行以确认 blocklet 可执行的关键检查。

### 签名

```typescript
function validateBlockletEntry(dir: string, meta: TBlockletMeta): void;
```

### 参数

<x-field-group>
  <x-field data-name="dir" data-type="string" data-required="true" data-desc="blocklet 包的根目录。"></x-field>
  <x-field data-name="meta" data-type="TBlockletMeta" data-required="true" data-desc="已解析并验证的 blocklet 元数据对象。"></x-field>
</x-field-group>

### 返回值

此函数不返回值。如果入口点验证失败，它将抛出一个 `Error`，并附带解释问题的消息。

### 示例用法

```javascript entry-validate-example.js icon=logos:javascript
import path from 'path';
import parse from '@blocklet/meta/lib/parse';
import validateBlockletEntry from '@blocklet/meta/lib/entry';

const blockletDir = path.join(__dirname, 'my-dapp');

try {
  const meta = parse(blockletDir);
  validateBlockletEntry(blockletDir, meta);
  console.log('Blocklet 入口点有效。');
} catch (error) {
  console.error('验证失败：', error.message);
}
```

---

现在你已经了解如何解析和验证元数据，你可能希望探索用于从远程源获取元数据的辅助函数。请继续阅读 [元数据辅助函数](./api-metadata-helpers.md) 部分以了解更多信息。