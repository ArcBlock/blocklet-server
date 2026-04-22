import React from 'react';
import { Typography } from '@mui/material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import SwitchControl from '../../component/switch-control';
import { useBlockletStorageContext } from '../../../contexts/blocklet-storage';

/**
 * @description
 * @param {{
 *  style: import('react').CSSProperties
 * }} {...rest}
 * @return {*}
 */
function AutoBackup({ ...rest }) {
  const { t } = useLocaleContext();
  const { autoBackup, updateAutoBackup } = useBlockletStorageContext();

  const configAutoBackup = async () => {
    try {
      const enabled = !autoBackup?.enabled;
      await updateAutoBackup({ enabled });
      Toast.success(enabled ? t('storage.spaces.autoBackup.enabled') : t('storage.spaces.autoBackup.disabled'));
    } catch (error) {
      Toast.error(error.message);
    }
  };

  return (
    <SwitchControl
      checked={Boolean(autoBackup?.enabled)}
      onChange={configAutoBackup}
      name="enableWelcomePage"
      labelProps={{
        label: (
          <Typography
            sx={{
              marginRight: '8px',
            }}>
            <span>{t('storage.spaces.autoBackup.title')}</span>
          </Typography>
        ),
      }}
      style={{ ...rest.style }}
    />
  );
}

export default AutoBackup;
