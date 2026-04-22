import { useCallback } from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useMemoizedFn } from 'ahooks';
import Invitation from '@abtnode/ux/lib/invitation/invitation';
import Fullpage from '@arcblock/did-connect-react/lib/Connect/fullpage';
import { setVisitorId } from '@arcblock/ux/lib/Util';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Helmet } from 'react-helmet';
import getSafeUrlWithToast from '@abtnode/ux/lib/util/get-safe-url';
import { createPassportSvg } from '@abtnode/ux/lib/util/passport';

import api from '../libs/api';
import { setSessionToken, setRefreshToken } from '../util';
import { useSessionContext } from '../contexts/session';

function WithInvite(props) {
  const navigate = useNavigate();
  const { searchParams } = new URL(window.location.href);
  const { api: apiSession, session } = useSessionContext();
  const { t } = useLocaleContext();
  const inviteId = searchParams.get('inviteId');
  const redirect = searchParams.get('redirect');

  const getDataFn = useCallback(async () => {
    const { data } = await api.get('invitation', {
      params: { inviteId },
    });

    // 检查 org 邀请是否需要登录
    const isOrgInvitation = !!data?.orgId;
    if (isOrgInvitation && !session.user) {
      // org 邀请需要登录，跳转到登录页
      const currentUrl = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
      window.location.href = `${WELLKNOWN_SERVICE_PATH_PREFIX}/login?redirect=${currentUrl}`;
    }

    return data;
  }, [inviteId, session.user]);

  const onLoginSuccess = useMemoizedFn(async (result, decrypt = (v) => v) => {
    if (result && result.sessionToken && result.refreshToken) {
      setSessionToken(decrypt(result.sessionToken));
      setRefreshToken(decrypt(result.refreshToken));
      if (result.visitorId) setVisitorId(decrypt(result.visitorId));
    }

    await session.refresh();

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

  return (
    <Fullpage did={window.blocklet?.appPid}>
      <Helmet>
        <title>
          {t('pageTitle.invite')} | {window.blocklet?.appName}
        </title>
      </Helmet>
      <Box
        sx={{
          width: '560px',
          maxWidth: '100%',
          height: '100%',
        }}
        className="page-invite">
        <Invitation
          {...props}
          getDataFn={getDataFn}
          checkFn={apiSession.get}
          createPassportSvg={(arg) => {
            return createPassportSvg({
              ...arg,
            });
          }}
          onLoginSuccess={onLoginSuccess}
          inService
        />
      </Box>
    </Fullpage>
  );
}

export default WithInvite;
