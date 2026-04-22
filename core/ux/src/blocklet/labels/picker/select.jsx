import { Select as MuiSelect } from '@mui/material';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { mergeSx } from '@arcblock/ux/lib/Util/style';
import PropTypes from 'prop-types';

const defaultSx = {
  '.MuiSvgIcon-root': { fontSize: '1.25rem' },
};

export default function Select({ sx = {}, ...props }) {
  return <MuiSelect variant="outlined" IconComponent={UnfoldMoreIcon} sx={mergeSx(defaultSx, sx)} {...props} />;
}

Select.propTypes = {
  sx: PropTypes.object,
};
