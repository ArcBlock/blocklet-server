/* eslint-disable react/require-default-props */

import PropTypes from 'prop-types';
import { Avatar, Stack, Typography, Tooltip } from '@mui/material';

function getWordBreakStyle(value) {
  if (!value || typeof value !== 'string') {
    return 'break-all';
  }
  return value.includes(' ') ? 'break-word' : 'break-all';
}

export default function InfoCard({
  logo = '',
  name = '',
  description = '',
  size = 40,
  variant = 'rounded',
  sx = {},
  className = '',
  logoName = '',
  tooltip = null,
}) {
  const dimensions = { width: size, height: size, ...sx };
  const avatarName = typeof name === 'string' ? name : logo;

  const cardContent = (
    <Stack
      direction="row"
      spacing={1}
      className={`info-card-wrapper ${className}`}
      sx={{
        alignItems: 'center',
        cursor: tooltip ? 'pointer' : 'default',
      }}>
      {logo ? (
        <Avatar src={logo} alt={logoName ?? avatarName} variant={variant} sx={dimensions} />
      ) : (
        <Avatar variant={variant} sx={dimensions}>
          {avatarName?.slice(0, 1)}
        </Avatar>
      )}
      <Stack
        direction="column"
        sx={{
          alignItems: 'flex-start',
          justifyContent: 'space-around',
          wordBreak: getWordBreakStyle(name),
          minWidth: { xs: 100, sm: 140 },
        }}>
        <Typography
          variant="body1"
          component="div"
          sx={{
            color: 'text.primary',
          }}>
          {name}
        </Typography>
        {description && (
          <Typography
            variant="subtitle1"
            sx={{
              color: 'text.secondary',
            }}>
            {description}
          </Typography>
        )}
      </Stack>
    </Stack>
  );

  if (tooltip) {
    return (
      <Tooltip
        title={tooltip}
        placement="top-start"
        slotProps={{
          tooltip: {
            sx: {
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#2a2e37' : '#ffffff'),
              color: (theme) => (theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.text.primary),
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
              borderRadius: 2,
              padding: '10px 16px',
              fontSize: 14,
              maxWidth: 400,
              minWidth: 240,
              wordBreak: 'break-word',
              border: (theme) => (theme.palette.mode === 'dark' ? '1px solid #3a3f48' : '1px solid #e0e0e0'),
              '& .MuiTooltip-arrow': {
                color: (theme) => (theme.palette.mode === 'dark' ? '#2a2e37' : '#ffffff'),
                '&::before': {
                  border: (theme) => (theme.palette.mode === 'dark' ? '1px solid #3a3f48' : '1px solid #e0e0e0'),
                  backgroundColor: (theme) => (theme.palette.mode === 'dark' ? '#2a2e37' : '#ffffff'),
                },
              },
            },
          },
        }}>
        {cardContent}
      </Tooltip>
    );
  }

  return cardContent;
}

InfoCard.propTypes = {
  logo: PropTypes.string,
  name: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  variant: PropTypes.oneOf(['square', 'rounded', 'circular']),
  sx: PropTypes.object,
  className: PropTypes.string,
  logoName: PropTypes.string,
  tooltip: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
};
