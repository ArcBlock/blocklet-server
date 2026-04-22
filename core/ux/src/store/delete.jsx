import { useState } from 'react';
import PropTypes from 'prop-types';
import { useTheme, Button } from '@mui/material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import Toast from '@arcblock/ux/lib/Toast';
import { useNodeContext } from '../contexts/node';
import DelConfirm from '../delete-confirm';
import { formatError } from '../util';
import { useBlockletContext } from '../contexts/blocklet';

export default function DeleteStore({
  store,
  teamDid,
  onDelete = () => {},
  children = null,
  projectId = '',
  scope = '',
}) {
  const { api } = useNodeContext();
  const { t } = useLocaleContext();
  const blockletContext = useBlockletContext();
  const [loading, setLoading] = useState(false);
  const [confirmSetting, setConfirmSetting] = useState(null);
  const theme = useTheme();

  const onCancel = () => {
    setLoading(false);
    setConfirmSetting(null);
  };

  const onConfirm = async () => {
    try {
      setLoading(true);
      await api.deleteBlockletStore({ input: { teamDid, url: store.url, projectId, scope } });
      await blockletContext?.actions?.refreshBlocklet();
      if (onDelete && typeof onDelete === 'function') {
        onDelete();
      }
    } catch (err) {
      Toast.error(`Remove Blocklet Store Error: ${formatError(err)}`);
    } finally {
      setLoading(false);
      setConfirmSetting(null);
    }
  };

  const setting = {
    keyName: store.url,
    title: t('store.blockletRegistry.deleteRegistry'),
    description: t('store.blockletRegistry.deleteDesc', {
      name: `<b>${store.url}</b>`,
      color: theme.palette.error.main,
    }),
    confirmPlaceholder: t('store.blockletRegistry.confirmDesc', { name: store.url }),
    confirm: t('common.delConfirm'),
    cancel: t('common.cancel'),
    onConfirm,
    onCancel,
  };

  const onMenuItemClick = (e) => {
    if (store.protected) {
      return;
    }
    e.stopPropagation();
    setConfirmSetting(setting);
  };

  return (
    <>
      {children ? (
        <span onClick={onMenuItemClick}>{children}</span>
      ) : (
        <Button data-cy="store-action-delete" color="primary" disabled={loading} onClick={onMenuItemClick} size="small">
          <DeleteOutlineIcon sx={{ zoom: 0.95 }} />
        </Button>
      )}

      {confirmSetting && (
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
      )}
    </>
  );
}

DeleteStore.propTypes = {
  children: PropTypes.node,
  teamDid: PropTypes.string.isRequired,
  store: PropTypes.object.isRequired,
  onDelete: PropTypes.func,
  projectId: PropTypes.string,
  scope: PropTypes.string,
};
