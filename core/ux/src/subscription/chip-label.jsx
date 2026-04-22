import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Tooltip, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import PropTypes from 'prop-types';

export default function ChipLabel({ children }) {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));

  if (isMobile) {
    return (
      <Tooltip enterDelay={500} leaveDelay={2000} title={typeof children === 'string' ? children : ''}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTimeIcon fontSize="small" />
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <AccessTimeIcon fontSize="small" />
      {children}
    </Box>
  );
}

ChipLabel.propTypes = {
  children: PropTypes.node.isRequired,
};
