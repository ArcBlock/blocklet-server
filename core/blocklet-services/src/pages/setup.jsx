import { Global, css } from '@emotion/react';
import styled from '@emotion/styled';

import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { ConfigSpaceProvider } from '@abtnode/ux/lib/contexts/config-space';
import HeaderAddon from '@abtnode/ux/lib/layout/addon';
import Layout from '@blocklet/launcher-layout';
import { StepProvider } from '@blocklet/launcher-layout/lib/context/step';
import { getDisplayName } from '@blocklet/meta/lib/util';
import { Box, useTheme } from '@mui/material';

import { NodeProvider } from '../contexts/node';
import { SessionContext } from '../contexts/session';
import useSetupWizard from '../hooks/use-setup-wizard';
import { WizardRoutes } from '../components/setup/wizard-components';

export default function BlockletSetup() {
  const theme = useTheme();
  const basePath = `${WELLKNOWN_SERVICE_PATH_PREFIX}/setup`;
  const {
    // 数据
    meta,
    blocklet,
    launcherSession,
    steps,
    stepIndex,
    totalSteps,
    logoUrl,
    logo,
    t,
    // 方法
    onNext,
    onPrevious,
  } = useSetupWizard(basePath);

  // 从hook中获取额外的属性
  const locale = 'zh';
  const loading = false;
  const extraNav = null;

  return (
    <StepProvider steps={totalSteps}>
      <NodeProvider>
        <ConfigSpaceProvider>
          {/* eslint-disable-next-line no-use-before-define */}
          <Global styles={launcherGlobalStyle} />
          <LayoutWrapper>
            <Layout
              locale={locale}
              loading={loading}
              blockletMeta={{ ...meta, title: getDisplayName({ ...blocklet, meta }) }}
              navLogo={logo}
              pcWidth="80%"
              style={{ height: '100%' }}
              logoUrl={logoUrl}
              useOfSkeleton={false}
              extraNav={extraNav}
              headerEndAddons={
                <HeaderAddon SessionContext={SessionContext} sessionManagerProps={{ disableLogout: true }} />
              }
              theme={theme}
              launchingText={t('setup.title')}>
              <WizardRoutes
                blocklet={blocklet}
                stepIndex={stepIndex}
                steps={steps}
                onNext={onNext}
                onPrevious={onPrevious}
                launcherSession={launcherSession}
              />
            </Layout>
          </LayoutWrapper>
        </ConfigSpaceProvider>
      </NodeProvider>
    </StepProvider>
  );
}

const launcherGlobalStyle = css`
  html,
  body,
  #app,
  #app > .wrapper {
    height: 100%;
  }
`;

const LayoutWrapper = styled(Box)`
  /* display: flex;
  min-width: 0;
  flex: 1 1 0; */
  height: 100%;

  & .layout-content {
    min-width: 0;
    flex: 1 1 0;
  }

  & .ll-header {
    @media (max-width: 960px) {
      padding: 0 12px;
    }
  }
`;
