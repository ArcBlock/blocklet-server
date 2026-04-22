import omit from 'lodash/omit';
import stringify from 'json-stable-stringify';
import { fromPublicKey, WalletObject } from '@ocap/wallet';
import { toTypeInfo, isFromPublicKey } from '@arcblock/did';

export async function signResponse<T extends Record<string, any>>(
  data: T,
  wallet: WalletObject
): Promise<T & { $signature: string }> {
  const payload = stringify(data);
  const signature = await wallet.sign(payload);
  const signed = { ...data, $signature: signature };
  return signed;
}

export function verifyResponse<T extends Record<string, any>>(
  signed: T & { $signature?: string },
  wallet: WalletObject
): Promise<boolean> {
  if (!signed.$signature) {
    return Promise.resolve(false);
  }

  return wallet.verify(stringify(omit(signed, '$signature')), signed.$signature);
}

type VaultRecord = {
  pk: string;
  did: string;
  at: number;
  sig: string;
  approverSig?: string;
  approverDid?: string;
  approverPk?: string;
};

export async function verifyVault(vaults: VaultRecord[], appPid: string, throwOnError = false): Promise<string> {
  // return empty string if the vaults list is empty
  if (!Array.isArray(vaults) || vaults.length === 0) {
    if (throwOnError) {
      throw new Error('vaults list is empty');
    }
    return '';
  }

  // throws if the vaults list is not in ascending order by `at` field
  for (let i = 1; i < vaults.length; i++) {
    if (vaults[i].at <= vaults[i - 1].at) {
      if (throwOnError) {
        throw new Error('vaults are not in ascending order');
      }
      return '';
    }
  }

  // throw if there are duplicate vaults
  const uniqueVaults = new Set(vaults.map((vault) => vault.did));
  if (uniqueVaults.size !== vaults.length) {
    if (throwOnError) {
      throw new Error('vaults list has duplicate vaults');
    }
    return '';
  }

  // verify signature for each vault: approve and commit
  for (let i = 0; i < vaults.length; i++) {
    const vault = vaults[i];
    if (!isFromPublicKey(vault.did, vault.pk)) {
      if (throwOnError) {
        throw new Error(`vault did and pk mismatch: ${vault.did}(${vault.pk})`);
      }
      return '';
    }

    let data = Buffer.from(`vault:${appPid}`);
    for (let j = 0; j <= i; j++) {
      data = Buffer.concat([data, Buffer.from(`:${vaults[j].did}`)]);
    }

    // verify approve signature for non-first vault
    if (!vault.approverSig) {
      if (throwOnError) {
        throw new Error(`vault approve signature missing for ${vault.did}`);
      }
      return '';
    }
    try {
      let wallet: WalletObject;
      if (i > 0) {
        const prevVault = vaults[i - 1];
        wallet = fromPublicKey(prevVault.pk, toTypeInfo(prevVault.did));
      } else {
        if (!vault.approverPk || !vault.approverDid || !isFromPublicKey(vault.approverDid, vault.approverPk)) {
          if (throwOnError) {
            throw new Error(`approver config missing for ${vault.did}`);
          }
          return '';
        }
        wallet = fromPublicKey(vault.approverPk, toTypeInfo(vault.approverDid));
      }

      // eslint-disable-next-line no-await-in-loop
      if ((await wallet.verify(data, vault.approverSig)) === false) {
        if (throwOnError) {
          throw new Error(`signature verify failed for ${vault.did}`);
        }
        return '';
      }
    } catch (err) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'test') {
        console.error(err);
      }
      if (throwOnError) {
        throw new Error(`vault approve verify failed: ${err.message}`);
      }
      return '';
    }

    // verify commit signature for all vaults
    if (!vault.sig) {
      if (throwOnError) {
        throw new Error(`vault commit signature missing for ${vault.did}`);
      }
      return '';
    }
    try {
      const wallet = fromPublicKey(vault.pk, toTypeInfo(vault.did));
      if (vault.approverSig) {
        data = Buffer.concat([data, Buffer.from(`:${vault.approverSig}`)]);
      }

      // eslint-disable-next-line no-await-in-loop
      if ((await wallet.verify(data, vault.sig)) === false) {
        if (throwOnError) {
          throw new Error(`commit signature verify failed for ${vault.did}`);
        }
        return '';
      }
    } catch (err) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'test') {
        console.error(err);
      }
      if (throwOnError) {
        throw new Error(`vault commit verify failed: ${err.message}`);
      }
      return '';
    }
  }

  return vaults[vaults.length - 1].did;
}
