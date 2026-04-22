import React, { useEffect, useMemo } from 'react';
import { joinURL } from 'ufo';
import { useSessionContext } from '@abtnode/ux/lib/contexts/session';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import DidConnect from '@arcblock/did-connect-react/lib/Connect';
import DidAvatar from '@arcblock/ux/lib/Avatar';
import Button from '@arcblock/ux/lib/Button';
import DidAddress from '@abtnode/ux/lib/did-address';
import styled from '@emotion/styled';
import { Box, Typography } from '@mui/material';
import PageHeader from '@blocklet/launcher-layout/lib/page-header';
import getSafeUrlWithToast from '@abtnode/ux/lib/util/get-safe-url';
import { getServerUrl } from '@abtnode/ux/lib/blocklet/util';
import Toast from '@arcblock/ux/lib/Toast';
import useSetState from 'react-use/lib/useSetState';

import DownloadBundleProgress from '../../../components/launch-blocklet/download-progress';
import { useNodeContext } from '../../../contexts/node';
import { getWebWalletUrl } from '../../../libs/util';

const Container = styled(Box)`
  width: 100%;
  height: 100%;
  overflow-y: auto;
`;

const VERIFY_OWNERSHIP_ACTION_NAME = 'verify-app-ownership-disk';

function VerifyOwnership() {
  const currentURL = new URL(window.location.href);
  const appDid = currentURL.searchParams.get('appDid');
  const appName = currentURL.searchParams.get('appName');

  const { t, locale } = useLocaleContext();
  const { api: node, info } = useNodeContext();
  const { session, api } = useSessionContext();

  const serverUrl = useMemo(() => (info ? getServerUrl(info) : ''), [info]);

  const [state, setState] = useSetState({
    isRestoring: false,
    isComplete: false,
    connectData: {
      isConnectOpen: false,
      action: '',
      checkFn: () => {},
      extraParams: {},
    },
  });

  const verifyOwnerShip = async () => {
    const result = await node.getBlocklet({ input: { did: appDid } });
    if (result.blocklet) {
      Toast.error(`Blocklet ${appName}(${appDid}) already exists`);
      setState({ shouldReconnect: true });
      return;
    }

    setState({
      connectData: {
        isConnectOpen: true,
        action: VERIFY_OWNERSHIP_ACTION_NAME,
        extraParams: {
          appDid,
          restoreFrom: 'disk',
        },
      },
    });
  };

  const onEndVerify = () => {
    setState({ connectData: { isConnectOpen: false } });

    setTimeout(() => {
      const url = new URL(joinURL(serverUrl, `blocklets/restore/restore-blocklet${window.location.search}`));
      // 由 location.origin 拼接生成，可以信任
      window.location.href = getSafeUrlWithToast(url.href);
    }, 0);
  };

  const onStartVerify = async () => {
    if (!session.user) {
      const nextUrl = new URL(window.location.href);
      nextUrl.pathname = joinURL(window?.env?.apiPrefix ?? '/', `/api/did/${VERIFY_OWNERSHIP_ACTION_NAME}/token`);
      nextUrl.searchParams.set('appDid', appDid);
      nextUrl.searchParams.set('restoreFrom', 'disk');

      const { data } = await api.get(nextUrl.href);

      session.login(onEndVerify, {
        nw: data.url,
        openMode: 'popup',
      });

      return;
    }

    await verifyOwnerShip();
  };

  const onCancelVerify = () => {
    setState({ connectData: { isConnectOpen: false } });
  };

  useEffect(() => {
    onStartVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container>
      <PageHeader
        title={t('blocklet.restoreBlocklet.verify.title')}
        subTitle={t('blocklet.restoreBlocklet.verify.subTitle')}
      />
      <Box
        sx={{
          textAlign: 'center',
          mt: 6,
        }}>
        <DidAvatar did={appDid} size={128} />
        <Box
          sx={{
            mt: 2,
            mb: 2,
          }}>
          <Typography variant="body2">{appName}</Typography>
          <DidAddress did={appDid} />
        </Box>
        <Button
          variant="contained"
          disabled={state.connectData.isConnectOpen}
          onClick={onStartVerify}
          sx={{
            width: '180px',
            height: '100%',
          }}>
          {t(`blocklet.restoreBlocklet.verify.${state.shouldReconnect ? 'reconnect' : 'verify'}`)}
        </Button>
      </Box>
      {state.connectData.isConnectOpen && <DownloadBundleProgress appDid={appDid} visible={false} />}
      <DidConnect
        popup
        locale={locale}
        open={state.connectData.isConnectOpen}
        forceConnected={false}
        saveConnect={false}
        action={state.connectData.action}
        checkFn={api.get}
        checkTimeout={5 * 60 * 1000}
        webWalletUrl={getWebWalletUrl(info)}
        onSuccess={onEndVerify}
        extraParams={state.connectData.extraParams}
        messages={{
          title: t('blocklet.restoreBlocklet.verify.title'),
          scan: t('blocklet.restoreBlocklet.verify.scan'),
          confirm: t('blocklet.restoreBlocklet.verify.confirm'),
          success: t('blocklet.restoreBlocklet.verify.success'),
        }}
        onClose={onCancelVerify}
      />
    </Container>
  );
}

export default VerifyOwnership;
