import { Box, Typography } from '@mui/material';
import React from 'react';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { DIDSpaceConnection } from '@blocklet/did-space-react';
import { useConfigSpaceContext } from '../../../contexts/config-space';
import Action from './action';

function Connected() {
  const { t } = useLocaleContext();
  const { spaceGateway, settingStorageEndpoint } = useConfigSpaceContext();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
      }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <Typography
          sx={{
            fontSize: '1rem',
            fontWeight: 'bold',
          }}>
          {t('storage.spaces.connected.title')}
        </Typography>
      </Box>
      <Box>
        <DIDSpaceConnection
          sx={{ marginTop: 2 }}
          endpoint={spaceGateway.endpoint}
          selected
          // eslint-disable-next-line react/no-unstable-nested-components
          action={(props) => <Action {...props} onDisconnect={() => settingStorageEndpoint(null)} />}
        />
      </Box>
    </Box>
  );
}

export default Connected;
