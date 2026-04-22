/* eslint-disable max-len */
/* eslint-disable array-callback-return */
/* eslint-disable consistent-return */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');

const getCmdHelps = (action) =>
  shell
    .exec(path.resolve(__dirname, `../bin/blocklet.js ${action}`), { silent: true })
    .toString()
    .trim();

const readmeFile = path.join(__dirname, '../README.md');
const readmeContent = `# Blocklet Server CLI

This package contains 2 command utilities to manage Blocklet Server and Blocklets

- \`blocklet\`: manage blocklets, such as init/dev/bundle/deploy/publish
- \`blocklet server\`: manage Blocklet Server instances, such as init/start/stop/export

## Getting Started

\`\`\`shell
# install
npm install -g @blocklet/cli

# initialize and start a new node
blocklet server init -f
blocklet server start
\`\`\`

Now your Blocklet Server is up and running.

## \`blocklet server\` command

\`\`\`terminal
${getCmdHelps('server -h')}
\`\`\`

## \`blocklet\` command

\`\`\`terminal
${getCmdHelps('-h')}
\`\`\`

## Documentation

https://developer.blocklet.io/docs
`;

fs.writeFileSync(readmeFile, readmeContent);
console.log('CLI README.md updated');
