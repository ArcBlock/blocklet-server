/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import '@iconify/iconify';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import PropTypes from 'prop-types';
import { ErrorBoundary } from 'react-error-boundary';
import { joinURL } from 'ufo';

import { colorMap } from '@abtnode/ux/lib/blocklet/status';
import { isServerless } from '@abtnode/ux/lib/blocklet/util';
import useBlockletLogo from '@abtnode/ux/lib/hooks/use-blocklet-logo';
import Feedback from '@abtnode/ux/lib/layout/feedback';
import SubscriptionBlocklet from '@abtnode/ux/lib/subscription/blocklet';
import SubscriptionServer from '@abtnode/ux/lib/subscription/server';
import Button from '@arcblock/ux/lib/Button';
import Center from '@arcblock/ux/lib/Center';
import { ErrorFallback } from '@arcblock/ux/lib/ErrorBoundary';
import UxImg from '@arcblock/ux/lib/Img';
import { useFullPage } from '@arcblock/ux/lib/Layout/dashboard/full-page';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { formatError } from '@blocklet/error';
import { getDisplayName, isRunning } from '@blocklet/meta/lib/util';
import Dashboard from '@blocklet/ui-react/lib/Dashboard';
import KeyboardArrowDownRoundedIcon from '@iconify-icons/material-symbols/arrow-outward';
import { Icon } from '@iconify/react';
import Fullscreen from '@mui/icons-material/Fullscreen';
import FullscreenExit from '@mui/icons-material/FullscreenExit';
import Spinner from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import { useLocation } from 'react-router-dom';

import { useBlockletContext } from '../../contexts/blocklet';
import { useNodeContext } from '../../contexts/node';
import WizardAddon from './wizard-addon';

function Toggle() {
  const { inFullPage, toggleFullPage } = useFullPage();

  return (
    <IconButton onClick={toggleFullPage}>
      {inFullPage ? (
        <FullscreenExit sx={{ transform: 'scale(1.3)' }} />
      ) : (
        <Fullscreen sx={{ transform: 'scale(1.3)' }} />
      )}
    </IconButton>
  );
}
export default function Layout({
  children = null,
  title = '',
  appPath = undefined,
  appTab = undefined,
  onAppTabChange = undefined,
}) {
  const { t } = useLocaleContext();
  const {
    loading,
    error,
    actions: { refreshBlocklet },
    env,
    blocklet,
  } = useBlockletContext();
  const { info: nodeInfo, imgPrefix } = useNodeContext();
  const location = useLocation();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const theme = useTheme();

  const { appId, version } = env;

  const infos = [
    {
      label: 'App ID',
      value: appId,
    },
    {
      label: 'App Version',
      value: version,
    },
    {
      label: 'App Bundle Name',
      value: blocklet?.meta?.bundleName,
    },
    {
      label: 'Server Id',
      value: nodeInfo.did,
    },
    {
      label: 'Server Version',
      value: nodeInfo.version,
    },
  ];

  const renderAddons = (addons) => {
    const _addons = Array.isArray(addons) ? addons : [addons];
    // _addons.unshift(<NotificationAddon />);
    _addons.unshift(<WizardAddon />);
    if (!isMobile) {
      _addons.unshift(<Toggle />);
    }

    if (blocklet) {
      // blocklet 在渲染的过程中可能为空，一旦为空就会被认为是 else if 里面的逻辑;
      // 所以订阅信息要在 blocklet 存在的情况下才判断
      const subscriptionSx = { cursor: 'pointer', marginRight: { xs: '8px', md: '48px' } };

      // 优先展示 Serverless Blocklet 订阅信息
      if (isServerless(blocklet)) {
        _addons.unshift(
          <SubscriptionBlocklet
            chainHost={blocklet?.controller?.chainHost}
            nftId={blocklet?.controller?.nftId}
            launcherSessionId={blocklet?.controller?.launcherSessionId}
            launcherUrl={blocklet?.controller?.launcherUrl}
            sx={subscriptionSx}
          />
        );
      } else if (nodeInfo.ownerNft && nodeInfo.launcher) {
        // 如果不是 Serverless Blocklet，展示 Server 订阅信息

        _addons.unshift(
          <SubscriptionServer
            chainHost={nodeInfo.launcher.chainHost}
            launcherUrl={nodeInfo.launcher.url}
            nftId={nodeInfo.ownerNft.did}
            launcherSessionId={nodeInfo.ownerNft.launcherSessionId}
            sx={subscriptionSx}
          />
        );
      }
    }

    return _addons;
  };

  const blockletLogo = useBlockletLogo({
    blocklet,
  });

  const headerProps = {
    logo: blockletLogo ? <img src={blockletLogo} alt="logo" /> : null,
    brandAddon: (
      <Box>
        {blocklet && (
          <Box
            component="a"
            target="_blank"
            href={window.blocklet.appUrl}
            rel="noopener noreferrer"
            title={window.blocklet.appName}
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1,
              py: 0.5,
              px: 2,
              border: '1px solid',
              borderColor: 'text.disabled',
              borderRadius: '30px',
              cursor: 'pointer',
            }}>
            <Tooltip title={isRunning(blocklet?.status) ? undefined : t(`blocklet.status.${blocklet?.status}`)}>
              <Box
                sx={{
                  bgcolor: colorMap[blocklet?.status],
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                }}
              />
            </Tooltip>

            <Box
              sx={{
                color: 'text.secondary',
                maxWidth: isMobile ? 66 : 240,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
              {getDisplayName(blocklet)}
            </Box>

            <Box component={Icon} icon={KeyboardArrowDownRoundedIcon} sx={{ color: 'text.secondary' }} />
          </Box>
        )}
      </Box>
    ),
  };

  const links = (navigators) => {
    const result = navigators?.map((navigator) => {
      navigator.children = navigator.children?.map((child) => {
        if (child.id === '/team/aigne') {
          const image = imgPrefix ? joinURL(imgPrefix, '/aigne-hub.png') : '/aigne-hub.pg';
          return {
            ...child,
            icon: (
              <UxImg
                src={image}
                alt="AIGNE Hub"
                style={theme.palette.mode === 'dark' ? { filter: 'invert(1)' } : {}}
                fallback={child.icon}
              />
            ),
          };
        }
        return child;
      });
      return navigator;
    });

    return result;
  };

  return (
    <StyledDashboard
      legacy={false}
      fullWidth
      headerAddons={renderAddons}
      headerProps={headerProps}
      links={links}
      title={title}
      // isMobile={isMobile}
      footerProps={{
        addon: <Feedback infos={infos} />,
      }}
      appPath={appPath}
      appTab={appTab}
      onAppTabChange={onAppTabChange}>
      {!blocklet && loading && (
        <Center relative="parent">
          <Spinner />
        </Center>
      )}
      {!blocklet && error && (
        <Center relative="parent">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
            }}>
            <ErrorOutlineIcon color="error" sx={{ marginRight: 1 }} />
            {formatError(error)}
          </Box>
          <Button onClick={() => refreshBlocklet()}>
            <span style={{ textDecoration: 'underline' }}>{t('common.retry')}</span>
          </Button>
        </Center>
      )}
      {!!blocklet && (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}>
          <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[location.pathname]}>
            {children}
          </ErrorBoundary>
        </Box>
      )}
    </StyledDashboard>
  );
}

Layout.propTypes = {
  children: PropTypes.any,
  title: PropTypes.string,
  appPath: PropTypes.string,
  appTab: PropTypes.string,
  onAppTabChange: PropTypes.func,
};

const StyledDashboard = styled(Dashboard)`
  .header-addons .locales {
    max-height: 400px;
    overflow-y: auto;
  }

  .header-brand-addon {
    display: block;
  }
`;
