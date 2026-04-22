import { useTheme, Chip } from '@mui/material';
import PropTypes from 'prop-types';
import CloseOutlineIcon from '@mui/icons-material/Close';
import { getTextColor, getBackgroundColor, getBorderColor, getFilterStyle } from './color';
import { useLabels } from './context/context';

export default function LabelChip({
  label,
  onDelete = undefined,
  onClick = undefined,
  sx = undefined,
  disabled = false,
  fullName = true,
}) {
  const theme = useTheme();
  const { mode } = theme.palette;
  const { getFullLabelName, getLabelName } = useLabels();

  const color = getTextColor(label.color, mode);
  const backgroundColor = getBackgroundColor(label.color, mode);
  const borderColor = getBorderColor(label.color, mode);
  const hoverFilter = getFilterStyle(label.color, mode);

  const mergedSx = [
    {
      height: 20,
      borderRadius: 0.5,
      fontSize: 12,
      fontWeight: 500,
      color: `${color} !important`,
      bgcolor: `${backgroundColor} !important`,
      borderColor: `${borderColor} !important`,
      transition: 'filter 0.2s',
      WebkitTextFillColor: `${color} !important`,
      '.MuiChip-deleteIcon': {
        color: `${color} !important`,
        cursor: 'pointer',
        transition: 'transform 0.3s',
        '&:hover': { transform: 'rotate(90deg)' },
      },
      '.MuiChip-label': { px: 0.5, maxHeight: 20 },
      ...(onClick && !disabled && { cursor: 'pointer', '&:hover': { filter: hoverFilter } }),
    },
    ...(Array.isArray(sx) ? sx : [sx]),
  ];

  const hasDelete = !disabled && typeof onDelete === 'function';
  const hasOnClick = !disabled && typeof onClick === 'function';

  const handleEvent = (e, handler) => {
    e.stopPropagation();
    e.preventDefault();
    handler?.(label);
  };

  const labelName = fullName ? getFullLabelName(label.id) : getLabelName(label.id);

  return (
    <Chip
      key={label.id}
      label={labelName || label.title}
      variant="outlined"
      size="small"
      {...(!disabled &&
        hasDelete &&
        onDelete && {
          onDelete: (e) => handleEvent(e, onDelete),
          deleteIcon: <CloseOutlineIcon />,
        })}
      {...(!disabled && hasOnClick && { onClick: (e) => handleEvent(e, onClick) })}
      sx={mergedSx}
    />
  );
}

LabelChip.propTypes = {
  label: PropTypes.shape({
    id: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    title: PropTypes.string,
    slug: PropTypes.string,
  }).isRequired,
  onDelete: PropTypes.func,
  onClick: PropTypes.func,
  sx: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  disabled: PropTypes.bool,
  fullName: PropTypes.bool,
};
