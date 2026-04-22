# 文件实用工具

该模块提供了一组用于与文件系统上的 `blocklet.yml` 文件进行交互的底层函数。它包括用于定位、读取和写入元数据文件的实用工具，以及自定义的 [Joi](https://joi.dev/) 扩展，以简化文件路径和 DID 的验证。

## `blocklet.yml` 文件处理器

这些函数是任何需要以编程方式读取或修改 blocklet 元数据文件的工具的核心构建块。

### select(dir, options?)

`select` 函数智能地在指定目录中定位正确的 `blocklet.yml` 或 `blocklet.yaml` 文件。

**参数**

<x-field-group>
  <x-field data-name="dir" data-type="string" data-required="true" data-desc="blocklet 元数据文件所在目录的绝对路径。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="select 函数的配置选项。">
    <x-field data-name="throwOnError" data-type="boolean" data-default="true" data-required="false" data-desc="如果为 true，在未找到元数据文件时将抛出错误。如果为 false，则返回空字符串。"></x-field>
  </x-field>
</x-field-group>

**返回**

<x-field data-name="metaFilePath" data-type="string" data-desc="找到的元数据文件的完整绝对路径，如果未找到且 `throwOnError` 为 false，则返回空字符串。"></x-field>

**示例**

```javascript 定位元数据文件 icon=logos:javascript
import { select } from '@blocklet/meta';

const blockletDir = '/path/to/your/blocklet';

try {
  const metaFile = select(blockletDir);
  console.log(`Found metadata file at: ${metaFile}`);
} catch (error) {
  console.error(error.message); // 例如，'blocklet.yml not found...'
}
```

### read(file)

一旦有了文件路径，`read` 函数会将 YAML 内容解析为 JavaScript 对象。

**参数**

<x-field data-name="file" data-type="string" data-required="true" data-desc="要读取的 blocklet.yml 文件的路径。"></x-field>

**返回**

<x-field data-name="meta" data-type="object" data-desc="解析后的 YAML 文件内容，作为 JavaScript 对象。"></x-field>

**示例**

```javascript 读取元数据文件 icon=logos:javascript
import { select, read } from '@blocklet/meta';

const metaFile = select('/path/to/your/blocklet');
const meta = read(metaFile);
console.log(`Blocklet name: ${meta.name}`);
```

### update(file, meta, options?)

`update` 函数将元数据对象序列化回 YAML 文件。默认情况下，它会在写入前通过移除仅在运行时相关的属性（例如，`path`、`stats`、`signatures`）来清理元数据。

**参数**

<x-field-group>
  <x-field data-name="file" data-type="string" data-required="true" data-desc="要更新的 blocklet.yml 文件的路径。"></x-field>
  <x-field data-name="meta" data-type="TBlockletMeta" data-required="true" data-desc="要写入文件的元数据对象。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="update 函数的配置选项。">
    <x-field data-name="fix" data-type="boolean" data-default="true" data-required="false" data-desc="如果为 true，则在写入前清理元数据对象（例如，移除 `path`、`stats`、`signatures`）。如果为 false，则按原样写入对象。"></x-field>
  </x-field>
</x-field-group>

**返回**

此函数不返回值 (`void`)。

**示例**

```javascript 更新元数据文件 icon=logos:javascript
import { select, read, update } from '@blocklet/meta';

const metaFile = select('/path/to/your/blocklet');
let meta = read(metaFile);

// 修改描述
meta.description = 'An updated description for my blocklet.';

// 将更改写回文件并进行清理
update(metaFile, meta);
console.log('blocklet.yml has been updated.');
```

### list

一个简单的常量数组，包含了 blocklet 元数据文件的可能名称，`select` 内部会使用它。

**示例**

```javascript icon=logos:javascript
import { list } from '@blocklet/meta';

console.log(list); // 输出：['blocklet.yml', 'blocklet.yaml']
```

## 自定义 Joi 扩展

这些扩展与 Joi 验证库集成，为常见的 Blocklet 相关数据（如文件路径和 DID）提供自定义验证类型。

### fileExtension

为 Joi 模式提供自定义的 `file()` 类型，从而实现强大的文件系统感知验证。

**用法**

首先，使用 `fileExtension` 扩展 Joi 实例。然后，您可以在模式中使用 `file()` 类型及其规则。

```javascript 使用 fileExtension 的 Joi 模式 icon=logos:javascript
import Joi from 'joi';
import path from 'path';
import { fileExtension } from '@blocklet/meta';

// 创建一个使用我们自定义类型扩展的 Joi 实例
const customJoi = Joi.extend(fileExtension);

const schema = customJoi.object({
  // 验证 'logo.png' 是否存在于项目目录中
  logoPath: customJoi.file().exists({ baseDir: __dirname }),
});

const { error } = schema.validate({ logoPath: 'logo.png' });
if (error) {
  console.log(error.message); // 例如，'file "logo.png" does not exist'
}
```

### didExtension

为 Joi 提供自定义的 `DID()` 类型，以验证 ArcBlock 分散式标识符。

**用法**

使用 `didExtension` 扩展 Joi，以添加 `DID()` 验证类型。

```javascript 使用 didExtension 的 Joi 模式 icon=logos:javascript
import Joi from 'joi';
import { didExtension } from '@blocklet/meta';

const customJoi = Joi.extend(didExtension);

const schema = customJoi.object({
  author: customJoi.DID().required(),
});

// 使用无效 DID 的示例
const { error } = schema.validate({ author: 'z123...invalid_did' });
if (error) {
  console.log(error.message); // 'did "z123...invalid_did" is not valid'
}

// 使用有效 DID 的示例
const { value } = schema.validate({ author: 'z8iZpbpJ4Yy2LzG1cqK9rC9pZ8r1Yq2Z3t4a' });
console.log(value); // { author: 'z8iZpbpJ4Yy2LzG1cqK9rC9pZ8r1Yq2Z3t4a' }
```

---

这些文件实用工具构成了 Blocklet 生态系统中许多更高级别操作的基础。有关更高级的元数据处理，请继续阅读[解析与验证](./api-parsing-validation.md)文档。
