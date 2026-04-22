import React from 'react';
import { Box } from '@mui/material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import PropTypes from 'prop-types';
import Tooltip from '@mui/material/Tooltip';

import SwitchControl from './component/switch-control';
import { useBlockletContext } from '../contexts/blocklet';
import { useNodeContext } from '../contexts/node';

/**
 * @description
 * @param {{
 *  style: import('react').CSSProperties
 * }} {...rest}
 * @return {*}
 */
function AutoCheckUpdate({ children = null, ...rest }) {
  const { t } = useLocaleContext();
  const { api } = useNodeContext();
  const { blocklet } = useBlockletContext();

  const autoCheckUpdate = blocklet?.settings?.autoCheckUpdate;
  const updateAutoCheckUpdate = async (value) => {
    await api.updateAutoCheckUpdate({
      input: {
        did: blocklet.meta.did,
        autoCheckUpdate: value,
      },
    });
  };

  const configAutoBackup = async () => {
    try {
      const enabled = !autoCheckUpdate?.enabled;
      await updateAutoCheckUpdate({ enabled });
      Toast.success(
        enabled ? t('storage.spaces.autoCheckUpdate.enabled') : t('storage.spaces.autoCheckUpdate.disabled')
      );
    } catch (error) {
      Toast.error(error.message);
    }
  };

  const enabled = Boolean(autoCheckUpdate?.enabled);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}>
      {children}
      <Tooltip title={t('storage.spaces.autoCheckUpdate.title')} arrow placement="right">
        <div>
          <SwitchControl
            checked={enabled}
            onChange={configAutoBackup}
            name="enableWelcomePage"
            style={{ ...rest.style, zoom: 0.8 }}
          />
        </div>
      </Tooltip>
    </Box>
  );
}

AutoCheckUpdate.propTypes = {
  children: PropTypes.any,
};

export default AutoCheckUpdate;
