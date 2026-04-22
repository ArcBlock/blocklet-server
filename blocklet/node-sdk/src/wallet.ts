import { fromJSON, fromPublicKey, fromSecretKey, WalletObject, WalletType, isValid } from '@ocap/wallet';
import { types } from '@ocap/mcrypto';
import { DidType, DIDTypeShortcut, DIDType, isEthereumType, DIDTypeArg } from '@arcblock/did';
import { LRUCache } from 'lru-cache';
import { fromAppDid } from '@arcblock/did-ext';
import { remoteSign, remoteSignJWT, remoteSignETH, remoteDeriveWallet } from './service/signature';

// NOTICE: At most 4 wallets per SDK runtime per application
// The cache is a performance optimization only; a cache miss causes no errors. Size intentionally set to 4.
export const cacheWallet = new LRUCache<string, WalletObject>({ max: 4, ttl: 60 * 1000 });

const REMOTE_CACHE_PLACEHOLDER = 'REMOTE_SIGN';

/**
 * Create a wallet from public key
 * Internal helper function used by both createRemoteWallet and getWallet.getPkWallet
 */
export const getPkWallet = (type?: DIDTypeShortcut, appPk: string = process.env.BLOCKLET_APP_PK): WalletObject => {
  let t: DIDType;

  // BLOCKLET_WALLET_TYPE is for backward compatibility
  // eslint-disable-next-line no-param-reassign
  type = type || process.env.CHAIN_TYPE || process.env.BLOCKLET_WALLET_TYPE;

  if (isEthereumType(DidType(type))) {
    t = WalletType(type);
  } else {
    t = WalletType({ role: types.RoleType.ROLE_APPLICATION, pk: types.KeyType.ED25519, hash: types.HashType.SHA3 });
  }

  return fromPublicKey(appPk, t);
};

/**
 * Create a remote wallet with sign and signJWT methods that call blocklet-service
 * @param publicKey - The public key to create the wallet from
 * @param type - The wallet type
 * @param keyType - Key type to use ('sk' or 'psk')
 * @returns Wallet object with remote sign and signJWT methods
 */
export const createRemoteWallet = (publicKey: string, type?: any, keyType: 'sk' | 'psk' = 'sk'): WalletObject => {
  if (!publicKey) {
    throw new Error('Missing publicKey for creating remote wallet');
  }

  // Create base wallet from public key
  const baseWallet = fromPublicKey(publicKey, type);
  const remoteWallet = Object.create(baseWallet) as WalletObject;

  // Add remote sign method
  // Match the standard wallet.sign signature: sign(data, hashBeforeSign?, encoding?)
  (remoteWallet as any).sign = async (payload: any, hashBeforeSign?: boolean, encoding?: any) => {
    try {
      const { signature } = await remoteSign(payload, { keyType, encoding, hashBeforeSign, type });
      if (!signature) {
        throw new Error('Empty signature returned from blocklet-service');
      }
      return signature;
    } catch (error) {
      throw new Error(
        `Remote signing failed: ${(error as Error).message || 'unknown error'}. Ensure blocklet-service signing API is available.`
      );
    }
  };

  // Add remote signJWT method
  // Match the signature: signJWT(payload?, doSign?, version?)
  (remoteWallet as any).signJWT = async (payload?: any, doSign?: boolean, version?: string) => {
    try {
      const { token } = await remoteSignJWT(payload, { doSign, version, keyType, type });
      if (!token) {
        throw new Error('Empty JWT token returned from blocklet-service');
      }
      return token;
    } catch (error) {
      throw new Error(
        `Remote JWT signing failed: ${(error as Error).message || 'unknown error'}. Ensure blocklet-service signing API is available.`
      );
    }
  };

  // Add remote signETH method
  (remoteWallet as any).signETH = async (data: string, hashBeforeSign?: boolean) => {
    try {
      const { signature } = await remoteSignETH(data, { hashBeforeSign, keyType, type: 'ethereum' });
      if (!signature) {
        throw new Error('Empty signature returned from blocklet-service');
      }
      return signature;
    } catch (error) {
      throw new Error(
        `Remote ETH signing failed: ${(error as Error).message || 'unknown error'}. Ensure blocklet-service signing API is available.`
      );
    }
  };

  return remoteWallet;
};

/**
 * @param {string} [type=process.env.CHAIN_TYPE] can only be 'eth|ethereum' or 'default|arcblock'
 * @param {string} [appSk=process.env.BLOCKLET_APP_SK] must be hex
 * @param {string} [keyType='sk'] key type to use ('sk' or 'psk')
 * @return {WalletObject}  {WalletObject}
 */
export const getWallet = (
  type?: DIDTypeShortcut,
  appSk: string = process.env.BLOCKLET_APP_SK,
  keyType: 'sk' | 'psk' = 'sk'
): WalletObject => {
  // BLOCKLET_WALLET_TYPE is for backward compatibility
  // eslint-disable-next-line no-param-reassign
  type = type || process.env.CHAIN_TYPE || process.env.BLOCKLET_WALLET_TYPE;

  const cacheKey = [type, appSk || REMOTE_CACHE_PLACEHOLDER, keyType].join('_');
  const cache = cacheWallet.get(cacheKey);
  if (cache) return cache;

  const walletType = isEthereumType(DidType(type))
    ? WalletType(type)
    : WalletType({ role: types.RoleType.ROLE_APPLICATION, pk: types.KeyType.ED25519, hash: types.HashType.SHA3 });

  if (!appSk) {
    let appPk;
    let envKey;
    if (isEthereumType(DidType(type))) {
      appPk = keyType === 'psk' ? process.env.BLOCKLET_APP_PPK_ETH : process.env.BLOCKLET_APP_PK_ETH;
      envKey = keyType === 'psk' ? 'BLOCKLET_APP_PPK_ETH' : 'BLOCKLET_APP_PK_ETH';
    } else {
      appPk = keyType === 'psk' ? process.env.BLOCKLET_APP_PPK : process.env.BLOCKLET_APP_PK;
      envKey = keyType === 'psk' ? 'BLOCKLET_APP_PPK' : 'BLOCKLET_APP_PK';
    }

    if (!appPk) {
      throw new Error(`Missing public key for ${keyType.toUpperCase()} wallet: ${envKey}`);
    }

    const currentWallet = createRemoteWallet(appPk, walletType, keyType);
    cacheWallet.set(cacheKey, currentWallet);
    return currentWallet;
  }

  const sk = isEthereumType(DidType(type)) ? appSk.slice(0, 66) : appSk;
  const currentWallet = fromSecretKey(sk, walletType);
  cacheWallet.set(cacheKey, currentWallet);
  return currentWallet;
};

/**
 * Create wallet from app DID with automatic fallback to remote signing
 * @param sub - Subject identifier (e.g., 'email|user@example.com')
 * @param type - DID type shortcut (e.g., 'ethereum')
 * @param index - Index for deriving wallet (default: 0)
 * @param keyType - Key type to use ('sk' or 'psk', default: 'sk')
 * @returns Wallet object with sign and signJWT methods
 */
export const deriveWallet = async (
  sub: string,
  type?: DIDTypeArg,
  index?: number,
  keyType: 'sk' | 'psk' = 'sk'
): Promise<WalletObject> => {
  const appSk = keyType === 'psk' ? process.env.BLOCKLET_APP_PSK : process.env.BLOCKLET_APP_SK;

  // If we have a secret key, use local fromAppDid
  if (appSk) {
    return fromAppDid(sub, appSk, type, index);
  }

  // No secret key available, use remote fromAppDid
  const walletJSON = await remoteDeriveWallet(sub, type, index, { keyType });
  const wallet = fromJSON(walletJSON);
  if (!isValid(wallet, true)) {
    throw new Error('Invalid response from remote fromAppDid: wallet is invalid');
  }

  return wallet;
};

// BLOCKLET_WALLET_TYPE is for backward compatibility
export const getPermanentWallet = () =>
  getWallet(process.env.CHAIN_TYPE || process.env.BLOCKLET_WALLET_TYPE, process.env.BLOCKLET_APP_PSK, 'psk');

export const getEthereumWallet = (permanent = false) =>
  getWallet(
    'ethereum',
    permanent ? process.env.BLOCKLET_APP_PSK : process.env.BLOCKLET_APP_SK,
    permanent ? 'psk' : 'sk'
  );

export const getAccessWallet = () =>
  getWallet(
    'arcblock',
    // Compatible with previous version where APP_ASK does not exist
    process.env.BLOCKLET_APP_ASK || process.env.BLOCKLET_APP_SK,
    'sk'
  );

// Expose helper methods as properties of getWallet
getWallet.getPermanentWallet = getPermanentWallet;
getWallet.getEthereumWallet = getEthereumWallet;
getWallet.getPkWallet = getPkWallet;
getWallet.deriveWallet = deriveWallet;
getWallet.getAccessWallet = getAccessWallet;

getWallet.getPermanentWallet = getPermanentWallet;
getWallet.getEthereumWallet = getEthereumWallet;
getWallet.getPkWallet = getPkWallet;
