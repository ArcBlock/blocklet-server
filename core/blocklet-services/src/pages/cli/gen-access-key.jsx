import { decodeConnectUrl, parseTokenFromConnectUrl } from '@arcblock/did-connect-react/lib/utils';
import Center from '@arcblock/ux/lib/Center';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import Result from '@arcblock/ux/lib/Result';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HomeIcon from '@mui/icons-material/Home';
import { useTheme, Box, Typography, Button, CircularProgress } from '@mui/material';
import { useMemoizedFn, useReactive } from 'ahooks';
import { useContext, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Fullpage from '@arcblock/did-connect-react/lib/Connect/fullpage';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { API_DID_PREFIX } from '@arcblock/did-connect-react/lib/constant';
import { joinURL } from 'ufo';

import { useSessionContext } from '../../contexts/session';
import useWindowClose from './hooks/use-window-close';

function ConnectCli() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { t, locale } = useContext(LocaleContext);
  const { api, connectApi } = useSessionContext();
  const [params] = useSearchParams();
  const theme = useTheme();
  const windowClose = useWindowClose();
  const currentState = useReactive({ ready: false, success: false, error: null, invalidSession: false });

  // 检查会话状态, 任何导致会话无效的情况都会在 url 附加 invalid 作为 hash (将无效会话状态记录到 url 中)
  const checkSession = () => {
    try {
      const url = new URL(window.location.href);
      if (url.hash.includes('invalid')) {
        currentState.invalidSession = true;
        return;
      }

      const connectUrl = url.searchParams.get('__connect_url__');
      const decoded = decodeConnectUrl(connectUrl);
      const token = parseTokenFromConnectUrl(decoded);

      if (!token) throw new Error('No token');

      currentState.ready = true;
    } catch (e) {
      currentState.invalidSession = true;
      navigate('#invalid', { replace: true });
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => checkSession(), []);

  const handleError = useMemoizedFn((err) => {
    currentState.error = err.message;
    window.opener?.postMessage({ type: 'connect-endpoint-message', error: currentState.error }, '*');

    navigate('#invalid', { replace: true });
  });

  const handleSuccess = useMemoizedFn(() => {
    window.opener?.postMessage({ type: 'connect-endpoint-message', success: true }, '*');

    currentState.success = true;
  });

  const source = params.get('source') || 'Generate Access Key';

  useEffect(() => {
    if (containerRef.current && currentState.ready) {
      connectApi.open(
        {
          locale,
          containerEl: containerRef.current,
          action: 'gen-access-key',
          extraParams: {
            remark: source,
          },
          checkFn: api.get,
          saveConnect: false,
          forceConnected: false,
          className: 'connect',
          popup: false,
          baseUrl: window.location.origin,
          prefix: joinURL(window.location.origin, WELLKNOWN_SERVICE_PATH_PREFIX, API_DID_PREFIX),

          messages: {
            title: t('connectCli.title'),
            scan: t('connectCli.scan'),
            confirm: t('auth.confirm'),
            success: t('connectCli.success'),
          },

          onSuccess: handleSuccess,
          onError: handleError,
        },
        { locale }
      );
    }
  }, [connectApi, currentState.ready, api, handleError, handleSuccess, locale, t, source]);

  const homeElement = (
    <Button
      variant="outlined"
      color="primary"
      size="small"
      startIcon={<HomeIcon />}
      href="/"
      style={{ borderRadius: 4 }}>
      {t('connectCli.home')}
    </Button>
  );

  if (currentState.invalidSession) {
    return (
      <Fullpage did={window.blocklet?.appPid} standalone key="invalid">
        <Result
          style={{ backgroundColor: 'transparent' }}
          status="error"
          title={t('connectCli.invalidSession')}
          description={t('connectCli.invalidSessionDesc')}
          extra={homeElement}
        />
      </Fullpage>
    );
  }

  if (currentState.error) {
    const description = currentState.error;
    const extra = homeElement;

    return (
      <Fullpage did={window.blocklet?.appPid} standalone key="error">
        <Result
          style={{ backgroundColor: 'transparent' }}
          status="error"
          title={t('connectCli.connectionError')}
          description={description}
          extra={extra}
        />
      </Fullpage>
    );
  }

  if (currentState.success) {
    if (params.has('closeOnSuccess')) {
      windowClose();
    }

    return (
      <Fullpage did={window.blocklet?.appPid} standalone key="success">
        <Result
          style={{ backgroundColor: 'transparent' }}
          status="info"
          icon={<CheckCircleIcon style={{ color: theme.palette.success.main, fontSize: 72 }} />}
          title={t('connectCli.success', { source })}
          description={`${t('connectCli.successDesc', { source })} ${t('connectCli.upload')}`}
        />
      </Fullpage>
    );
  }

  if (currentState.ready) {
    return (
      <Fullpage did={window.blocklet?.appPid} standalone key="ready">
        <Box
          sx={{
            maxWidth: '100%',
            height: '100%',
          }}>
          <Box sx={{ mb: 5 }}>
            <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 'bold', textAlign: 'center' }}>
              {t('connectCli.tips.title')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
              <Typography sx={{ color: 'text.secondary' }}>{t('connectCli.tips.item1')}</Typography>
              <Typography sx={{ color: 'text.secondary' }}>{t('connectCli.tips.item2')}</Typography>
              <Typography sx={{ color: 'text.secondary' }}>{t('connectCli.tips.item3')}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'inline-block' }} ref={containerRef} />
        </Box>
      </Fullpage>
    );
  }

  return (
    <Center>
      <CircularProgress />
    </Center>
  );
}

export default ConnectCli;
