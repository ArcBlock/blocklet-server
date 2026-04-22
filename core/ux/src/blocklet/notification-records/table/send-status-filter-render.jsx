import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { getStatusPreview } from '../utils';
import StatusDot from '../status-dot';

SendStatusFilterRender.propTypes = {
  list: PropTypes.array.isRequired,
  label: PropTypes.string.isRequired,
  onDelete: PropTypes.func,
};

export default function SendStatusFilterRender({ list, label, onDelete = () => {} }) {
  const { t, locale } = useLocaleContext();
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        alignItems: 'center',
      }}>
      <Typography>{label}: </Typography>
      {list.map((status) => {
        const result = getStatusPreview(t, locale, { status });
        return (
          <Chip
            key={status}
            size="small"
            label={
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                <StatusDot config={result} enableTooltip={false}>
                  {result.title}
                </StatusDot>
              </Box>
            }
            onDelete={(e) => onDelete(e, status)}
          />
        );
      })}
    </Box>
  );
}
