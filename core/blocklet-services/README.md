# Blocklet Services

Provides out-of-the-box services for blocklets.

Should run under Server Gateway (e.g. nginx).

## Usage

```shell
yarn add @abtnode/blocklet-service
```

Then:

```javascript
const createServer = require('@abtnode/blocklet-services');
const ABTNode = require('@abtnode/core');

const node = ABTNode({ ...nodeOptions });

node.onReady(() => {
  const server = createServer(node);

  server.listen(5000, '127.0.0.1', async (err) => {
    if (err) throw err;

    console.log(`> Blocklet Service ready on 5000`);
  });
});
```

## Service API

### Public

#### Web

- /.well-known/service/lost-passport
- /.well-known/service/login
- /.well-known/service/admin/
- /.well-known/service/blocklet/logo

#### API

- /.well-known/service/health
- /.well-known/service/api/did/session

### Internal

#### Web

- /.well-known/service/issue-passport
- /.well-known/service/invite
- /.well-known/service/start
- /.well-known/service/setup
- /.well-known/service/user/avatar/:fileName
- /.well-known/service/studio/home
- /.well-known/service/studio/preferences
- /.well-known/service/studio/localization
- /.well-known/service/hosted/form-builder
- /.well-known/service/hosted/form-collector

#### API

- /.well-known/service/api/passport/status

- /.well-known/service/api/send-to-user
- /.well-known/service/api/send-to-app-channel

- /.well-known/service/api/blocklet/detail
- /.well-known/service/api/blocklet/start
- /.well-known/service/api/blocklet/meta

- \*\*/api/env

- /.well-known/service/api/gql
- /.well-known/service/api/dns-resolve
- /.well-known/service/api/invitation

- /.well-known/service/api/studio/preferences

- /.well-known/service/openapi.yml
- /.well-known/service/openapi.json
- /.well-known/service/openembed.json
- /.well-known/service/openevent.json

#### DID Connect

- /api/connect/relay/login/connect
- /api/connect/relay/login/approve
- /api/connect/relay/switch-profile/connect
- /api/connect/relay/switch-profile/approve
- /api/connect/relay/switch-passport/connect
- /api/connect/relay/switch-passport/approve

- /api/did/login
- /api/did/invite
- /api/did/issue-passport
- /api/did/lost-passport-list
- /api/did/lost-passport-issue
- /api/did/pre-setup
- /api/did/setup
- /api/did/switch-profile
- /api/did/switch-passport
- /api/did/fuel

#### Websocket

- /api/connect/relay/websocket
- /websocket
- /admin/websocket

### Working with ux repo hmr

Add `ARCBLOCK_UX_BASE_PATH` equals to your ux repo path in `.env.development` file

```shell
ARCBLOCK_UX_BASE_PATH="/Users/xxx/arcblock/ux"
```

Then, you can change ux repo src code to see hmr effect in blocklet-server services app
