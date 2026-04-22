/* eslint-disable react/require-default-props */
import { Box, Button } from '@mui/material';
import PropTypes from 'prop-types';
import ReplayIcon from '@mui/icons-material/Replay';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import StatusDot from './status-dot';
import { getStatusPreview } from './utils';

SendStatus.propTypes = {
  status: PropTypes.number.isRequired,
  updatedAt: PropTypes.string.isRequired,
  reason: PropTypes.string,
  channel: PropTypes.string,
  onResend: PropTypes.func,
};

export default function SendStatus({ status, updatedAt, reason = '', channel = 'wallet', onResend }) {
  const { t, locale } = useLocaleContext();
  const result = getStatusPreview(t, locale, { status, updatedAt, reason, channel });
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}>
      <StatusDot config={result} showTitle />
      {result.status !== 'success' && (
        <Button
          className="resend-btn"
          size="small"
          startIcon={<ReplayIcon />}
          sx={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.87)', fontWeight: 400, '.MuiButton-startIcon': { mr: '2px' } }}
          onClick={onResend}>
          {t('notification.resend')}
        </Button>
      )}
    </Box>
  );
}
