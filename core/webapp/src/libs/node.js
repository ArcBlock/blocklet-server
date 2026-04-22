import NodeClient from '@blocklet/server-js';
import { getLocale } from '@arcblock/ux/lib/Locale/context';
import { getSessionToken } from './util';

let client;

export function create(token) {
  const prefix = (window.env ? window.env.apiPrefix : '/') || '/';
  const newClient = new NodeClient(() => `${prefix}/api/gql?locale=${getLocale()}`.replace(/\/+/g, '/').trim());
  newClient.setAuthToken(() => {
    if (token) {
      return token;
    }

    if (!window.localStorage) {
      return null;
    }

    return getSessionToken();
  });

  return newClient;
}

export default function createClient() {
  if (!client) {
    client = create();
  }

  return client;
}
