import React from 'react';
import { Box, Card, Typography, Avatar, Skeleton } from '@mui/material';
import PropTypes from 'prop-types';
import DidAddress from '@arcblock/ux/lib/DID';
import Img from '@arcblock/ux/lib/Img';
import { ThemeProvider } from '@arcblock/ux/lib/Theme';

export default function AppLogo({ name, icon, did, dark = false }) {
  return (
    <ThemeProvider prefer={dark ? 'dark' : 'light'}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: dark ? 'common.black' : 'info.main',
          pl: 4,
          borderRadius: 1,
          overflow: 'hidden',
          height: 1,
        }}>
        <Card
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 1.5,
            width: 1,
            borderRadius: '8px 0 0 8px',
          }}>
          <Avatar
            sx={{
              bgcolor: 'transparent',
              width: 48,
              height: 48,
              borderRadius: 1,
            }}>
            {icon ? (
              <Img src={icon} alt="icon" style={{ width: 48, height: 48, borderRadius: '8px' }} />
            ) : (
              <Skeleton variant="rectangular" width={48} height={48} sx={{ borderRadius: 1 }} />
            )}
          </Avatar>

          <Box sx={{ ml: 1, flex: 1, width: 0, overflow: 'hidden' }}>
            <Typography
              sx={{
                fontSize: 20,
                fontWeight: 500,
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
              {name}
            </Typography>

            <DidAddress did={did} inline size={13} />
          </Box>
        </Card>
      </Box>
    </ThemeProvider>
  );
}

AppLogo.propTypes = {
  name: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  did: PropTypes.string.isRequired,
  dark: PropTypes.bool,
};
