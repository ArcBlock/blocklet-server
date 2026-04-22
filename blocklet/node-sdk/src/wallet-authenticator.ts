import { WalletAuthenticator as Authenticator } from '@arcblock/did-connect-js';
import { getWallet } from './wallet';
import { checkBlockletEnvironment } from './util/check-blocklet-env';
import { getAuthenticatorProps } from './connect/shared';
import { BlockletService } from './service/blocklet';

class WalletAuthenticator extends Authenticator {
  constructor(options = {}) {
    checkBlockletEnvironment();
    super({
      wallet: getWallet(),
      ...getAuthenticatorProps(options),
    });
    this.blockletClient = new BlockletService();
    this.authClient = this.blockletClient;
  }

  /** @deprecated Use blockletClient instead */
  private authClient: BlockletService;

  private blockletClient: BlockletService;
}
export { WalletAuthenticator };
