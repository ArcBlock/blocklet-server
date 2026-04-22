import { CircularProgress, Box } from '@mui/material';
import { useMemoizedFn, useReactive, useRequest } from 'ahooks';
import Invitation from '@abtnode/ux/lib/invitation/invitation';
import Fullpage from '@arcblock/did-connect-react/lib/Connect/fullpage';
import { setVisitorId } from '@arcblock/ux/lib/Util';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { useNavigate } from 'react-router-dom';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Helmet } from 'react-helmet';
import getSafeUrlWithToast from '@abtnode/ux/lib/util/get-safe-url';
import { createPassportSvg } from '@abtnode/ux/lib/util/passport';

import { setSessionToken, setRefreshToken } from '../util';
import { useSessionContext } from '../contexts/session';

export default function IssuePassport(props) {
  const { searchParams } = new URL(window.location.href);
  const { api, session } = useSessionContext();
  const navigate = useNavigate();
  const { t } = useLocaleContext();
  const inviteId = searchParams.get('id');
  const redirect = searchParams.get('redirect');

  const currentState = useReactive({
    state: '',
  });

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

  const onLoginSuccess = useMemoizedFn(async (result, decrypt = (v) => v) => {
    if (result) {
      if (result.sessionToken) setSessionToken(decrypt(result.sessionToken));
      if (result.refreshToken) setRefreshToken(decrypt(result.refreshToken));
      if (result.visitorId) setVisitorId(decrypt(result.visitorId));
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
    <Fullpage did={window.blocklet?.appPid}>
      <Helmet>
        <title>
          {t('pageTitle.issuePassport')} | {window.blocklet?.appName}
        </title>
      </Helmet>
      <Box
        className="page-invite"
        sx={{
          width: '560px',
          maxWidth: '100%',
          height: '100%',
        }}>
        <Invitation
          {...props}
          action="issue-passport"
          getDataFn={getDataFn}
          checkFn={api.get}
          createPassportSvg={createPassportSvg}
          onLoginSuccess={onLoginSuccess}
          inService
          status={currentState.state}
        />
      </Box>
    </Fullpage>
  );
}
