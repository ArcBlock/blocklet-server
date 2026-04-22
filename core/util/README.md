# ArcBlock's JavaScript utility

## Usage

For example:

```js
const tryWithTimeout = require('@abtnode/util/lib/try-with-timeout');
try {
  await tryWithTimeout(() => new Promise((resolve) => setTimeout(() => resolve(true), 60)), 50);
} catch (err) {
  expect(err).toBeTruthy();
  expect(err.message).toContain('Operation timed out after 50 ms');
}
```
