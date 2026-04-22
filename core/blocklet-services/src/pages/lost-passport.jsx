/* eslint-disable react/jsx-one-expression-per-line */
import LostPassportPage from '@abtnode/ux/lib/lost-passport';
import { Helmet } from 'react-helmet';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { createPassportSvg } from '@abtnode/ux/lib/util/passport';

import { SessionContext } from '../contexts/session';
import { getWebWalletUrl, setCsrfToken, setRefreshToken, setSessionToken } from '../util';

export default function LostPassport() {
  const webWalletUrl = getWebWalletUrl();
  const { t } = useLocaleContext();

  const onLogin = ({ sessionToken, refreshToken, csrfToken } = {}) => {
    if (sessionToken) {
      setSessionToken(sessionToken);
    }
    if (refreshToken) {
      setRefreshToken(refreshToken);
    }
    if (csrfToken) {
      setCsrfToken(csrfToken);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('pageTitle.lostPassport')}</title>
      </Helmet>
      <LostPassportPage
        SessionContext={SessionContext}
        webWalletUrl={webWalletUrl}
        createPassportSvg={createPassportSvg}
        passportColor={window?.env?.passportColor || 'auto'}
        onLogin={onLogin}
      />
    </>
  );
}
