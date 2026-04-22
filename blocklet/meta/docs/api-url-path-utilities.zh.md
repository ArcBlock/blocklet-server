# URL 和路径工具

本节提供了一组辅助函数，用于创建 URL 友好的字符串和验证 URL 路径。这些工具对于在你的 blocklet 应用中生成干净、有效且一致的路由和链接至关重要。

## 推荐的工具

`url-path-friendly.ts` 模块中提供了以下函数，它们是处理 URL 路径的推荐选择。

### `urlPathFriendly(name, [options])`

通过将非标准字符替换为连字符并清理连续的特殊字符，将字符串转换为 URL 路径友好的格式。

**参数**

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="要转换的输入字符串。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="可选的配置对象。">
    <x-field data-name="keepSlash" data-type="boolean" data-default="true" data-desc="如果为 `true`（默认值），则保留斜杠（`/`）。如果为 `false`，则删除开头和结尾的斜杠。"></x-field>
  </x-field>
</x-field-group>

**返回**

- `string`: URL 路径友好的字符串。

**示例**

```javascript icon=logos:javascript
import urlPathFriendly from '@blocklet/meta/lib/url-path-friendly';

// 基本用法
const messyString = '  My Awesome/Blocklet!!_v1.0.  ';
const cleanPath = urlPathFriendly(messyString);
// 结果: 'My-Awesome/Blocklet-v1.0.'

// 处理连续字符
const withExtras = 'path///with...multiple---separators';
const cleanedExtras = urlPathFriendly(withExtras);
// 结果: 'path/with.multiple-separators'

// 不保留斜杠
const fullPath = '/my/blocklet/path/';
const noSlashes = urlPathFriendly(fullPath, { keepSlash: false });
// 结果: 'my/blocklet/path'
```

### `isValidUrlPath(name)`

检查给定字符串是否为有效的 URL 路径段。它会验证该字符串仅包含 ASCII 字符，匹配模式 `^[a-z0-9/\-._]*$`，并且不包含连续的斜杠（`//`）。

**参数**

<x-field data-name="name" data-type="string" data-required="true" data-desc="要验证的路径字符串。"></x-field>

**返回**

- `boolean`: 如果路径有效，则为 `true`，否则为 `false`。

**示例**

```javascript icon=logos:javascript
import { isValidUrlPath } from '@blocklet/meta/lib/url-path-friendly';

console.log(isValidUrlPath('valid-path/sub-path_1.0')); // true
console.log(isValidUrlPath('/another/valid/path')); // true

console.log(isValidUrlPath('invalid//path')); // false (连续斜杠)
console.log(isValidUrlPath('path-with-emojis-😀')); // false (非 ASCII 字符)
console.log(isValidUrlPath('invalid path')); // false (包含空格)
```

### `checkLink(value)`

判断一个字符串是有效的绝对 URL 还是适合链接的有效相对 URL 路径。

**参数**

<x-field data-name="value" data-type="string" data-required="true" data-desc="要检查的 URL 或路径。"></x-field>

**返回**

- `boolean`: 如果链接有效，则为 `true`，否则为 `false`。

**示例**

```javascript icon=logos:javascript
import { checkLink } from '@blocklet/meta/lib/url-path-friendly';

// 绝对 URL
console.log(checkLink('https://www.arcblock.io')); // true
console.log(checkLink('ftp://example.com')); // true

// 有效的相对路径
console.log(checkLink('/my-page')); // true
console.log(checkLink('/docs/getting-started/')); // true

// 无效路径
console.log(checkLink('not-a-link')); // false
console.log(checkLink('/invalid//path')); // false
```

### `checkUrlPath(value)`

一个更严格的检查，专门用于拼接中使用的 URL 路径。它会验证路径以斜杠开头且不包含连续的斜杠。

**参数**

<x-field data-name="value" data-type="string" data-required="true" data-desc="要检查的 URL 路径。"></x-field>

**返回**

- `boolean`: 如果路径是有效的拼接路径，则为 `true`，否则为 `false`。

**示例**

```javascript icon=logos:javascript
import { checkUrlPath } from '@blocklet/meta/lib/url-path-friendly';

console.log(checkUrlPath('/abc')); // true
console.log(checkUrlPath('/abc/bcd')); // true
console.log(checkUrlPath('/abc/bcd/')); // true

console.log(checkUrlPath('abc')); // false (不以 '/' 开头)
console.log(checkUrlPath('/abc//bcd')); // false (包含连续斜杠)
```

---

## 已弃用的工具

> ⚠️ **警告：** 以下来自 `url-friendly.ts` 模块的函数已弃用。请改用 `url-path-friendly.ts` 中的工具，以便更好地处理 URL 路径。

### `urlFriendly(name, [options])`

> **已弃用：** 请改用 `urlPathFriendly`。

使用 `slugify` 将字符串转换为 URL 友好的格式。

**参数**

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="输入字符串。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="可选的配置对象。">
    <x-field data-name="keepSlash" data-type="boolean" data-default="true" data-desc="如果为 `true`（默认值），则保留斜杠（`/`）。如果为 `false`，斜杠将转换为连字符。"></x-field>
  </x-field>
</x-field-group>

**示例**

```javascript icon=logos:javascript
import urlFriendly from '@blocklet/meta/lib/url-friendly';

// 保留斜杠
const result1 = urlFriendly('my/awesome_blocklet');
// 结果: 'my/awesome-blocklet'

// 替换斜杠
const result2 = urlFriendly('my/awesome_blocklet', { keepSlash: false });
// 结果: 'my-awesome-blocklet'
```

### `isValidUrl(name)`

> **已弃用：** 请改用 `isValidUrlPath` 或 `checkLink`。

检查字符串是否包含在 URL 中通常有问题字符，例如空格和各种符号。

**示例**

```javascript icon=logos:javascript
import { isValidUrl } from '@blocklet/meta/lib/url-friendly';

console.log(isValidUrl('valid-name')); // true
console.log(isValidUrl('invalid name')); // false
console.log(isValidUrl('another$invalid')); // false
```