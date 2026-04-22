import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import DidSvg from '../icons/did.svg?react';

export default function DIDIcon({ width = 24, color = 'black', backgroundColor = 'transparent' }) {
  return (
    <Box
      component="span"
      sx={{
        width,
        display: 'inline-block',
        verticalAlign: 'middle',
        color,
        backgroundColor,
        fontSize: 0,
      }}>
      <DidSvg
        viewBox="0 0 90 65"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: 'relative',
          top: -1,
          lineHeight: 1,
        }}
      />
    </Box>
  );
}

DIDIcon.propTypes = {
  width: PropTypes.number,
  color: PropTypes.string,
  backgroundColor: PropTypes.string,
};
