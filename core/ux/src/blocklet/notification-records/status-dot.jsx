import PropTypes from 'prop-types';
import { Box, Tooltip, Typography } from '@mui/material';
import { sendStatusColor } from './utils';

export default function StatusDot({ config, enableTooltip = true, showTitle = false, children = null }) {
  const { status, title = '', sentTime = '', reason = '' } = config;
  const tips = [title, reason].filter(Boolean).join(', ');
  return (
    <Tooltip
      title={
        enableTooltip ? (
          <>
            <Typography color="inherit" sx={{ fontSize: 12 }}>
              {tips}
            </Typography>
            <span>{sentTime}</span>
          </>
        ) : null
      }
      arrow
      placement="top">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '4px',
        }}>
        <Box
          sx={{
            position: 'relative',
            minHeight: 14,
            minWidth: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Box
            style={{ opacity: 0.15 }}
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              bgcolor: sendStatusColor[status],
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: '55%',
              height: '55%',
              borderRadius: '50%',
              bgcolor: sendStatusColor[status],
            }}
          />
        </Box>
        <Typography color="inherit" sx={{ fontSize: 12 }}>
          {showTitle ? title : children}
        </Typography>
      </Box>
    </Tooltip>
  );
}

StatusDot.propTypes = {
  config: PropTypes.object.isRequired,
  enableTooltip: PropTypes.bool,
  showTitle: PropTypes.bool,
  children: PropTypes.node,
};
