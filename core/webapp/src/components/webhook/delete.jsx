import { useState } from 'react';
import PropTypes from 'prop-types';

import ActionIcon from '@mui/icons-material/Delete';
import Spinner from '@mui/material/CircularProgress';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import DelConfirm from '../delete-confirm';
import { useNodeContext } from '../../contexts/node';

export default function DeleteWebhook({ item, onDelete = () => {}, close = () => {} }) {
  const { t } = useLocaleContext();
  const [loading, setLoading] = useState(false);
  const [confirmSetting, setConfirmSetting] = useState(null);
  const { id, title } = item;

  const { api } = useNodeContext();

  const onCancel = () => {
    setLoading(false);
    setConfirmSetting(null);
  };

  const onConfirm = async () => {
    setLoading(true);
    try {
      await api.deleteWebHook({ input: { id } });
      onDelete();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setConfirmSetting(null);
    }
  };

  const setting = {
    keyName: id,
    title: t('setting.webhook.delTitle'),
    description: `${t('setting.webhook.description', { name: `<b>${title}</b>`, id: `<b>${id}</b>` })}`,
    confirmPlaceholder: t('setting.webhook.confirm_desc', { name: id }),
    confirm: t('common.delConfirm'),
    cancel: t('common.cancel'),
    onConfirm,
    onCancel,
  };

  return (
    <>
      <MenuItem
        disabled={loading}
        key="delete-webhook"
        onClick={e => {
          e.stopPropagation();
          close();
          setConfirmSetting(setting);
        }}
        data-cy="action-delete-webhook"
        dense>
        <ListItemIcon style={{ minWidth: 24, marginRight: 8 }}>{loading ? <Spinner /> : <ActionIcon />}</ListItemIcon>
        <ListItemText primary={t('common.delete')} />
      </MenuItem>
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

DeleteWebhook.propTypes = {
  item: PropTypes.object.isRequired,
  onDelete: PropTypes.func,
  close: PropTypes.func,
};
