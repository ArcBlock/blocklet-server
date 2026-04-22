/* eslint-disable react/require-default-props */
import Chip from '@mui/material/Chip';
import PropTypes from 'prop-types';

export default function FilterChip({ label, onDelete, canDelete = () => true, ...rest }) {
  const deleteFun = onDelete && typeof onDelete === 'function' ? onDelete : undefined;

  let deletable = true;
  if (canDelete && typeof canDelete === 'function') {
    deletable = canDelete({ label, ...rest });
  }

  return <Chip label={label} variant="outlined" {...(deleteFun && deletable ? { onDelete: deleteFun } : {})} />;
}

FilterChip.propTypes = {
  label: PropTypes.string.isRequired,
  onDelete: PropTypes.func,
  canDelete: PropTypes.func,
};
