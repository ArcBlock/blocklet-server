import { useMemo } from 'react';
import PropTypes from 'prop-types';

import { Box, List, Alert, ListItem, ListItemText } from '@mui/material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import LaunchIcon from '@mui/icons-material/Launch';

import { blueGrey } from '@mui/material/colors';
import AddStore from '../../../store/add';
import StoreItem from '../../../store/item';
import { useSessionContext } from '../../../contexts/session';
import { useBlockletContext } from '../../../contexts/blocklet';
import getStudioStoreList from '../utils/get-studio-store-list';

function ConnectStoreList({
  blocklet,
  releaseId,
  connectedStores,
  projectId,
  releaseType,
  publishedStoreIds = [],
  onPublish = () => {},
  onDelete = () => {},
  warning = {},
  projectType = '',
  componentDid = '',
  onOpenConnectStore = () => {},
  behavior = 'connect',
  version,
  onSelectConnectStore = () => {},
}) {
  const { t } = useLocaleContext();
  const {
    actions: { refreshBlocklet },
  } = useBlockletContext();
  const { session } = useSessionContext();
  const { storeList } = getStudioStoreList({ fromBlocklet: true, blocklet, componentDid, userDid: session?.user?.did });
  const connectedMap = useMemo(() => {
    if (!connectedStores?.length) {
      return {};
    }
    return connectedStores?.reduce((acc, x) => {
      acc[x.storeId] = x;
      return acc;
    }, {});
  }, [connectedStores]);

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
      {behavior === 'connect' && !!storeList?.length && (
        <Alert severity="info" style={{ width: '100%' }}>
          <Box
            component="a"
            href={
              projectType === 'pack'
                ? 'https://www.arcblock.io/docs/blocklet-developer/en/5PXToZve-5IXAN1bc8rkpxAc'
                : 'https://www.arcblock.io/docs/blocklet-developer/en/hB5VWLfg9VnbWsL1JGLuLUfW'
            }
            target="_blank"
            rel="noreferrer"
            sx={{
              color: blueGrey[400],
              display: 'flex',
              alignItems: 'center',
            }}>
            {projectType === 'pack'
              ? t('blocklet.publish.whyCantSeeInStore')
              : t('blocklet.publish.whyCantSeeResourceBlockletInStore')}
            <LaunchIcon sx={{ marginLeft: 1 }} />
          </Box>
        </Alert>
      )}
      <List>
        {storeList?.map((x) => (
          <ListItem key={x.url} data-cy="store-switch">
            <ListItemText>
              <StoreItem
                behavior={behavior}
                onSelectConnectStore={onSelectConnectStore}
                releaseId={releaseId}
                projectId={projectId}
                releaseType={releaseType}
                kind="publish"
                teamDid={did}
                warningList={warningList[x.url]}
                store={x}
                version={version}
                published={publishedStoreIds?.indexOf(x.id) > -1}
                connectedStore={connectedMap[x.id]}
                onPublish={onPublish}
                onDelete={onDelete}
                scope={x.scope || 'studio'}
                onOpenConnectStore={onOpenConnectStore}
              />
            </ListItemText>
          </ListItem>
        ))}
      </List>
      <AddStore teamDid={did} storeList={storeList} scope="studio" onAdd={refreshBlocklet} />
    </>
  );
}

ConnectStoreList.propTypes = {
  blocklet: PropTypes.object.isRequired,
  projectId: PropTypes.string.isRequired,
  releaseId: PropTypes.string.isRequired,
  releaseType: PropTypes.string.isRequired,
  onPublish: PropTypes.func,
  onDelete: PropTypes.func,
  publishedStoreIds: PropTypes.arrayOf(PropTypes.string),
  connectedStores: PropTypes.arrayOf(PropTypes.object).isRequired,
  projectType: PropTypes.string,
  componentDid: PropTypes.string,
  warning: PropTypes.object,
  onOpenConnectStore: PropTypes.func,
  onSelectConnectStore: PropTypes.func,
  behavior: PropTypes.string,
  version: PropTypes.string.isRequired,
};

export default ConnectStoreList;
