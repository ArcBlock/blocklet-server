/* eslint-disable react/jsx-one-expression-per-line */
import LostPassportPage from '@abtnode/ux/lib/lost-passport';

import { SessionContext } from '../../contexts/session';
import { getWebWalletUrl, createPassportSvg, setSessionToken } from '../../libs/util';
import { useNodeContext } from '../../contexts/node';

export default function LostPassport() {
  const { info } = useNodeContext();
  const webWalletUrl = getWebWalletUrl(info);
  const onLogin = ({ sessionToken } = {}) => {
    if (sessionToken) {
      setSessionToken(sessionToken);
    }
  };

  return (
    <LostPassportPage
      SessionContext={SessionContext}
      webWalletUrl={webWalletUrl}
      createPassportSvg={props => createPassportSvg(props, info)}
      passportColor="default"
      onLogin={onLogin}
      teamDid={info.did}
    />
  );
}
