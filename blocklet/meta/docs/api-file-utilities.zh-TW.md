# 檔案工具

此模組提供一組低階函數，用於與檔案系統上的 `blocklet.yml` 檔案進行互動。它包括用於定位、讀取和寫入元資料檔案的工具，以及自訂的 [Joi](https://joi.dev/) 擴充功能，以簡化檔案路徑和 DID 的驗證。

## `blocklet.yml` 檔案處理程式

對於任何需要以程式設計方式讀取或修改 blocklet 元資料檔案的工具來說，這些函數都是核心的建構模塊。

### select(dir, options?)

`select` 函數會智慧地在指定目錄中找到正確的 `blocklet.yml` 或 `blocklet.yaml` 檔案。

**參數**

<x-field-group>
  <x-field data-name="dir" data-type="string" data-required="true" data-desc="blocklet 元資料檔案所在目錄的絕對路徑。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="select 函數的配置選項。">
    <x-field data-name="throwOnError" data-type="boolean" data-default="true" data-required="false" data-desc="若為 true，則在找不到元資料檔案時會拋出錯誤。若為 false，則傳回空字串。"></x-field>
  </x-field>
</x-field-group>

**傳回值**

<x-field data-name="metaFilePath" data-type="string" data-desc="找到的元資料檔案的完整絕對路徑，如果未找到且 `throwOnError` 為 false，則傳回空字串。"></x-field>

**範例**

```javascript 定位元資料檔案 icon=logos:javascript
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

一旦您有了檔案路徑，`read` 函數就會將 YAML 內容解析為 JavaScript 物件。

**參數**

<x-field data-name="file" data-type="string" data-required="true" data-desc="要讀取的 blocklet.yml 檔案的路徑。"></x-field>

**傳回值**

<x-field data-name="meta" data-type="object" data-desc="YAML 檔案解析後的內容，作為一個 JavaScript 物件。"></x-field>

**範例**

```javascript 讀取元資料檔案 icon=logos:javascript
import { select, read } from '@blocklet/meta';

const metaFile = select('/path/to/your/blocklet');
const meta = read(metaFile);
console.log(`Blocklet name: ${meta.name}`);
```

### update(file, meta, options?)

`update` 函數會將元資料物件序列化回 YAML 檔案。預設情況下，它會在寫入前清理元資料，移除僅在執行時相關的屬性（例如 `path`、`stats`、`signatures`）。

**參數**

<x-field-group>
  <x-field data-name="file" data-type="string" data-required="true" data-desc="要更新的 blocklet.yml 檔案的路徑。"></x-field>
  <x-field data-name="meta" data-type="TBlockletMeta" data-required="true" data-desc="要寫入檔案的元資料物件。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="update 函數的配置選項。">
    <x-field data-name="fix" data-type="boolean" data-default="true" data-required="false" data-desc="若為 true，則在寫入前清理元資料物件（例如，移除 `path`、`stats`、`signatures`）。若為 false，則按原樣寫入物件。"></x-field>
  </x-field>
</x-field-group>

**傳回值**

此函數不傳回任何值 (`void`)。

**範例**

```javascript 更新元資料檔案 icon=logos:javascript
import { select, read, update } from '@blocklet/meta';

const metaFile = select('/path/to/your/blocklet');
let meta = read(metaFile);

// 修改描述
meta.description = 'An updated description for my blocklet.';

// 將變更寫回檔案並進行清理
update(metaFile, meta);
console.log('blocklet.yml has been updated.');
```

### list

一個簡單的常數陣列，包含 blocklet 元資料檔案的可能名稱，`select` 內部會使用它。

**範例**

```javascript icon=logos:javascript
import { list } from '@blocklet/meta';

console.log(list); // 輸出：['blocklet.yml', 'blocklet.yaml']
```

## 自訂 Joi 擴充功能

這些擴充功能與 Joi 驗證庫整合，為常見的 Blocklet 相關資料（如檔案路徑和 DID）提供自訂驗證類型。

### fileExtension

為 Joi 結構描述提供一個自訂的 `file()` 類型，從而實現強大的檔案系統感知驗證。

**用法**

首先，使用 `fileExtension` 擴充 Joi 實例。然後，您就可以在您的結構描述中使用 `file()` 類型及其規則。

```javascript 使用 fileExtension 的 Joi 結構描述 icon=logos:javascript
import Joi from 'joi';
import path from 'path';
import { fileExtension } from '@blocklet/meta';

// 建立一個使用我們自訂類型擴充的 Joi 實例
const customJoi = Joi.extend(fileExtension);

const schema = customJoi.object({
  // 驗證 'logo.png' 是否存在於專案目錄中
  logoPath: customJoi.file().exists({ baseDir: __dirname }),
});

const { error } = schema.validate({ logoPath: 'logo.png' });
if (error) {
  console.log(error.message); // 例如，'file "logo.png" does not exist'
}
```

### didExtension

為 Joi 提供一個自訂的 `DID()` 類型，用於驗證 ArcBlock 分散式識別碼。

**用法**

使用 `didExtension` 擴充 Joi 以新增 `DID()` 驗證類型。

```javascript 使用 didExtension 的 Joi 結構描述 icon=logos:javascript
import Joi from 'joi';
import { didExtension } from '@blocklet/meta';

const customJoi = Joi.extend(didExtension);

const schema = customJoi.object({
  author: customJoi.DID().required(),
});

// 使用無效 DID 的範例
const { error } = schema.validate({ author: 'z123...invalid_did' });
if (error) {
  console.log(error.message); // 'did "z123...invalid_did" is not valid'
}

// 使用有效 DID 的範例
const { value } = schema.validate({ author: 'z8iZpbpJ4Yy2LzG1cqK9rC9pZ8r1Yq2Z3t4a' });
console.log(value); // { author: 'z8iZpbpJ4Yy2LzG1cqK9rC9pZ8r1Yq2Z3t4a' }
```

---

這些檔案工具構成了 Blocklet 生態系統中許多高階操作的基礎。有關更進階的元資料處理，請參閱 [解析與驗證](./api-parsing-validation.md) 文件。