import { getServerUrl } from '@abtnode/ux/lib/blocklet/util';
import Toast from '@arcblock/ux/lib/Toast';
import { formatError } from '@blocklet/error';
import StyledResultMessage from '@abtnode/ux/lib/result-message';
import AnimationWaiter from '@arcblock/ux/lib/AnimationWaiter';
import Button from '@arcblock/ux/lib/Button';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { BlockletEvents, RESTORE_PROGRESS_STATUS } from '@blocklet/constant';
import PageHeader from '@blocklet/launcher-layout/lib/page-header';
import ProgressMessage from '@blocklet/launcher-ux/lib/progress-message';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import React, { useEffect, useState, useRef } from 'react';
import { Link as InnerLink } from 'react-router-dom';
import useSetState from 'react-use/lib/useSetState';
import { isBlockletRunning } from '@blocklet/meta/lib/util';
import Debug from 'debug';
import { useBlockletAppContext } from '../../contexts/blocklet-app';
import { useNodeContext } from '../../contexts/node';
import useRuntimeBlockletState from '../../contexts/runtime-blocklet-state';
import getWsClient from '../../libs/ws';
import DownloadBundleProgress from './download-progress';
import { getRestoredAccessUrl, isServerlessBlockletInstalled } from './util';
import WaiterContainer from './wait-container';

const debug = Debug('@abtnode/webapp:restore-blocklet:step-install');

const Container = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow-y: auto;
`;

const ErrorMessageSub = styled(Box)`
  line-height: 1.4em;
  .error-desc {
    margin-top: 8px;
    word-wrap: break-word;
    color: ${props => props.theme.palette.grey[500]};
  }
`;

const restoreProgressMap = {
  [RESTORE_PROGRESS_STATUS.waiting]: 0,
  [RESTORE_PROGRESS_STATUS.start]: 1,
  [RESTORE_PROGRESS_STATUS.importData]: 2,
  [RESTORE_PROGRESS_STATUS.downloading]: 3,
  [RESTORE_PROGRESS_STATUS.importDataSuccess]: 4,
  [RESTORE_PROGRESS_STATUS.installing]: 5,
  [RESTORE_PROGRESS_STATUS.completed]: 10,
};

const COMMUNITY_LINK = 'https://community.arcblock.io/';
const SUPPORT_EMAIL = 'launcher@arcblock.io';

/**
 * @description
 * @param {{
 *  appDid: string
 * }} { appDid }
 * @return {{
 *  appDid: string,
 *  meta: { did: string,},
 *  status: typeof RESTORE_PROGRESS_STATUS
 * }}
 */
function useRestoreProgress({ appDid }) {
  const [progress, setProgress] = useState(RESTORE_PROGRESS_STATUS.waiting);

  const webSocketClient = getWsClient();
  webSocketClient.connect();

  useEffect(() => {
    webSocketClient.on(BlockletEvents.restoreProgress, data => {
      if (appDid === data?.appDid) {
        setProgress(data);
      }
    });

    return () => {
      webSocketClient.off(BlockletEvents.restoreProgress);
    };
  }, [appDid, webSocketClient]);

  return progress;
}

function Installation() {
  const currentURL = new URL(window.location.href);
  const appDid = currentURL.searchParams.get('appDid');
  const launchType = currentURL.searchParams.get('launchType');
  const nftId = currentURL.searchParams.get('nftId');
  const fromLauncher = currentURL.searchParams.get('fromLauncher');
  const from = currentURL.searchParams.get('from');
  const chainHost = currentURL.searchParams.get('chainHost');
  const restoreProgress = useRestoreProgress({ appDid });
  const [currentStep, setCurrentStep] = useState(0);
  const timer = useRef(null);

  const { meta } = useBlockletAppContext();
  const { t } = useLocaleContext();
  const { api, info } = useNodeContext();

  const [state, setState] = useSetState({
    nextAccessUrl: '',
    installError: null,
  });

  const runtimeBlockletState = useRuntimeBlockletState(appDid);
  const { status, eventName } = runtimeBlockletState;

  const onInstalled = () => {
    setCurrentStep(12);

    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    timer.current = setTimeout(() => {
      api.getBlocklet({ input: { did: appDid, attachRuntimeInfo: true } }).then(res => {
        if (res.blocklet) {
          // eslint-disable-next-line no-use-before-define
          visitBlocklet(res.blocklet);
        }
      });
    }, 500);
  };

  const handleInstalledProgress = () => {
    if (runtimeBlockletState?.runtimeBlocklet?.settings?.initialized) {
      // 等待启动
      setCurrentStep(11);
      return;
    }

    onInstalled();
  };

  const progressSteps = [
    t('blocklet.restoreFromSpaces.progress.waiting'),
    t('blocklet.restoreFromSpaces.progress.restoring'),
    t('blocklet.restoreFromSpaces.progress.importData'),
    t('blocklet.restoreFromSpaces.progress.downloading', {
      progress: `${restoreProgress?.data?.completed ?? 100}/${restoreProgress?.data?.total ?? 100}`,
    }),
    t('blocklet.restoreFromSpaces.progress.importSuccess'),
    t('launchBlocklet.waiting.downloading'),
    t('launchBlocklet.waiting.verifying'),
    t('launchBlocklet.waiting.downloading'),
    t('launchBlocklet.waiting.extracting'),
    status === 'upgrading' ? t('common.upgrading') : t('launchBlocklet.waiting.installing'),
    t('launchBlocklet.waiting.installed'),
    t('launchBlocklet.waiting.starting'),
    t('launchBlocklet.waiting.done'),
  ];

  useEffect(() => {
    if (restoreProgress.status === RESTORE_PROGRESS_STATUS.error) {
      const errorData = {
        message: restoreProgress.message,
        name: 'restoreFailed',
        action: 'retryRestore',
      };

      if (!isEqual(errorData, state.installError)) {
        Toast.error(formatError(errorData));
      }

      setState({ installError: errorData });

      return;
    }

    setCurrentStep(restoreProgressMap[restoreProgress.status] || 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoreProgress.status]);

  useEffect(() => {
    if (launchType === 'serverless' && eventName === BlockletEvents.nftConsumed) {
      handleInstalledProgress();
      return;
    }

    if (restoreProgress.status === RESTORE_PROGRESS_STATUS.waiting) {
      setCurrentStep(restoreProgressMap[restoreProgress.status] || 0);
      return;
    }

    if (
      restoreProgress.status !== RESTORE_PROGRESS_STATUS.completed &&
      restoreProgress.status !== RESTORE_PROGRESS_STATUS.error &&
      status !== 'running'
    ) {
      setCurrentStep(restoreProgressMap[restoreProgress.status] || 0);
      return;
    }

    switch (status) {
      case 'waiting':
        setCurrentStep(6);
        break;
      case 'downloading':
        setCurrentStep(7);
        break;
      case 'installing':
      case 'upgrading':
        setCurrentStep(8);
        break;
      case 'installed':
        if (launchType === 'serverless' && !isServerlessBlockletInstalled(runtimeBlockletState)) {
          break;
        }

        handleInstalledProgress();
        break;
      case 'starting':
        setCurrentStep(11);
        break;
      case 'running':
        setCurrentStep(12);
        onInstalled();
        break;
      case 'stopped':
        onInstalled();
        break;
      case 'corrupted':
      case 'error':
        // WARN: 暂时不要直接使用 runtimeBlockletState 的 error 数据；
        // 当下载中失败时，core/webapp/src/libs/ws.js 触发downloadFailed后，会更新一次 downloading，会让 error 被清理；所以error后，要通过 setState(setInstallError) 保存后使用；
        {
          runtimeBlockletState?.stopPolling();

          const errorData = {
            message: runtimeBlockletState?.error?.message,
            name: runtimeBlockletState?.eventName,
            action: 'retryRestore',
          };

          const onError = (tmpState = {}) => {
            if (!isEqual(errorData, state.installError) && runtimeBlockletState?.error?.message) {
              Toast.error(formatError(runtimeBlockletState.error));
            }

            setState({ installError: errorData, ...tmpState });
          };

          api
            .getBlocklet({ input: { did: appDid, attachRuntimeInfo: true } })
            .then(({ blocklet }) => {
              if (blocklet?.settings?.initialized) {
                errorData.action = 'retryStart';
              }

              onError();
            })
            .catch(() => {
              // 忽略请求 blocklet 自身失败的情况
              onError();
            });
        }

        break;
      default:
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, eventName, runtimeBlockletState]);

  // 跳转到下一步
  const visitBlocklet = async b => {
    const accessUrl = await getRestoredAccessUrl(b);

    if (isEmpty(accessUrl)) {
      return;
    }

    const url = new URL(accessUrl);
    // install blocklet 并跳转到 blocklet setup 界面时携带 serverUrl 查询参数
    url.searchParams.set('serverUrl', getServerUrl(info));

    if (b.status !== 'running') {
      url.searchParams.set('__start__', '1');
    }

    if (fromLauncher) {
      url.searchParams.set('fromLauncher', fromLauncher);
    }

    if (from) {
      url.searchParams.set('from', from);
    }

    if (launchType) {
      url.searchParams.set('launchType', launchType);
    }

    if (nftId) {
      url.searchParams.set('nftId', nftId);
    }

    if (chainHost) {
      url.searchParams.set('chainHost', chainHost);
    }

    runtimeBlockletState?.stopPolling();
    setState({
      nextAccessUrl: url.href,
      status: b.status,
      resultMessage: isBlockletRunning(b)
        ? {
            variant: 'success',
            title: t('blocklet.restoreFromSpaces.restore.completeTitle'),
            subTitle: '',
            footer: t('common.open'),
          }
        : {
            variant: 'info',
            title: t('blocklet.restoreFromSpaces.restore.installedTitle'),
            subTitle: t('blocklet.restoreFromSpaces.restore.installedSubTitle'),
            footer: t('common.configuration'),
          },
    });
  };

  const startBlocklet = async () => {
    setState({ installError: null, nextAccessUrl: '' });
    await api.startBlocklet({ input: { did: appDid } });
    runtimeBlockletState?.startPolling();
  };

  // View: Error
  if (state.installError) {
    const errorActions = {
      retryRestore: (
        <Button
          variant="contained"
          className="bottom-button"
          data-cy="retry-install"
          component={InnerLink}
          to={`/blocklets/restore/verify-ownership${window.location.search}`}>
          {t('common.retry')}
        </Button>
      ),
      retryStart: (
        <Button variant="contained" className="bottom-button" data-cy="retry-start" onClick={() => startBlocklet()}>
          {t('common.retry')}
        </Button>
      ),
    };

    const errorEventName = state.installError.name ? state.installError.name.replace('blocklet.', '') : 'installFailed';

    return (
      <StyledResultMessage
        variant="error"
        title={meta?.title}
        subTitle={
          <ErrorMessageSub>
            <div>{t(`launchBlocklet.error.${errorEventName}`)}</div>
            {state.installError.message && (
              <div className="error-desc">{t('common.errorMessage') + state.installError.message}</div>
            )}
          </ErrorMessageSub>
        }
        footer={
          <Footer>
            {errorActions[state.installError.action]}
            {launchType === 'serverless' && (
              <div
                style={{ marginTop: '24px' }}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: t('blocklet.restoreFromSpaces.restore.support', {
                    communityLink: COMMUNITY_LINK,
                    supportEmail: SUPPORT_EMAIL,
                  }),
                }}
              />
            )}
          </Footer>
        }
      />
    );
  }

  const done = !!state.nextAccessUrl;

  debug('render', { status, eventName, launchType, runtimeBlockletState, state });

  return (
    <Container>
      {!done && (
        <>
          <PageHeader
            title={t('blocklet.restoreBlocklet.restore.title')}
            subTitle={t('blocklet.restoreFromSpaces.restore.subTitle')}
          />
          <WaiterContainer>
            <AnimationWaiter
              increaseSpeed={0.3}
              messageLoop={false}
              message={
                <ProgressMessage
                  steps={progressSteps}
                  stepIndex={currentStep}
                  autoGrowth={currentStep === 10 ? 1000 : 4000}
                />
              }
            />
            {/* downloading, extracting */}
            {[5, 7, 8].includes(currentStep) && <DownloadBundleProgress appDid={appDid} />}
          </WaiterContainer>
        </>
      )}
      {done && (
        <StyledResultMessage
          variant={state.resultMessage.variant}
          title={state.resultMessage.title}
          subTitle={state.resultMessage.subTitle}
          footer={
            <Footer>
              <Button variant="contained" style={{ width: '200px' }} component={Link} href={state.nextAccessUrl}>
                {state.resultMessage.footer}
              </Button>
            </Footer>
          }
        />
      )}
    </Container>
  );
}

const Footer = styled(Box)`
  padding-top: 24px;
`;

export default Installation;
