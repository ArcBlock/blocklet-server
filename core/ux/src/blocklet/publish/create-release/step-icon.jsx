import { Box } from '@mui/material';
import PropTypes from 'prop-types';
import DoneIcon from '@mui/icons-material/Done';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';

function StepIcon({ step = 0, ok = false, active = 0, error = '', warning = false }) {
  let color = 'grey.500';
  let content = step + 1;
  if (ok) {
    content = <DoneIcon sx={{ fontSize: 18, margin: 0 }} color="white" />;
  }
  if (error || (!ok && active > step)) {
    color = 'error.main';
    content = <PriorityHighIcon sx={{ fontSize: 18, margin: 0 }} color="white" />;
  } else if (warning) {
    color = 'warning.main';
    content = <PriorityHighIcon sx={{ fontSize: 18, margin: 0 }} color="white" />;
  } else if (active >= step) {
    color = 'primary.main';
  }

  return (
    <Box
      sx={{
        width: 24,
        height: 24,
        bgcolor: color,
        borderRadius: '100%',
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: 14,
        alignItems: 'center',
      }}>
      {content}
    </Box>
  );
}

StepIcon.propTypes = {
  step: PropTypes.number,
  ok: PropTypes.bool,
  active: PropTypes.number,
  error: PropTypes.string,
  warning: PropTypes.bool,
};

export default StepIcon;
