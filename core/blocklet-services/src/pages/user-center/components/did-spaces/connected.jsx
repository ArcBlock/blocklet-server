import PropTypes from 'prop-types';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Box, Typography } from '@mui/material';
import { DIDSpaceConnection, DIDSpaceConnect } from '@blocklet/did-space-react';
import { useConfigUserSpaceContext } from '../../context/did-spaces';
import Action from './action';
import useMobile from '../../../../hook/use-mobile';

function Connected({ spaceGateway = undefined }) {
  const { t } = useLocaleContext();
  const { updateSpaceGateway, session } = useConfigUserSpaceContext();
  const isMobile = useMobile();

  const onSuccess = ({ spaceGateway: _spaceGateway }) => updateSpaceGateway(_spaceGateway);

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
          marginBottom: '12px',
        }}>
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 'bold',
          }}>
          {t('userCenter.storage.spaces.connected.title')}
        </Typography>
        {!isMobile && (
          <DIDSpaceConnect
            connectScope="user"
            connectText={t('userCenter.storage.spaces.connected.switch')}
            session={session}
            onSuccess={onSuccess}
          />
        )}
      </Box>
      <Box>
        {spaceGateway && (
          <DIDSpaceConnection
            key={spaceGateway.endpoint}
            endpoint={spaceGateway.endpoint}
            deps={[spaceGateway]}
            selected
            footer
            // eslint-disable-next-line react/no-unstable-nested-components
            action={(props) => <Action session={session} {...props} />}
          />
        )}
      </Box>
      {isMobile && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
          <DIDSpaceConnect
            connectScope="user"
            connectText={t('userCenter.storage.spaces.connected.switch')}
            session={session}
            onSuccess={onSuccess}
          />
        </Box>
      )}
    </Box>
  );
}

Connected.propTypes = {
  spaceGateway: PropTypes.object,
};

export default Connected;
