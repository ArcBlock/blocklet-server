/* eslint-disable no-await-in-loop */
import { joinURL } from 'ufo';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import axios from '@abtnode/util/lib/axios';
import Client from '@ocap/client';
import { BLOCKLET_STORE_META_PATH } from '@abtnode/constant';
import { BLOCKLET_FACTORY_SHARES } from '@blocklet/constant';
import { createNftFactoryItx } from '@blocklet/meta/lib/payment/v2';
import { TBlockletMeta } from '@blocklet/meta/lib/types';

export interface Share {
  name: string;
  address: string;
  share: string;
  price: string;
  value: string;
}

const getStoreInfo = async (url: string) => {
  const { data } = await axios.get(joinURL(url, BLOCKLET_STORE_META_PATH), { timeout: 20 * 1000 });
  return data;
};

export const isValidChainEndpoint = async (endpoint: string) => {
  if (!endpoint) {
    return false;
  }

  const client = new Client(endpoint);
  try {
    const { info } = await client.getChainInfo();
    if (info.consensusVersion.split(' ').length === 2) {
      return client;
    }

    return false;
  } catch (err) {
    return false;
  }
};

export const getShare = async ({
  meta,
  storeUrl,
  developerDid,
}: {
  meta: Record<string, string>;
  storeUrl: string;
  developerDid: string;
}) => {
  const info = await getStoreInfo(storeUrl);

  const shares = cloneDeep(get(meta, 'payment.share', [])) as Pick<Share, 'name' | 'address' | 'value'>[];
  if (shares.length === 0) {
    shares.push({
      name: 'developer',
      address: developerDid,
      value: BLOCKLET_FACTORY_SHARES.developer as unknown as string,
    });
  }
  if (!shares.find(x => x.address === info.id)) {
    shares.push({
      name: 'store',
      address: info.id,
      value: BLOCKLET_FACTORY_SHARES.store as unknown as string,
    });
  }

  return shares;
};

/**
 * Ensure NFT factory exists for paid blocklets, the process must be deterministic.
 * If user changed the name/title of the blocklet, then a new factory will be created
 */
export const ensureBlockletNftFactory = async ({
  meta,
  storeUrl,
}: {
  meta: Record<string, string>;
  storeUrl: string;
}) => {
  const info = await getStoreInfo(storeUrl);
  const endpoint = info.chainHost;

  const ocapClient = await isValidChainEndpoint(endpoint);
  if (ocapClient === false) {
    throw new Error('Invalid chain endpoint fetched from store, please contact store administrator to fix');
  }

  // create factory nft itx
  const { itx } = await createNftFactoryItx({
    blockletMeta: meta as unknown as TBlockletMeta,
    ocapClient,
    issuers: [info.id],
    storeUrl,
  });

  return itx.address;
};
