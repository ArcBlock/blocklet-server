import { useState, useContext, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { fromUnitToToken, fromTokenToUnit, BN } from '@ocap/util';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import Toast from '@arcblock/ux/lib/Toast';
import { BlockletContext } from '@abtnode/ux/lib/contexts/blocklet';
import { useBlocklet } from '@abtnode/ux/lib/hooks/blocklet';
import { getBlockletAppIdList } from '@blocklet/meta/lib/util';
import getChainClient from '@abtnode/ux/lib/chain';
import { createProxyClient } from '@abtnode/ux/lib/contexts/util';

import api from '../libs/api';
import originalClient from '../libs/client';
import { useSubscription } from '../libs/ws';
import getIP from '../libs/get-ip';
import { getSessionToken, setSessionToken, setRefreshToken } from '../util';
import { useSessionContext } from './session';

const { Provider, Consumer } = BlockletContext;

const parseEndpoint = (endpoint, blocklet) => {
  const match = /^{env\.(.+)}$/.exec(endpoint);

  if (match && match[1]) {
    const item = (blocklet?.configs || []).find((x) => x.key === match[1]);
    if (!item && !item.value) {
      return '';
    }
    return item.value;
  }

  return endpoint;
};

const getChainConfig = (() => {
  const cache = {
    endpoint: '',
    data: {},
  };

  return async (endpoint) => {
    if (cache.endpoint === endpoint) {
      return cache.data;
    }
    const ocapClient = getChainClient(endpoint);
    const data = await ocapClient.getConfig();

    cache.endpoint = endpoint;
    cache.data = data;

    return data;
  };
})();

const { did, appId } = window.env;

function BlockletProvider({ children = null, mode }) {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [meta, setMeta] = useState({});
  const [gas, setGas] = useState();
  const [tokenInfo, setTokenInfo] = useState();
  const [launcherSession, setLauncherSession] = useState();
  const [refreshFlag, setRefreshSubscription] = useState(false);
  const { enableSessionHardening } = window.env;
  const { session, connectApi } = useSessionContext();
  const { t, locale } = useLocaleContext();

  const client = createProxyClient({
    client: originalClient,
    t,
    locale,
    enableSessionHardening,
    connectApi,
    getSessionToken,
    setSessionToken,
    setRefreshToken,
    session,
    inService: true,
  });

  const isSetupMode = mode === 'setup';

  const {
    loading: loadingBlocklet,
    loadingDiskInfo,
    loadingRuntimeInfo,
    error: blockletError,
    blocklet,
    recommendedDomain,
    runtimeHistory,
    actions: { refreshBlocklet, refreshDomainStatus, setBlocklet, updateBlockletDomainAliases },
  } = useBlocklet({
    did,
    client,
    useSubscription,
    getIP,
    useLocaleContext,
    getOptionalComponents: true,
  });

  const blockletDidRef = useRef(undefined);
  blockletDidRef.current = blocklet?.meta?.did;

  const refreshMeta = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('/blocklet/meta');
      setMeta(data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err);
      Toast.error(err.message);
    }
  };

  const refreshFuel = async ({ showError = true } = {}) => {
    if (!meta?.requirements?.fuels?.length) {
      return null;
    }

    // TODO: support multi token
    const { endpoint: rawEndpoint, value, address: configAddress } = meta.requirements.fuels[0];
    const endpoint = parseEndpoint(rawEndpoint, blocklet);

    const need = value;
    // 差额
    let deficiency = value;
    const doc = {
      endpoint,
      symbol: '',
      need,
      current: 0,
      owe: Number(need) > 0,
    };

    try {
      const ocapClient = getChainClient(endpoint);

      const { config: configStr } = await getChainConfig(endpoint);
      const _tokenInfo = JSON.parse(configStr).token;
      let address = configAddress;
      if (!address) {
        address = _tokenInfo.address;
      }
      setTokenInfo({ address: _tokenInfo.address, symbol: _tokenInfo.symbol, decimal: _tokenInfo.decimal });

      const {
        getAccountState: { state: accountState },
        getTokenState: { state: tokenState },
      } = await ocapClient.doBatchQuery({
        getAccountState: { address: appId },
        getTokenState: { address },
      });

      if (tokenState) {
        doc.symbol = tokenState.symbol;
      }

      const token = (accountState?.tokens || []).find((x) => x.address === address);
      if (token) {
        const needUnits = fromTokenToUnit(need, token.decimal || 18);
        doc.current = fromUnitToToken(token.value, token.decimal || 18);
        doc.owe = needUnits.gt(new BN(token.value));
        deficiency = Math.max(0, fromUnitToToken(needUnits.sub(new BN(token.value)), token.decimal || 18));
      }
    } catch (err) {
      if (showError) {
        Toast.error(err.message);
      }
    }

    setGas({ ...doc, deficiency });
    return doc;
  };

  const configBlocklet = async ({ configs, childDid }) => {
    await client.configBlocklet({ input: { did: [did].concat(childDid).filter(Boolean), configs } });
    return refreshBlocklet();
  };

  const configNavigations = async (value) => {
    const { blocklet: data } = await client.configNavigations({
      input: { did, navigations: value },
    });
    setBlocklet(data);
  };

  useEffect(() => {
    if (isSetupMode) {
      refreshMeta();
    }
    refreshBlocklet({ showError: false });
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!blocklet?.controller?.launcherSessionId) {
      return;
    }

    client
      .getLauncherSession({
        input: {
          launcherSessionId: blocklet.controller.launcherSessionId,
          launcherUrl: blocklet.controller.launcherUrl,
        },
      })
      .then((res) => {
        setLauncherSession(res.launcherSession);
      })
      .catch((err) => {
        console.error('get launcher session error', err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocklet?.appPid, refreshFlag]);

  const value = {
    loading: loading || loadingBlocklet,
    loadingDiskInfo,
    loadingRuntimeInfo,
    error: error || blockletError,
    blocklet,
    launcherSession,
    refreshFlag,
    refreshSubscription: () => setRefreshSubscription((prev) => !prev),
    did,
    recommendedDomain,
    runtimeHistory,
    appIdList: blocklet ? getBlockletAppIdList(blocklet) : [],
    // blocklet-service only
    // from __blocklet__.js, always exist
    env: window.blocklet || {},
    // setup only
    meta,
    gas,
    tokenInfo,
    client,
    mode,
    actions: {
      refreshBlocklet,
      refreshDomainStatus,
      setBlocklet,
      // setup only
      refreshMeta,
      refreshFuel,
      configBlocklet,
      configNavigations,
      updateBlockletDomainAliases,
    },
  };

  return <Provider value={value}>{children}</Provider>;
}

BlockletProvider.propTypes = {
  children: PropTypes.any,
  mode: PropTypes.oneOf(['dashboard', 'setup', 'start']).isRequired,
};

function useBlockletContext() {
  return useContext(BlockletContext);
}

export { BlockletContext, BlockletProvider, Consumer as BlockletConsumer, useBlockletContext };
