# ABT Node Core

ABT Node core state management lib, that powers `@blocklet/cli` and `@abtnode/webapp`.

## FAQ

### How to debug tests?

> You need to use node.js v20.x to run tests.

Run the following command in one terminal:

```bash
PM2_HOME=~/.arcblock/abtnode-test pm2 monit
```

Run the following command in another terminal:

```bash
DEBUG=@abtnode/* npm run test /path/to/test/file.spec.js
```
