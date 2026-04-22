import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import PropTypes from 'prop-types';
import NotificationSeverity from '../severity';

SeverityFilterRender.propTypes = {
  list: PropTypes.array.isRequired,
  label: PropTypes.string.isRequired,
  onDelete: PropTypes.func,
};

export default function SeverityFilterRender({ list, label, onDelete = () => {} }) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        alignItems: 'center',
      }}>
      <Typography>{label}: </Typography>
      {list.map((severity) => {
        return (
          <Chip
            key={severity}
            size="small"
            label={
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                <NotificationSeverity severity={severity} />
              </Box>
            }
            onDelete={(e) => onDelete(e, severity)}
          />
        );
      })}
    </Box>
  );
}
