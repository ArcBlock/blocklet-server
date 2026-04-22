import get from 'lodash/get';
import { WalletObject } from '@ocap/wallet';
import { Hasher } from '@ocap/mcrypto';
// eslint-disable-next-line import/no-extraneous-dependencies
import { BlockletState } from '@blocklet/server-js';
import { getApplicationWallet as getBlockletWallet } from './wallet';
import { getDisplayName } from './util';

const getBlockletInfo = (
  state: BlockletState,
  nodeSk?: string,
  { returnWallet = true }: { returnWallet?: boolean } = {}
): {
  did: string; // blocklet meta did
  name: string;
  version: string;
  description: string;
  passportColor: string;
  appUrl: string;
  secret: string;
  tenantMode: string;
  wallet: WalletObject;
  permanentWallet: WalletObject;
} => {
  if (!state || typeof state !== 'object' || !Array.isArray(state.environments) || !get(state, 'meta.did')) {
    throw new Error('Blocklet state must be an object');
  }
  const { environments = [], configs = [] } = state;

  const envs = [...configs, ...environments];
  const customDescription = envs.find((x) => x.key === 'BLOCKLET_APP_DESCRIPTION');
  const customPassportColor = envs.find((x) => x.key === 'BLOCKLET_PASSPORT_COLOR');
  const customAppUrl = envs.find((x) => x.key === 'BLOCKLET_APP_URL');
  const customTenantMode = envs.find((x) => x.key === 'BLOCKLET_APP_TENANT_MODE');

  const { did, version } = state.meta;
  const name = getDisplayName(state);
  const description = get(customDescription, 'value', state.meta.description);
  const passportColor = get(customPassportColor, 'value', 'auto');
  const appUrl = get(customAppUrl, 'value', '');
  const tenantMode = get(customTenantMode, 'value', '');

  if (!returnWallet) {
    return {
      did,
      version,
      name,
      description,
      passportColor,
      appUrl,
      secret: '',
      wallet: null,
      permanentWallet: null,
      tenantMode,
    };
  }

  const customSk = envs.find((x) => x.key === 'BLOCKLET_APP_SK');
  const customType =
    envs.find((x) => x.key === 'BLOCKLET_APP_CHAIN_TYPE') || envs.find((x) => x.key === 'BLOCKLET_WALLET_TYPE');
  const permanentSk = envs.find((x) => x.key === 'BLOCKLET_APP_PSK');

  let type;
  if (customType && (customType.value === 'ethereum' || customType.value === 'eth')) {
    type = customType.value;
  }

  let wallet = null;
  let permanentWallet = null;

  if (customSk && customSk.value) {
    wallet = getBlockletWallet(customSk.value, undefined, type);
    if (permanentSk && permanentSk.value && permanentSk.value !== customSk.value) {
      permanentWallet = getBlockletWallet(permanentSk.value, undefined, type);
    }
  } else {
    if (!nodeSk || typeof nodeSk !== 'string') {
      throw new Error('Node secret key must be a string');
    }

    if (customType) {
      wallet = getBlockletWallet(state.meta.did, nodeSk, type);
    } else {
      wallet = getBlockletWallet(state.meta.did, nodeSk);
    }
  }

  const salt = state.settings?.session?.salt || '';
  const secret = Hasher.SHA3.hash256(
    Buffer.concat([wallet.secretKey, wallet.address, salt].filter(Boolean).map((v) => Buffer.from(v)))
  ) as string;

  return {
    did,
    version,
    name,
    description,
    passportColor,
    appUrl,
    secret,
    wallet,
    permanentWallet: permanentWallet || wallet,
    tenantMode,
  };
};

export { getBlockletInfo };
