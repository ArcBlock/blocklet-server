/**
 * 重发配置
 */
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, FormControl, FormLabel, FormGroup, FormControlLabel, Checkbox, Button } from '@mui/material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Spinner from '@mui/material/CircularProgress';

const defaultChannels = [
  { label: 'Wallet', value: 'app', checked: true },
  { label: 'Email', value: 'email', checked: true },
  { label: 'Push Kit', value: 'push', checked: true },
  { label: 'Webhook', value: 'webhook', checked: true },
];

ResendConfig.propTypes = {
  loading: PropTypes.bool,
  onCancel: PropTypes.func,
  onConfirm: PropTypes.func,
};

export default function ResendConfig({ loading = false, onCancel = () => {}, onConfirm = () => {} }) {
  const { t } = useLocaleContext();

  const [channels, setChannels] = useState(defaultChannels);
  const [isResendFailedOnly, setIsResendFailedOnly] = useState(true);

  const handleChange = (ev, channel) => {
    channel.checked = ev.target.checked;
    const newChannels = channels.map((c) => ({
      ...c,
      checked: c.value === channel.value ? channel.checked : c.checked,
    }));
    setChannels(newChannels);
  };

  const handleConfirm = (e) => {
    e.stopPropagation();
    onConfirm({
      channels: channels.filter((c) => c.checked).map((c) => c.value),
      isResendFailedOnly,
    });
  };

  return (
    <Box className="resend-config" sx={{ padding: '16px 24px' }}>
      <Typography variant="body1" component="div" className="check-title" sx={{ fontWeight: 700, mb: 1 }}>
        {t('notification.config')}
      </Typography>
      <Box className="choose-channel">
        <FormControl component="fieldset" variant="standard">
          <FormLabel component="legend">{t('notification.selectChannels')}</FormLabel>
          <FormGroup sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1 }}>
            {channels.map((channel) => (
              <FormControlLabel
                key={channel.value}
                control={
                  <Checkbox
                    checked={channel.checked}
                    onChange={(ev) => handleChange(ev, channel)}
                    name={channel.value}
                  />
                }
                label={channel.label}
              />
            ))}
          </FormGroup>
        </FormControl>
      </Box>
      <Box className="resend-config-footer">
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox checked={isResendFailedOnly} onChange={(ev) => setIsResendFailedOnly(ev.target.checked)} />
            }
            label={t('notification.resendFailedOnly')}
          />
        </FormGroup>
      </Box>
      <Box
        className="resend-config-footer-tip"
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1,
        }}>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          color="inherit">
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleConfirm}
          color="primary"
          disabled={loading}
          variant="contained"
          autoFocus
          style={{ marginLeft: 8 }}>
          {loading && <Spinner size={16} />}
          {t('common.confirm')}
        </Button>
      </Box>
    </Box>
  );
}
