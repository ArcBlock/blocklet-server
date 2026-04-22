/* eslint-disable object-curly-newline */
// eslint-disable-next-line no-unused-vars
import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import '@abtnode/util/lib/dayjs';
import { CircularProgress as Spinner } from '@mui/material';
import Center from '@arcblock/ux/lib/Center';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { getServerAuthMethod } from '@abtnode/auth/lib/util/get-auth-method';
import useBrowser from '@arcblock/react-hooks/lib/useBrowser';

import { WELLKNOWN_SERVICE_PATH_PREFIX, SERVER_ROLES } from '@abtnode/constant';

import history from './libs/history';
import NodeConnectOwner from './components/node/connect-owner';
import NodeVerifyOwner from './components/node/verify-owner';
import NodeMaintainProgress from './components/node/maintain/progress';
import NodeLogin from './components/node/login';
import Health from './components/health';
import CheckNodeStatus from './components/check-node-status';
import Root from './components/root';
import DashboardRoute from './components/layout/layout-route';
import GlobalSubscriber from './components/global-subscriber';

import { useSessionContext } from './contexts/session';
import { useNodeContext } from './contexts/node';
import { NotificationProvider } from './contexts/notification';
import { BlockletsProvider } from './contexts/blocklets';
import { LaunchBlockletProvider } from './contexts/launch-blocklet';
import { BlockletAppProvider } from './contexts/blocklet-app';

import getWsClient from './libs/ws';
import useQuery from './hooks/query';
import './global.css';

const Dashboard = lazy(() => import('./pages/dashboard/index'));
const BlockletList = lazy(() => import('./pages/blocklets/index'));
const BlockletRestore = lazy(() => import('./pages/blocklets/restore/index'));
const BlockletStore = lazy(() => import('./pages/store/index'));
const Settings = lazy(() => import('./pages/settings/index'));
const LogPage = lazy(() => import('./pages/logger/index'));
const TeamPage = lazy(() => import('./pages/team/index'));
const BlockletDetail = lazy(() => import('./pages/blocklets/detail'));
const EULAPage = lazy(() => import('./pages/eula/index'));
const Notifications = lazy(() => import('./pages/notifications/index'));
const IssuePassport = lazy(() => import('./pages/issue-passport/index'));
const LostPassport = lazy(() => import('./pages/lost-passport/index'));
const ExchangePassport = lazy(() => import('./pages/exchange-passport/index'));
const BlockletLauncher = lazy(() => import('./pages/launch-blocklet/index'));
const NotFoundPage = lazy(() => import('./pages/notfound/index'));
const Invite = lazy(() => import('./pages/invite/index'));
const Console = lazy(() => import('./pages/console/index'));
const AnalyticsPage = lazy(() => import('./pages/analytics/index'));
const GenKeyPair = lazy(() => import('./pages/gen-key-pair/index'));
function useSharedContext() {
  const node = useNodeContext();
  const { session } = useSessionContext();
  const { wallet: isWalletWebview } = useBrowser();

  const userDid = session.user && session.user.did;

  // init ws client
  useEffect(() => {
    const wsClient = getWsClient();
    if (userDid) {
      wsClient.connect();
    } else if (wsClient.isConnected()) {
      wsClient.disconnect();
    }
    return () => {
      if (wsClient.isConnected()) {
        wsClient.disconnect();
      }
    };
  }, [userDid]);

  // auto check session when page visibility change
  useEffect(() => {
    if (isWalletWebview) {
      // 安卓 webview 中在 DID Connect 完成后会触发 visibilitychange 事件
      // 此刻 session.user 可能为空，决定在 Wallet 中禁用该功能
      return () => {};
    }

    const refresh = () => {
      if (document.visibilityState === 'visible') {
        session.refresh();
      }
    };
    document.addEventListener('visibilitychange', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []); // eslint-disable-line

  return { node, session };
}

export function ProtectedApp() {
  const { t } = useLocaleContext();
  const { node, session } = useSharedContext();
  const location = useLocation();

  useEffect(() => {
    if (window.tracker && typeof window.tracker.pageView === 'function') {
      window.tracker.pageView(`${location.pathname}${location.search}`);
    }
  }, [location]);

  // EXTERNAL_BLOCKLET_CONTROLLER should not access dashboard
  useEffect(() => {
    if (session?.user?.role === SERVER_ROLES.EXTERNAL_BLOCKLET_CONTROLLER) {
      session.logout();
    }
  }, [session?.user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadingEle = <Spinner />;

  if (node.loading || session.loading) {
    return <Center>{loadingEle}</Center>;
  }

  if (!node.info.initialized) {
    if (getServerAuthMethod(node.info) === 'nft') {
      return <NodeVerifyOwner action="verify-owner" />;
    }

    return (
      <Center>
        <NodeConnectOwner />
      </Center>
    );
  }

  if (node.info.upgradeSessionId) {
    return (
      <Center>
        <NodeMaintainProgress />
      </Center>
    );
  }

  if (!session.user) {
    return <NodeLogin loadingEle={loadingEle} />;
  }

  const fallback = (
    <Center>
      <Spinner />
    </Center>
  );

  return (
    <BlockletsProvider>
      <NotificationProvider>
        <Health />
        <CheckNodeStatus />
        <GlobalSubscriber />
        <Suspense fallback={fallback}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <DashboardRoute fullWidth title="Dashboard">
                  <Dashboard />
                </DashboardRoute>
              }
            />
            <Route
              path="/blocklets"
              element={
                <DashboardRoute fullWidth title={t('common.blocklets')}>
                  <BlockletList />
                </DashboardRoute>
              }
            />
            <Route
              path="/blocklets/:did/:tab"
              element={
                <DashboardRoute fullWidth title="Blocklets">
                  <BlockletDetail />
                </DashboardRoute>
              }
            />
            <Route
              path="/settings/:tab"
              element={
                <DashboardRoute fullWidth title={t('common.setting')}>
                  <Settings />
                </DashboardRoute>
              }
            />
            <Route
              path="/eula"
              element={
                <DashboardRoute fullWidth title={t('setup.steps.eula')}>
                  <EULAPage />
                </DashboardRoute>
              }
            />
            <Route
              path="/store"
              element={
                <DashboardRoute fullWidth title={t('common.store')}>
                  <BlockletStore />
                </DashboardRoute>
              }
            />
            <Route
              path="/console"
              element={
                <DashboardRoute title={`GraphQL ${t('common.console')}`} scrollable={false} fullWidth>
                  <Console />
                </DashboardRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <DashboardRoute title={t('notification.title')}>
                  <Notifications />
                </DashboardRoute>
              }
            />
            <Route
              path="/team/:tab"
              element={
                <DashboardRoute fullWidth title={t('common.team')}>
                  <TeamPage />
                </DashboardRoute>
              }
            />
            <Route
              path="/logs/:name?"
              element={
                <DashboardRoute scrollable={false} fullWidth title={t('common.logs')}>
                  <LogPage />
                </DashboardRoute>
              }
            />
            <Route
              path="/analytics/:tab"
              element={
                <DashboardRoute fullWidth title={t('common.analytics')}>
                  <AnalyticsPage />
                </DashboardRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/team" element={<Navigate to="/team/members" replace />} />
            <Route path="/analytics" element={<Navigate to="/analytics/traffic" replace />} />
            <Route path="/router" element={<Navigate to="/router/rules" replace />} />
            <Route path="/settings" element={<Navigate to="/settings/basic" replace />} />
            <Route path="/marketplace" element={<Navigate to="/store" replace />} />
            <Route path="/marketplace/:did" element={<Navigate to="/store/:did" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </NotificationProvider>
    </BlockletsProvider>
  );
}

// eslint-disable-next-line react/prop-types
export function UnprotectedWrapper({ children }) {
  const { node, session } = useSharedContext();

  if (node.loading || (!session.initialized && session.loading)) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  if (node.info.upgradeSessionId) {
    return (
      <Center>
        <NodeMaintainProgress />
      </Center>
    );
  }

  return children;
}

function App() {
  const { changeLocale } = useLocaleContext();
  const query = useQuery();

  useEffect(() => {
    const queryStringLocale = query.get('locale');
    if (queryStringLocale && ['zh', 'en'].includes(queryStringLocale)) {
      changeLocale(queryStringLocale);
    }
  }, []); // eslint-disable-line

  const fallback = (
    <Center>
      <Spinner />
    </Center>
  );

  return (
    <Suspense fallback={fallback}>
      <Routes>
        <Route
          path={`${WELLKNOWN_SERVICE_PATH_PREFIX}/issue-passport`}
          element={
            <UnprotectedWrapper>
              <IssuePassport />
            </UnprotectedWrapper>
          }
        />
        <Route
          path={`${WELLKNOWN_SERVICE_PATH_PREFIX}/lost-passport`}
          element={
            <UnprotectedWrapper>
              <LostPassport />
            </UnprotectedWrapper>
          }
        />
        <Route
          path={`${WELLKNOWN_SERVICE_PATH_PREFIX}/exchange-passport`}
          element={
            <UnprotectedWrapper>
              <ExchangePassport />
            </UnprotectedWrapper>
          }
        />
        <Route
          path="/accept-server"
          element={
            <UnprotectedWrapper>
              <NodeVerifyOwner action="accept-server" />
            </UnprotectedWrapper>
          }
        />
        <Route
          path="/gen-key-pair/"
          element={
            <UnprotectedWrapper>
              <GenKeyPair />
            </UnprotectedWrapper>
          }
        />
        <Route
          path="/launch-blocklet/*"
          element={
            <UnprotectedWrapper>
              <LaunchBlockletProvider>
                <BlockletLauncher />
              </LaunchBlockletProvider>
            </UnprotectedWrapper>
          }
        />
        <Route
          path="/blocklets/restore/*"
          element={
            <UnprotectedWrapper>
              <BlockletAppProvider>
                <BlockletRestore />
              </BlockletAppProvider>
            </UnprotectedWrapper>
          }
        />
        <Route
          path={`${WELLKNOWN_SERVICE_PATH_PREFIX}/invite`}
          element={
            <UnprotectedWrapper>
              <Invite />
            </UnprotectedWrapper>
          }
        />
        <Route path="/*" element={<ProtectedApp />} />
      </Routes>
    </Suspense>
  );
}

export default function AppWrapper() {
  const prefix = window.env && window.env.apiPrefix ? window.env.apiPrefix : '/';
  return (
    <Router history={history} basename={prefix}>
      <Root>
        <App />
      </Root>
    </Router>
  );
}
