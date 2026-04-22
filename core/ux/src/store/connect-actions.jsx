import PropTypes from 'prop-types';
import { useState } from 'react';

import { Box, Button, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { joinURL } from 'ufo';
import LaunchIcon from '@mui/icons-material/Launch';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import ConfirmDialog from '../confirm';
import DeleteStore from './delete';
import canDeleteStore from '../blocklet/publish/utils/can-delete-store';
import { useSessionContext } from '../contexts/session';
import getSafeUrlWithToast from '../util/get-safe-url';

function ConnectActions({
  connectedStore,
  onDisconnect = () => {},
  onDelete = () => {},
  store,
  teamDid,
  projectId = '',
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const { t } = useLocaleContext();
  const { session } = useSessionContext();

  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const handleOpenUrl = (e) => {
    e.stopPropagation();
    window.open(getSafeUrlWithToast(`${joinURL(store.url, 'search?menu=my-blocklets')}`, { allowDomains: null }));
  };

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDisconnect = () => {
    setShowDisconnectConfirm(false);
    onDisconnect();
  };

  const actions = [
    {
      label: t('common.visitStore'),
      action: handleOpenUrl,
      icon: LaunchIcon,
    },
    {
      label: t('common.disconnect'),
      action: () => {
        handleClose();
        setShowDisconnectConfirm(true);
      },
      icon: LinkOffIcon,
      hidden: !connectedStore,
    },
  ];

  return (
    <>
      <Button ref={anchorEl} color="primary" onClick={handleOpen} size="small">
        <MoreVertIcon sx={{ zoom: 0.95 }} />
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}>
        {actions.map((x) => {
          if (x.hidden) {
            return null;
          }
          return (
            <MenuItem dense key={x.label} onClick={x.action} disabled={x.disabled}>
              {x.icon && <x.icon color="action" sx={{ marginRight: 1 }} />}
              <Box
                sx={{
                  color: 'action',
                }}>
                {x.label}
              </Box>
            </MenuItem>
          );
        })}
        {canDeleteStore({ store, userDid: session?.user?.did }) && (
          <DeleteStore
            store={store}
            onDelete={onDelete}
            teamDid={teamDid}
            projectId={projectId}
            scope={store.scope || 'studio'}>
            <MenuItem dense disabled={store.protected}>
              <DeleteOutlineIcon sx={{ color: store.protected ? 'action' : 'error.main', marginRight: 1 }} />
              <Box
                sx={{
                  color: store.protected ? 'action' : 'error.main',
                }}>
                {t('common.delete')}
              </Box>
            </MenuItem>
          </DeleteStore>
        )}
      </Menu>
      {showDisconnectConfirm && (
        <ConfirmDialog
          displayError
          title={`${t('common.disconnect')} ${store.name}`}
          description={t('blocklet.publish.disconnectStoreTip')}
          confirm={t('common.confirm')}
          onConfirm={handleDisconnect}
          onCancel={() => setShowDisconnectConfirm(false)}
        />
      )}
    </>
  );
}

ConnectActions.propTypes = {
  connectedStore: PropTypes.object.isRequired,
  onDisconnect: PropTypes.func,
  onDelete: PropTypes.func,
  store: PropTypes.object.isRequired,
  teamDid: PropTypes.string.isRequired,
  projectId: PropTypes.string,
};

export default ConnectActions;
