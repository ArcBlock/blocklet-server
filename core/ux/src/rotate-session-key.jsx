import React, { useState } from 'react';

import Toast from '@arcblock/ux/lib/Toast';
import Button from '@arcblock/ux/lib/Button';
import Spinner from '@mui/material/CircularProgress';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import { formatError } from './util';
import { useNodeContext } from './contexts/node';
import Confirm from './confirm';

// eslint-disable-next-line react/prop-types
export default function RotateSessionKey({ teamDid, size = 'small', ...rest }) {
  const { t } = useLocaleContext();
  const { api } = useNodeContext();
  const [loading, setLoading] = useState(false);
  const [confirmSetting, setConfirmSetting] = useState(null);

  const onCancel = () => {
    setLoading(false);
    setConfirmSetting(null);
  };

  const onConfirm = async () => {
    try {
      setLoading(true);
      const result = await api.rotateSessionKey({ input: { teamDid } });
      Toast.success(t('blocklet.config.rotateSessionKey.success', { count: result.removed?.length || 0 }));
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      Toast.error(formatError(err));
    } finally {
      setLoading(false);
      setConfirmSetting(null);
    }
  };

  const setting = {
    title: t('blocklet.config.rotateSessionKey.title'),
    description: t('blocklet.config.rotateSessionKey.description'),
    confirm: t('common.confirm'),
    cancel: t('common.cancel'),
    onConfirm,
    onCancel,
  };

  return (
    <div {...rest}>
      <Button onClick={() => setConfirmSetting(setting)} color="error" variant="outlined" size={size}>
        {loading ? <Spinner size={16} style={{ marginRight: 5 }} /> : null}
        {t('blocklet.config.rotateSessionKey.action')}
      </Button>
      {confirmSetting && (
        <Confirm
          title={confirmSetting.title}
          description={confirmSetting.description}
          confirm={confirmSetting.confirm}
          cancel={confirmSetting.cancel}
          onConfirm={confirmSetting.onConfirm}
          onCancel={confirmSetting.onCancel}
        />
      )}
    </div>
  );
}
