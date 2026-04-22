import { useContext, useState, useEffect } from 'react';
import Button from '@arcblock/ux/lib/Button';
import Center from '@arcblock/ux/lib/Center';
import Alert from '@mui/material/Alert';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { NodeContext } from '@abtnode/ux/lib/contexts/node';
import { createProxyClient } from '@abtnode/ux/lib/contexts/util';

import restApi from '../libs/api';
import getClient from '../libs/node';
import getWsClient, { create, useSubscription } from '../libs/ws';
import { getSessionToken, setSessionToken, setRefreshToken } from '../libs/util';
import { useSessionContext } from './session';

const { Provider, Consumer } = NodeContext;

const MAX_RETRY = 4;

const prefix = (window.env && window.env.apiPrefix) || '/';
const imgPrefix = `${prefix}/images`.replace(/\/+/g, '/');

const getSessionInHeader = () => {
  const token = getSessionToken();
  const headers = {
    authorization: `Bearer ${token}`,
  };
  return headers;
};

// eslint-disable-next-line react/prop-types
function NodeProvider({ children }) {
  const { t, locale } = useLocaleContext();
  const { session, connectApi } = useSessionContext();

  const originalClient = getClient();
  const [newInfo, setNewInfo] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const getNodeInfo = async ({ silent = true, retries = MAX_RETRY } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const { info } = await originalClient.getNodeInfo();
      if (info) {
        info.startAt = new Date() - info.uptime;
      }
      setNewInfo(info);
    } catch (err) {
      if (retries > 0) {
        setTimeout(() => getNodeInfo({ silent, retries: retries - 1 }), 1000);
      } else {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Create a proxied client
  const client = createProxyClient({
    client: originalClient,
    t,
    locale,
    enableSessionHardening: newInfo?.enableSessionHardening,
    connectApi,
    getSessionToken,
    setSessionToken,
    setRefreshToken,
    session,
  });

  useEffect(() => {
    getNodeInfo({ silent: false });
  }, []); // eslint-disable-line

  const value = {
    loading,
    error,
    info: newInfo,
    refresh: getNodeInfo,
    api: client,
    restApi,
    prefix,
    imgPrefix,
    getSessionInHeader,
    ws: {
      getWsClient,
      create,
      useSubscription,
    },
    type: 'daemon',
  };

  if (value.error) {
    return (
      <Center>
        <Alert severity="error">
          <div>
            {/* message */}
            {value.error.message === 'Network Error' ? t('health.connectionErrorTip') : value.error.message}
            {/* retry */}
            <Button onClick={() => getNodeInfo({ silent: false })}>
              <span style={{ color: '#44cdc6', textDecoration: 'underline' }}>{t('common.retry')}</span>
            </Button>
          </div>
        </Alert>
      </Center>
    );
  }

  return <Provider value={{ node: value }}>{children}</Provider>;
}

function useNodeContext() {
  const { node } = useContext(NodeContext);
  return node;
}

export { NodeContext, NodeProvider, Consumer as NodeConsumer, useNodeContext };
