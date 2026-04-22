import { toBase58 } from '@ocap/util';
import type { WalletObject } from '@ocap/wallet';
import stableStringify from 'json-stable-stringify';

export interface BlockletMeta {
  name: string;
  version: string;
  did: string;
  status: string;
}

interface Signature {
  type?: string;
  name: string;
  signer: string;
  pk: string;
  created: string;
  sig?: string;
}

export const sign = async (blockletMeta: BlockletMeta, wallet: WalletObject<string>) => {
  const walletJSON = wallet.toJSON();

  const signatureData: Signature = {
    type: walletJSON.type.pk,
    name: blockletMeta.name,
    signer: walletJSON.address,
    pk: toBase58(walletJSON.pk),
    created: new Date().toISOString(),
  };

  const signature = await wallet.sign(stableStringify({ ...blockletMeta, signatures: [signatureData] }) ?? '');
  signatureData.sig = toBase58(signature);

  return signatureData;
};
