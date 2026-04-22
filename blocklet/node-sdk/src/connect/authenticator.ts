import { Authenticator } from '@did-connect/authenticator';
import { getWallet } from '../wallet';
import { checkBlockletEnvironment } from '../util/check-blocklet-env';
import { getAuthenticatorProps } from './shared';
import { BlockletService } from '../service/blocklet';

class BlockletAuthenticator extends Authenticator {
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

export { BlockletAuthenticator };
