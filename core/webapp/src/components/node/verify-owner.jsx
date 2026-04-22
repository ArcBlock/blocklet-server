import PropTypes from 'prop-types';

import { Box } from '@mui/material';
import DidConnect from '@arcblock/did-connect-react/lib/Connect';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Fullpage from '@arcblock/did-connect-react/lib/Connect/fullpage';

import { useNodeContext } from '../../contexts/node';
import { useSessionContext } from '../../contexts/session';
import { getWebWalletUrl, setSessionToken } from '../../libs/util';

export default function NodeVerifyOwner({ action }) {
  const { info } = useNodeContext();
  const { api } = useSessionContext();
  const { t, locale } = useLocaleContext();

  const webWalletUrl = getWebWalletUrl(info);
  const prefix = window.env ? window.env.apiPrefix || '/' : '/';

  const goDashboard = () => {
    // 本地地址，无需处理
    window.location.href = prefix;
  };

  const onOwnerVerified = (result, decrypt) => {
    setSessionToken(decrypt(result.sessionToken));
    setTimeout(() => {
      goDashboard();
    }, 1000);
  };

  const localeKey = action === 'verify-owner' ? 'verify' : 'accept';

  return (
    <Fullpage did={window?.blocklet?.appPid || window?.env?.appPid}>
      <Box
        sx={{
          maxWidth: '100%',
          height: '100%',
        }}>
        <DidConnect
          className="connect"
          action={action}
          checkFn={api.get}
          checkTimeout={10 * 60 * 1000}
          webWalletUrl={webWalletUrl}
          onSuccess={onOwnerVerified}
          locale={locale}
          messages={{
            title: t(`setup.${localeKey}.title`),
            scan: t(`setup.${localeKey}.scan`),
            confirm: t(`setup.${localeKey}.confirm`),
            success: t(`setup.${localeKey}.success`),
          }}
          popup
          open
          hideCloseButton
        />
      </Box>
    </Fullpage>
  );
}

NodeVerifyOwner.propTypes = {
  action: PropTypes.oneOf(['verify-owner', 'accept-server']).isRequired,
};
