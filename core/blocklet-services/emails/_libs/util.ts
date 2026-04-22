import { getConfigByChainId, EVM_PREFIX } from './config';

export const isEVMChain = (chainId: string) => {
  if (!chainId) {
    return false;
  }

  return chainId.startsWith(EVM_PREFIX);
};

export const getExplorerUrl = (chainId: string) => {
  const chain = getConfigByChainId(chainId);
  if (chain) {
    return chain.explorer;
  }

  return '';
};
