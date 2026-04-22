import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { ConfigSpaceProvider } from '@abtnode/ux/lib/contexts/config-space';
import { StepProvider } from '@blocklet/launcher-layout/lib/context/step';
import Header from '@blocklet/ui-react/lib/Header';
import { Global, css } from '@emotion/react';
import { Box, Button } from '@mui/material';

import { BlockletAdminRoles } from '@abtnode/ux/lib/util';
import Typography from '@arcblock/ux/lib/Typography';
import { useEffect } from 'react';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import {
  SetupContentContainer,
  SetupFormContainer,
  WizardPageLayout,
  WizardProgress,
  WizardRoutes,
} from '../components/setup/wizard-components';
import { AuthProvider } from '../contexts/auth';
import { NodeProvider } from '../contexts/node';
import useSetupWizard from '../hooks/use-setup-wizard';

const launcherGlobalStyle = css`
  html,
  body,
  #app,
  #app > .wrapper {
    height: 100%;
  }
`;

export default function BlockletSetup() {
  const isInIframe = window.self !== window.top;
  const basePath = `${WELLKNOWN_SERVICE_PATH_PREFIX}/onboard`;
  const { t } = useLocaleContext();

  const {
    // 数据
    blocklet,
    launcherSession,
    steps,
    stepIndex,
    totalSteps,

    // 方法
    onNext,
    onPrevious,
    onStepClick,
  } = useSetupWizard(basePath, true, () => {
    if (isInIframe) {
      window.parent.postMessage(
        {
          type: 'wizard.finished',
        },
        window.location.origin
      );
    } else {
      window.location.href = window.blocklet?.prefix || '/';
    }
  });

  useEffect(() => {
    if (isInIframe) {
      window.parent.postMessage({ type: 'wizard.loaded' }, window.location.origin);
    }
  }, [isInIframe]);

  return (
    <NodeProvider>
      <AuthProvider roles={BlockletAdminRoles}>
        <StepProvider steps={totalSteps}>
          <ConfigSpaceProvider>
            <Global styles={launcherGlobalStyle} />
            <WizardPageLayout>
              {isInIframe ? null : (
                <Header
                  width="100%"
                  brandAddon={
                    blocklet?.meta?.title ? <Typography variant="h4">{blocklet.meta?.title}</Typography> : null
                  }
                  description={blocklet?.meta?.description}
                  maxWidth={false}
                  bordered
                  showDomainWarningDialog={false}
                />
              )}
              <SetupContentContainer
                maxWidth="md"
                mt={isInIframe ? 0 : { xs: 0, md: 10 }}
                sx={
                  isInIframe
                    ? { display: 'flex', flexDirection: 'column', height: '100vh', p: 0 }
                    : { p: { xs: 1, md: 3 } }
                }>
                <SetupFormContainer sx={isInIframe ? { flex: 1 } : {}}>
                  {/* 只在有步骤且不在完成页时显示进度条 */}
                  {steps.length > 0 && stepIndex !== -1 && !window.location.pathname.includes('complete') && (
                    <WizardProgress
                      steps={steps}
                      currentIndex={stepIndex >= 0 ? stepIndex : 0}
                      onStepClick={onStepClick}
                    />
                  )}

                  {/* 表单内容 */}
                  <Box
                    sx={{
                      display: 'flex',
                      flex: 1,
                      py: 3,
                      width: '100%',
                      flexDirection: 'column',
                      '& .header': { display: 'none' },
                      '&& .form-container': { overflowY: 'visible' },
                      '&& .container-inner': { position: 'relative' },
                      '.form-container + div': { display: 'none' },
                      overflowY: 'hidden',
                    }}>
                    <Box
                      sx={{
                        flex: 1,
                        overflowY: 'auto',
                        width: '100%',
                        height: '100%',
                        px: 3,
                        '& > div': { overflowY: 'visible' },
                        ...(['access', 'bind-account'].includes(steps[stepIndex]?.key)
                          ? {
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              '& > div': { height: 'unset' },
                            }
                          : {}),
                      }}>
                      <WizardRoutes
                        blocklet={blocklet}
                        stepIndex={stepIndex}
                        steps={steps}
                        onNext={onNext}
                        onPrevious={onPrevious}
                        launcherSession={launcherSession}
                      />
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column-reverse', md: 'row' },
                        justifyContent: 'flex-end',
                        gap: 2,
                        width: '100%',
                        px: 3,
                        pt: 2,
                        '& button': { minWidth: '100px', height: '40px' },
                      }}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                          variant="text"
                          color="primary"
                          sx={{ width: { xs: '35%', md: 'auto' } }}
                          onClick={() => {
                            if (isInIframe) {
                              window.parent.postMessage(
                                {
                                  type: 'wizard.close',
                                },
                                window.location.origin
                              );
                            } else {
                              window.location.href = window.blocklet?.prefix || '/';
                            }
                          }}>
                          {t('setup.later')}
                        </Button>
                        {stepIndex > 0 && (
                          <Button
                            variant="outlined"
                            color="primary"
                            sx={{ width: { xs: '65%', md: 'auto' } }}
                            onClick={() => onNext(steps[stepIndex - 1]?.key)}>
                            {t('setup.previous')}
                          </Button>
                        )}
                      </Box>

                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => onNext(steps[stepIndex + 1]?.key)}
                        disabled={steps[stepIndex]?.getButtonDisabled?.()}>
                        {stepIndex === steps.length - 1 ? t('setup.finished') : t('setup.next')}
                      </Button>
                    </Box>
                  </Box>
                </SetupFormContainer>
              </SetupContentContainer>
            </WizardPageLayout>
          </ConfigSpaceProvider>
        </StepProvider>
      </AuthProvider>
    </NodeProvider>
  );
}
