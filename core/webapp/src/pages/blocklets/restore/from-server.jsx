import React, { useState, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { joinURL } from 'ufo';
import { Global, css } from '@emotion/react';
import styled from '@emotion/styled';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Layout from '@blocklet/launcher-layout';
import { StepProvider } from '@blocklet/launcher-layout/lib/context/step';
import HeaderAddon from '@abtnode/ux/lib/layout/addon';
import NavLogo from '@abtnode/ux/lib/nav-logo';
import useServerLogo from '@abtnode/ux/lib/hooks/use-server-logo';
import { getServerUrl } from '@abtnode/ux/lib/blocklet/util';
import { getPathPrefix, getWebWalletUrl } from '@abtnode/ux/lib/util';

import { Link } from '@mui/material';
import { SessionContext } from '../../../contexts/session';
import { useNodeContext } from '../../../contexts/node';

import SelectApplication from './select-application';
import VerifyOwnership from './verify-ownership-from-server';
import RestoreBlocklet from './restore-blocklet';

export default function BlockletRestoreFromServer() {
  const logo = useServerLogo();
  const { t, locale } = useLocaleContext();
  const { info } = useNodeContext();
  const { meta, setMeta } = useState({});

  const serverUrl = useMemo(() => (info ? getServerUrl(info) : ''), [info]);
  const webWalletUrl = getWebWalletUrl(info);

  const basePath = joinURL(getPathPrefix(), '/blocklets/restore');

  const steps = [
    {
      key: 'select',
      name: t('blocklet.restoreFromServer.selectTitle'),
      path: joinURL(basePath, 'select'),
    },

    {
      key: 'verify-ownership',
      name: t('blocklet.restoreBlocklet.verify.title'),
      path: joinURL(basePath, 'verify-ownership'),
    },
    {
      key: 'restore-blocklet',
      name: t('blocklet.restoreBlocklet.restore.title'),
      path: joinURL(basePath, 'restore-blocklet'),
    },
  ];

  const navLogo = (
    <LogoContainer className={`${serverUrl ? 'logo-can-click' : ''}`}>
      <Link href={serverUrl || ''} target="_blank">
        <NavLogo logo={logo} />
      </Link>
    </LogoContainer>
  );

  return (
    <StepProvider steps={steps}>
      <Layout
        blockletMeta={{ ...meta, registryUrl: '' }}
        locale={locale}
        useOfSkeleton={false}
        navLogo={navLogo}
        headerEndAddons={<HeaderAddon webWalletUrl={webWalletUrl} SessionContext={SessionContext} />}
        pcWidth="80%"
        style={{ height: '100%' }}
        logoUrl={meta?.logo}>
        <Content>
          {/* eslint-disable-next-line no-use-before-define */}
          <Global styles={launcherGlobalStyle} />
          <Routes>
            <Route path="select" element={<SelectApplication onSelect={setMeta} />} />
            <Route path="verify-ownership" element={<VerifyOwnership />} />
            <Route path="restore-blocklet" element={<RestoreBlocklet />} />
            <Route path="*" element={<Navigate to={`select${window.location.search}`} replace />} />
          </Routes>
        </Content>
      </Layout>
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
