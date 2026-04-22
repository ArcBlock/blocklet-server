/* eslint-disable object-curly-newline */
import { useContext } from 'react';
import createSessionContext from '@arcblock/did-connect-react/lib/Session';
import { SESSION_CACHE_TTL, SESSION_TTL } from '@abtnode/constant';
import { formatCacheTtl } from '@arcblock/did-connect-react/lib/utils';

let path = '/';
if (window.env) {
  path = window.env.groupPathPrefix || window.env.pathPrefix || '/';
}

const sessionTokenExpireInDays = formatCacheTtl(
  window.blocklet?.settings?.session?.cacheTtl,
  SESSION_CACHE_TTL / 86400
); // 1h
const refreshTokenExpireInDays = formatCacheTtl(window.blocklet?.settings?.session?.ttl, SESSION_TTL / 86400); // 7days

const { SessionProvider, SessionContext, SessionConsumer, withSession } = createSessionContext(
  'login_token',
  'cookie',
  {
    returnDomain: false,
    path,
    expireInDays: sessionTokenExpireInDays,
  },
  {
    refreshTokenStorageKey: 'refresh_token',
    refreshTokenExpireInDays,
  }
);

function useSessionContext() {
  const info = useContext(SessionContext);
  return info;
}

export { SessionProvider, SessionContext, SessionConsumer, useSessionContext, withSession };
