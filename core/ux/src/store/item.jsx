import { styled, Typography, Button, ButtonGroup, CircularProgress, Box, Tooltip, tooltipClasses } from '@mui/material';
import LaunchIcon from '@mui/icons-material/Launch';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import DoneIcon from '@mui/icons-material/Done';
import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import { joinURL } from 'ufo';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import PublishIcon from '@mui/icons-material/BackupOutlined';
import { isInServerlessMode } from '@abtnode/util/lib/serverless';

import DeleteStore from './delete';
import { useNodeContext } from '../contexts/node';
import { formatError } from '../util';

import ConnectActions from './connect-actions';
import DidAddress from '../did-address';
import usePromiseWindowOpen from '../hooks/use-promise-window-open';
import DeveloperAvatar from './developer-avatar';
import UploadedToast from '../blocklet/publish/create-release/uploaded-toast';
import getSafeUrlWithToast from '../util/get-safe-url';

export const BEHAVIOR = {
  CONNECT: 'connect',
  SELECT: 'select',
};

const WhiteTooltip = styled(({ className, ...props }) => <Tooltip {...props} classes={{ popper: className }} />)(
  ({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: '#fff',
      color: 'rgba(0, 0, 0, 0.87)',
      borderRadius: 8,
      padding: theme.spacing(2),
      fontSize: theme.typography.pxToRem(12),
      border: '1px solid rgba(0,0,0,0.08)',
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.05)',
    },
  })
);

export default function StoreItem({
  teamDid,
  projectId = '',
  releaseId = '',
  store,
  warningList = [],
  onDelete = () => {},
  kind = 'store',
  published = false,
  connectedStore = null,
  releaseType = '',
  onPublish = () => {},
  onOpenConnectStore = () => {},
  onSelectConnectStore = () => {},
  behavior = BEHAVIOR.CONNECT,
  scope = '',
  version = '',
}) {
  const { t } = useLocaleContext();
  const { api, info: nodeInfo, inService } = useNodeContext();
  const [loading, setLoading] = useState(false);
  const openWindow = usePromiseWindowOpen({
    messageType: 'connect-store-message',
    onOpen: () => setLoading(true),
    onClose: () => setLoading(false),
  });
  const isPublish = kind === 'publish';
  const connected = !!connectedStore;

  const handleOpenUrl = (e) => {
    e.stopPropagation();
    if (isPublish) {
      // 从 配置的 store 中获得，可以信任
      window.open(getSafeUrlWithToast(joinURL(store.url, 'developer/blocklets'), { allowDomains: null }));
      return;
    }
    // 从 配置的 store 中获得，可以信任
    window.open(getSafeUrlWithToast(store.url, { allowDomains: null }));
  };

  const handleConnectToStore = () => {
    if (behavior === BEHAVIOR.SELECT) {
      onSelectConnectStore(store);
      return;
    }
    openWindow(async (newWindow, open) => {
      try {
        const res = await api.connectToStore({
          input: {
            did: teamDid,
            storeUrl: store.url,
            storeId: store.id,
            storeName: store.name,
            projectId,
          },
        });
        if (!res?.url) {
          Toast.error('failed to connect to store');
          return;
        }
        open(res.url);
        await onOpenConnectStore({ did: teamDid, projectId, storeId: store.id });
        setLoading(false);
      } catch (err) {
        const error = formatError(err);
        Toast.error(error);
        setLoading(false);
      }
    });
  };

  const handleDisconnectStore = async () => {
    try {
      await api.disconnectFromStore({ input: { did: teamDid, storeId: store.id, projectId, storeScope: scope } });
      onDelete();
    } catch (err) {
      Toast.error(formatError(err));
    }
  };

  const handleUploadToStore = () => {
    setLoading(true);
    api
      .publishToStore({
        input: {
          did: teamDid,
          storeId: store.id,
          storeName: store.name,
          projectId,
          releaseId,
          type: releaseType,
        },
      })
      .then((res) => {
        Toast.success(
          <UploadedToast
            storeName={connectedStore.storeName}
            storeUrl={connectedStore.storeUrl}
            did={projectId}
            version={version}
            published={res.url === 'published'}
          />,
          { duration: 10000 }
        );
        onPublish?.(null);
      })
      .catch((err) => {
        Toast.error(formatError(err));
        onPublish?.(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (connected) {
      setLoading(false);
    }
  }, [connected]);

  const showDeleteButton = useMemo(() => {
    if (inService && isInServerlessMode(nodeInfo)) {
      return false;
    }
    return true;
  }, [inService, nodeInfo]);

  const hasWarning = warningList.length > 0;
  const uploadButton = (
    <Button
      sx={{ paddingLeft: 2, paddingRight: 2, fontSize: 15, width: 130, height: '100%' }}
      disabled={hasWarning}
      onClick={handleUploadToStore}>
      {loading ? (
        <CircularProgress sx={{ marginRight: 1 }} size={16} />
      ) : (
        <PublishIcon sx={{ marginRight: 1, fontSize: 20 }} />
      )}
      {t('common.upload')}
    </Button>
  );
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        overflow: 'hidden',
        width: '100%',
      }}>
      {!isPublish && loading && <CircularProgress sx={{ marginRight: 2 }} size={16} />}
      <Box
        sx={{
          flexShrink: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flex: 1,
        }}>
        <Box sx={{ display: 'flex', flexDirection: 'row' }}>
          <Typography
            component="span"
            sx={{
              fontSize: 16,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            variant="subtitle1">
            {store.name}
          </Typography>
        </Box>
        <Typography
          sx={{
            fontSize: 14,
            opacity: 0.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          component="span"
          variant="inherit">
          {`${store.url}`}
        </Typography>
      </Box>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}>
        {connectedStore && (
          <WhiteTooltip
            placement="top"
            title={
              <Box>
                <Typography component="span" variant="caption" sx={{ opacity: 0.7 }}>
                  {t('blocklet.publish.developerInfo')}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, mt: 1 }}>
                  <DeveloperAvatar connectedStore={connectedStore} sx={{ width: 42, height: 42 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography component="span" variant="subtitle1">
                      {connectedStore.developerName}
                    </Typography>
                    <DidAddress size={14} copyable compact responsive={false} did={connectedStore.developerDid} />
                  </Box>
                </Box>
              </Box>
            }>
            <Box>
              <DeveloperAvatar connectedStore={connectedStore} sx={{ marginRight: 1, cursor: 'help' }} />
            </Box>
          </WhiteTooltip>
        )}
        {isPublish && (
          <ButtonGroup disabled={loading} variant="outlined" sx={{ height: 38 }} size="small">
            {!connected && (
              <Button sx={{ paddingLeft: 2, paddingRight: 2, fontSize: 15, width: 130 }} onClick={handleConnectToStore}>
                {loading ? (
                  <CircularProgress sx={{ marginRight: 1 }} size={16} />
                ) : (
                  <LinkOutlinedIcon sx={{ marginRight: 1 }} />
                )}
                {t('common.connect')}
              </Button>
            )}
            {connected && published && (
              <Button disabled sx={{ paddingLeft: 2, paddingRight: 2, fontSize: 15, width: 130 }}>
                {loading ? (
                  <CircularProgress sx={{ marginRight: 1 }} size={16} />
                ) : (
                  <DoneIcon sx={{ marginRight: 1 }} />
                )}
                {t('common.uploaded')}
              </Button>
            )}
            {connected &&
              !published &&
              (hasWarning ? (
                <WhiteTooltip
                  title={
                    <Box>
                      <Box sx={{ color: 'error.main', mb: 0.5 }}>{t('blocklet.publish.storeRule.warning')}</Box>
                      {warningList.map((x, index) => (
                        <Box key={x} sx={{ color: 'error.main' }}>
                          {index + 1}. {x}
                        </Box>
                      ))}
                    </Box>
                  }>
                  <div>{uploadButton}</div>
                </WhiteTooltip>
              ) : (
                uploadButton
              ))}
            <ConnectActions
              projectId={projectId}
              connectedStore={connectedStore}
              store={store}
              onDelete={onDelete}
              teamDid={teamDid}
              onDisconnect={handleDisconnectStore}
            />
          </ButtonGroup>
        )}
        {!isPublish && (
          <ButtonGroup disabled={loading} variant="outlined" sx={{ height: 36 }} size="small">
            <Button data-cy="store-open-url" onClick={handleOpenUrl}>
              <LaunchIcon sx={{ zoom: 0.9 }} />
            </Button>
            {!store.protected && showDeleteButton && (
              <DeleteStore store={store} onDelete={onDelete} teamDid={teamDid} scope="" />
            )}
          </ButtonGroup>
        )}
      </Box>
    </Box>
  );
}

StoreItem.propTypes = {
  kind: PropTypes.string,
  teamDid: PropTypes.string.isRequired,
  published: PropTypes.bool,
  connectedStore: PropTypes.shape({
    storeName: PropTypes.string,
    storeId: PropTypes.string,
    storeUrl: PropTypes.string,
    developerDid: PropTypes.string,
    developerName: PropTypes.string,
  }),
  warningList: PropTypes.array,
  projectId: PropTypes.string,
  releaseId: PropTypes.string,
  releaseType: PropTypes.string,
  store: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    protected: PropTypes.bool,
    connected: PropTypes.bool,
  }).isRequired,
  scope: PropTypes.string,
  onDelete: PropTypes.func,
  onPublish: PropTypes.func,
  onOpenConnectStore: PropTypes.func,
  behavior: PropTypes.string,
  onSelectConnectStore: PropTypes.func,
  version: PropTypes.string,
};
