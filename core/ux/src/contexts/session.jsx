/* eslint-disable object-curly-newline */
import { useContext } from 'react';
import { SessionContext } from '@arcblock/did-connect-react/lib/Session';

function useSessionContext() {
  const info = useContext(SessionContext);
  return info;
}

export { SessionContext, useSessionContext };
