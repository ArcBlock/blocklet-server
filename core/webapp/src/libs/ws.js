import { WsClient } from '@arcblock/ws';
import { useSubscription as baseUseSubscription } from '@abtnode/ux/lib/hooks/use-subscription';
import { useSessionContext } from '../contexts/session';
import { getSessionToken } from './util';

let client;

export function create(token) {
  const pathPrefix = (window.env && window.env.apiPrefix ? window.env.apiPrefix : '/').replace(/\/$/, '');
  const url = `//${window.location.host}${pathPrefix}`;
  return new WsClient(url, {
    heartbeatIntervalMs: 10 * 1000,
    params: () => ({
      token: token || getSessionToken(),
    }),
  });
}

export default function getWsClient() {
  if (!client) {
    client = create();
  }

  return client;
}

export const useSubscription = (event, cb = () => {}, deps = []) => {
  const { session } = useSessionContext();

  if (!client && session.user) {
    client = getWsClient();
    client.connect();
  }

  baseUseSubscription({ wsClient: client, event, cb, deps });

  return client;
};
