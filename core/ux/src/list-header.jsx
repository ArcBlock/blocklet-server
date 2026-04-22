import React from 'react';
import { Box, Stack, styled } from '@mui/material';
import PropTypes from 'prop-types';

const StyledHeader = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,

  '& .header-row': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing(1),
  },

  '& .right': {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
  },

  '& .tabs': {
    marginTop: theme.spacing(2),
    '& .MuiButton-root': {
      border: 'none',
      color: '#999',
      '&.active': {
        color: '#222',
      },
    },
  },

  '@media (max-width: 900px)': {
    '& .header-row': {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },

    '& .right': {
      flexDirection: 'column',
      width: '100%',

      '.search-always-open, .toolbar-btn-show, a, button, .MuiButtonGroup-root': {
        width: '100% !important',
      },
    },
  },
}));

function LayoutHeader({ left = null, tabs = null, actions = null, ...props }) {
  if (!left && !tabs) {
    return (
      <StyledHeader elevation={0} {...props}>
        <Box className="header-row">
          <Box className="left" />

          <Stack direction="row" className="right">
            {actions}
          </Stack>
        </Box>
      </StyledHeader>
    );
  }

  if ((left && !tabs) || (!left && tabs)) {
    return (
      <StyledHeader elevation={0} {...props}>
        <Box className="header-row">
          <Box className="left">{left || tabs}</Box>

          <Stack direction="row" className="right">
            {actions}
          </Stack>
        </Box>
      </StyledHeader>
    );
  }

  return (
    <StyledHeader elevation={0} {...props}>
      <Box className="header-row">
        <Box className="left">{left}</Box>

        <Stack direction="row" className="right">
          {actions}
        </Stack>
      </Box>
      {tabs && (
        <Box
          sx={{
            mt: 2,
          }}>
          {tabs}
        </Box>
      )}
    </StyledHeader>
  );
}

LayoutHeader.propTypes = {
  left: PropTypes.node,
  tabs: PropTypes.node,
  actions: PropTypes.node,
};

export default LayoutHeader;
