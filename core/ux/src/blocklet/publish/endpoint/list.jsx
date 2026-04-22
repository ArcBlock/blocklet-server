import { useMemo } from 'react';
import PropTypes from 'prop-types';

import { Box, List, Alert, ListItem, ListItemText } from '@mui/material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { blueGrey } from '@mui/material/colors';

import AddEndpoint from './add';
import EndpointItem from './item';
import { useSessionContext } from '../../../contexts/session';
import { useBlockletContext } from '../../../contexts/blocklet';

function ConnectEndpointList({
  releaseId,
  blocklet,
  connectedEndpoints,
  projectId,
  publishedEndpointIds = [],
  onPublish = () => {},
  onDelete = () => {},
  warning = {},
  onOpenConnectEndpoint = () => {},
}) {
  const {
    actions: { refreshBlocklet },
  } = useBlockletContext();
  const { session } = useSessionContext();
  const { t } = useLocaleContext();
  const list = (blocklet?.settings?.endpointList || []).filter((x) => x.scope === session?.user?.did);

  const connectedMap = useMemo(() => {
    if (!connectedEndpoints?.length) {
      return {};
    }
    return connectedEndpoints?.reduce((acc, x) => {
      acc[x.endpointId] = x;
      return acc;
    }, {});
  }, [connectedEndpoints]);

  const did = blocklet?.meta?.did;

  const warningList = {};
  Object.entries(warning?.logoErrors || {}).forEach(([key, value]) => {
    const errors = Object.values(value);
    if (errors.length > 0) {
      warningList[key] = errors;
    }
  });
  Object.entries(warning?.screenshotErrors || {}).forEach(([key, value]) => {
    const errors = Object.values(value);
    if (errors.length > 0) {
      warningList[key] = warningList[key] ? [...warningList[key], ...errors] : errors;
    }
  });

  return (
    <>
      {!!list?.length && (
        <Alert severity="info" style={{ width: '100%' }}>
          <Box
            sx={{
              color: blueGrey[400],
            }}>
            {t('blocklet.publish.endpoint.uploadToEndpoint')}
          </Box>
        </Alert>
      )}
      <List sx={{ flex: 1 }}>
        {list?.map((x) => (
          <ListItem key={x.url} data-cy="endpoint-switch">
            <ListItemText>
              <EndpointItem
                releaseId={releaseId}
                projectId={projectId}
                teamDid={did}
                warningList={warningList[x.url]}
                endpoint={x}
                published={publishedEndpointIds?.indexOf(x.id) > -1}
                connectedEndpoint={connectedMap[x.id]}
                onPublish={onPublish}
                onDelete={onDelete}
                onOpenConnectEndpoint={onOpenConnectEndpoint}
              />
            </ListItemText>
          </ListItem>
        ))}
      </List>
      <AddEndpoint teamDid={did} endpointList={list} onAdd={refreshBlocklet} />
    </>
  );
}

ConnectEndpointList.propTypes = {
  releaseId: PropTypes.string.isRequired,
  blocklet: PropTypes.object.isRequired,
  projectId: PropTypes.string.isRequired,
  warning: PropTypes.object,
  onPublish: PropTypes.func,
  onOpenConnectEndpoint: PropTypes.func,
  onDelete: PropTypes.func,
  connectedEndpoints: PropTypes.arrayOf(PropTypes.object).isRequired,
  publishedEndpointIds: PropTypes.arrayOf(PropTypes.string),
};

export default ConnectEndpointList;
