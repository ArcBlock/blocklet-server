/* eslint-disable react/jsx-one-expression-per-line */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSetState, useCreation } from 'ahooks';
import PropTypes from 'prop-types';
import { joinURL } from 'ufo';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/react';
import Box from '@mui/material/Box';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ErrorIcon from '@mui/icons-material/Error';
import Paper from '@mui/material/Paper';
import ExternalLink from '@mui/material/Link';
import Button from '@arcblock/ux/lib/Button';
import { mergeSx } from '@arcblock/ux/lib/Util/style';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import DidAvatar from '@arcblock/did-connect-react/lib/Avatar';
import DidAddress from '@abtnode/ux/lib/did-address';
import Img from '@arcblock/ux/lib/Img';
import Center from '@arcblock/ux/lib/Center';
import Spinner from '@mui/material/CircularProgress';
import useMediaQuery from '@mui/material/useMediaQuery';
import { getDisplayName, findComponentByIdV2, isBlockletRunning } from '@blocklet/meta/lib/util';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import HeaderAddon from '@abtnode/ux/lib/layout/addon';
import { formatToDatetime, getManageSubscriptionURL } from '@abtnode/ux/lib/util';
import useServerLogo from '@abtnode/ux/lib/hooks/use-server-logo';
import { useTheme } from '@mui/material';

import getSafeUrlWithToast from '@abtnode/ux/lib/util/get-safe-url';
import { HeaderAddons } from '@arcblock/ux/lib/Header';
import { OverdueInvoicePayment, PaymentProvider } from '@blocklet/payment-react';
import StartingProgress, { ProgressContent, progressCss } from '../components/starting-progress';
import api from '../libs/api';
import client from '../libs/client';
import { SessionContext, useSessionContext } from '../contexts/session';
import {
  calculateRetentionDate,
  isSuspended,
  isSuspendedByExpired,
  isSuspendedByTerminated,
  isPastDue,
  isCanceled,
} from '../util';
import { useBlockletContext } from '../contexts/blocklet';

function AppIcon({ appInfo, ...rest }) {
  const [error, setError] = useState(false);
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const size = isMobile ? 32 : 48;

  if (error) {
    return <DidAvatar did={appInfo.publisher} size={size} />;
  }
  return (
    <Img src={appInfo.icon} alt={appInfo.title} width={size} height={size} {...rest} onError={() => setError(true)} />
  );
}

AppIcon.propTypes = {
  appInfo: PropTypes.object.isRequired,
};

const getComponent = (app, componentId) => findComponentByIdV2(app, componentId) || app;

export default function Start() {
  const { t, locale } = useLocaleContext();
  const [state, setState] = useSetState({
    blocklet: null,
    component: null,
    launcherSession: null,
    loading: false,
    starting: false,
    manageSubscriptionURL: '',
    restart: false,
  });

  const serverUrl = localStorage.getItem('blocklet-server-url');
  const logo = useServerLogo({
    onClick: () => {
      if (serverUrl) {
        // 可能是非本地 url，暂没有渠道获取白名单，需要放开 allowDomains 限制
        window.open(getSafeUrlWithToast(serverUrl, { allowDomains: null }));
      }
    },
  });
  const url = new URL(window.location.href);
  const componentId = url.searchParams.get('componentId');
  const uiTheme = useTheme();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));

  const visitBlocklet = () => {
    const redirect = url.searchParams.get('redirect') || '/';
    // 假定为内部值，严格限制 allowDomains
    window.location.href = getSafeUrlWithToast(decodeURIComponent(redirect));
  };

  const checkStatus = () => {
    const timer = setInterval(() => {
      api
        .get('/blocklet/detail?nocache=1')
        .then(({ data: app }) => {
          setState((prev) => ({ ...prev, blocklet: app }));
          const data = getComponent(app, componentId);
          if (isBlockletRunning(data)) {
            visitBlocklet();
            return;
          }
          if (data.status !== 'starting' && !state.restart) {
            setState({ blocklet: app, starting: false });
            if (app !== data) {
              setState({ component: data });
            }
            clearInterval(timer);
          }
        })
        .catch((err) => {
          setState({ loading: false, restart: false });
          Toast.error(err.message);
        });
    }, 3000);
  };

  const handleRestart = () => {
    setState({
      restart: true,
      starting: true,
      loading: true,
    });
    setTimeout(() => {
      checkStatus();
    }, 10);
  };

  useEffect(() => {
    setState({ loading: true });
    api
      .get('/blocklet/detail?nocache=1')
      .then(({ data: app }) => {
        const data = getComponent(app, componentId);

        setState({ blocklet: app, loading: false });
        if (isBlockletRunning(data)) {
          visitBlocklet();
          return;
        }

        setState({ blocklet: app });
        if (app !== data) {
          setState({ component: data });
        }

        if (data.status === 'starting') {
          setState({ starting: true });
          checkStatus();
        }
      })
      .catch((err) => {
        setState({ loading: false });
        Toast.error(err.message);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startBlocklet = useCallback(() => {
    setState({ loading: true, starting: true });
    const curBlocklet = state.blocklet;
    if (!curBlocklet) {
      return;
    }
    const input = { did: curBlocklet?.meta.did };
    if (curBlocklet.children.length > 0) {
      input.componentDids = curBlocklet.children.map((x) => x.meta.did);
    }
    client
      .startBlocklet({ input })
      .then(({ blocklet }) => {
        setState((prev) => ({ ...prev, blocklet }));
        checkStatus();
      })
      .catch((err) => {
        Toast.error(err.message);
        setState({ loading: false, starting: false });
      });
  }, [state.component, state.blocklet]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (state.blocklet?.controller) {
      getManageSubscriptionURL({
        launcherUrl: state.blocklet.controller.launcherUrl,
        launcherSessionId: state.blocklet.controller.launcherSessionId,
        locale,
      })
        .then((manageSubscriptionURL) => {
          setState({ manageSubscriptionURL });
        })
        .catch((err) => {
          console.error('get manage subscription url error', err);
        });

      client
        .getLauncherSession({
          input: {
            launcherSessionId: state.blocklet.controller.launcherSessionId,
            launcherUrl: state.blocklet.controller.launcherUrl,
          },
        })
        .then((res) => {
          setState({ launcherSession: res.launcherSession });
        })
        .catch((err) => {
          console.error('get launcher session error', err);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.blocklet?.controller]);

  const total = useCreation(() => {
    return state.blocklet?.children?.length;
  }, [state.blocklet]);

  const successCount = useCreation(() => {
    return state.blocklet?.children?.filter((blocklet) => isBlockletRunning(blocklet))?.length || 0;
  }, [state.blocklet]);

  // 启动成功数量 / 启动中数量
  const startedPercent = useCreation(() => {
    if (!total) {
      return 0;
    }
    if (!successCount) {
      return 5;
    }
    return Math.round(Math.max(successCount / total, 0.15) * 100);
  }, [successCount, total]);

  if (!state.blocklet) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  const appInfo = {
    icon: `${WELLKNOWN_SERVICE_PATH_PREFIX}/blocklet/logo`,
    title: getDisplayName(state.blocklet),
    publisher: state.blocklet.appDid,
  };

  const mergedSx = mergeSx(
    progressCss,
    state.starting
      ? {
          width: `${startedPercent}%`,
          '&::after': {
            width: `${startedPercent}%`,
          },
          '&::before': {
            width: `${startedPercent}%`,
            animation: 'shimmer 1s infinite cubic-bezier(0.4, 0.0, 0.2, 1)',
            '@keyframes shimmer': {
              '0%': {
                width: 0,
              },

              '100%': {
                width: `${startedPercent}%`,
              },
            },
          },
        }
      : {}
  );

  const showSuspended = isSuspended(state.blocklet) || isPastDue(state.launcherSession);
  return (
    <Root>
      {/* eslint-disable-next-line no-use-before-define */}
      <Global styles={launcherGlobalStyle} />
      <header className="root-header">
        {isMobile ? null : <div className="left">{logo}</div>}
        <HeaderAddons
          sx={{
            background: isMobile ? uiTheme.palette.background.default : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}>
          <HeaderAddon SessionContext={SessionContext} />
        </HeaderAddons>
      </header>
      <StyledPaper elevation={0}>
        <AppInfo>
          <AppIcon appInfo={appInfo} />
          <div className="app-info_content">
            <Box className="app-info_name">{appInfo.title}</Box>
            <DidAddress size={14} className="app-info_did" did={appInfo.publisher} />
          </div>
        </AppInfo>

        {(state.restart || !showSuspended) && (
          <>
            <Box className="title-box">
              <Box className="icon">
                <PlayArrowIcon />
              </Box>
              <Box className="title">{t('blocklet.startApplication')}</Box>
            </Box>
            <Box className="sub-title">
              {!state.starting ? (
                t('blocklet.startDescription', {
                  name: state.component ? getDisplayName(state.component, true) : getDisplayName(state.blocklet),
                })
              ) : (
                <StartingProgress blocklets={state.blocklet?.children ?? []} />
              )}
            </Box>

            <Box
              sx={{
                mt: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
              }}>
              <ProgressContent blocklets={state.blocklet?.children ?? []} status={state.starting ? 'starting' : ''}>
                <Button
                  sx={mergedSx}
                  disabled={state.loading || state.starting}
                  variant="contained"
                  color="primary"
                  size="large"
                  loading={state.starting}
                  onClick={() => startBlocklet()}>
                  <span style={{ position: 'relative', zIndex: 2 }}>
                    {state.starting ? `(${successCount}/${total}) ${t('blocklet.starting')}` : t('blocklet.start')}
                  </span>
                </Button>
              </ProgressContent>
            </Box>
          </>
        )}
        {showSuspended && !state.restart && (
          <ContentSuspended
            blocklet={state.blocklet}
            launcherSession={state.launcherSession}
            manageSubscriptionURL={state.manageSubscriptionURL}
            handleRestart={handleRestart}
          />
        )}
        <Box
          sx={{
            mt: 5,
          }}>
          <Link className="footer-link" to={`${WELLKNOWN_SERVICE_PATH_PREFIX}/admin/overview`}>
            {t('blocklet.dashboard')}
          </Link>
        </Box>
      </StyledPaper>
    </Root>
  );
}

function ContentSuspended({ blocklet, launcherSession, manageSubscriptionURL, handleRestart }) {
  const { t, locale } = useLocaleContext();
  const { connectApi, session } = useSessionContext();
  const { refreshSubscription } = useBlockletContext();
  const [showPay, setShowPay] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');

  useEffect(() => {
    if (blocklet?.controller?.launcherUrl && isPastDue(launcherSession)) {
      const url = joinURL(blocklet.controller.launcherUrl, '__blocklet__.js?type=json');
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          const paymentMount = data.componentMountPoints?.find(
            (item) => item.did === 'z2qaCNvKMv5GjouKdcDWexv6WqtHbpNPQDnAk'
          )?.mountPoint;
          const baseUrl = joinURL(blocklet.controller.launcherUrl, paymentMount);
          setPaymentUrl(baseUrl);
        });
    }
  }, [blocklet?.controller?.launcherUrl, launcherSession]);

  if (!blocklet || !launcherSession) {
    return '';
  }

  const hasPastDue = isPastDue(launcherSession);
  const isExpired = !hasPastDue && isSuspendedByExpired(blocklet, launcherSession);
  const isTerminated = !hasPastDue && isSuspendedByTerminated(blocklet, launcherSession);

  if (!isExpired && !isTerminated && !hasPastDue) {
    return '';
  }

  return (
    <>
      {showPay && paymentUrl && launcherSession && (
        <PaymentProvider
          session={session}
          connect={connectApi}
          baseUrl={paymentUrl}
          authToken={launcherSession.subscription.authToken}>
          <OverdueInvoicePayment
            dialogProps={{ open: showPay, onClose: () => setShowPay(false) }}
            subscriptionId={launcherSession.subscription.id}
            successToast
            onPaid={() => {
              api.post('/blocklet/start?fromSetup=1');
              refreshSubscription();
              handleRestart();
              setShowPay(false);
            }}
          />
        </PaymentProvider>
      )}
      <Box className="title-box">
        <ErrorIcon className="icon-error" />
        <Box className="title error">
          {isExpired && t('blocklet.suspended')}
          {isTerminated && t('blocklet.terminated')}
          {hasPastDue && t('blocklet.suspended')}
        </Box>
      </Box>
      <Box className="sub-title">
        {isExpired &&
          t('blocklet.suspendedCausedByExpired', {
            deadline: formatToDatetime(launcherSession?.reservedUntil, locale),
            canceledAt: formatToDatetime((launcherSession?.subscription?.canceled_at || 0) * 1000, locale),
          })}
        {isTerminated &&
          t('blocklet.suspendedCausedByTerminated', {
            canceledAt: formatToDatetime(launcherSession?.terminatedAt, locale),
            deadline: calculateRetentionDate(launcherSession?.terminatedAt, locale),
          })}
        {hasPastDue &&
          t('blocklet.suspendedCausedByPastDue', {
            deadline: formatToDatetime(launcherSession?.reservedUntil, locale),
          })}
      </Box>
      <Box
        sx={{
          mt: 8,
        }}>
        {hasPastDue && !isCanceled(launcherSession) && (
          <Button
            style={{ minWidth: 200 }}
            variant="contained"
            color="primary"
            size="large"
            onClick={() => setShowPay(true)}>
            {t('blocklet.payNow')}
          </Button>
        )}
        {(isExpired || isCanceled(launcherSession)) && (
          <Button
            component={ExternalLink}
            style={{ minWidth: 200 }}
            variant="contained"
            color="primary"
            size="large"
            target="_blank"
            href={manageSubscriptionURL || '#'}>
            {t('blocklet.manageSubscription')}
          </Button>
        )}
        {isTerminated && (
          <Button
            component={Link}
            to={joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/admin/did-spaces')}
            style={{ minWidth: 200 }}
            variant="contained"
            color="primary"
            size="large">
            {t('common.backup')}
          </Button>
        )}
      </Box>
    </>
  );
}

ContentSuspended.propTypes = {
  blocklet: PropTypes.object.isRequired,
  launcherSession: PropTypes.object.isRequired,
  manageSubscriptionURL: PropTypes.string.isRequired,
  handleRestart: PropTypes.func.isRequired,
};

const launcherGlobalStyle = css`
  html,
  body,
  #app,
  #app > .wrapper {
    height: 100%;
  }
`;

const Root = styled.div`
  width: 100vw;
  height: 100%;
  background: ${({ theme }) =>
    theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.grey[100]};
  display: flex;
  justify-content: center;
  align-items: center;

  .root-header {
    position: fixed;
    z-index: 200;
    top: 0;
    display: flex;
    width: 100%;
    height: 68px;
    align-items: center;
    justify-content: flex-end;
    padding: 24px;
    max-width: 1245px;

    ${(props) => props.theme.breakpoints.down('md')} {
      padding: 14px 16px;
      height: 56px;
    }

    .left {
      margin-top: 4px;
      margin-right: auto;
      ${(props) => props.theme.breakpoints.down('md')} {
        margin-top: 0%;
      }
    }

    .right {
      display: flex;
      align-items: center;
      ${(props) => props.theme.breakpoints.down('md')} {
        button,
        a {
          padding-left: 8px;
          padding-right: 8px;
        }
      }
    }
  }
`;

const StyledPaper = styled(Paper)`
  width: 80vw;
  max-width: 1245px;
  height: 80vh;
  box-sizing: border-box;
  padding: 32px;
  &.MuiPaper-rounded {
    border-radius: 8px;
  }
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  ${(props) => props.theme.breakpoints.down('md')} {
    width: 100vw;
    height: 100%;
    left: 0;
    top: 0;
    padding: 32px 0;
  }

  .MuiIconButton-root {
    svg {
      fill: #888;
    }
    &.Mui-disabled {
      opacity: 0.4;
    }
  }

  .title-box {
    display: flex;
    align-items: center;
    ${(props) => props.theme.breakpoints.down('md')} {
      margin-top: 60px;
    }
  }

  .icon {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 32px;
    height: 32px;
    border-radius: 100%;
    background-color: ${(props) => props.theme.palette.primary.main};
    color: ${(props) => props.theme.palette.common.white};
  }

  .icon-error {
    width: 32px;
    height: 32px;
    color: ${(props) => props.theme.palette.error.main};
  }

  .title {
    margin-left: 12px;
    color: ${(props) => props.theme.palette.primary.main};
    font-size: 24px;
    font-weight: bolder;
  }

  .error {
    color: ${(props) => props.theme.palette.error.main};
  }

  .sub-title {
    margin-top: 24px;
    color: ${(props) => props.theme.palette.grey[700]};
    font-size: 16px;
    max-width: 460px;
    text-align: center;
    word-break: break-word;
    hyphens: auto;

    ${(props) => props.theme.breakpoints.down('md')} {
      padding: 0 32px;
    }
  }

  .footer-link {
    color: ${(props) => props.theme.palette.primary.main};
  }
`;

const AppInfo = styled.div`
  display: flex;
  align-items: center;
  position: absolute;
  left: 24px;
  right: 24px;
  top: 24px;
  font-size: 16px;
  font-weight: 500;
  color: #222;

  /* 禁止 app icon shrink */
  > *:first-child {
    flex: 0 0 auto;
  }

  .app-info_content {
    padding-left: 16px;
    overflow: hidden;
  }

  .app-info_name {
    max-width: 100%;
    padding-right: 32px;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: bold;
  }

  .app-info_did {
    transform: translate(0, 2px);
  }

  .app-info_did .did-address__text {
    color: #666;
    font-size: 14px;
  }

  ${(props) => props.theme.breakpoints.down('md')} {
    top: 12px;
    .app-info_did {
      transform: translate(0, 0);
    }
    .app-info_did .did-address__text {
      font-size: 12px;
    }
  }
`;
