import { useState } from 'react';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Button, Box, useTheme } from '@mui/material';
import PropTypes from 'prop-types';
import { useNodeContext } from '../../../contexts/node';
import { useBlockletContext } from '../../../contexts/blocklet';
import DelConfirm from '../../../delete-confirm';
import { formatError } from '../../../util';

export default function DeleteEndpoint({ endpoint, teamDid, onDelete = '', projectId = '', children = null }) {
  const { api } = useNodeContext();
  const { t } = useLocaleContext();
  const theme = useTheme();
  const blockletContext = useBlockletContext();
  const [loading, setLoading] = useState(false);
  const [confirmSetting, setConfirmSetting] = useState(null);

  const onCancel = () => {
    setLoading(false);
    setConfirmSetting(null);
  };

  const onConfirm = async () => {
    try {
      setLoading(true);
      await api.deleteUploadEndpoint({ input: { teamDid, did: endpoint.id, projectId } });
      await blockletContext?.actions?.refreshBlocklet();
      onDelete?.();
    } catch (err) {
      Toast.error(`${t('blocklet.publish.endpoint.deleteFailed')}: ${formatError(err)}`);
    } finally {
      setLoading(false);
      setConfirmSetting(null);
    }
  };

  const setting = {
    keyName: endpoint.url,
    title: t('blocklet.publish.endpoint.deleteEndpoint'),
    description: t('blocklet.publish.endpoint.deleteDesc', {
      name: `<b>${endpoint.url}</b>`,
      color: theme.palette.error.main,
    }),
    confirmPlaceholder: t('blocklet.publish.endpoint.confirmDesc', { name: endpoint.url }),
    confirm: t('common.delConfirm'),
    cancel: t('common.cancel'),
    onConfirm,
    onCancel,
  };

  const handleDelete = (e) => {
    if (endpoint.protected) {
      return;
    }
    e.stopPropagation();
    setConfirmSetting(setting);
  };

  return (
    <>
      {children ? (
        <Box component="span" onClick={handleDelete}>
          {children}
        </Box>
      ) : (
        <Button data-cy="endpoint-action-delete" color="primary" disabled={loading} onClick={handleDelete} size="small">
          <DeleteOutlineIcon sx={{ zoom: 0.95 }} />
        </Button>
      )}

      {confirmSetting ? (
        <DelConfirm
          keyName={confirmSetting.keyName}
          title={confirmSetting.title}
          description={confirmSetting.description}
          confirmPlaceholder={confirmSetting.confirmPlaceholder}
          confirm={confirmSetting.confirm}
          cancel={confirmSetting.cancel}
          params={confirmSetting.params}
          onConfirm={confirmSetting.onConfirm}
          onCancel={confirmSetting.onCancel}
        />
      ) : null}
    </>
  );
}

DeleteEndpoint.propTypes = {
  endpoint: PropTypes.object.isRequired,
  teamDid: PropTypes.string.isRequired,
  onDelete: PropTypes.func,
  projectId: PropTypes.string,
  children: PropTypes.node,
};
