/* eslint-disable @typescript-eslint/indent */
import get from 'lodash/get';
import omit from 'lodash/omit';
import cloneDeep from 'lodash/cloneDeep';
import stableStringify from 'json-stable-stringify';
import { toTypeInfo } from '@arcblock/did';
import { fromPublicKey } from '@ocap/wallet';
import { verify } from '@arcblock/jwt';
import { fromBase64 } from '@ocap/util';
import Debug from 'debug';
import { TBlockletMeta, TSignature } from './types';

const debug = Debug('@blocklet/meta:verifyMultiSig');

async function verifyDelegationToken(signature: TSignature): Promise<boolean> {
  if (signature.delegation) {
    // @ts-ignore
    const payload = JSON.parse(fromBase64(signature.delegation.split('.')[1]));

    if (payload.from !== signature.signer) {
      debug('verify payload.from failed', { payload, signature });
      return false;
    }
    if (payload.to !== signature.delegatee) {
      debug('verify payload.to failed', { payload, signature });
      return false;
    }
    if (!get(payload, 'permissions', []).includes('publish_blocklet')) {
      debug('verify payload.permissions failed', payload);
      return false;
    }
    // Verify the delegation token
    if (!(await verify(signature.delegation, signature.pk))) {
      debug('verify delegation token failed', signature);
      return false;
    }
  }
  return true;
}

const verifyMultiSig = async (blockletMeta: TBlockletMeta): Promise<boolean> => {
  const { signatures: tmpSignatures, ...meta } = blockletMeta;

  const signatures = cloneDeep(tmpSignatures);

  if (!Array.isArray(signatures)) {
    throw new Error('Invalid signatures, signatures should be an array');
  }
  if (signatures.length === 0) {
    throw new Error('Invalid signatures, found empty');
  }
  const { length } = signatures;

  let lastSignature = null;
  for (let i = 0; i < length; i++) {
    const signature = signatures.shift();

    // Verify delegation token
    // eslint-disable-next-line no-await-in-loop
    if (!(await verifyDelegationToken(signature))) {
      return false;
    }
    const { sig, signer, pk } = signature.delegation
      ? {
          sig: signature.sig,
          signer: signature.delegatee,
          pk: signature.delegateePk,
        }
      : signature;

    delete signature.sig;
    debug('verify', { signer });
    let toBeVerifiedMeta: any = { ...meta };
    if (lastSignature && lastSignature.appended) {
      debug('appended fields', { signer, appended: lastSignature.appended });
      lastSignature.appended.forEach((field) => {
        toBeVerifiedMeta = omit(toBeVerifiedMeta, field);
      });
    }
    if (signature.excludes && signature.excludes.length > 0) {
      debug('excludes fields', { signer, excludes: signature.excludes });
      signature.excludes.forEach((field) => {
        toBeVerifiedMeta = omit(toBeVerifiedMeta, field);
      });
    }
    const type = toTypeInfo(signer);
    const wallet = fromPublicKey(pk, type);
    // eslint-disable-next-line no-await-in-loop
    const verifyRes = await wallet.verify(
      stableStringify({ ...toBeVerifiedMeta, signatures: [signature, ...signatures] }),
      sig
    );

    if (verifyRes !== true) {
      debug('verify failed', { signer });
      return verifyRes;
    }
    lastSignature = signature;
  }
  return true;
};

export { verifyMultiSig, debug };
