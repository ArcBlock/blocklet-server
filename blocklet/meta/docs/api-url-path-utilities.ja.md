# URL & パスユーティリティ

このセクションでは、URLフレンドリーな文字列を作成し、URLパスを検証するための一連のヘルパー関数を提供します。これらのユーティリティは、blockletアプリケーション内でクリーンで有効、かつ一貫性のあるルートとリンクを生成するために不可欠です。

## 推奨されるユーティリティ

以下の関数は`url-path-friendly.ts`モジュールで提供されており、URLパスの処理に推奨される選択肢です。

### `urlPathFriendly(name, [options])`

非標準文字をハイフンに置き換え、連続する特殊文字を整理することで、文字列をURLパスフレンドリーな形式に変換します。

**パラメータ**

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="変換対象の入力文字列。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="オプションの設定オブジェクト。">
    <x-field data-name="keepSlash" data-type="boolean" data-default="true" data-desc="`true`（デフォルト）の場合、スラッシュ（`/`）は保持されます。`false`の場合、先頭と末尾のスラッシュは削除されます。"></x-field>
  </x-field>
</x-field-group>

**戻り値**

- `string`: URLパスフレンドリーな文字列。

**例**

```javascript icon=logos:javascript
import urlPathFriendly from '@blocklet/meta/lib/url-path-friendly';

// 基本的な使用法
const messyString = '  My Awesome/Blocklet!!_v1.0.  ';
const cleanPath = urlPathFriendly(messyString);
// 結果: 'My-Awesome/Blocklet-v1.0.'

// 連続する文字の処理
const withExtras = 'path///with...multiple---separators';
const cleanedExtras = urlPathFriendly(withExtras);
// 結果: 'path/with.multiple-separators'

// スラッシュを保持しない場合
const fullPath = '/my/blocklet/path/';
const noSlashes = urlPathFriendly(fullPath, { keepSlash: false });
// 結果: 'my/blocklet/path'
```

### `isValidUrlPath(name)`

指定された文字列が有効なURLパスセグメントであるかどうかをチェックします。文字列がASCII文字のみを含み、パターン `^[a-z0-9/\-._]*$` に一致し、連続するスラッシュ（`//`）を含まないことを検証します。

**パラメータ**

<x-field data-name="name" data-type="string" data-required="true" data-desc="検証するパス文字列。"></x-field>

**戻り値**

- `boolean`: パスが有効な場合は`true`、それ以外の場合は`false`。

**例**

```javascript icon=logos:javascript
import { isValidUrlPath } from '@blocklet/meta/lib/url-path-friendly';

console.log(isValidUrlPath('valid-path/sub-path_1.0')); // true
console.log(isValidUrlPath('/another/valid/path')); // true

console.log(isValidUrlPath('invalid//path')); // false (連続するスラッシュ)
console.log(isValidUrlPath('path-with-emojis-😀')); // false (非ASCII文字)
console.log(isValidUrlPath('invalid path')); // false (スペースを含む)
```

### `checkLink(value)`

文字列が有効な絶対URLまたはリンクに適した有効な相対URLパスであるかどうかを判断します。

**パラメータ**

<x-field data-name="value" data-type="string" data-required="true" data-desc="チェックするURLまたはパス。"></x-field>

**戻り値**

- `boolean`: リンクが有効な場合は`true`、それ以外の場合は`false`。

**例**

```javascript icon=logos:javascript
import { checkLink } from '@blocklet/meta/lib/url-path-friendly';

// 絶対URL
console.log(checkLink('https://www.arcblock.io')); // true
console.log(checkLink('ftp://example.com')); // true

// 有効な相対パス
console.log(checkLink('/my-page')); // true
console.log(checkLink('/docs/getting-started/')); // true

// 無効なパス
console.log(checkLink('not-a-link')); // false
console.log(checkLink('/invalid//path')); // false
```

### `checkUrlPath(value)`

連結に使用されるURLパスに特化した、より厳密なチェックです。パスがスラッシュで始まり、連続するスラッシュを含まないことを検証します。

**パラメータ**

<x-field data-name="value" data-type="string" data-required="true" data-desc="チェックするURLパス。"></x-field>

**戻り値**

- `boolean`: パスが有効な連結パスである場合は`true`、それ以外の場合は`false`。

**例**

```javascript icon=logos:javascript
import { checkUrlPath } from '@blocklet/meta/lib/url-path-friendly';

console.log(checkUrlPath('/abc')); // true
console.log(checkUrlPath('/abc/bcd')); // true
console.log(checkUrlPath('/abc/bcd/')); // true

console.log(checkUrlPath('abc')); // false ('/'で始まらない)
console.log(checkUrlPath('/abc//bcd')); // false (連続するスラッシュを含む)
```

---

## 非推奨のユーティリティ

> ⚠️ **警告:** `url-friendly.ts`モジュールの以下の関数は非推奨です。URLパスのより良い処理のために、代わりに`url-path-friendly.ts`のユーティリティを使用してください。

### `urlFriendly(name, [options])`

> **非推奨:** 代わりに`urlPathFriendly`を使用してください。

`slugify`を使用して文字列をURLフレンドリーな形式に変換します。

**パラメータ**

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="入力文字列。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="オプションの設定オブジェクト。">
    <x-field data-name="keepSlash" data-type="boolean" data-default="true" data-desc="`true`（デフォルト）の場合、スラッシュ（`/`）は保持されます。`false`の場合、スラッシュはハイフンに変換されます。"></x-field>
  </x-field>
</x-field-group>

**例**

```javascript icon=logos:javascript
import urlFriendly from '@blocklet/meta/lib/url-friendly';

// スラッシュを保持
const result1 = urlFriendly('my/awesome_blocklet');
// 結果: 'my/awesome-blocklet'

// スラッシュを置換
const result2 = urlFriendly('my/awesome_blocklet', { keepSlash: false });
// 結果: 'my-awesome-blocklet'
```

### `isValidUrl(name)`

> **非推奨:** 代わりに`isValidUrlPath`または`checkLink`を使用してください。

文字列に、スペースやさまざまな記号など、URLで通常問題となる文字が含まれているかどうかをチェックします。

**例**

```javascript icon=logos:javascript
import { isValidUrl } from '@blocklet/meta/lib/url-friendly';

console.log(isValidUrl('valid-name')); // true
console.log(isValidUrl('invalid name')); // false
console.log(isValidUrl('another$invalid')); // false
```