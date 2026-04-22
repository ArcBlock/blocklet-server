import ExchangePassportPage from '@abtnode/ux/lib/exchange-passport';

import { SessionContext } from '../contexts/session';
import { getWebWalletUrl, setSessionToken, setRefreshToken } from '../util';

export default function ExchangePassport() {
  const webWalletUrl = getWebWalletUrl();
  const onSuccess = (result, decrypt) => {
    if (result.sessionToken) {
      setSessionToken(decrypt(result.sessionToken));
      setRefreshToken(decrypt(result.refreshToken));
    }
  };

  return <ExchangePassportPage SessionContext={SessionContext} webWalletUrl={webWalletUrl} onSuccess={onSuccess} />;
}
