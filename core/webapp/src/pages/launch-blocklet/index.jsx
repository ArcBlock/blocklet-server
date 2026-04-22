import { Routes, Route, Navigate } from 'react-router-dom';
import { joinURL } from 'ufo';
import { Global, css } from '@emotion/react';
import styled from '@emotion/styled';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Layout from '@blocklet/launcher-layout';
import { StepProvider } from '@blocklet/launcher-layout/lib/context/step';
import HeaderAddon from '@abtnode/ux/lib/layout/addon';
import NavLogo from '@abtnode/ux/lib/nav-logo';
import { useTheme, Alert, Link } from '@mui/material';
import AnimationWaiter from '@arcblock/ux/lib/AnimationWaiter';
import ProgressMessage from '@blocklet/launcher-ux/lib/progress-message';
import Center from '@arcblock/ux/lib/Center';
import useExtraNav from '@abtnode/ux/lib/launch-blocklet/use-extra-nav';
import useServerLogo from '@abtnode/ux/lib/hooks/use-server-logo';
import useLauncherLogo from '@abtnode/ux/lib/hooks/use-launcher-logo';
import { useNodeContext } from '../../contexts/node';
import Complete from '../../components/launch-blocklet/step-complete';
import Install from '../../components/launch-blocklet/step-install';
import Agreement from '../../components/launch-blocklet/step-agreement';
import { getBlockletLogoUrl, getPathPrefix, getWebWalletUrl } from '../../libs/util';
import { SessionContext } from '../../contexts/session';
import { useLaunchBlockletContext } from '../../contexts/launch-blocklet';

export default function BlockletLauncher() {
  const theme = useTheme();
  const serverLogo = useServerLogo();
  const launcherLogo = useLauncherLogo();
  const { t, locale } = useLocaleContext();
  const { info } = useNodeContext();
  const webWalletUrl = getWebWalletUrl(info);
  const { serverUrl, fromLauncher, meta, isFree, loading, error, storeUrl, launchType, launcherUrl, launcherSession } =
    useLaunchBlockletContext();

  const basePath = joinURL(getPathPrefix(), '/launch-blocklet');
  const extraNav = useExtraNav(launchType, launcherUrl, launcherSession?.userDid);

  const commonSteps = [
    {
      key: 'install',
      name: t('launchBlocklet.steps.installApp'),
      path: joinURL(basePath, 'install'),
    },
    {
      key: 'setup',
      name: t('setup.steps.launchApp'),
    },
  ];

  let steps = [
    {
      key: 'agreement',
      name: t('launchBlocklet.introduction'),
      path: joinURL(basePath, 'agreement'),
    },
    ...commonSteps,
  ];

  let navLogo = (
    <LogoContainer className={`${serverUrl ? 'logo-can-click' : ''}`}>
      <Link href={serverUrl || ''} target="_blank">
        <NavLogo logo={serverLogo} />
      </Link>
    </LogoContainer>
  );

  // 从launcher 代表已经同意了 blocklet agreement
  if (fromLauncher) {
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

    navLogo = (
      <LogoContainer className={`${serverUrl ? 'logo-can-click' : ''}`}>
        <Link href={serverUrl || ''} target="_blank">
          <NavLogo logo={serverLogo} previousData={{ logo: launcherLogo }} />
        </Link>
      </LogoContainer>
    );
  }

  const blocklet = { meta, isFree };

  return (
    <StepProvider steps={steps}>
      <Layout
        locale={locale}
        loading={loading}
        className="page-layout"
        blockletMeta={{ ...meta, isFree }}
        useOfSkeleton={false}
        navLogo={navLogo}
        headerEndAddons={<HeaderAddon webWalletUrl={webWalletUrl} SessionContext={SessionContext} />}
        pcWidth="80%"
        style={{ height: '100%' }}
        theme={theme}
        logoUrl={
          meta && meta.logo
            ? getBlockletLogoUrl({
                did: meta.did,
                version: meta.version,
                baseUrl: storeUrl,
                logoPath: meta.logo,
              })
            : null
        }
        extraNav={extraNav}>
        <Content>
          {/* eslint-disable-next-line no-use-before-define */}
          <Global styles={launcherGlobalStyle} />

          {loading && (
            <Center relative="parent">
              <AnimationWaiter
                increaseSpeed={0.3}
                messageLoop={false}
                message={
                  <ProgressMessage steps={[t('launchBlocklet.waiting.parsing')]} stepIndex={0} autoGrowth={2000} />
                }
              />
            </Center>
          )}

          {!loading && error && (
            <Center relative="parent">
              <Alert style={{ wordBreak: 'break-all' }} severity="error">
                {error}
              </Alert>
            </Center>
          )}

          {!loading && !error && (
            <Routes>
              <Route path="agreement" element={<Agreement />} />
              <Route path="install" element={<Install />} />
              <Route path="complete" element={<Complete blocklet={blocklet} />} />
              <Route path="*" element={<Navigate to={`agreement${window.location.search}`} replace />} />
            </Routes>
          )}
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
  .page-layout .ll-header {
    @media (max-width: 960px) {
      padding: 0 12px;
    }
  }
`;

const Content = styled.div`
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
