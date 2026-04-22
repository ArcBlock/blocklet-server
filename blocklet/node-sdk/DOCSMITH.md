- This SDK name is @blocklet/sdk.
- Blocklet SDK document should focus on `./service`, `./src/component`, `./src/middlewares`, `./src/config.ts`, `./src/wallet.ts`, other folder or file may not need independent document page, you can decide by yourself
- `./src/database` is deprecated, so do not generate document for it.
- `../../core/types` contains BlockletService function schema, you might need this.
- WalletHandlers 和 WalletAuthenticator 只需要做简单的介绍即可，更详细的用法，可以引导用户到 https://www.arcblock.io/docs/did-connect-sdk/en/did-connect-sdk-overview 进行查看

---

Here is some simple for how to use wallet-handler & wallet-authenticator
```js
import path from 'path';

import AuthStorage from '@arcblock/did-connect-storage-nedb';
import WalletAuthenticator from '@blocklet/sdk/lib/wallet-authenticator';
import WalletHandler from '@blocklet/sdk/lib/wallet-handler';

export const authenticator = new WalletAuthenticator();
export const handlers = new WalletHandler({
  authenticator,
  tokenStorage: new AuthStorage({
    dbPath: path.join(process.env.BLOCKLET_DATA_DIR, 'auth.db'),
  }),
});

```
