import { useCallback, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { joinURL } from 'ufo';
import get from 'lodash/get';
import useAsync from 'react-use/lib/useAsync';
import Invitation from '@abtnode/ux/lib/invitation/invitation';
import Connect, { useSecurity } from '@arcblock/did-connect-react/lib/Connect';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Spinner from '@mui/material/CircularProgress';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';

import { useSessionContext } from '../../contexts/session';
import { useNodeContext } from '../../contexts/node';
import { getPathPrefix, getWebWalletUrl, setSessionToken, createPassportSvg } from '../../libs/util';

function WithInvite(props) {
  const { api, session } = useSessionContext();
  const { info } = useNodeContext();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, locale } = useLocaleContext();
  const { encryptKey, decrypt } = useSecurity();
  const [showReceiveOwnerNft, setShowReceiveOwnerNft] = useState(false);
  const inviteId = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('inviteId');
  }, [location]);

  const state = useAsync(async () => {
    if (!inviteId) {
      return null;
    }

    let nextWorkflow;
    const { data: invitation } = await api.get('/api/invitation', {
      params: { inviteId },
    });

    const needReceiveNFT = !!get(info, 'ownerNft.did') && invitation.role.name === 'owner';

    if (needReceiveNFT) {
      const nw = new URL(window.location.href);
      nw.pathname = joinURL(getPathPrefix(), '/api/did/invite/token');
      nw.searchParams.set('_ek_', encryptKey);
      nw.searchParams.set('inviteId', inviteId);

      const { data } = await api.get(nw.href);
      nextWorkflow = data;
    }

    return { invitation, nextWorkflow, needReceiveNFT };
  });

  const handleReceive = useCallback(() => {
    setShowReceiveOwnerNft(true);
  }, []);

  const getDataFn = useCallback(() => {
    if (state.error) {
      throw state.error;
    }

    return state.value.invitation;
  }, [state]);

  const onLoginSuccess = useCallback(
    async result => {
      if (result) {
        // 如果有 encrypted 属性，并且为 false，则说明 sessionToken 没有加密
        if (Object.prototype.hasOwnProperty.call(result, 'encrypted') && !result.encrypted) {
          setSessionToken(result.sessionToken);
        } else {
          setSessionToken(decrypt(result.sessionToken));
        }
      }
      const searchParams = new URLSearchParams(location.search);
      searchParams.delete('inviteId');
      const search = searchParams.toString();
      await session.refresh();
      navigate(`/${search ? `?${search}` : search}`, { replace: true });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location, navigate, session]
  );

  if (state.loading) {
    return <Spinner />;
  }

  const handleConnectedLauncher = () => {
    const statusURL = new URL(window.location.href);
    statusURL.pathname = joinURL(getPathPrefix(), '/api/did/invite/status');
    statusURL.searchParams.set('_t_', state.value.nextWorkflow.token);
    statusURL.searchParams.set('locale', locale);

    const intervalId = setInterval(async () => {
      const { data } = await api.get(statusURL.href);
      if (data.status === 'succeed') {
        clearInterval(intervalId);
        session.updateConnectedInfo(data);
        onLoginSuccess(data);
      }
    }, 2000);
  };

  const handleCloseConnectLauncher = () => {
    setShowReceiveOwnerNft(false);
  };

  return (
    <Root className="page-invite">
      {get(state, 'value.needReceiveNFT') && (
        <Connect
          action="login"
          popup
          className="connect"
          open={showReceiveOwnerNft}
          locale={locale}
          baseUrl={info.launcher.url}
          checkFn={axios.create({ baseURL: info.launcher.url }).get}
          onSuccess={handleConnectedLauncher}
          onClose={handleCloseConnectLauncher}
          checkTimeout={5 * 60 * 1000}
          webWalletUrl={getWebWalletUrl(info)}
          extraParams={{ nw: get(state, 'value.nextWorkflow.url') }}
          messages={{
            title: t('invite.transferNFTDialog.title', { name: info.name }),
            scan: t('invite.transferNFTDialog.scan'),
            confirm: t('invite.transferNFTDialog.confirm'),
            success: t('invite.transferNFTDialog.success'),
          }}
          prefix={`${WELLKNOWN_SERVICE_PATH_PREFIX}/api/did`}
        />
      )}
      <Invitation
        {...props}
        getDataFn={getDataFn}
        createPassportSvg={args => createPassportSvg(args, info)}
        checkFn={api.get}
        onLoginSuccess={onLoginSuccess}
        passportColor="default"
        onReceive={get(state, 'value.needReceiveNFT') ? handleReceive : null}
      />
    </Root>
  );
}

const Root = styled.div`
  width: 100vw;
  height: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f6f8fa;
  overflow: auto;
  padding: 20px;
`;

export default function Wrapper() {
  const node = useNodeContext();
  if (node.loading) {
    return <Spinner />;
  }

  return <WithInvite />;
}
