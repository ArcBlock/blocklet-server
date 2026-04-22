const fs = require('fs');
const path = require('path');

const source = fs
  .readFileSync(path.resolve(__dirname, '../lib/schema.graphqls'))
  .toString()
  .trim()
  // compile to 'scalar Upload' from prototype
  .replace(/enum\s+Upload\s+{\s+scalar\s+}/, 'scalar Upload');
fs.writeFileSync(path.resolve(__dirname, '../lib/index.js'), `module.exports = \`${source}\`;`);
console.log('graphql schema file wrapped in javascript file');
