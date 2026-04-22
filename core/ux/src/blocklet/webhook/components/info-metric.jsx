import PropTypes from 'prop-types';
import React from 'react';
import { Divider, Tooltip, Stack, Typography } from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';
import { isEmptyExceptNumber } from '../util';

export default function InfoMetric({ value, label, tip = '', divider = false }) {
  const isNone = isEmptyExceptNumber(value);

  return (
    <>
      <Stack direction="column" alignItems="flex-start">
        <Typography component="div" variant="body1" mb={1} color="text.primary" sx={{ fontWeight: 500 }}>
          {label}
          {!!tip && (
            <Tooltip title={tip}>
              <InfoOutlined fontSize="small" />
            </Tooltip>
          )}
        </Typography>
        <Typography
          component="div"
          variant="body1"
          color={isNone ? 'text.disabled' : 'text.secondary'}
          sx={{ width: '100%', minHeight: '24px' }}>
          {isNone ? '-' : value}
        </Typography>
      </Stack>
      {divider && <Divider orientation="vertical" flexItem />}
    </>
  );
}

InfoMetric.propTypes = {
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  tip: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  divider: PropTypes.bool,
};
