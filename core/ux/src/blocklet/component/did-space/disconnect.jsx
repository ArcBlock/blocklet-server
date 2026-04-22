import React from 'react';
import { Box, Typography } from '@mui/material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { DIDSpaceDefaultNFT } from '@blocklet/did-space-react';

function Disconnect() {
  const { t } = useLocaleContext();

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          alignContent: 'center',
        }}>
        <DIDSpaceDefaultNFT style={{ width: 250, height: 250 }} />
        <Typography
          sx={{
            marginTop: '24px',
          }}>
          {t('storage.spaces.connect.providerForStorage')}
        </Typography>
      </Box>
    </Box>
  );
}

export default Disconnect;
