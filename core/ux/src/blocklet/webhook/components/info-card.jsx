import PropTypes from 'prop-types';
import React from 'react';
import { Avatar, Stack, Typography } from '@mui/material';
import { getWordBreakStyle } from '../util';

export default function InfoCard({ logo = '', size = 40, variant = 'rounded', sx = {}, name, description }) {
  const dimensions = { width: size, height: size, ...sx };
  const avatarName = typeof name === 'string' ? name : logo;
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        alignItems: 'center',
      }}>
      {logo ? (
        <Avatar src={logo} alt={avatarName} variant={variant} sx={dimensions} />
      ) : (
        <Avatar variant={variant} sx={dimensions}>
          {avatarName?.slice(0, 1)}
        </Avatar>
      )}
      <Stack
        direction="column"
        className="info-card"
        sx={{
          alignItems: 'flex-start',
          justifyContent: 'space-around',
          wordBreak: getWordBreakStyle(name),
          minWidth: 140,
        }}>
        <Typography
          variant="body1"
          component="div"
          sx={{
            color: 'text.primary',
          }}>
          {name}
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            color: 'text.secondary',
          }}>
          {description}
        </Typography>
      </Stack>
    </Stack>
  );
}

InfoCard.propTypes = {
  logo: PropTypes.string,
  name: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  description: PropTypes.any.isRequired,
  size: PropTypes.number,
  variant: PropTypes.oneOf(['square', 'rounded', 'circular']),
  sx: PropTypes.object,
};
