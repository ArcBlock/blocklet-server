import PropTypes from 'prop-types';
import { StepContent, Typography, Button, Step, Box, Stepper, StepButton, Paper } from '@mui/material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { validateParams, validateParamsStep } from '../utils/validate-params';
import StepIcon from './step-icon';

export default function ReleaseStepper({
  steps,
  activeStep,
  setActiveStep,
  hasSelectedResources = false,
  params,
  loading,
  paramsErrTip,
  warning,
  viewMode = '',
  projectId,
}) {
  const { t } = useLocaleContext();
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const getStepError = (step) => {
    if (step === 0) {
      return (
        paramsErrTip?.blockletTitle ||
        paramsErrTip?.projectId ||
        paramsErrTip?.blockletDescription ||
        paramsErrTip?.blockletHomepage ||
        paramsErrTip?.blockletSupport ||
        paramsErrTip?.blockletCommunity ||
        paramsErrTip?.blockletRepository
      );
    }
    if (step === 2) {
      return paramsErrTip?.blockletResource || paramsErrTip?.blockletDocker || paramsErrTip?.dockerImageName;
    }
    if (step >= 4) {
      return paramsErrTip?.blockletVersion || paramsErrTip?.note;
    }

    return '';
  };

  const readOnly = viewMode || validateParams({ hasSelectedResources, params, projectId, t }) === null;

  return (
    <Box
      sx={{
        width: 300,
        maxWidth: 300,
        minWidth: 300,
        padding: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
      }}>
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => {
          const labelProps = {};
          const ok = loading || !validateParamsStep({ hasSelectedResources, params, projectId, step: index, t });
          const error = loading ? '' : getStepError(index);

          if (error) {
            labelProps.optional = (
              <Typography variant="caption" color="error" sx={{ wordBreak: 'break-word' }}>
                {error}
              </Typography>
            );
            labelProps.error = true;
          }
          return (
            <Step key={step.label}>
              <StepButton
                icon={
                  <StepIcon
                    error={error}
                    warning={index === 0 ? warning.hasWarning : false}
                    active={readOnly ? 99 : activeStep}
                    step={index}
                    ok={ok}
                  />
                }
                sx={{ cursor: 'pointer', color: error ? 'error.main' : 'inherit' }}
                disabled={false}
                onClick={() => setActiveStep(index)}
                {...labelProps}>
                <Typography
                  fontSize="14px"
                  fontWeight="500"
                  color={error || (!ok && activeStep > index) ? 'error.main' : 'inherit'}>
                  {step.label}
                </Typography>
              </StepButton>
              <StepContent>
                <Typography fontSize={12}>{step.description}</Typography>
                {!readOnly && (
                  <Box sx={{ mb: 2 }}>
                    <div>
                      {index < steps.length - 1 && (
                        <Button variant="contained" onClick={handleNext} sx={{ mt: 1, mr: 1 }} disabled={error || !ok}>
                          {t('common.continue')}
                        </Button>
                      )}
                      {index > 0 && (
                        <Button disabled={index === 0} onClick={handleBack} sx={{ mt: 1, mr: 1 }}>
                          {t('common.back')}
                        </Button>
                      )}
                    </div>
                  </Box>
                )}
              </StepContent>
            </Step>
          );
        })}
      </Stepper>
      {activeStep >= steps.length - 1 && (
        <Paper square elevation={0} sx={{ p: 3 }}>
          <Typography fontSize={12} sx={{ opacity: 0.5 }}>
            Click right top button to release
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

ReleaseStepper.propTypes = {
  steps: PropTypes.array.isRequired,
  activeStep: PropTypes.number.isRequired,
  setActiveStep: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired,
  viewMode: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  loading: PropTypes.bool.isRequired,
  projectId: PropTypes.string.isRequired,
  hasSelectedResources: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  warning: PropTypes.object.isRequired,
  paramsErrTip: PropTypes.shape({
    projectId: PropTypes.string,
    blockletVersion: PropTypes.string,
    blockletTitle: PropTypes.string,
    blockletDescription: PropTypes.string,
    note: PropTypes.string,
    blockletResource: PropTypes.string,
    blockletHomepage: PropTypes.string,
    blockletSupport: PropTypes.string,
    blockletCommunity: PropTypes.string,
    blockletRepository: PropTypes.string,
    blockletDocker: PropTypes.object,
    dockerImageName: PropTypes.string,
  }).isRequired,
};
