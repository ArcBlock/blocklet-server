import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import styled from '@emotion/styled';
import { ArrowBack as ArrowBackIcon, Check as CheckIcon } from '@mui/icons-material';
import { alpha, Box, IconButton, CircularProgress as Spinner, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import { lazy, Suspense, useEffect, useRef } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const Connect = lazy(() => import('./connect'));
const BindAccount = lazy(() => import('./bind-account'));
const Config = lazy(() => import('./config'));
const DidSpace = lazy(() => import('./did-space'));
const Branding = lazy(() => import('./branding'));
const Domain = lazy(() => import('./domain'));
const AccessControl = lazy(() => import('./access-control'));
const Fuel = lazy(() => import('./fuel'));
const Aigne = lazy(() => import('./aigne'));
const Complete = lazy(() => import('./complete'));

// 优化的样式组件
const WizardProgressContainer = styled(Box)`
  background: ${({ theme }) => alpha(theme.palette.primary.main, 0.05)};
`;

const WizardPageLayout = styled(Box)`
  width: 100vw;
  min-height: 100vh;
  background: ${({ theme }) =>
    theme.palette.mode === 'dark'
      ? theme.palette.background.default
      : `linear-gradient(135deg, ${theme.palette.grey[50]} 0%, ${theme.palette.grey[100]} 100%)`};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 0;
`;

const SetupContentContainer = styled(Box)`
  width: 100%;
`;

const SetupFormContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: ${({ theme }) => theme.palette.background.paper};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.palette.divider};
  min-height: 500px;
  overflow: hidden;
  position: relative;
`;

const SetupNavigationBar = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  border-bottom: 1px solid
    ${({ theme }) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : theme.palette.divider)};
  background: ${({ theme }) =>
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.02)'
      : `linear-gradient(135deg, ${theme.palette.grey[50]} 0%, rgba(255, 255, 255, 0.8) 100%)`};

  .nav-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${({ theme }) => theme.palette.text.secondary};
    font-size: 0.875rem;
    font-weight: 500;
  }

  ${({ theme }) => theme.breakpoints.down('md')} {
    padding: 16px 20px;
  }
`;

// 步骤导航栏组件
export function StepNavigationBar({
  currentStepName = '',
  description = '',
  currentIndex,
  onPrevious = () => {},
  canGoBack = true,
}) {
  return (
    <SetupNavigationBar width="100%" display={{ xs: 'none', md: 'flex' }}>
      <Box className="nav-left">
        {canGoBack && currentIndex > 0 && (
          <IconButton
            size="small"
            onClick={onPrevious}
            sx={{
              bgcolor: 'action.hover',
              color: 'primary.main',
              border: '1px solid',
              borderColor: 'primary.main',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                transform: 'translateX(-2px)',
              },
            }}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        )}
        <Box
          display="flex"
          flexDirection={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          gap={1}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: '1.25rem',
              color: 'text.primary',
              letterSpacing: '-0.01em',
            }}>
            {currentStepName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </Box>
    </SetupNavigationBar>
  );
}

StepNavigationBar.propTypes = {
  currentStepName: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  description: PropTypes.string,
  currentIndex: PropTypes.number.isRequired,
  onPrevious: PropTypes.func,
  canGoBack: PropTypes.bool,
};

// 步骤进度指示器组件
export function WizardProgress({ steps, currentIndex, onStepClick = () => {} }) {
  const currentStep = steps[currentIndex];
  const maxStep = useRef(parseInt(localStorage.getItem('wizard-max-step'), 10) || currentIndex);

  useEffect(() => {
    maxStep.current = Math.max(maxStep.current, currentIndex);
    localStorage.setItem('wizard-max-step', maxStep.current);
  }, [currentIndex]);

  return (
    <WizardProgressContainer width="100%" p={{ xs: 2, md: 3 }} pb={2}>
      {/* 现代化步骤条 */}
      <Box sx={{ display: 'flex', gap: 1, position: 'relative', width: '100%', pt: 1 }}>
        {steps.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index <= maxStep.current;
          const isClickable = index <= maxStep.current;

          return (
            <Box key={step.key} sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* 步骤图标 */}
              <Box display="flex" alignItems="center" justifyContent={{ xs: 'center', md: 'flex-start' }} gap={1}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.300',
                    color: 'text.secondary',
                    ...(isActive || isCompleted ? { bgcolor: 'primary.main', color: 'primary.contrastText' } : {}),
                    fontWeight: 600,
                    fontSize: '14px',
                    transition: 'all 0.2s ease-in-out',
                    cursor: isClickable ? 'pointer' : 'default',
                    zIndex: 2,
                    '&:hover': isClickable
                      ? {
                          transform: 'scale(1.05)',
                        }
                      : {},
                  }}
                  onClick={() => isClickable && onStepClick?.(step.key)}>
                  {isCompleted && !isActive ? <CheckIcon style={{ fontSize: '16px', fontWeight: 800 }} /> : index + 1}
                </Box>
                {/* 步骤标签 */}
                <Typography
                  variant="body2"
                  sx={{
                    display: { xs: 'none', md: 'block' },
                    fontWeight: isActive ? 700 : 400,
                    color: 'text.secondary',
                    ...(isActive || isCompleted ? { color: 'primary.main' } : {}),
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    transition: 'color 0.2s ease-in-out',
                    cursor: isClickable ? 'pointer' : 'default',
                    lineHeight: 1.2,
                  }}
                  onClick={() => isClickable && onStepClick?.(step.key)}>
                  {step.stepTitle || step.name}
                </Typography>
              </Box>

              <Box
                sx={{
                  mt: 0.5,
                  height: 2,
                  width: '100%',
                  bgcolor: isClickable ? 'primary.main' : 'grey.200',
                  borderRadius: 2,
                  transition: 'width 0.5s ease-in-out',
                }}
              />
            </Box>
          );
        })}
      </Box>

      {/* 头部信息 */}
      <Box mt={{ xs: 2, md: 4 }} overflow="hidden" sx={{ width: '100%' }}>
        <Typography variant="h3" sx={{ mb: 0.5 }}>
          {currentStep?.name}
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
          {currentStep?.description}
        </Typography>
      </Box>
    </WizardProgressContainer>
  );
}

WizardProgress.propTypes = {
  steps: PropTypes.array.isRequired,
  currentIndex: PropTypes.number.isRequired,
  onStepClick: PropTypes.func,
};

// Suspense Fallback 组件
function SuspenseFallback() {
  return (
    <Box
      sx={{
        width: '100%',
        height: 400,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 3,
      }}>
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Spinner
          size={48}
          thickness={4}
          sx={{
            color: 'primary.main',
            filter: 'drop-shadow(0 2px 8px rgba(25, 118, 210, 0.3))',
          }}
        />
      </Box>
    </Box>
  );
}

function IframeResize(index) {
  const isInIframe = window.self !== window.top;
  useEffect(() => {
    if (isInIframe) {
      window.parent.postMessage(
        { type: 'wizard.resize', data: { height: document.body.scrollHeight } },
        window.location.origin
      );
    }
  }, [index, isInIframe]);
  return null;
}

function WizardRoutes({ blocklet = null, stepIndex, steps, onNext, onPrevious, launcherSession = null }) {
  const { t } = useLocaleContext();
  const isInIframe = window.self !== window.top;
  function withSetup(Component, props) {
    const content = (
      <>
        <IframeResize />
        {blocklet ? (
          <Component
            blocklet={blocklet}
            {...props}
            onNext={onNext}
            onPrevious={onPrevious}
            buttonText={stepIndex === steps.length - 1 ? t('setup.finished') : ''}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Spinner />
          </Box>
        )}
      </>
    );

    // 如果是在 iframe 中，不是在启动流程中，则直接返回内容不需要自动绑定和 setup owner
    if (isInIframe) {
      return content;
    }

    return <Connect>{content}</Connect>;
  }

  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        <Route path="bind-account" element={withSetup(BindAccount)} />
        <Route path="access" element={withSetup(AccessControl)} />
        <Route path="domain" element={withSetup(Domain)} />
        <Route path="did-space" element={withSetup(DidSpace)} />
        <Route path="config" element={withSetup(Config)} />
        <Route path="fuel" element={withSetup(Fuel)} />
        <Route path="aigne" element={withSetup(Aigne)} />
        <Route path="branding" element={withSetup(Branding)} />
        <Route path="complete" element={withSetup(Complete, { launcherSession })} />
        <Route path="*" element={<Navigate to={`access${window.location.search}`} replace />} />
      </Routes>
    </Suspense>
  );
}

WizardRoutes.propTypes = {
  blocklet: PropTypes.object,
  stepIndex: PropTypes.number.isRequired,
  steps: PropTypes.array.isRequired,
  onNext: PropTypes.func.isRequired,
  onPrevious: PropTypes.func.isRequired,
  launcherSession: PropTypes.object,
};

// 导出样式组件
export { SetupContentContainer, SetupFormContainer, WizardPageLayout, WizardRoutes };
