import React, { useState } from 'react';
import { Button, CircularProgress, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import PropTypes from 'prop-types';
import ElectricBoltOutlinedIcon from '@mui/icons-material/ElectricBoltOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import Toast from '@arcblock/ux/lib/Toast';
import StopIcon from '@mui/icons-material/Stop';

import { getBackupFilesUrlFromEndpoint, getDIDSpaceUrlFromEndpoint } from '../../../util/spaces';
import DeleteDIDSpacesGateWay from './gateway-delete';
import getSafeUrlWithToast from '../../../util/get-safe-url';
import { useBlockletStorageContext } from '../../../contexts/blocklet-storage';

/**
 * @description
 * @param {{
 *  spaceGateway: import('./connected').SpaceGateway,
 *  onDelete?: (spaceGateway: import('./connected').SpaceGateway) => Promise<void>,
 *  onConnect?: (spaceGateway: import('./connected').SpaceGateway) => Promise<void>,
 *  enableSwitchToSpace: true | false,
 *  selected: false | true,
 *  backupInProgress: false | true,
 * } & import('@mui/material').IconButtonProps} { spaceGateway, onDelete, onConnect, enableSwitchToSpace, connected, ...rest }
 * @return {React.Component}
 */
function SpaceItemAction({
  spaceGateway,
  selected,
  onDelete = () => {},
  onConnect = () => {},
  enableSwitchToSpace = true,
  backupInProgress = false,
  ...rest
}) {
  const { abortBlockletBackup } = useBlockletStorageContext();
  const [anchorEl, setAnchorEl] = useState(null);
  const { t } = useLocaleContext();
  const [loading, setLoading] = useState(false);

  /**
   * @description
   * @param {React.MouseEvent<HTMLButtonElement> | undefined} event
   */
  const handleOpen = (event, open) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(open && event.currentTarget);
  };

  const handleOnSwitchSpace = async (e) => {
    try {
      setLoading(true);
      handleOpen(e, false);
      await onConnect(spaceGateway);
    } catch (error) {
      console.error(error);
      Toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOnAbortBlockletBackup = async (e) => {
    try {
      setLoading(true);
      handleOpen(e, false);
      await abortBlockletBackup();
    } catch (error) {
      console.error(error);
      Toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading || spaceGateway?.loading ? (
        <CircularProgress sx={{ ml: 1 }} size="24px" />
      ) : (
        <Button
          aria-label="more"
          aria-controls="actions-menu"
          aria-haspopup="true"
          data-cy="trigger-blocklet-actions"
          variant="outlined"
          size="small"
          onClick={(e) => handleOpen(e, true)}
          {...rest}>
          <MoreHorizIcon />
        </Button>
      )}
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={(e) => handleOpen(e, false)}>
        <MenuItem
          onClick={(e) => {
            handleOpen(e, false);
            window.open(
              // 从 gateway 相关接口中获得，可以信任
              getSafeUrlWithToast(
                spaceGateway.endpoint ? getDIDSpaceUrlFromEndpoint(spaceGateway.endpoint) : spaceGateway.url,
                {
                  allowDomains: null,
                }
              )
            );
          }}>
          <ListItemIcon style={{ minWidth: 24 }}>
            <ArrowOutwardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('common.open')}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            handleOpen(e, false);
            // 从 gateway 相关接口中获得，可以信任
            window.open(
              getSafeUrlWithToast(getBackupFilesUrlFromEndpoint(spaceGateway.endpoint), { allowDomains: null })
            );
          }}>
          <ListItemIcon style={{ minWidth: 24 }}>
            <FolderOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('storage.spaces.strategy.viewBackupFiles')}</ListItemText>
        </MenuItem>
        {!selected && enableSwitchToSpace && (
          <MenuItem onClick={handleOnSwitchSpace}>
            <ListItemIcon style={{ minWidth: 24 }}>
              <ElectricBoltOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('storage.spaces.connect.switchToSpace')}</ListItemText>
          </MenuItem>
        )}
        {backupInProgress && (
          <MenuItem onClick={handleOnAbortBlockletBackup}>
            <ListItemIcon style={{ minWidth: 24 }}>
              <StopIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('storage.spaces.connect.abortBlockletBackup')}</ListItemText>
          </MenuItem>
        )}
        {!backupInProgress && (
          <DeleteDIDSpacesGateWay
            spaceGateway={spaceGateway}
            onConfirm={async () => {
              setAnchorEl(null);
              await onDelete?.(spaceGateway);
            }}
            onCancel={() => setAnchorEl(null)}
          />
        )}
      </Menu>
    </>
  );
}

SpaceItemAction.propTypes = {
  spaceGateway: PropTypes.shape({
    name: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    protected: PropTypes.bool,
    endpoint: PropTypes.string.isRequired,
    loading: PropTypes.bool,
  }).isRequired,
  selected: PropTypes.bool.isRequired,
  enableSwitchToSpace: PropTypes.bool,
  onDelete: PropTypes.func,
  onConnect: PropTypes.func,
  backupInProgress: PropTypes.bool,
};

export default SpaceItemAction;
