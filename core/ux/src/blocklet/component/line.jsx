import PropTypes from 'prop-types';
import Box from '@mui/material/Box';

export default function Line({ depth = 1, className = '' }) {
  return (
    <Box
      key="group-collapse-box"
      className={className}
      sx={{
        ml: Math.max((depth - 1) * 2, 0),
        borderBottom: 1,
        borderColor: 'rgba(0,0,0,0.12)',
      }}
    />
  );
}

Line.propTypes = {
  depth: PropTypes.number,
  className: PropTypes.string,
};
