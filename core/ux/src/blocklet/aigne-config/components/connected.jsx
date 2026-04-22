import { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Button, CircularProgress, Tooltip } from '@mui/material';
import { TaskAltOutlined, LinkOff, ErrorOutline } from '@mui/icons-material';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import noop from 'lodash/noop';

import { CardWrapper } from './basic';

export default function Connected({
  url,
  providerName,
  disconnect = noop,
  disabled = false,
  loading = false,
  validationResult = '',
}) {
  const { t } = useContext(LocaleContext);

  const isVerifyFailed = useMemo(() => {
    return validationResult && validationResult !== 'success';
  }, [validationResult]);

  return (
    <CardWrapper minHeight={80} height="none">
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: 2,
        }}>
        {isVerifyFailed ? (
          <Tooltip title={validationResult}>
            <ErrorOutline sx={{ fontSize: 24, color: 'error.main', cursor: 'pointer', flexShrink: 0 }} />
          </Tooltip>
        ) : (
          <TaskAltOutlined sx={{ fontSize: 24, color: 'success.main', cursor: 'pointer', flexShrink: 0 }} />
        )}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            flex: 1,
            flexWrap: 'wrap',
          }}>
          <Box>
            <Typography variant="h5" sx={{ fontSize: 18 }}>
              {isVerifyFailed
                ? t('setting.aigne.testFailed')
                : t('setting.aigne.connected', { provider: providerName })}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: 14 }}>
              {t('setting.aigne.baseUrl', { provider: providerName })}: {url}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="error"
            startIcon={loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : <LinkOff />}
            onClick={disconnect}
            disabled={disabled || loading}
            sx={{ lineHeight: 1.5 }}>
            {t('setting.aigne.disconnect')}
          </Button>
        </Box>
      </Box>
    </CardWrapper>
  );
}

Connected.propTypes = {
  url: PropTypes.string.isRequired,
  providerName: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  disconnect: PropTypes.func,
  loading: PropTypes.bool,
  validationResult: PropTypes.string,
};
