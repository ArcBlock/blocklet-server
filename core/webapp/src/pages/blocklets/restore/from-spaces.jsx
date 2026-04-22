import React, { useMemo } from 'react';
import toLower from 'lodash/toLower';
import { Routes, Route, Navigate } from 'react-router-dom';
import { joinURL } from 'ufo';
import { Global, css } from '@emotion/react';
import { useTheme, Link } from '@mui/material';
import styled from '@emotion/styled';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Layout from '@blocklet/launcher-layout';
import { StepProvider } from '@blocklet/launcher-layout/lib/context/step';
import HeaderAddon from '@abtnode/ux/lib/layout/addon';
import NavLogo from '@abtnode/ux/lib/nav-logo';
import useServerLogo from '@abtnode/ux/lib/hooks/use-server-logo';

import { getServerUrl } from '@abtnode/ux/lib/blocklet/util';
import { getPathPrefix, getWebWalletUrl } from '@abtnode/ux/lib/util';

import { SessionContext } from '../../../contexts/session';
import { useNodeContext } from '../../../contexts/node';

import ConnectSpace from './connect-space';
import VerifyOwnership from './verify-ownership';
import RestoreBlocklet from './restore-blocklet';
import useQuery from '../../../hooks/query';
import { useBlockletAppContext } from '../../../contexts/blocklet-app';

/**
 *
 * @see https://github.com/blocklet/nft-maker/blob/main/blocklets/core/src/components/step-dialog.jsx
 * @see https://github.com/blocklet/nft-maker/blob/main/blocklets/core/src/components/create-nft.jsx
 * @export
 * @return {React.Component}
 */
export default function BlockletRestore() {
  const theme = useTheme();
  const logo = useServerLogo();
  const { t, locale } = useLocaleContext();
  const { info } = useNodeContext();
  const query = useQuery();
  const { meta } = useBlockletAppContext();

  const serverUrl = useMemo(() => (info ? getServerUrl(info) : ''), [info]);
  const webWalletUrl = getWebWalletUrl(info);

  const basePath = joinURL(getPathPrefix(), '/blocklets/restore');

  const commonSteps = [
    {
      key: 'verify-ownership',
      name: t('blocklet.restoreBlocklet.verify.title'),
      path: joinURL(basePath, 'verify-ownership'),
    },
    {
      key: 'restore-blocklet',
      name: t('blocklet.restoreFromSpaces.restore.title'),
      path: joinURL(basePath, 'restore-blocklet'),
    },
  ];

  let steps = [];

  if (toLower(query.get('from')) === 'launcher') {
    steps = [
      {
        key: 'purchase-space',
        name: t('launchBlocklet.steps.purchaseSpace'),
      },
      {
        key: 'prepare-space',
        name: t('launchBlocklet.steps.prepareSpace'),
      },
      ...commonSteps,
    ];
  } else {
    steps = [
      {
        key: 'connect-space',
        name: t('blocklet.restoreFromSpaces.connect.title'),
        path: joinURL(basePath, 'connect-space'),
      },
      {
        key: 'select-blocklet',
        name: t('blocklet.restoreFromSpaces.selectBlocklet.title'),
      },
      ...commonSteps,
    ];
  }

  const navLogo = (
    <LogoContainer className={`${serverUrl ? 'logo-can-click' : ''}`}>
      <Link href={serverUrl || ''} target="_blank">
        <NavLogo logo={logo} />
      </Link>
    </LogoContainer>
  );

  return (
    <StepProvider steps={steps}>
      <StyledLayout
        blockletMeta={meta}
        locale={locale}
        useOfSkeleton={false}
        navLogo={navLogo}
        navSubTitle={t('blocklet.restoreFromSpaces.navSubTitle')}
        loading={false}
        headerEndAddons={<HeaderAddon webWalletUrl={webWalletUrl} SessionContext={SessionContext} />}
        pcWidth="80%"
        style={{ height: '100%' }}
        logoUrl={meta?.logo}
        theme={theme}>
        <Content>
          {/* eslint-disable-next-line no-use-before-define */}
          <Global styles={launcherGlobalStyle} />
          <Routes>
            <Route path="connect-space" element={<ConnectSpace />} />
            <Route path="verify-ownership" element={<VerifyOwnership />} />
            <Route path="restore-blocklet" element={<RestoreBlocklet />} />
            <Route path="*" element={<Navigate to="connect-space" replace />} />
          </Routes>
        </Content>
      </StyledLayout>
    </StepProvider>
  );
}

const launcherGlobalStyle = css`
  html,
  body,
  #root,
  #root > .wrapper {
    height: 100%;
  }
`;

const Content = styled.div`
  ${props => props.theme.breakpoints.up('md')} {
    padding-top: 34px;
  }
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;

  .bottom-button {
    min-width: 200px;
  }
`;

const LogoContainer = styled.div`
  margin-top: -1px;
  &.logo-can-click {
    cursor: pointer;
  }
`;

const StyledLayout = styled(Layout)`
  .layout-content {
    min-width: 0;
    flex: 1 1 0;
  }
`;
