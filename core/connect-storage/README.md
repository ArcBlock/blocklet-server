# Connect Storage

Simple did connect storage that can be used cross multiple processes.

## Usage

```shell
yarn add @abtnode/connect-storage
```

Then:

```javascript
import { join } from 'path';

import AuthStorage from '@abtnode/connect-storage';
import WalletAuthenticator from '@blocklet/sdk/lib/wallet-authenticator';
import WalletHandler from '@blocklet/sdk/lib/wallet-handler';
import Config from '@blocklet/sdk/lib/config';

export const authenticator = new WalletAuthenticator();
export const handlers = new WalletHandler({
  authenticator,
  tokenStorage: new AuthStorage({
    // FIXME: update this
    dbPath: join(Config.env.dataDir, 'path/to/component.db'),
  }),
});

```
