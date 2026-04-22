import React from 'react';
import { Box, Typography } from '@mui/material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { DIDSpaceDefaultNFT } from '@blocklet/did-space-react';
import ConnectTo from './connect-to';
import DiskInfo from '../../disk-info';
import SpacesBackupRecordsCalendar from './backups-calendar';
import SpacesBackupRecordsTable from './backups-table';

function Disconnect() {
  const { t } = useLocaleContext();

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          flexDirection: { xs: 'column', md: 'row' },
        }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            alignContent: 'center',
            minWidth: 240,
          }}>
          <DIDSpaceDefaultNFT style={{ cursor: 'pointer', width: '150px', height: '100%', maxHeight: 160 }} />

          <Typography
            sx={{
              my: 2,
              textAlign: 'center',
              color: 'text.secondary',
            }}>
            {t('storage.spaces.connect.provider')}
          </Typography>
          <ConnectTo />
        </Box>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}>
            <Typography
              sx={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
              }}>
              {t('storage.spaces.backup.records')}
            </Typography>
          </Box>

          <SpacesBackupRecordsCalendar />
        </Box>
      </Box>
      <SpacesBackupRecordsTable sx={{ marginTop: '24px' }} />
      <Typography
        sx={{
          fontSize: '1.2rem',
          fontWeight: 'bold',
          mb: 2,
          mt: 2,
        }}>
        {t('common.dataStorage')}
      </Typography>
      <DiskInfo />
    </Box>
  );
}

export default Disconnect;
