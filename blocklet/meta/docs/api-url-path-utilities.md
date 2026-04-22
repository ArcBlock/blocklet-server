# URL & Path Utilities

This section provides a set of helper functions for creating URL-friendly strings and validating URL paths. These utilities are essential for generating clean, valid, and consistent routes and links within your blocklet applications.

## Recommended Utilities

The following functions are provided in the `url-path-friendly.ts` module and are the recommended choice for handling URL paths.

### `urlPathFriendly(name, [options])`

Converts a string into a URL path-friendly format by replacing non-standard characters with hyphens and cleaning up consecutive special characters.

**Parameters**

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="The input string to be converted."></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="Optional configuration object.">
    <x-field data-name="keepSlash" data-type="boolean" data-default="true" data-desc="If `true` (default), slashes (`/`) are preserved. If `false`, leading and trailing slashes are removed."></x-field>
  </x-field>
</x-field-group>

**Returns**

- `string`: The URL path-friendly string.

**Example**

```javascript icon=logos:javascript
import urlPathFriendly from '@blocklet/meta/lib/url-path-friendly';

// Basic usage
const messyString = '  My Awesome/Blocklet!!_v1.0.  ';
const cleanPath = urlPathFriendly(messyString);
// Result: 'My-Awesome/Blocklet-v1.0.'

// Handling consecutive characters
const withExtras = 'path///with...multiple---separators';
const cleanedExtras = urlPathFriendly(withExtras);
// Result: 'path/with.multiple-separators'

// Without keeping slashes
const fullPath = '/my/blocklet/path/';
const noSlashes = urlPathFriendly(fullPath, { keepSlash: false });
// Result: 'my/blocklet/path'
```

### `isValidUrlPath(name)`

Checks if a given string is a valid URL path segment. It verifies that the string contains only ASCII characters, matches the pattern `^[a-z0-9/\-._]*$`, and does not contain consecutive slashes (`//`).

**Parameters**

<x-field data-name="name" data-type="string" data-required="true" data-desc="The path string to validate."></x-field>

**Returns**

- `boolean`: `true` if the path is valid, otherwise `false`.

**Example**

```javascript icon=logos:javascript
import { isValidUrlPath } from '@blocklet/meta/lib/url-path-friendly';

console.log(isValidUrlPath('valid-path/sub-path_1.0')); // true
console.log(isValidUrlPath('/another/valid/path')); // true

console.log(isValidUrlPath('invalid//path')); // false (consecutive slashes)
console.log(isValidUrlPath('path-with-emojis-😀')); // false (non-ASCII characters)
console.log(isValidUrlPath('invalid path')); // false (contains space)
```

### `checkLink(value)`

Determines if a string is either a valid absolute URL or a valid relative URL path suitable for linking.

**Parameters**

<x-field data-name="value" data-type="string" data-required="true" data-desc="The URL or path to check."></x-field>

**Returns**

- `boolean`: `true` if the link is valid, otherwise `false`.

**Example**

```javascript icon=logos:javascript
import { checkLink } from '@blocklet/meta/lib/url-path-friendly';

// Absolute URLs
console.log(checkLink('https://www.arcblock.io')); // true
console.log(checkLink('ftp://example.com')); // true

// Valid relative paths
console.log(checkLink('/my-page')); // true
console.log(checkLink('/docs/getting-started/')); // true

// Invalid paths
console.log(checkLink('not-a-link')); // false
console.log(checkLink('/invalid//path')); // false
```

### `checkUrlPath(value)`

A stricter check specifically for URL paths used in concatenation. It validates that a path starts with a slash and does not contain consecutive slashes.

**Parameters**

<x-field data-name="value" data-type="string" data-required="true" data-desc="The URL path to check."></x-field>

**Returns**

- `boolean`: `true` if the path is a valid concatenation path, otherwise `false`.

**Example**

```javascript icon=logos:javascript
import { checkUrlPath } from '@blocklet/meta/lib/url-path-friendly';

console.log(checkUrlPath('/abc')); // true
console.log(checkUrlPath('/abc/bcd')); // true
console.log(checkUrlPath('/abc/bcd/')); // true

console.log(checkUrlPath('abc')); // false (does not start with '/')
console.log(checkUrlPath('/abc//bcd')); // false (contains consecutive slashes)
```

---

## Deprecated Utilities

> ⚠️ **Warning:** The following functions from the `url-friendly.ts` module are deprecated. Please use the utilities from `url-path-friendly.ts` instead for better handling of URL paths.

### `urlFriendly(name, [options])`

> **Deprecated:** Use `urlPathFriendly` instead.

Converts a string to a URL-friendly format using `slugify`.

**Parameters**

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="The input string."></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="Optional configuration object.">
    <x-field data-name="keepSlash" data-type="boolean" data-default="true" data-desc="If `true` (default), slashes (`/`) are preserved. If `false`, slashes are converted to hyphens."></x-field>
  </x-field>
</x-field-group>

**Example**

```javascript icon=logos:javascript
import urlFriendly from '@blocklet/meta/lib/url-friendly';

// With slashes kept
const result1 = urlFriendly('my/awesome_blocklet');
// Result: 'my/awesome-blocklet'

// With slashes replaced
const result2 = urlFriendly('my/awesome_blocklet', { keepSlash: false });
// Result: 'my-awesome-blocklet'
```

### `isValidUrl(name)`

> **Deprecated:** Use `isValidUrlPath` or `checkLink` instead.

Checks if a string contains characters that are typically problematic in URLs, such as spaces and various symbols.

**Example**

```javascript icon=logos:javascript
import { isValidUrl } from '@blocklet/meta/lib/url-friendly';

console.log(isValidUrl('valid-name')); // true
console.log(isValidUrl('invalid name')); // false
console.log(isValidUrl('another$invalid')); // false
```