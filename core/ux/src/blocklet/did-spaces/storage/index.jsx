import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import { useCreation } from 'ahooks';
import Center from '@arcblock/ux/lib/Center';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { ConfigSpaceProvider, useConfigSpaceContext } from '../../../contexts/config-space';
import ConnectTo from '../../component/did-space/connect-to';
import Disconnect from '../../component/did-space/disconnect';
import Connected from '../../component/did-space/connected';

function Storage() {
  /** @type {{ blocklet: import('@blocklet/server-js').BlockletState }} */
  const { spaceGateway, settingStorageEndpoint, updateSpaceGateway, hasStorageEndpoint, loading, storageEndpoint } =
    useConfigSpaceContext();
  const connectToSx = useCreation(() => {
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: '16px',
    };
  });

  if (loading) {
    return (
      <Center relative="parent">
        <CircularProgress />
      </Center>
    );
  }

  return (
    <Box sx={{ maxWidth: 'md', position: 'relative' }}>
      {hasStorageEndpoint ? (
        <Connected spaceGateway={spaceGateway} settingStorageEndpoint={settingStorageEndpoint} />
      ) : (
        <Disconnect />
      )}
      <Box sx={connectToSx}>
        <ConnectTo onConnect={updateSpaceGateway} storageEndpoint={storageEndpoint} />
      </Box>
    </Box>
  );
}

export default function BlockletStorage() {
  const { t } = useLocaleContext();

  return (
    <ConfigSpaceProvider>
      <Stack
        spacing={1}
        sx={{
          marginBottom: 2,
        }}>
        <Typography
          sx={{
            fontSize: '1.2rem',
            fontWeight: 'bold',
          }}>
          {t('storage.appLevel.title')}
        </Typography>
        <Typography
          sx={{
            color: 'text.secondary',
          }}>
          {t('storage.appLevel.description')}
        </Typography>
      </Stack>
      <Storage />
    </ConfigSpaceProvider>
  );
}
