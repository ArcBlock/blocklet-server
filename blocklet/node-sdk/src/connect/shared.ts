import { signV2 } from '@arcblock/jwt';
import { getChainInfo } from '@blocklet/meta/lib/util';
import { WalletObject, fromPublicKey } from '@ocap/wallet';
import { types } from '@ocap/mcrypto';
import get from 'lodash/get';

import { getWallet } from '../wallet';
import { getSourceAppPid } from '../util/login';
import { getAppInfo, getBlockletInfoSimple, getMemberAppInfo } from '../util/app-info';

// Copied from @abtnode/auth to avoid circular dependency
function isMaster(site) {
  return site?.isMaster !== false;
}
// Copied from @abtnode/auth to avoid circular dependency
function getFederatedMaster(blocklet) {
  const { sites } = blocklet?.settings?.federated || {};
  const masterSite = (sites || []).find((item) => isMaster(item));
  return masterSite || null;
}

// wraps value in closure or returns closure
const closure = (value: any): Function => (typeof value === 'function' ? value : () => value);

const getDelegator = () => {
  // BLOCKLET_WALLET_TYPE is for backward compatibility
  const { BLOCKLET_APP_ID, BLOCKLET_APP_PID, BLOCKLET_WALLET_TYPE, CHAIN_TYPE } = process.env;
  if (BLOCKLET_APP_ID && BLOCKLET_APP_PID && BLOCKLET_APP_ID !== BLOCKLET_APP_PID) {
    return getWallet(CHAIN_TYPE || BLOCKLET_WALLET_TYPE, '', 'psk');
  }

  return null;
};

const getDelegatee = () => {
  // BLOCKLET_WALLET_TYPE is for backward compatibility
  const { BLOCKLET_WALLET_TYPE, CHAIN_TYPE } = process.env;
  return getWallet(CHAIN_TYPE || BLOCKLET_WALLET_TYPE, '', 'sk');
};

const getDelegation = async (delegator: WalletObject, delegatee: WalletObject): Promise<string> => {
  const payload = {
    agentDid: `did:abt:${delegatee.address}`,
    permissions: [
      {
        role: 'DIDConnectAgent',
        claims: [
          'authPrincipal',
          'profile',
          'signature',
          'prepareTx',
          'agreement',
          'verifiableCredential',
          'asset',
          'assetOrVC',
          'keyPair',
          'encryptionKey',
        ],
      },
    ],
    exp: Math.floor(new Date().getTime() / 1000) + 60 * 60, // valid for 1 hour
  };

  if ((delegator as any).secretKey) {
    const token = await signV2(delegator.address, (delegator as any).secretKey, payload);
    return token;
  }

  // Remote signing mode
  if (typeof (delegator as any).signJWT === 'function') {
    // Match signV2 behavior: doSign=true, version='1.1.0'
    const token = await (delegator as any).signJWT(payload, true, '1.1.0');
    return token;
  }

  throw new Error('Delegator wallet does not support signing (no secretKey or signJWT method available)');
};

const getAuthenticatorProps = (options = {}) => ({
  chainInfo: () => getChainInfo(process.env),
  ...options,
  async appInfo(...args: any[]) {
    const mergeInfo = await closure((options as $TSFixMe).appInfo)(...args);
    const { request, baseUrl } = args[0];
    const appInfo = await getAppInfo({
      request,
      baseUrl,
      getNodeInfo() {
        return Promise.resolve({
          did: process.env.ABT_NODE_DID,
        });
      },
    });
    return {
      ...appInfo,
      // Override default appInfo with any explicitly provided fields
      ...(mergeInfo || {}),
    };
  },
  async memberAppInfo({ request, baseUrl }) {
    const memberAppInfo = await getMemberAppInfo({
      request,
      baseUrl,
      getNodeInfo() {
        return Promise.resolve({
          did: process.env.ABT_NODE_DID,
        });
      },
    });
    return memberAppInfo;
  },
  async delegator({ request }) {
    const sourceAppPid = getSourceAppPid(request);
    if (sourceAppPid) {
      const { federated } = await getBlockletInfoSimple();
      const masterSite = getFederatedMaster({ settings: { federated } });

      if (masterSite?.pk) {
        // NOTE: The type parameter must match the one used when the blocklet was generated
        const type = {
          role: types.RoleType.ROLE_APPLICATION,
          pk: types.KeyType.ED25519,
          hash: types.HashType.SHA3,
          address: types.EncodingType.BASE58,
        };
        const delegator = fromPublicKey(masterSite.pk, type);
        return delegator;
      }
      throw new Error('federated login master-site pk not found');
    }

    const delegator = getDelegator();
    return delegator;
  },
  async delegation({ request }) {
    const sourceAppPid = getSourceAppPid(request);
    if (sourceAppPid) {
      const { federated } = await getBlockletInfoSimple();
      const delegation = get(federated, 'config.delegation');
      if (delegation) {
        return delegation;
      }
      throw new Error('federated login master-site granted delegation not found');
    }

    const delegator = getDelegator();
    if (delegator) {
      const delegatee = getDelegatee();
      return getDelegation(delegator, delegatee);
    }

    return null;
  },
});

export { getDelegation, getDelegator, getDelegatee, getAuthenticatorProps };
