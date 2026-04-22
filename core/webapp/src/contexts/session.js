/* eslint-disable object-curly-newline */
import { useContext } from 'react';
import createSessionContext from '@arcblock/did-connect-react/lib/Session';

const { SessionProvider, SessionContext, SessionConsumer, withSession } = createSessionContext(
  '__sst',
  'ls',
  {},
  // 这里需要传入 refreshToken 的相关配置
  { rolling: false, refreshTokenStorageKey: '__srt' }
);

function useSessionContext() {
  const info = useContext(SessionContext);
  return info;
}

export { SessionProvider, SessionContext, SessionConsumer, useSessionContext, withSession };
