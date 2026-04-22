import { Typography, Button, ButtonGroup, CircularProgress, Box, Tooltip, tooltipClasses, styled } from '@mui/material';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import DoneIcon from '@mui/icons-material/Done';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import PublishIcon from '@mui/icons-material/BackupOutlined';

import { useNodeContext } from '../../../contexts/node';
import { formatError } from '../../../util';

import ConnectActions from './connect-actions';
import DeveloperAvatar from './developer-avatar';
import DidAddress from '../../../did-address';
import usePromiseWindowOpen from '../../../hooks/use-promise-window-open';
import UploadedToast from './uploaded';

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

export default function EndpointItem({
  teamDid,
  projectId = '',
  releaseId = '',
  endpoint,
  warningList = [],
  onDelete = () => {},
  published = false,
  onPublish = () => {},
  connectedEndpoint = null,
  onOpenConnectEndpoint = () => {},
}) {
  const { t } = useLocaleContext();
  const { api } = useNodeContext();

  const [loading, setLoading] = useState(false);
  const openWindow = usePromiseWindowOpen({
    messageType: 'connect-endpoint-message',
    onOpen: () => setLoading(true),
    onClose: () => setLoading(false),
  });

  const connected = !!connectedEndpoint;

  const handleConnectToEndpoint = () => {
    openWindow(async (_, open) => {
      try {
        const res = await api.connectToEndpoint({
          input: {
            did: teamDid,
            endpointId: endpoint.id,
            projectId,
          },
        });

        if (!res?.url) {
          Toast.error('failed to connect to endpoint');
          return;
        }

        open(res.url);
        await onOpenConnectEndpoint({ did: teamDid, projectId, endpointId: endpoint.id });
        setLoading(false);
      } catch (err) {
        const error = formatError(err);
        Toast.error(error);
        setLoading(false);
      }
    });
  };

  const handleDisconnectEndpoint = async () => {
    try {
      await api.disconnectFromEndpoint({ input: { did: teamDid, endpointId: endpoint.id, projectId } });
      onDelete();
    } catch (err) {
      Toast.error(formatError(err));
    }
  };

  const handleUploadToEndpoint = () => {
    setLoading(true);
    api
      .publishToEndpoint({ input: { did: teamDid, endpointId: endpoint.id, projectId, releaseId } })
      .then(() => {
        Toast.success(<UploadedToast endpoint={endpoint} published />, { duration: 10000 });
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

  const hasWarning = warningList.length > 0;

  const uploadButton = (
    <Button
      sx={{ paddingLeft: 2, paddingRight: 2, fontSize: 15, width: 130, height: '100%' }}
      disabled={hasWarning}
      onClick={handleUploadToEndpoint}>
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
            {endpoint.appName}
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
          {`${endpoint.url}`}
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
        {connectedEndpoint && (
          <WhiteTooltip
            placement="top"
            title={
              <Box>
                <Typography component="span" variant="caption" sx={{ opacity: 0.7 }}>
                  {t('blocklet.publish.developerInfo')}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, mt: 1 }}>
                  <DeveloperAvatar
                    developerUrl={endpoint.url}
                    developerDid={connectedEndpoint.developerDid}
                    sx={{ width: 42, height: 42 }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography component="span" variant="subtitle1">
                      {connectedEndpoint.developerName}
                    </Typography>
                    <DidAddress size={14} copyable compact responsive={false} did={connectedEndpoint.developerDid} />
                  </Box>
                </Box>
              </Box>
            }>
            <Box>
              <DeveloperAvatar
                developerUrl={endpoint.url}
                developerDid={connectedEndpoint.developerDid}
                sx={{ marginRight: 1, cursor: 'help' }}
              />
            </Box>
          </WhiteTooltip>
        )}

        <ButtonGroup disabled={loading} variant="outlined" sx={{ height: 38 }} size="small">
          {!connected && (
            <Button
              sx={{ paddingLeft: 2, paddingRight: 2, fontSize: 15, width: 130 }}
              onClick={handleConnectToEndpoint}>
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
              {loading ? <CircularProgress sx={{ marginRight: 1 }} size={16} /> : <DoneIcon sx={{ marginRight: 1 }} />}
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
            endpoint={endpoint}
            teamDid={teamDid}
            connectedEndpoint={connectedEndpoint}
            onDisconnect={handleDisconnectEndpoint}
            onDelete={onDelete}
          />
        </ButtonGroup>
      </Box>
    </Box>
  );
}

EndpointItem.propTypes = {
  teamDid: PropTypes.string.isRequired,
  published: PropTypes.bool,
  connectedEndpoint: PropTypes.shape({
    endpointId: PropTypes.string,
    accessKeyId: PropTypes.string,
    accessKeySecret: PropTypes.string,
    createdBy: PropTypes.string,
    developerDid: PropTypes.string,
    developerName: PropTypes.string,
    developerEmail: PropTypes.string,
  }),
  warningList: PropTypes.array,
  projectId: PropTypes.string,
  releaseId: PropTypes.string,
  endpoint: PropTypes.shape({
    id: PropTypes.string.isRequired,
    appName: PropTypes.string,
    url: PropTypes.string.isRequired,
    endpoint: PropTypes.string.isRequired,
    protected: PropTypes.bool,
    connected: PropTypes.bool,
  }).isRequired,
  onDelete: PropTypes.func,
  onOpenConnectEndpoint: PropTypes.func,
  onPublish: PropTypes.func,
};
