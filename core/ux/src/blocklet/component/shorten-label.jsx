import PropTypes from 'prop-types';
import { Tooltip, Typography } from '@mui/material';

function shortenString(str, maxLength = 10) {
  if (typeof str === 'string' && str?.length > maxLength) {
    return `${str.slice(0, maxLength - 1)}...${str.slice(-2)}`;
  }
  return str;
}

function ShortenLabel({ children, maxLength = 10, sx = null, hiddenTip = false }) {
  if (children?.length <= maxLength) {
    return <Typography sx={sx}>{children}</Typography>;
  }
  if (hiddenTip) {
    return <Typography sx={sx}>{shortenString(children, maxLength)}</Typography>;
  }
  return (
    <Tooltip title={children} placement="top">
      <Typography sx={sx}>{shortenString(children, maxLength)}</Typography>
    </Tooltip>
  );
}

ShortenLabel.propTypes = {
  children: PropTypes.string.isRequired,
  maxLength: PropTypes.number,
  sx: PropTypes.object,
  hiddenTip: PropTypes.bool,
};

export default ShortenLabel;
