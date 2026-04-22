/* eslint-disable react/prop-types */
import { useState } from 'react';

import ActionIcon from '@mui/icons-material/Delete';
import { useTheme, CircularProgress as Spinner } from '@mui/material';

import Button from '@arcblock/ux/lib/Button';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import Confirm from '../../../confirm';
import { useRoutingContext } from '../../../../contexts/routing';
import { useNodeContext } from '../../../../contexts/node';

export default function DeleteCert(props) {
  const theme = useTheme();
  const { t } = useLocaleContext();
  const { api } = useNodeContext();
  const [loading, setLoading] = useState(false);
  const [confirmSetting, setConfirmSetting] = useState(null);
  const { id, domain, onDelete = () => {}, ...restProps } = props;
  const { refresh: refreshRoutingContext } = useRoutingContext();

  const onCancel = () => {
    setLoading(false);
    setConfirmSetting(null);
  };

  const onConfirm = async () => {
    setLoading(true);
    try {
      await api.deleteCertificate({ input: { id } });
      refreshRoutingContext();
      onDelete();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setConfirmSetting(null);
    }
  };

  const setting = {
    title: t('router.cert.delete.title'),
    description: t('router.cert.delete.description', { domain }),
    confirm: t('common.delConfirm'),
    cancel: t('common.cancel'),
    onConfirm,
    onCancel,
  };

  return (
    <>
      <Button
        edge="end"
        onClick={() => setConfirmSetting(setting)}
        size="small"
        className="rule-action"
        variant="text"
        data-cy="action-delete-cert"
        style={{ color: theme.palette.error.main }}
        {...restProps}>
        {loading ? <Spinner size={16} /> : <ActionIcon style={{ fontSize: 16 }} />}
        {t('common.delete')}
      </Button>
      {confirmSetting && (
        <Confirm
          title={confirmSetting.title}
          description={confirmSetting.description}
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
