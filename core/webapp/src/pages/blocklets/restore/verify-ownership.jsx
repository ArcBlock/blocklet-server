import React, { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { joinURL } from 'ufo';
import { useSessionContext } from '@abtnode/ux/lib/contexts/session';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import DidConnect from '@arcblock/did-connect-react/lib/Connect';
import DidAddress from '@abtnode/ux/lib/did-address';
import Button from '@arcblock/ux/lib/Button';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { getServerAuthMethod } from '@abtnode/auth/lib/util/get-auth-method';
import PageHeader from '@blocklet/launcher-layout/lib/page-header';
import { getServerUrl } from '@abtnode/ux/lib/blocklet/util';
import Toast from '@arcblock/ux/lib/Toast';
import Confirm from '@abtnode/ux/lib/confirm';
import useSetState from 'react-use/lib/useSetState';
import getSafeUrlWithToast from '@abtnode/ux/lib/util/get-safe-url';

import AppLogo from '../../../components/launch-blocklet/app-logo';
import DownloadBundleProgress from '../../../components/launch-blocklet/download-progress';
import { useBlockletAppContext } from '../../../contexts/blocklet-app';
import { useNodeContext } from '../../../contexts/node';
import { getWebWalletUrl, setSessionToken } from '../../../libs/util';
import { getRestoredAccessUrl } from '../../../components/launch-blocklet/util';

const Container = styled(Box)`
  width: 100%;
  height: 100%;
  overflow-y: auto;
`;

const VERIFY_OWNERSHIP_ACTION_NAME = 'verify-app-ownership-spaces';

function VerifyOwnership() {
  const { session } = useSessionContext();
  const [params] = useSearchParams();

  const { t, locale } = useLocaleContext();
  const { api: node, info } = useNodeContext();
  const { api } = useSessionContext();
  const { meta } = useBlockletAppContext();
  const navigate = useNavigate();

  const serverUrl = useMemo(() => (info ? getServerUrl(info) : ''), [info]);

  const [state, setState] = useSetState({
    loading: false,
    isRestoring: false,
    isComplete: false,
    isOverwrite: false,
    shouldReconnect: false,
    exists: false,
    accessUrl: '',
    isConnectOpen: false,
    isConfirmOpen: false,
    connectData: {
      action: '',
      checkFn: () => {},
      extraParams: {},
    },
    connectMessages: {},
  });

  const launchType = params.get('launchType');
  const nftId = params.get('nftId');
  const chainHost = params.get('chainHost');
  const from = params.get('from');
  const blockletMetaUrl = params.get('blocklet_meta_url');
  const launcherSessionId = params.get('launcherSessionId') || '';
  const launcherUrl = params.get('launcherUrl') || '';

  const { appDid, appPid } = meta;
  const authMethod = getServerAuthMethod(info, launchType, launcherSessionId, session.user);

  const onEndVerify = async (results, decrypt) => {
    const result = Array.isArray(results) ? results.find(x => !!x.sessionToken) : results;

    if (result?.sessionToken) {
      setSessionToken(decrypt(result.sessionToken));
      await session.refresh();
    }

    setState({ isConnectOpen: false });

    setTimeout(() => {
      const searchParams = new URLSearchParams({ appDid });

      [
        { name: 'launchType', value: launchType },
        { name: 'nftId', value: nftId },
        { name: 'from', value: from },
        { name: 'blocklet_meta_url', value: blockletMetaUrl },
        { name: 'chainHost', value: chainHost },
      ].forEach(({ name, value }) => {
        if (value) {
          searchParams.set(name, value);
        }
      });

      navigate(`/blocklets/restore/restore-blocklet?${searchParams.toString()}`);
    }, 0);
  };
  const onStartVerify = async (isOverwrite = false) => {
    if (!isOverwrite) {
      if (state.shouldReconnect) {
        // 由 location.origin 拼接生成，可以信任
        window.location.href = getSafeUrlWithToast(joinURL(serverUrl, 'blocklets/restore/connect-space'));
        return;
      }

      if (session.user) {
        try {
          setState({ loading: true });
          const result = await node.getBlocklet({ input: { did: appPid, attachRuntimeInfo: true } });
          if (result.blocklet) {
            const accessUrl = await getRestoredAccessUrl(result.blocklet);

            if (accessUrl) {
              const url = new URL(accessUrl);
              if (result.blocklet.status !== 'running') {
                url.searchParams.set('__start__', '1');
              }

              setState({ shouldReconnect: true, exists: true, accessUrl: url.href, loading: false });
            }

            return;
          }
        } finally {
          setState({ loading: false });
        }
      }
    }

    // Verify nft first, then verify ownership
    if (authMethod === 'nft') {
      const nextUrl = new URL(window.location.href);
      nextUrl.pathname = joinURL(window?.env?.apiPrefix ?? '/', `/api/did/${VERIFY_OWNERSHIP_ACTION_NAME}/token`);
      nextUrl.searchParams.set('appDid', appDid);
      nextUrl.searchParams.set('endpoint', meta.spaceEndpoint);
      nextUrl.searchParams.set('referrer', window.location.href);
      nextUrl.searchParams.set('nftId', nftId);
      nextUrl.searchParams.set('appPid', meta.did);

      const extraParams = {
        autoConnect: false,
        launchType,
        nftId,
      };

      if (chainHost) {
        nextUrl.searchParams.set('chainHost', chainHost);
        extraParams.chainHost = chainHost;
      }
      if (isOverwrite) {
        nextUrl.searchParams.set('overwrite', '1');
      }

      const { data } = await api.get(nextUrl.href);
      if (data.error) {
        Toast.error(data.error);
        return;
      }

      extraParams.nw = data.url;

      setState({
        isConnectOpen: true,
        connectData: {
          action: 'verify-restore-by-nft',
          extraParams,
        },
        connectMessages: {
          title: t('blocklet.restoreFromSpaces.nftAuthDialog.title'),
          scan: t('blocklet.restoreFromSpaces.nftAuthDialog.scan'),
          confirm: t('blocklet.restoreFromSpaces.nftAuthDialog.confirm'),
          success: t('blocklet.restoreFromSpaces.nftAuthDialog.success'),
        },
      });
      return;
    }

    if (authMethod === 'launcher') {
      const { launcherSession, error } = await node.getLauncherSession({ input: { launcherUrl, launcherSessionId } });
      if (launcherSession) {
        setState({
          isConnectOpen: true,
          connectData: {
            action: VERIFY_OWNERSHIP_ACTION_NAME,
            extraParams: {
              appDid,
              appPid: meta.did,
              endpoint: meta.spaceEndpoint,
              referrer: window.location.href,
              restoreFrom: 'spaces',
              overwrite: isOverwrite ? '1' : undefined,
              launcherUrl,
              launcherSessionId,
              chainHost,
            },
          },
          connectMessages: {
            title: t('blocklet.restoreBlocklet.verify.title'),
            scan: t('blocklet.restoreBlocklet.verify.scan'),
            confirm: t('blocklet.restoreBlocklet.verify.confirm'),
            success: t('blocklet.restoreBlocklet.verify.success'),
          },
        });
      } else {
        Toast.error(`Launch session invalid: ${error}`);
      }

      return;
    }

    // Already logged in, verify ownership
    if (authMethod === 'session') {
      setState({
        isConnectOpen: true,
        connectData: {
          action: VERIFY_OWNERSHIP_ACTION_NAME,
          extraParams: {
            appDid,
            appPid: meta.did,
            endpoint: meta.spaceEndpoint,
            referrer: window.location.href,
            overwrite: isOverwrite ? '1' : undefined,
            restoreFrom: 'spaces',
          },
        },
        connectMessages: {
          title: t('blocklet.restoreBlocklet.verify.title'),
          scan: t('blocklet.restoreBlocklet.verify.scan'),
          confirm: t('blocklet.restoreBlocklet.verify.confirm'),
          success: t('blocklet.restoreBlocklet.verify.success'),
        },
      });
      return;
    }

    // Login first then verify ownership
    const nextUrl = new URL(window.location.href);
    nextUrl.pathname = joinURL(window?.env?.apiPrefix ?? '/', `/api/did/${VERIFY_OWNERSHIP_ACTION_NAME}/token`);
    nextUrl.searchParams.set('appDid', appDid);
    nextUrl.searchParams.set('appPid', meta.did);
    nextUrl.searchParams.set('endpoint', meta.spaceEndpoint);
    nextUrl.searchParams.set('referrer', window.location.href);
    nextUrl.searchParams.set('restoreFrom', 'spaces');

    const { data } = await api.get(nextUrl.href);

    session.login(onEndVerify, {
      nw: data.url,
      openMode: 'popup',
    });
  };

  const onCancelVerify = () => {
    setState({ isConnectOpen: false });
  };

  const onStartOverwrite = () => {
    setState({ isConfirmOpen: true });
  };

  const onConfirmOverwrite = () => {
    setState({ isConfirmOpen: false, isOverwrite: true });
    onStartVerify(true);
  };

  const onCancelOverwrite = () => {
    setState({ isConfirmOpen: false });
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
        onClickBack={() => window.history.back()}
      />
      <Box
        sx={{
          textAlign: 'center',
          mt: 6,
        }}>
        <AppLogo blocklet={{ meta }} blockletMetaUrl={blockletMetaUrl} />
        <Box
          sx={{
            mt: 2,
            mb: 2,
          }}>
          <Typography variant="body2">{meta.title}</Typography>
          <DidAddress did={appDid} />
        </Box>
        {state.exists && state.accessUrl && (
          <>
            <Typography component="p" variant="body1" gutterBottom sx={{ color: 'orange' }}>
              {t('blocklet.restoreBlocklet.verify.exists')}
            </Typography>
            <Typography component="div" sx={{ marginTop: '32px' }}>
              {state.accessUrl && (
                <Button
                  variant="contained"
                  component={Link}
                  href={state.accessUrl}
                  sx={{
                    width: '160px',
                    height: '100%',
                  }}>
                  {t('blocklet.restoreBlocklet.verify.open')}
                </Button>
              )}
              <Button
                variant="contained"
                color="error"
                onClick={onStartOverwrite}
                sx={{
                  width: '160px',
                  height: '100%',
                  marginLeft: '32px',
                }}>
                {t('blocklet.restoreBlocklet.verify.overwrite')}
              </Button>
            </Typography>
          </>
        )}
        {!state.exists && (
          <Button
            variant="contained"
            loading={state.loading}
            disabled={state.isConnectOpen || state.loading}
            onClick={onStartVerify}
            sx={{
              width: '180px',
              height: '100%',
            }}>
            {t(`blocklet.restoreBlocklet.verify.${state.shouldReconnect ? 'reconnect' : 'verify'}`)}
          </Button>
        )}
      </Box>
      {state.connectData.isConnectOpen && <DownloadBundleProgress appDid={appDid} visible={false} />}
      <DidConnect
        popup
        locale={locale}
        open={state.isConnectOpen}
        forceConnected={false}
        saveConnect={false}
        action={state.connectData.action}
        checkFn={api.get}
        checkTimeout={5 * 60 * 1000}
        webWalletUrl={getWebWalletUrl(info)}
        onSuccess={onEndVerify}
        extraParams={state.connectData.extraParams}
        messages={state.connectMessages}
        onClose={onCancelVerify}
      />
      {state.isConfirmOpen && (
        <Confirm
          color="error"
          title={t('blocklet.restoreBlocklet.overwrite.title')}
          description={t('blocklet.restoreBlocklet.overwrite.description')}
          confirm={t('common.confirm')}
          onCancel={onCancelOverwrite}
          onConfirm={onConfirmOverwrite}
        />
      )}
    </Container>
  );
}

export default VerifyOwnership;
