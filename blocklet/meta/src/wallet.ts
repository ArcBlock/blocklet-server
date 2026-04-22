import { types } from '@ocap/mcrypto';
import { fromSecretKey, WalletType, WalletObject } from '@ocap/wallet';
import { DidType, isValid, DIDType, isEthereumType } from '@arcblock/did';
import { fromAppDid } from '@arcblock/did-ext';

const defaults = { role: types.RoleType.ROLE_APPLICATION };

/**
 * Gen DID from blocklet did and nodeSk
 *
 * Spec: https://github.com/ArcBlock/ABT-DID-Protocol#request-did-authentication
 */
const getApplicationWallet = (
  didOrSk: string,
  nodeSk?: string,
  type?: DIDType | 'default' | 'eth' | 'ethereum',
  index?: number
): WalletObject => {
  let t = type || defaults;
  const isEthereum = isEthereumType(DidType(type));
  if (isEthereum) {
    t = WalletType(type);
  } else {
    t = WalletType(defaults);
  }

  if (!isValid(didOrSk)) {
    let sk = '';
    try {
      if (isEthereum) {
        sk = didOrSk.slice(0, 66);
      } else {
        sk = didOrSk;
      }
      return fromSecretKey(sk, t);
    } catch (err) {
      throw new Error(`Cannot get blocklet wallet with invalid blocklet did or custom sk: ${err.message}`);
    }
  }

  if (!nodeSk) {
    throw new Error('Cannot get blocklet wallet with empty node sk');
  }

  return fromAppDid(didOrSk, nodeSk, t, index || 0);
};

export { getApplicationWallet };
