/* eslint-disable react/jsx-one-expression-per-line */
import React, { useCallback, isValidElement, lazy, Suspense } from 'react'; // eslint-disable-line no-unused-vars
import styled from '@emotion/styled';
import { useParams, useNavigate, Link, NavLink } from 'react-router-dom';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import Tabs from '@arcblock/ux/lib/Tabs';
import Alert from '@mui/material/Alert';
import Button from '@arcblock/ux/lib/Button';
import { getDisplayName, getAppMissingConfigs, isExternalBlocklet, getBlockletServices } from '@blocklet/meta/lib/util';
import BlockletStatus from '@abtnode/ux/lib/blocklet/status';
import { DeletingBlockletProvider } from '@abtnode/ux/lib/contexts/deleting-blocklets';
import '@iconify/iconify';
import Toast from '@arcblock/ux/lib/Toast';
import BlockletAppAvatar from '@abtnode/ux/lib/blocklet/app-avatar';
import BlockletMigration from '@abtnode/ux/lib/blocklet/migration';
import { APP_STRUCT_VERSION } from '@abtnode/constant';
import { useSessionContext } from '@abtnode/ux/lib/contexts/session';
import Center from '@arcblock/ux/lib/Center';
import Result from '@arcblock/ux/lib/Result';
import { useCreation } from 'ahooks';
import { CircularProgress } from '@mui/material';
import { BlockletAdminRoles } from '@abtnode/ux/lib/util';
import BlockletActions from '../../components/blocklet/actions';
import { useNodeContext } from '../../contexts/node';
import { TeamProvider } from '../../contexts/team';
import { BlockletProvider, useBlockletContext } from '../../contexts/blocklet';
import { formatError, isInstalling, createAppPassportSvg } from '../../libs/util';
import Permission from '../../components/permission';
import useHtmlTitle from '../../hooks/html-title';
import { useBlockletsContext } from '../../contexts/blocklets';

const BlockletOverview = lazy(() => import('@abtnode/ux/lib/blocklet/overview'));
const BlockletDomains = lazy(() => import('@abtnode/ux/lib/blocklet/domains'));
const BlockletPreferences = lazy(() => import('@abtnode/ux/lib/blocklet/preferences'));
const BlockletAppearance = lazy(() => import('@abtnode/ux/lib/blocklet/appearance'));
const BlockletConfigNavigation = lazy(() => import('@abtnode/ux/lib/blocklet/config-navigation'));
const NotificationRecords = lazy(() => import('@abtnode/ux/lib/blocklet/notification-records'));
const AuditLogs = lazy(() => import('@abtnode/ux/lib/blocklet/audit-logs'));
const Passports = lazy(() => import('@abtnode/ux/lib/team/passports/new'));
const Members = lazy(() => import('@abtnode/ux/lib/team/members'));
const BlockletService = lazy(() => import('../../components/blocklet/service'));
const Components = lazy(() => import('../../components/blocklet/component'));
const BlockletLog = lazy(() => import('@abtnode/ux/lib/blocklet/log'));
const Runtime = lazy(() => import('@abtnode/ux/lib/analytics/runtime'));
const Traffic = lazy(() => import('@abtnode/ux/lib/analytics/traffic'));
const DIDSpaces = lazy(() => import('@abtnode/ux/lib/blocklet/did-spaces'));

const Empty = ({ children }) => children;

function BlockletDetail() {
  const navigate = useNavigate();
  const { tab: currentTab = 'overview' } = useParams();
  const {
    did,
    blocklet: currentState,
    error,
    client,
    actions: { setBlocklet: setCurrentState, refreshBlocklet: getBlocklet },
  } = useBlockletContext();
  const { refresh: refreshNode } = useNodeContext();
  const { t } = useLocaleContext();
  const { session } = useSessionContext();
  const { data: blocklets } = useBlockletsContext();

  const isAdmin = useCreation(() => {
    return session.user?.role && BlockletAdminRoles.includes(session.user.role);
  }, [session]);

  const renderAuditLogs = useCallback(() => <AuditLogs scope={did} blocklets={blocklets} />, [did, blocklets]);
  const renderNotificationRecords = useCallback(
    () => (isAdmin ? <NotificationRecords blocklet={currentState} /> : <Result status={403} />),
    [currentState, isAdmin]
  );

  const appUrl = currentState?.environments.find(x => x.key === 'BLOCKLET_APP_URL')?.value || window.location.origin;
  const createPassportSvg = props => createAppPassportSvg(props, appUrl);

  const onTabChange = newTab => {
    navigate(`/blocklets/${did}/${newTab}`);
  };

  // eslint-disable-next-line no-unused-vars
  const onUpdate = blocklet => {
    if (blocklet) {
      setCurrentState(blocklet);
    }

    getBlocklet();
  };

  const missingRequiredConfigs =
    !currentState || isInstalling(currentState.status) ? [] : getAppMissingConfigs(currentState);

  let content = null;
  const tabs = [
    { label: t('common.overview'), value: 'overview' },
    {
      breadcrumbsLabel: t('common.components'),
      label: (
        <Badge data-cy="blocklet-list" color="error" variant="dot" invisible={!missingRequiredConfigs.length}>
          {t('common.components')}
        </Badge>
      ),
      value: 'components',
    },
  ];

  if (error) {
    content = (
      <>
        <Alert severity="error">{formatError(error)}</Alert>
        <Button onClick={() => getBlocklet()}>
          <span style={{ textDecoration: 'underline' }}>{t('common.retry')}</span>
        </Button>
      </>
    );
  } else if (currentState) {
    const renders = {
      overview: <BlockletOverview />,
      domains: <BlockletDomains />,
      configuration: BlockletPreferences,
      appearance: BlockletAppearance,
      navigation: BlockletConfigNavigation,
      services: BlockletService,
      members: <Members type="blocklet" createPassportSvg={createPassportSvg} />,
      passports: Passports,
      components: Components,
      'audit-logs': renderAuditLogs,
      notifications: renderNotificationRecords,
      logs: BlockletLog,
      runtime: <Runtime />,
      traffic: <Traffic client={client} did={did} />,
      didSpaces: <DIDSpaces />,
    };

    if (currentTab === 'configuration' && isInstalling(currentState.status)) {
      onTabChange('overview');
    }

    tabs.push({ label: t('common.domains'), value: 'domains' });
    tabs.push({ label: t('common.members'), value: 'members' });
    tabs.push({ label: t('team.member.passports'), value: 'passports' });
    tabs.push({ label: t('common.configuration'), value: 'configuration' });
    tabs.push({ label: t('common.appearance'), value: 'appearance' });
    tabs.push({ label: t('common.auditLogs'), value: 'audit-logs' });

    if (isAdmin) {
      tabs.push({ label: t('common.notificationRecords'), value: 'notifications' });
    }

    if (currentState && currentState.children?.length && currentState.structVersion === APP_STRUCT_VERSION) {
      tabs.push({ label: t('common.logs'), value: 'logs' });
    }

    tabs.push({ label: t('common.configNavigation'), value: 'navigation' });
    tabs.push({ label: t('common.runtime'), value: 'runtime' });
    tabs.push({ label: t('common.traffic'), value: 'traffic' });
    tabs.push({ label: t('storage.spaces.title'), value: 'didSpaces' });

    const services = getBlockletServices(currentState);
    if (services.length) {
      tabs.splice(2, 0, { label: t('blocklet.services'), value: 'services' });
    }

    const TabComponent = renders[currentTab] || renders.overview;

    content = (
      <DeletingBlockletProvider type="components">
        {!isExternalBlocklet(currentState) && (
          <Tabs tabs={tabs} current={currentTab} onChange={onTabChange} scrollButtons="auto" />
        )}
        <div className="page-content">
          <Suspense
            fallback={
              <Center relative="parent">
                <CircularProgress />
              </Center>
            }>
            {isValidElement(TabComponent) ? (
              TabComponent
            ) : (
              <TabComponent blocklet={currentState} onUpdate={onUpdate} createPassportSvg={createPassportSvg} />
            )}
          </Suspense>
        </div>
      </DeletingBlockletProvider>
    );
  } else {
    content = (
      <Center relative="parent">
        <CircularProgress />
      </Center>
    );
  }

  const onActionStart = () => {};
  const onActionComplete = ({ action, error: err }) => {
    if (err) {
      Toast.error(err.message);
      return;
    }

    if (action === 'remove') {
      refreshNode();
      navigate('/blocklets');
    } else {
      getBlocklet();
    }
  };
  const currentTabDesc = tabs.find(x => x.value === currentTab);

  const ProxyTeamProvider = currentState ? TeamProvider : Empty;

  const htmlTitle = useHtmlTitle(currentTabDesc, currentState?.meta?.title || t('common.blocklets'));

  return (
    <ProxyTeamProvider teamDid={did}>
      {htmlTitle}
      <Main>
        <Breadcrumbs separator="›" aria-label="breadcrumb" className="page-breadcrumb">
          <Link color="textSecondary" to="/blocklets">
            {t('common.blocklets')}
          </Link>
          <NavLink to={`/blocklets/${did}/overview`} style={active => (active ? { color: 'inherit' } : {})}>
            {t('common.detail')}
          </NavLink>
          <Typography color="textSecondary">
            {currentTabDesc ? currentTabDesc.breadcrumbsLabel || currentTabDesc.label : ''}
          </Typography>
        </Breadcrumbs>

        <Typography component="div" className="page-header">
          <Typography component="h2" variant="h4" className="page-title" color="textPrimary">
            {currentState ? <BlockletAppAvatar blocklet={currentState} style={{ marginRight: 16 }} /> : null}
            {currentState ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1,
                }}>
                <Box>{getDisplayName(currentState)}</Box>
                {currentState?.status !== 'unknown' && (
                  <BlockletStatus
                    size="12px"
                    status={currentState.status}
                    source={currentState.source}
                    progress={currentState.progress}
                  />
                )}
              </Box>
            ) : (
              `${t('common.blocklet')} ${t('common.detail')}`
            )}
          </Typography>
          <Permission permission="mutate_blocklets">
            {!!currentState && !isExternalBlocklet(currentState) && (
              <BlockletActions
                className="page-actions"
                blocklet={currentState}
                onStart={onActionStart}
                onComplete={onActionComplete}
                variant="group"
                source="blocklet-detail"
              />
            )}
          </Permission>
        </Typography>

        <BlockletMigration />

        {content}
      </Main>
    </ProxyTeamProvider>
  );
}

export default function WrapBlockletDetail() {
  const { did } = useParams();

  if (!did) {
    return null;
  }

  return (
    <BlockletProvider did={did}>
      <BlockletDetail />
    </BlockletProvider>
  );
}

const Main = styled.main`
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
  }

  .page-title {
    display: flex;
    align-items: center;

    .page-link {
      font-size: 15px;
      margin-top: 8px;
      margin-left: 8px;
    }
  }

  .page-content {
    margin-top: 16px;
  }

  @media (max-width: ${props => props.theme.breakpoints.values.md}px) {
    .page-header {
      flex-direction: column;
      align-items: flex-start;
      .page-actions,
      .MuiButtonGroup-root {
        width: 100%;
      }
      .MuiButtonGroup-root {
        .MuiButtonBase-root {
          flex: 1;
        }
        .blocklet-action-text {
          display: none;
        }
      }
    }

    .page-title {
      margin-bottom: 15px;
    }
  }
`;
