const fs = require('fs-extra');
const path = require('path');

// FIXME: This version number is higher than the beta version; should it be set to beta instead?
const version = fs.readFileSync(path.resolve(__dirname, '../../../version'), 'utf8').trim();

fs.writeFileSync(
  path.resolve(__dirname, '../src/version.ts'),
  `const version = '${version}';

export { version };

export default { version };
`
);
