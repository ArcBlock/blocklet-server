import React from 'react';
import { Box, CircularProgress, Grid, Typography } from '@mui/material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { DIDSpaceConnection } from '@blocklet/did-space-react';
import GatewayAction from './gateway-action';
import ConnectTo from './connect-to';
import SpacesBackupRecords from './backups';
import DiskInfo from '../../disk-info';
import { useBlockletStorageContext } from '../../../contexts/blocklet-storage';
import AutoBackup from './auto-backup';

/**
 * @typedef {{
 *  did: string,
 *  name: string,
 *  url: string,
 *  endpoint: string
 *  protected?: boolean,
 *  loading?: boolean,
 * }} SpaceGateway
 */

function Connected() {
  const { t } = useLocaleContext();
  const { spaceGateways, spaceGatewaysLoading, spaceGatewayIsSelected } = useBlockletStorageContext();
  const shouldShowLoading = spaceGatewaysLoading && !spaceGateways?.length;

  const renderAction = ({ spaceGateway, spaceStatus, selected, refresh }) => {
    return (
      <GatewayAction
        spaceGateway={spaceGateway}
        spaceStatus={spaceStatus}
        selected={selected}
        onConnected={() => refresh()}
        onBackedUp={(err) => err && refresh()}
      />
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
      }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 1, md: 2 },
          justifyContent: { xs: 'center', md: 'flex-start' },
          alignItems: { xs: 'flex-start', md: 'center' },
        }}>
        <Typography
          sx={{
            fontSize: '1.2rem',
            fontWeight: 'bold',
            flexGrow: 1,
          }}>
          {t('storage.spaces.connected.title')}
        </Typography>
        <AutoBackup />
        <ConnectTo />
      </Box>
      <Box
        sx={{
          mt: 2,
        }}>
        {shouldShowLoading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
            }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            <>
              {spaceGateways.map((x) => {
                return (
                  <Grid
                    key={x.endpoint}
                    size={{
                      xs: 12,
                      md: 6,
                    }}>
                    <DIDSpaceConnection
                      key={x.endpoint}
                      endpoint={x.endpoint}
                      selected={spaceGatewayIsSelected(x)}
                      // eslint-disable-next-line react/no-unstable-nested-components
                      action={renderAction}
                    />
                  </Grid>
                );
              })}
            </>
          </Grid>
        )}
      </Box>
      <SpacesBackupRecords sx={{ marginTop: '24px' }} />
      <Typography
        sx={{
          fontSize: '1.2rem',
          fontWeight: 'bold',
          mb: 2,
        }}>
        {t('common.dataStorage')}
      </Typography>
      <DiskInfo />
    </Box>
  );
}

export default Connected;
