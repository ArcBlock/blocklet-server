import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Button from './button';
import useMobile from '../../hooks/use-mobile';
import { hasRequiredSteps } from '../../util';

export default function StepActions({ blocklet = null, onStartNow = () => {}, children = null, disabled = false }) {
  const { t } = useLocaleContext();
  const isMobile = useMobile();

  if (!blocklet || hasRequiredSteps(blocklet.meta)) {
    return <Center>{children}</Center>;
  }

  return (
    <Between isMobile={isMobile}>
      <Button
        className="start-now"
        variant="contained"
        color="primary"
        disabled={disabled}
        onClick={() => onStartNow()}>
        {t('setup.startNow')}
      </Button>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}>
        {children}
      </Box>
    </Between>
  );
}

StepActions.propTypes = {
  blocklet: PropTypes.object,
  onStartNow: PropTypes.func,
  children: PropTypes.any,
  disabled: PropTypes.bool,
};

const Center = styled(Box)`
  width: 100%;
  margin-top: auto;
  padding-top: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  .bottom-button {
    min-width: 200px;
  }
  ${(props) => props.theme.breakpoints.down('md')} {
    .bottom-button {
      width: 100%;
    }
  }
`;

const Between = styled(Box)`
  padding-top: 24px;
  margin-top: auto;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  .start-now {
    min-width: 140px;
  }
  .bottom-button {
    min-width: 120px;
  }
  ${(props) => props.theme.breakpoints.down('lg')} {
    width: 100%;
  }

  ${(props) => props.theme.breakpoints.down('md')} {
    .start-now {
      min-width: inherit;
    }
    .bottom-button {
      min-width: 100px;
    }
  }

  ${(props) => props.isMobile} {
    justify-content: space-between;
    gap: '32px',
  }}
`;
