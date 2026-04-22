import { useAsyncEffect, useMount, useReactive } from 'ahooks';
import { Alert, Box, Button, Container, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import PoweredBy from '@arcblock/ux/lib/DIDConnect/powered-by';
import { ErrorFallback } from '@arcblock/ux/lib/ErrorBoundary';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { joinURL } from 'ufo';
import { getBlockletSDK } from '../libs/blocklet-sdk';

const type = 'authorization_response';

const sdk = getBlockletSDK();

function LoginOAuthCallbackSuccess() {
  const { t } = useLocaleContext();
  // const params = useParams();
  // 路由参数中包含了当前的 provider，暂时没想到用途，先保留此代码（用于提示包含此参数）
  // const { provider } = params;
  const [searchParams] = useSearchParams();
  const handleClose = () => {
    window.close();
  };

  useMount(() => {
    const state = searchParams.get('state');
    const code = searchParams.get('code');
    const res = {
      type,
      response: {
        code,
        // name: searchParams.get('name'),
      },
    };
    if (window.opener) {
      try {
        const callerUrl = new URL(state);
        // 此处是 oauth 登录流程，将 code 回传给 did-connect 的页面
        window.opener.postMessage(res, callerUrl.origin);
        setTimeout(() => {
          // 如果未能成功关闭页面，则提示用户进行手动关闭页面
          window.close();
        }, 2000);
      } catch (err) {
        console.error('Invalid login caller', err);
      }
    }
  });

  return (
    <Alert severity="success">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignContent: 'center',
          gap: 1,
        }}>
        {t('login.needManualClose')}
        <Box
          sx={{
            textAlign: 'center',
          }}>
          <Button variant="outlined" size="small" onClick={handleClose}>
            {t('login.closeWindow')}
          </Button>
        </Box>
      </Box>
    </Alert>
  );
}

export default function LoginOAuthCallback() {
  const { blocklet } = window;
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const state = searchParams.get('state');
  const currentState = useReactive({
    errorMessage: '',
    loading: true,
  });

  useAsyncEffect(async () => {
    if (error) {
      currentState.errorMessage = errorDescription;
      currentState.loading = false;
    } else {
      try {
        // 还需要检查 state 是否在允许的域名列表中，需要获取整个站点群的所有域名，因为 member 站点打开的是主站的 oauth 信任 URL
        const callerUrl = new URL(state);
        const domainAliases = await sdk.federated.getTrustedDomains();
        if (!domainAliases.includes(callerUrl.hostname)) {
          currentState.errorMessage = 'Invalid login caller';
          currentState.loading = false;
        }
      } catch {
        currentState.errorMessage = 'Invalid login caller';
        currentState.loading = false;
      }
    }
  }, [error, errorDescription, state]);

  const siteLogo = joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, `/blocklet/logo?&version=${blocklet?.meta?.version || ''}`);

  return (
    <Container
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        justifyContent: 'center',
        alignContent: 'center',
      }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          minHeight: '100vh',
          margin: 'auto',
          paddingBottom: {
            sx: 0,
            md: 15,
          },
        }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
          }}>
          <Box
            component="img"
            src={siteLogo}
            alt={`${blocklet?.appName || 'site'} logo`}
            sx={{
              width: 80,
            }}
          />
          <Typography variant="h6" component="p">
            {blocklet?.appName}
          </Typography>
        </Box>
        {/* eslint-disable-next-line no-nested-ternary */}
        {currentState.loading ? (
          currentState.errorMessage ? (
            <ErrorFallback
              error={{
                message: currentState.errorMessage,
              }}
            />
          ) : (
            <LoginOAuthCallbackSuccess />
          )
        ) : null}
        <PoweredBy
          sx={{
            mt: 4,
          }}
        />
      </Box>
    </Container>
  );
}
