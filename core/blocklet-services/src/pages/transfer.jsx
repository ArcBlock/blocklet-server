import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import HeaderAddon from '@abtnode/ux/lib/layout/addon';
import DidConnect from '@arcblock/did-connect-react/lib/Connect';
import Fullpage from '@arcblock/did-connect-react/lib/Connect/fullpage';
import Button from '@arcblock/ux/lib/Button';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Result from '@arcblock/ux/lib/Result';
import styled from '@emotion/styled';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Box from '@mui/material/Box';
import Spinner from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useRequest } from 'ahooks';
import { useCallback, useState } from 'react';
import { HeaderAddons } from '@arcblock/ux/lib/Header';

import { SessionContext, useSessionContext } from '../contexts/session';
import api from '../libs/api';
import { setRefreshToken, setSessionToken } from '../util';

function Transfer() {
  const { t, locale } = useLocaleContext();
  const { api: apiSession, session } = useSessionContext();
  const { searchParams } = new URL(window.location.href);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const transferId = searchParams.get('transferId');
  const appDid = window?.env?.appId;

  const getDataFn = useCallback(async () => {
    const { data } = await api.get('/blocklet/transfer', {
      params: { transferId },
    });
    return data;
  }, [transferId]);

  const state = useRequest(getDataFn);

  const onSuccess = useCallback(async (result, decrypt) => {
    if (result) {
      setSessionToken(decrypt(result.sessionToken));
      setRefreshToken(decrypt(result.refreshToken));
    }

    await session.refresh();

    setTransferSuccess(true);
  }, []); // eslint-disable-line

  if (state.loading) {
    return <Spinner />;
  }

  if (state.error) {
    return (
      <Root>
        <Result status="404" title={state.error?.response?.data} description="" />
      </Root>
    );
  }

  const isStateSuccess = state.data.status === 'success';

  let body;
  if (isStateSuccess || transferSuccess) {
    body = (
      <>
        <StyledAddon>
          <HeaderAddon SessionContext={SessionContext} />
        </StyledAddon>

        <Box
          sx={{
            pt: 1,
            color: 'success.main',
          }}>
          <CheckCircleIcon style={{ fontSize: 80 }} />
        </Box>

        <Typography
          variant="h5"
          sx={{
            my: 4,
          }}>
          {t('team.transferApp.successTitle')}
        </Typography>

        <a href={`${WELLKNOWN_SERVICE_PATH_PREFIX}/admin`}>
          <Button variant="contained">{t('team.transferApp.visitDashboard')}</Button>
        </a>
      </>
    );
  } else {
    body = (
      <DidConnect
        popup
        open
        action="receive-transfer-app-owner"
        checkFn={apiSession.get}
        forceConnected={false}
        autoConnect={false}
        checkTimeout={10 * 60 * 1000}
        onSuccess={onSuccess}
        onClose={() => {}}
        locale={locale}
        messages={{
          title: t('team.transferApp.receiveDialog.title'),
          scan: t('team.transferApp.receiveDialog.scan'),
          confirm: t('team.transferApp.receiveDialog.confirm'),
          success: t('team.transferApp.receiveDialog.success'),
        }}
        extraParams={{ transferId, appDid }}
        hideCloseButton
      />
    );
  }

  return (
    <Fullpage did={window.blocklet?.appPid}>
      <Box
        sx={{
          maxWidth: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {body}
      </Box>
    </Fullpage>
  );
}

const StyledAddon = styled(HeaderAddons)`
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
`;

const Root = styled.div`
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f6f8fa;
`;

export default Transfer;
