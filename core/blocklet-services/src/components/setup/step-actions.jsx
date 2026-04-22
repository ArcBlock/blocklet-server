import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import useMobile from '../../hook/use-mobile';
import { hasRequiredSteps } from '../../util';

/**
 * @description
 * @export
 * @param {{
 *  blocklet: import('@blocklet/server-js').BlockletState,
 *  onStartNow: Function,
 *  children: import('react').ReactNode,
 *  disabled: boolean,
 *  startNowText: string,
 *  align: string,
 *  startNowProps: import('@mui/material').ButtonProps
 * }} { blocklet, onStartNow, children, disabled }
 * @return {import('react').Component}
 */
export default function StepActions({ blocklet = null, children = null }) {
  const isMobile = useMobile();

  if (!blocklet || hasRequiredSteps(blocklet.meta)) {
    return <Between isMobile={isMobile}>{children}</Between>;
  }

  return (
    <Between isMobile={isMobile}>
      {/* <Button
        className="start-now"
        variant="outlined"
        disabled={disabled}
        onClick={() => onStartNow()}
        {...startNowProps}>
        {startNowText ?? t('setup.next')}
      </Button> */}
      <Box
        variant="contained"
        sx={{
          display: 'flex',
          color: 'primary',
          alignItems: 'center',
          marginLeft: '32px',
        }}>
        {children}
      </Box>
    </Between>
  );
}

StepActions.propTypes = {
  blocklet: PropTypes.object,
  children: PropTypes.any,
};

const Between = styled(Box)`
  padding-top: 24px;
  margin-top: auto;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
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
