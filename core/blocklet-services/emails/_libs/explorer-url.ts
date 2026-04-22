import { joinURL, withQuery } from 'ufo';
import { types } from '@ocap/mcrypto';
import { toTypeInfo } from '@arcblock/did';
import { arcChainConfig } from './config';
import { isEVMChain, getExplorerUrl } from './util';

const { RoleType } = types;
const baseUrl = 'https://explorer.abtnetwork.io/explorer/';

export default function explorerUrl({
  hash,
  asset,
  rollup,
  address,
  token,
  stake,
  chainId = '',
}: {
  hash?: string;
  asset?: string;
  rollup?: string;
  address?: string;
  token?: string;
  stake?: string;
  chainId?: string;
}) {
  if (isEVMChain(chainId)) {
    const url = getExplorerUrl(chainId);

    if (hash) {
      return joinURL(url, `tx/${hash}`);
    }

    if (asset) {
      return joinURL(url, `token/${asset}`);
    }

    return joinURL(url, `address/${address}`);
  }

  const chain = arcChainConfig[chainId as keyof typeof arcChainConfig];
  const chainHost = chain?.defaultRPC;
  const host = chainHost ? `${chainHost}` : undefined;

  // rollup
  if (rollup && toTypeInfo(rollup).role === RoleType.ROLE_ROLLUP) {
    if (hash) {
      return withQuery(joinURL(baseUrl, `rollups/${rollup}/moves/${hash}`), { host });
    }

    return withQuery(joinURL(baseUrl, `rollups/${rollup}`), { host });
  }

  // asset
  if (asset) {
    return withQuery(joinURL(baseUrl, `assets/${asset}`), { host });
  }

  // tx
  if (hash) {
    return withQuery(joinURL(baseUrl, `txs/${hash}`), { host });
  }

  // tx
  if (token) {
    return withQuery(joinURL(baseUrl, `tokens/${token}/tx`), { host });
  }

  if (stake) {
    return withQuery(joinURL(baseUrl, `stakes/${stake}`), { host });
  }

  // account
  return withQuery(joinURL(baseUrl, `accounts/${address}`), { host });
}
