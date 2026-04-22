import PropTypes from 'prop-types';
import { Box, Container } from '@mui/material';
import StopIcon from '@mui/icons-material/DoDisturbAlt';

function StopBox({ children, Icon = StopIcon }) {
  return (
    <Container
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: '10px',
        margin: '10px 0px',
      }}>
      <Box sx={{ opacity: 0.3, fontSize: 32 }}>
        <Icon />
      </Box>
      <Box sx={{ mb: 2, opacity: 0.7, fontSize: 'small', color: 'action' }}>{children}</Box>
    </Container>
  );
}

StopBox.propTypes = {
  children: PropTypes.node.isRequired,
  Icon: PropTypes.elementType,
};

export default StopBox;
