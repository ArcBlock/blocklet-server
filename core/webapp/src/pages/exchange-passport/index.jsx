/* eslint-disable react/jsx-one-expression-per-line */
import ExchangePassportPage from '@abtnode/ux/lib/exchange-passport';

import { useNodeContext } from '../../contexts/node';
import { SessionContext } from '../../contexts/session';
import { getWebWalletUrl, setSessionToken } from '../../libs/util';

export default function IssuePassport() {
  const { info: nodeInfo } = useNodeContext();
  const webWalletUrl = getWebWalletUrl(nodeInfo);
  const onSuccess = (result, decrypt) => {
    if (result.sessionToken) {
      setSessionToken(decrypt(result.sessionToken));
    }
  };

  return <ExchangePassportPage SessionContext={SessionContext} webWalletUrl={webWalletUrl} onSuccess={onSuccess} />;
}
