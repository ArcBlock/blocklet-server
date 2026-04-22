import { Box, Typography } from '@mui/material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { DIDSpaceConnect, EmptySpacesNFTIcon } from '@blocklet/did-space-react';
import { useConfigUserSpaceContext } from '../../context/did-spaces';

function Disconnect() {
  const { t } = useLocaleContext();
  const { updateSpaceGateway, session } = useConfigUserSpaceContext();

  const onSuccess = ({ spaceGateway }) => updateSpaceGateway(spaceGateway);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
      }}>
      <Typography
        sx={{
          fontSize: '16px',
          fontWeight: 'bold',
        }}>
        {t('userCenter.storage.spaces.connect.providerForStorage')}
      </Typography>
      <EmptySpacesNFTIcon
        viewBox="0 0 228 258"
        style={{
          width: '156px',
          height: '156px',
          margin: '16px 0',
        }}
      />
      <Box>
        <DIDSpaceConnect session={session} onSuccess={onSuccess} />
      </Box>
    </Box>
  );
}

export default Disconnect;
