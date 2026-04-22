import { useNavigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useRequest, useMemoizedFn } from 'ahooks';
import Invitation from '@abtnode/ux/lib/invitation/invitation';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import getSafeUrlWithToast from '@abtnode/ux/lib/util/get-safe-url';

import { useSessionContext } from '../../contexts/session';
import { useNodeContext } from '../../contexts/node';
import { createPassportSvg, setSessionToken } from '../../libs/util';

function IssuePassport(props) {
  const { searchParams } = new URL(window.location.href);
  const navigate = useNavigate();
  const { api, session } = useSessionContext();
  const { info } = useNodeContext();
  const redirect = searchParams.get('redirect');
  const inviteId = searchParams.get('id');

  const state = useRequest(async () => {
    if (!inviteId) {
      return null;
    }

    const { data: invitation } = await api.get('/api/invitation', {
      params: { inviteId, mode: 'issue-passport' },
    });

    return invitation;
  });

  const getDataFn = useMemoizedFn(() => {
    if (state.error) {
      throw state.error;
    }

    return state?.data;
  });

  const onLoginSuccess = useMemoizedFn(async (result, decrypt = v => v) => {
    if (result) {
      if (result.sessionToken) setSessionToken(decrypt(result.sessionToken));
      await session.refresh();
    }

    setTimeout(() => {
      if (redirect) {
        const url = decodeURIComponent(redirect);
        if (url.startsWith(WELLKNOWN_SERVICE_PATH_PREFIX)) {
          navigate(url, { replace: true });
        } else {
          // 假定为内部值，严格限制 allowDomains
          window.location.href = getSafeUrlWithToast(url);
        }
      } else {
        window.location.href = window.env.pathPrefix || '/';
      }
    }, 50);
  });

  if (state.loading) {
    return <CircularProgress />;
  }

  return (
    <Box
      className="page-invite"
      sx={{
        width: '100vw',
        height: '100%',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f6f8fa',
        overflow: 'auto',
        padding: '20px',
      }}>
      <Invitation
        {...props}
        action="issue-passport"
        getDataFn={getDataFn}
        createPassportSvg={args => createPassportSvg(args, info)}
        checkFn={api.get}
        onLoginSuccess={onLoginSuccess}
        passportColor="default"
        onLogin={session.login}
      />
    </Box>
  );
}

export default function Wrapper() {
  const node = useNodeContext();
  if (node.loading) {
    return <CircularProgress />;
  }

  return <IssuePassport />;
}
