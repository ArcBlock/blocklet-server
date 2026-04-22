import { useState } from 'react';
import { Box, styled } from '@mui/material';

import DidConnect from '@arcblock/did-connect-react/lib/Connect';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { getServerAuthMethod } from '@abtnode/auth/lib/util/get-auth-method';

import AgreeEula from './agree-eula';

import { useNodeContext } from '../../contexts/node';
import { useSessionContext } from '../../contexts/session';
import { getWebWalletUrl, setSessionToken } from '../../libs/util';

export default function NodeSetup() {
  const { info } = useNodeContext();
  const { api } = useSessionContext();
  const { t, locale } = useLocaleContext();
  const [open, setOpen] = useState(false);

  const webWalletUrl = getWebWalletUrl(info);
  const action = getServerAuthMethod(info) === 'nft' ? 'verify' : 'connect';
  const prefix = window.env ? window.env.apiPrefix || '/' : '/';

  const goDashboard = () => {
    // 本地地址，无需处理
    window.location.href = prefix;
  };

  const onConnect = () => {
    setOpen(true);
  };

  const onOwnerConnected = (result, decrypt) => {
    setSessionToken(decrypt(result.sessionToken));
    setTimeout(() => {
      goDashboard();
    }, 1000);
  };

  return (
    <Div>
      <AgreeEula onGoToNext={onConnect} />

      <DidConnect
        popup
        open={open}
        className="stepper-auth"
        action={`${action}-owner`}
        checkFn={api.get}
        checkTimeout={10 * 60 * 1000}
        webWalletUrl={webWalletUrl}
        onSuccess={onOwnerConnected}
        locale={locale}
        messages={{
          title: t(`setup.${action}.title`),
          scan: t(`setup.${action}.scan`),
          confirm: t(`setup.${action}.confirm`),
          success: t(`setup.${action}.success`),
        }}
        dialogStyle={{ height: 800 }}
        onClose={() => setOpen(false)}
      />
    </Div>
  );
}

const Div = styled(Box)`
  display: flex;
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.palette.grey[100]};
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;
