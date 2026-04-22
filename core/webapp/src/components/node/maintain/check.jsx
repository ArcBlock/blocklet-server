/* eslint-disable react/jsx-one-expression-per-line */
import { useState, useEffect } from 'react';

import useLocalStorage from 'react-use/lib/useLocalStorage';
import RefreshIcon from '@mui/icons-material/Refresh';
import Button from '@mui/lab/LoadingButton';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import ConfirmDialog from '../../confirm';
import { useNodeContext } from '../../../contexts/node';

export default function UpgradeCheck() {
  const { t } = useLocaleContext();
  const { api } = useNodeContext();
  const [loading, setLoading] = useState(false);
  const [confirmSetting, setConfirmSetting] = useState(null);
  const [lastTime, setLastTime] = useLocalStorage('last-check-server-version-time');

  const onDone = () => {
    setLoading(false);
    setConfirmSetting(null);
  };

  const setting = {
    title: t('setting.form.upgrade.check'),
    description: t('setting.form.upgrade.latest'),
    confirm: t('common.confirm'),
    showCancel: false,
    color: 'primary',
    onConfirm: onDone,
    onCancel: onDone,
  };

  const onCheck = async showResult => {
    try {
      setLoading(true);
      const { version } = await api.checkNodeVersion();
      if (!version && showResult) {
        setConfirmSetting(setting);
      }
      setLastTime(Date.now());
    } catch (err) {
      console.error(`Failed to check new version: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!lastTime || Date.now() - Number(lastTime) > 60 * 1000) {
      onCheck(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Button
        sx={{ ml: 2 }}
        color="primary"
        variant="outlined"
        onClick={onCheck}
        size="small"
        loadingPosition="end"
        loading={loading}>
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            alignItems: 'center',
          }}>
          <RefreshIcon fontSize="small" />
          <Typography component="span">{t('server.checkUpgrade')}</Typography>
        </Stack>
      </Button>
      {confirmSetting && (
        <ConfirmDialog
          title={confirmSetting.title}
          description={confirmSetting.description}
          confirm={confirmSetting.confirm}
          showCancel={confirmSetting.showCancel}
          color={confirmSetting.color}
          onConfirm={confirmSetting.onConfirm}
          onCancel={confirmSetting.onCancel}
        />
      )}
    </>
  );
}
