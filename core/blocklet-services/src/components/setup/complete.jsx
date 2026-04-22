import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import styled from '@emotion/styled';
import Cookie from 'js-cookie';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { joinURL, withQuery } from 'ufo';
import isUrl from 'is-url';
import { useCreation, useMemoizedFn } from 'ahooks';
import { evaluateURLs } from '@abtnode/util/lib/url-evaluation';
import StyledResultMessage from '@abtnode/ux/lib/result-message';
import { getAccessUrl, getLauncherBaseURL } from '@abtnode/ux/lib/util';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import getSafeUrlWithToast from '@abtnode/ux/lib/util/get-safe-url';
import Toast from '@arcblock/ux/lib/Toast';
import Box from '@mui/material/Box';
import { mergeSx } from '@arcblock/ux/lib/Util/style';
import { getLauncherUrl, getDidConnectParam } from '@abtnode/ux/lib/launch-blocklet/use-extra-nav';
import { isBlockletRunning } from '@blocklet/meta/lib/util';
import checkDomainAccessible from '../../util/check-domain-accessible';
import { useBlockletContext } from '../../contexts/blocklet';
import api from '../../libs/api';
import client from '../../libs/client';
import { getFromQuery, PREFIX } from '../../util';
import Button from './button';
import Layout from './layout';
import StartingProgress, { ProgressContent, progressCss } from '../starting-progress';

export default function Complete({ onPrevious = () => {}, launcherSession = {} }) {
  const { t } = useLocaleContext();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('starting'); // stopped, starting, running
  const [startupError, setStartupError] = useState();
  const [launcherBlockletUrl, setLauncherBlockletUrl] = useState(null);
  const { blocklet } = useBlockletContext();

  const [isRedirectValidLoading, setIsRedirectValidLoading] = useState(false);

  const [recommendedURL, setRecommendedURL] = useState('');
  const fromLauncher = getFromQuery('fromLauncher');
  const launcherUrl = getFromQuery('launcherUrl');

  const baseUrl = getLauncherUrl(launcherUrl);

  const didConnectParam = getDidConnectParam(launcherSession?.userDid);

  const isStopped = !['starting', 'running'].includes(status);
  const isStarting = status === 'starting';
  const statusText = {
    stopped: t('blocklet.start'),
    starting: t('blocklet.starting'),
    running: t('blocklet.open'),
  };

  const getLauncherBlockletUrl = useMemoizedFn(async () => {
    const id = blocklet?.controller?.launcherSessionId || blocklet?.meta?.did;
    const launchPath = id ? `/apps/${id}/overview` : 'apps';
    const baseLauncherUrl = await getLauncherBaseURL(baseUrl);
    const redirectUrl = withQuery(joinURL(baseLauncherUrl, '/u/', launchPath), didConnectParam);
    return redirectUrl;
  }, [fromLauncher, baseUrl, blocklet]);

  useEffect(() => {
    getLauncherBlockletUrl()
      .then((url) => {
        setLauncherBlockletUrl(url);
      })
      .catch(() => {
        setLauncherBlockletUrl(null);
      });
  }, [getLauncherBlockletUrl]);

  const checkRedirectUrl = async () => {
    try {
      const url = new URL(window.location.href);
      const redirect = url.searchParams.get('redirect');
      if (!redirect) return null;

      const result = await checkDomainAccessible(redirect, 6);

      if (result.accessible) {
        return result.url;
      }

      return null;
    } catch (error) {
      console.error('checkRedirectUrl error', error);
      return null;
    }
  };

  const visitBlocklet = async () => {
    // 如果是从 Launcher 过来的，则不需要跳转到应用的页面，而是跳转到 Launcher 的页面
    if (fromLauncher && !!launcherBlockletUrl) {
      window.location.href = launcherBlockletUrl;
      return;
    }

    setIsRedirectValidLoading(true);
    const validRedirectUrl = await checkRedirectUrl();

    const url = new URL(window.location.href);
    const redirect = url.searchParams.get('redirect');
    const canRedirect = redirect && validRedirectUrl;

    if (!recommendedURL || !isUrl(recommendedURL)) {
      Toast.error(t('blocklet.gotoVisitError'));
      return;
    }

    let targetUrl = recommendedURL;
    let allowDomains = [];

    if (canRedirect) {
      try {
        const parsed = new URL(validRedirectUrl);
        targetUrl = parsed.href;
        allowDomains = [parsed.hostname];
      } catch (e) {
        console.error('Invalid redirect URL:', redirect, e);
      }
    }

    const loginToken = Cookie.get('login_token');
    const vid = Cookie.get('vid');
    const targetObj = new URL(targetUrl);

    if (targetObj.host !== window.location.host && loginToken) {
      targetObj.pathname = joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, 'redirect-with-login');
      targetObj.searchParams.set('setupToken', loginToken);
      if (vid) targetObj.searchParams.set('visitorId', vid);
      targetUrl = targetObj.href;
    }

    // 无法更改 redirect 的 origin，此处需要严格校验 allowDomains
    window.location.href = getSafeUrlWithToast(targetUrl, allowDomains.length ? { allowDomains } : {});
    setIsRedirectValidLoading(false);
  };

  const startBlocklet = async () => {
    setLoading(true);
    setStatus('starting');

    try {
      await api.post('/blocklet/start?fromSetup=1');
      const { blocklet: { status: curStatus } = {} } = await client.getBlocklet({
        input: { did: blocklet.meta.did },
      });
      setLoading(false);
      setStatus(curStatus);
      setStartupError(curStatus === 'running' ? null : t('setup.complete.notRunning'));
    } catch (err) {
      const errMsg = err?.response?.data || err.message;
      Toast.error(errMsg);
      setLoading(false);
      setStatus('stopped');
      setStartupError(errMsg);
    }
  };

  useEffect(() => {
    setStatus(blocklet.status);

    if (!['starting', 'running'].includes(blocklet.status)) {
      startBlocklet();
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    const _setRecommendedURL = async () => {
      const results = await evaluateURLs(
        blocklet.site.domainAliases.map((item) => getAccessUrl(item.value, PREFIX)),
        { preferAccessible: true }
      );
      if (results.length > 0) {
        setRecommendedURL(results[0].url);
      }
    };
    if (!recommendedURL) {
      _setRecommendedURL();
    }
  }, [blocklet, recommendedURL]);

  const total = useCreation(() => {
    return blocklet?.children?.length;
  }, [blocklet]);

  const successCount = useCreation(() => {
    return blocklet?.children?.filter((child) => isBlockletRunning(child))?.length || 0;
  }, [blocklet]);

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

  const serverUrl = localStorage.getItem('blocklet-server-url');

  const isButtonLoading = isStarting || !recommendedURL;

  if (fromLauncher && !isButtonLoading) {
    if (isStopped) {
      startBlocklet();
    } else {
      visitBlocklet();
    }
  }

  const mergedSx = mergeSx(
    progressCss,
    isStopped ? { ml: 3 } : {},
    isStarting
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

  const resultTitle = {
    starting: t('setup.complete.readyToStart'),
    running: t('setup.complete.title'),
  };

  const renderButtonText = () => {
    if (isRedirectValidLoading) {
      return t('setup.complete.opening');
    }

    if (status === 'starting' && !startupError) {
      return `(${successCount}/${total}) ${t('blocklet.starting')}`;
    }

    return statusText[status] || statusText.stopped;
  };

  const startingProgress = (
    <ProgressContent blocklets={blocklet.children ?? []} status={status} debounce={false}>
      <Button
        sx={mergedSx}
        onClick={() => (isStopped ? startBlocklet() : visitBlocklet())}
        loading={isButtonLoading || isRedirectValidLoading}>
        <span style={{ position: 'relative', zIndex: 2 }}>{renderButtonText()}</span>
      </Button>
    </ProgressContent>
  );

  return (
    <Container>
      <StyledResultMessage
        variant={startupError ? 'error' : 'success'}
        title={
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
            }}>
            <Box
              sx={{
                fontSize: 24,
                fontWeight: 600,
              }}>
              {startupError ? t('setup.complete.failedTitle') : resultTitle[status] || ''}
            </Box>
            {status === 'starting' && !startupError ? <StartingProgress blocklets={blocklet.children ?? []} /> : null}
          </Box>
        }
        footer={
          <Center>
            {isStopped && (
              <Button variant="outlined" disabled={loading} onClick={() => onPrevious()}>
                {t('setup.previous')}
              </Button>
            )}

            {fromLauncher ? (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                  }}>
                  {startingProgress}
                </Box>
                {startupError && !!launcherBlockletUrl ? (
                  <Box
                    sx={{
                      width: '100%',
                      mt: 2,
                    }}>
                    <a
                      href={launcherBlockletUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="back-to-server-link">
                      {t('launchBlocklet.nav.viewMyApps')}
                    </a>
                  </Box>
                ) : null}
              </>
            ) : (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                  }}>
                  {startingProgress}
                </Box>
                {(status === 'running' || startupError) && !!serverUrl && (
                  <Box
                    sx={{
                      width: '100%',
                      mt: 2,
                    }}>
                    <a href={serverUrl} target="_blank" rel="noopener noreferrer" className="back-to-server-link">
                      {t('setup.complete.backToServer')}
                    </a>
                  </Box>
                )}
                {startupError && (
                  <Box
                    className="error-message"
                    sx={{
                      fontSize: 14,
                      color: '#888',
                      mt: 1,
                    }}>
                    {startupError}
                  </Box>
                )}
              </>
            )}
          </Center>
        }
      />
    </Container>
  );
}

const Container = styled(Layout)`
  justify-content: center;
  .icon-success {
    width: 64px;
    height: 64px;
    color: ${(props) => props.theme.palette.success.main};
  }
  .back-to-server-link {
    color: ${(props) => props.theme.palette.primary.main};
  }
  .error-message {
    color: ${(props) => props.theme.palette.error.main};
    height: 15em;
    overflow: hidden;
    overflow-y: scroll;
  }
`;

Complete.propTypes = {
  onPrevious: PropTypes.func,
  launcherSession: PropTypes.object,
};

const Center = styled(Box)`
  width: 100%;
  margin-top: auto;
  padding-top: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  .bottom-button {
    min-width: 200px;
  }
  ${(props) => props.theme.breakpoints.down('md')} {
    .bottom-button {
      width: 100%;
    }
  }
`;
