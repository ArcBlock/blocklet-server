import { joinURL } from 'ufo';
import { BN } from '@ocap/util';
import { isValidFactory } from '@ocap/asset';
import { toFactoryAddress } from '@arcblock/did-util';
// eslint-disable-next-line import/no-extraneous-dependencies
import { BlockletPaymentPrice } from '@blocklet/server-js';
import { getBlockletPurchaseTemplate } from '../nft-templates';
import { TBlockletMeta } from '../types';

const createShareContract = ({
  tokens = [],
  shares = [],
}: {
  tokens?: Pick<BlockletPaymentPrice, 'address' | 'value'>[];
  shares: { value: number; address: string }[];
}): string => {
  const zeroBN = new BN(0);
  const decimals = 1000000; // we only support 6 decimals on share ratio
  const decimalsBN = new BN(decimals);
  const contract: string[] = [];
  const shareSum: number = shares.reduce((sum, x) => sum + x.value, 0);

  if (shareSum > 1) {
    throw new Error('payment.share invalid: share sum should not be greater than 1');
  }
  if (Array.isArray(tokens)) {
    tokens.forEach(({ address: tokenAddress, value: valueItem }) => {
      const valueBN = new BN(valueItem);

      if (valueBN.lt(zeroBN)) {
        throw new Error('token price must be greater than or equal to zero');
      }
      shares.forEach(({ address, value }) => {
        const ratio = new BN(value * decimals);
        const amount = valueBN.mul(ratio).div(decimalsBN);
        contract.push(`transferToken('${tokenAddress}','${address}','${amount.toString()}')`);
      });
    });
  }

  return contract.join(';\n');
};

// we need to ensure that blocklet purchase factory does not change across changes
const createNftFactoryItx = ({
  meta,
  tokens,
  shares,
  issuers,
  serviceUrl,
}: {
  meta: TBlockletMeta;
  tokens: Pick<BlockletPaymentPrice, 'address' | 'value'>[];
  shares: { value: number; address: string }[];
  issuers: string[];
  serviceUrl: string;
}) => {
  const factoryOutput = getBlockletPurchaseTemplate(serviceUrl);
  const itx = {
    name: meta.title || meta.name,
    description: `Purchase NFT factory for blocklet ${meta.name}`,
    settlement: 'instant',
    limit: 0,
    trustedIssuers: issuers,
    input: {
      tokens: [...tokens],
      assets: [],
      variables: [],
    },
    output: {
      issuer: '{{ctx.issuer.id}}',
      parent: '{{ctx.factory}}',
      moniker: 'BlockletPurchaseNFT',
      readonly: true,
      transferrable: false,
      data: factoryOutput,
    },
    data: {
      type: 'json',
      value: {
        did: meta.did,
        url: joinURL(serviceUrl, `/blocklet/${meta.did}`),
        name: meta.name,
      },
    },
    hooks: [
      {
        name: 'mint',
        type: 'contract',
        hook: createShareContract({ tokens, shares }),
      },
    ],
  };

  // @ts-ignore
  itx.address = toFactoryAddress(itx);
  isValidFactory(itx);
  return itx;
};

export { createShareContract };
export { createNftFactoryItx };
export default {
  createShareContract,
  createNftFactoryItx,
};
