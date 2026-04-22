import PropTypes from 'prop-types';
import { Stack, Typography } from '@mui/material';
import React from 'react';

export default function SectionHeader({ title, children = null, mb = 1.5, mt = 1.5 }) {
  return (
    <Stack
      className="section-header"
      direction="row"
      sx={{
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1,
        mb,
        mt,
        pb: 1,
      }}>
      <Typography
        variant="h3"
        sx={{
          fontSize: {
            xs: '18px',
            md: '1.09375rem',
          },
        }}
        component="div">
        {title}
      </Typography>
      {children}
    </Stack>
  );
}

SectionHeader.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  children: PropTypes.node,
  mb: PropTypes.number,
  mt: PropTypes.number,
};
