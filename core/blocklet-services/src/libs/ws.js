import { usePrevious, useCreation, useUnmount } from 'ahooks';
import { WsClient } from '@arcblock/ws';
import { useSubscription as baseUseSubscription } from '@abtnode/ux/lib/hooks/use-subscription';
import { useSessionContext } from '../contexts/session';

const client = {};

export function create(endpoint = 'admin') {
  const pathPrefix = (window.env && window.env.apiPrefix ? window.env.apiPrefix : '/').replace(/\/$/, '');
  const url = `//${window.location.host}${pathPrefix}/${endpoint}`;
  return new WsClient(url, {
    heartbeatIntervalMs: 100 * 1000,
  });
}

export default function getWsClient(endpoint = 'admin') {
  if (!client[endpoint]) {
    client[endpoint] = create(endpoint);
  }

  return client[endpoint];
}

export const useSubscription = (eventName, cb = () => {}, deps = [], endpoint = 'admin') => {
  const event = `${window.blocklet.did}/${eventName}`;
  const { session } = useSessionContext();
  const userDid = useCreation(() => session.user?.did, [session.user]);
  const previousUserDid = usePrevious(userDid);

  useUnmount(() => {
    Object.keys(client).forEach((key) => {
      if (client[key]?.isConnected()) {
        client[key]?.disconnect();
      }
      delete client[key];
    });
  });

  // 同步检查：如果用户切换了，断开并重新连接所有客户端
  if (previousUserDid && previousUserDid !== userDid) {
    Object.keys(client).forEach((key) => {
      if (client[key]) {
        if (client[key].isConnected()) {
          client[key].off(event, cb);
          client[key].disconnect(() => {
            client[key].connect();
          });
        }
      }
    });
  }
  if (!client[endpoint] && session.user) {
    client[endpoint] = getWsClient(endpoint);
    client[endpoint].connect();
  }
  baseUseSubscription({ wsClient: !eventName || !userDid ? null : client[endpoint], event, cb, deps });
  return client[endpoint];
};
