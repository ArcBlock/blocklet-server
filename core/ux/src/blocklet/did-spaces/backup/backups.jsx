/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable no-console */
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Box, Typography } from '@mui/material';
import React from 'react';

import SpacesBackupRecordsCalendar from './backups-calendar';
import SpacesBackupRecordsTable from './backups-table';

function SpacesBackupRecords({ ...rest }) {
  const { t } = useLocaleContext();

  return (
    <Box {...rest}>
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
      <SpacesBackupRecordsTable />
    </Box>
  );
}

export default SpacesBackupRecords;
