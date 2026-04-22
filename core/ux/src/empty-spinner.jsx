import React from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Spinner from '@mui/material/CircularProgress';

export default function EmptySpinner({ size = 24, ...rest }) {
  return (
    <Box
      {...rest}
      sx={[
        {
          display: 'flex',
          mt: 4,
        },
        ...(Array.isArray(rest.sx) ? rest.sx : [rest.sx]),
      ]}>
      <Spinner size={size} />
    </Box>
  );
}

EmptySpinner.propTypes = {
  size: PropTypes.number,
};
