import { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import { BlockletContext } from '@abtnode/ux/lib/contexts/blocklet';
import { useBlocklet } from '@abtnode/ux/lib/hooks/blocklet';
import { getBlockletAppIdList } from '@blocklet/meta/lib/util';

import { useNodeContext } from './node';
import getIP from '../libs/get-ip';

const { Provider, Consumer } = BlockletContext;

function BlockletProvider({ did, children }) {
  const {
    api: client,
    ws: { useSubscription },
  } = useNodeContext();

  const {
    loading,
    loadingRuntimeInfo,
    error,
    blocklet,
    recommendedDomain,
    runtimeHistory,
    actions: { refreshBlocklet, refreshDomainStatus, setBlocklet, configNavigations, updateBlockletDomainAliases },
  } = useBlocklet({ did, client, useSubscription, getIP, useLocaleContext, getOptionalComponents: true });

  useEffect(() => {
    refreshBlocklet();
  }, [did]); // eslint-disable-line

  const value = {
    did,
    client,
    loading,
    loadingRuntimeInfo,
    error,
    blocklet,
    recommendedDomain,
    runtimeHistory,
    appIdList: blocklet ? getBlockletAppIdList(blocklet) : [],
    actions: {
      refreshBlocklet,
      refreshDomainStatus,
      setBlocklet,
      configNavigations,
      updateBlockletDomainAliases,
    },
  };

  return <Provider value={value}>{children}</Provider>;
}

BlockletProvider.propTypes = {
  did: PropTypes.string.isRequired,
  children: PropTypes.any.isRequired,
};

function useBlockletContext() {
  return useContext(BlockletContext);
}

export { BlockletContext, BlockletProvider, Consumer as BlockletConsumer, useBlockletContext };
