# URL 與路徑工具

本節提供了一組輔助函式，用於建立 URL 友善的字串和驗證 URL 路徑。這些工具對於在您的 blocklet 應用程式中產生乾淨、有效且一致的路由和連結至關重要。

## 推薦工具

以下函式在 `url-path-friendly.ts` 模組中提供，是處理 URL 路徑的推薦選擇。

### `urlPathFriendly(name, [options])`

透過將非標準字元替換為連字號並清理連續的特殊字元，將字串轉換為 URL 路徑友善的格式。

**參數**

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="要轉換的輸入字串。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="可選的設定物件。">
    <x-field data-name="keepSlash" data-type="boolean" data-default="true" data-desc="如果為 `true` (預設)，則保留斜線 (`/`)。如果為 `false`，則移除開頭和結尾的斜線。"></x-field>
  </x-field>
</x-field-group>

**回傳值**

- `string`：URL 路徑友善的字串。

**範例**

```javascript icon=logos:javascript
import urlPathFriendly from '@blocklet/meta/lib/url-path-friendly';

// 基本用法
const messyString = '  My Awesome/Blocklet!!_v1.0.  ';
const cleanPath = urlPathFriendly(messyString);
// 結果：'My-Awesome/Blocklet-v1.0.'

// 處理連續字元
const withExtras = 'path///with...multiple---separators';
const cleanedExtras = urlPathFriendly(withExtras);
// 結果：'path/with.multiple-separators'

// 不保留斜線
const fullPath = '/my/blocklet/path/';
const noSlashes = urlPathFriendly(fullPath, { keepSlash: false });
// 結果：'my/blocklet/path'
```

### `isValidUrlPath(name)`

檢查給定的字串是否為有效的 URL 路徑區段。它會驗證該字串僅包含 ASCII 字元，符合模式 `^[a-z0-9/\-._]*$`，且不包含連續的斜線 (`//`)。

**參數**

<x-field data-name="name" data-type="string" data-required="true" data-desc="要驗證的路徑字串。"></x-field>

**回傳值**

- `boolean`：如果路徑有效，則為 `true`，否則為 `false`。

**範例**

```javascript icon=logos:javascript
import { isValidUrlPath } from '@blocklet/meta/lib/url-path-friendly';

console.log(isValidUrlPath('valid-path/sub-path_1.0')); // true
console.log(isValidUrlPath('/another/valid/path')); // true

console.log(isValidUrlPath('invalid//path')); // false (連續斜線)
console.log(isValidUrlPath('path-with-emojis-😀')); // false (非 ASCII 字元)
console.log(isValidUrlPath('invalid path')); // false (包含空格)
```

### `checkLink(value)`

判斷一個字串是否為有效的絕對 URL 或適合連結的有效相對 URL 路徑。

**參數**

<x-field data-name="value" data-type="string" data-required="true" data-desc="要檢查的 URL 或路徑。"></x-field>

**回傳值**

- `boolean`：如果連結有效，則為 `true`，否則為 `false`。

**範例**

```javascript icon=logos:javascript
import { checkLink } from '@blocklet/meta/lib/url-path-friendly';

// 絕對 URL
console.log(checkLink('https://www.arcblock.io')); // true
console.log(checkLink('ftp://example.com')); // true

// 有效的相對路徑
console.log(checkLink('/my-page')); // true
console.log(checkLink('/docs/getting-started/')); // true

// 無效的路徑
console.log(checkLink('not-a-link')); // false
console.log(checkLink('/invalid//path')); // false
```

### `checkUrlPath(value)`

一個更嚴格的檢查，專門用於串接的 URL 路徑。它會驗證路徑以斜線開頭且不包含連續的斜線。

**參數**

<x-field data-name="value" data-type="string" data-required="true" data-desc="要檢查的 URL 路徑。"></x-field>

**回傳值**

- `boolean`：如果路徑是有效的串接路徑，則為 `true`，否則為 `false`。

**範例**

```javascript icon=logos:javascript
import { checkUrlPath } from '@blocklet/meta/lib/url-path-friendly';

console.log(checkUrlPath('/abc')); // true
console.log(checkUrlPath('/abc/bcd')); // true
console.log(checkUrlPath('/abc/bcd/')); // true

console.log(checkUrlPath('abc')); // false (不以 '/' 開頭)
console.log(checkUrlPath('/abc//bcd')); // false (包含連續斜線)
```

---

## 已棄用的工具

> ⚠️ **警告：** 以下來自 `url-friendly.ts` 模組的函式已棄用。請改用 `url-path-friendly.ts` 中的工具，以更好地處理 URL 路徑。

### `urlFriendly(name, [options])`

> **已棄用：** 請改用 `urlPathFriendly`。

使用 `slugify` 將字串轉換為 URL 友善的格式。

**參數**

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="輸入字串。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="可選的設定物件。">
    <x-field data-name="keepSlash" data-type="boolean" data-default="true" data-desc="如果為 `true` (預設)，則保留斜線 (`/`)。如果為 `false`，斜線將轉換為連字號。"></x-field>
  </x-field>
</x-field-group>

**範例**

```javascript icon=logos:javascript
import urlFriendly from '@blocklet/meta/lib/url-friendly';

// 保留斜線
const result1 = urlFriendly('my/awesome_blocklet');
// 結果：'my/awesome-blocklet'

// 替換斜線
const result2 = urlFriendly('my/awesome_blocklet', { keepSlash: false });
// 結果：'my-awesome-blocklet'
```

### `isValidUrl(name)`

> **已棄用：** 請改用 `isValidUrlPath` 或 `checkLink`。

檢查字串是否包含在 URL 中通常會有問題的字元，例如空格和各種符號。

**範例**

```javascript icon=logos:javascript
import { isValidUrl } from '@blocklet/meta/lib/url-friendly';

console.log(isValidUrl('valid-name')); // true
console.log(isValidUrl('invalid name')); // false
console.log(isValidUrl('another$invalid')); // false
```