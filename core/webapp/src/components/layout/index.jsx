/* eslint-disable react/prop-types */
import DidAddress from '@abtnode/ux/lib/did-address';
import BlockletsIcon from '@arcblock/icons/lib/Blocklets';
import CodeFolderIcon from '@arcblock/icons/lib/CodeFolder';
import DashboardIcon from '@arcblock/icons/lib/Dashboard';
import LogIcon from '@arcblock/icons/lib/Log';
import SettingIcon from '@arcblock/icons/lib/Setting';
import StoreIcon from '@arcblock/icons/lib/Store';
import TeamIcon from '@arcblock/icons/lib/Team';
import { ErrorFallback } from '@arcblock/ux/lib/ErrorBoundary';
import BaseLayout from '@arcblock/ux/lib/Layout/dashboard';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import Tag from '@arcblock/ux/lib/Tag';
import AnalyticsIcon from '@mui/icons-material/Insights';
import useMediaQuery from '@mui/material/useMediaQuery';
import PropTypes from 'prop-types';
import { useContext } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useLocation } from 'react-router-dom';

import { NODE_MODES } from '@abtnode/constant';
import HeaderAddon from '@abtnode/ux/lib/layout/addon';
import Feedback from '@abtnode/ux/lib/layout/feedback';
import SubscriptionServer from '@abtnode/ux/lib/subscription/server';

// eslint-disable-next-line import/no-unresolved
import Logo from '../../assets/logo.svg?react';
import { useNodeContext } from '../../contexts/node';
import { SessionContext } from '../../contexts/session';
import useShowConsole from '../../hooks/show-console';
import NotificationAddon from './notification-addon';

export default function Dashboard({ children, title = 'Blocklet Server', ...rest }) {
  const { info } = useNodeContext();
  const { t } = useContext(LocaleContext);
  const location = useLocation();
  const showConsole = useShowConsole();
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('md'));

  const ownerNftId = info.ownerNft?.did || '';
  const chainHost = info.launcher?.chainHost || '';
  const launcherUrl = info.launcher?.url || '';

  const links = [
    {
      url: '/dashboard',
      name: 'dashboard',
      title: t('sidebar.dashboard'),
      icon: <DashboardIcon />,
    },
    { url: '/store', name: 'store', title: t('common.store'), icon: <StoreIcon /> },
    { url: '/blocklets', name: 'blocklets', title: t('sidebar.blocklets'), icon: <BlockletsIcon /> },
    { url: '/logs', name: 'log', title: t('common.logs'), icon: <LogIcon /> },
    { url: '/team', name: 'team', title: t('common.team'), icon: <TeamIcon /> },
    { url: '/analytics', name: 'analytics', title: t('common.analytics'), icon: <AnalyticsIcon /> },
    { url: '/settings', name: 'settings', title: t('sidebar.settings'), icon: <SettingIcon /> },
  ];

  if (showConsole) {
    links.push({ url: '/console', name: 'console', title: t('sidebar.console'), icon: <CodeFolderIcon /> });
  }

  const mode = info.mode || NODE_MODES.PRODUCTION;
  const tagTypeMap = {
    [NODE_MODES.PRODUCTION]: 'success',
    [NODE_MODES.SERVERLESS]: 'primary',
    [NODE_MODES.MAINTENANCE]: 'error',
    [NODE_MODES.DEBUG]: 'error',
  };

  const infos = [
    {
      label: 'Server ID',
      value: info.did,
    },
    {
      label: 'Server Version',
      value: info.version,
    },
  ];

  // TODO: 因为BaseLayout绑定了标签的title，暂时将h2隐藏；以后将 ui 适配转移到 ux 的dashboard组件
  return (
    <BaseLayout
      links={links}
      headerProps={{
        brand: info.name,
        description: <DidAddress compact responsive={false} copyable={false} showCopyButtonInTooltip did={info.did} />,
        brandAddon: <Tag type={tagTypeMap[mode]}>{`${mode} mode`}</Tag>,
        addons: (
          <>
            {ownerNftId && chainHost && (
              <SubscriptionServer
                chainHost={chainHost}
                launcherUrl={launcherUrl}
                nftId={ownerNftId}
                launcherSessionId={info.ownerNft?.launcherSessionId}
                sx={{ cursor: 'pointer', marginRight: { xs: '8px', md: '64px' } }}
              />
            )}
            <HeaderAddon SessionContext={SessionContext} extraItems={[<NotificationAddon />]} />
          </>
        ),
        logo: isMobile ? null : <Logo width="48" height="48" />,
      }}
      footerProps={{
        addon: <Feedback infos={infos} />,
      }}
      title={`${title} | ${info.name}`}
      legacy={false}
      dense={false}
      {...rest}>
      <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[location.pathname]}>
        {children}
      </ErrorBoundary>
    </BaseLayout>
  );
}

Dashboard.propTypes = {
  children: PropTypes.any.isRequired,
  title: PropTypes.string,
};
