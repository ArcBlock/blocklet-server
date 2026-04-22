import { useContext, useMemo } from 'react';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { NodeContext } from '@abtnode/ux/lib/contexts/node';
import { createProxyClient } from '@abtnode/ux/lib/contexts/util';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';

import originalClient from '../libs/client';
import getWsClient, { create, useSubscription } from '../libs/ws';
import restApi from '../libs/api';
import { getSessionToken, setSessionToken, setRefreshToken } from '../util';
import { useSessionContext } from './session';

const { Provider, Consumer } = NodeContext;

const imgPrefix =
  process.env.NODE_ENV === 'development'
    ? `${WELLKNOWN_SERVICE_PATH_PREFIX}/images`
    : `${WELLKNOWN_SERVICE_PATH_PREFIX}/static/images`;

// eslint-disable-next-line react/prop-types
function NodeProvider({ children }) {
  const { t, locale } = useLocaleContext();
  // NOTICE: need to refresh the page after changing the server settings
  const { serverDid, serverVersion, enableSessionHardening, mode, nftDomainUrl, ownerNft, launcher, runtimeConfig } =
    window.env;
  const { session, connectApi } = useSessionContext();

  // Create a proxied client with memoization
  const client = useMemo(
    () =>
      createProxyClient({
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
      }),
    [t, locale, enableSessionHardening, connectApi, session]
  );

  const info = useMemo(
    () => ({
      // server did
      did: serverDid,
      version: serverVersion,
      mode,
      nftDomainUrl,
      ownerNft,
      launcher,
      runtimeConfig,
    }),
    [serverDid, serverVersion, mode, nftDomainUrl, ownerNft, launcher, runtimeConfig]
  );

  const value = useMemo(
    () => ({
      node: {
        api: client,
        restApi,
        prefix: WELLKNOWN_SERVICE_PATH_PREFIX,
        imgPrefix,
        getSessionInHeader: () => {},
        ws: {
          getWsClient,
          create,
          useSubscription,
        },
        type: 'service',
        info,
      },
    }),
    [client, info]
  );

  return <Provider value={value}>{children}</Provider>;
}

function useNodeContext() {
  const { node } = useContext(NodeContext);
  return node;
}

export { NodeContext, NodeProvider, Consumer as NodeConsumer, useNodeContext };
