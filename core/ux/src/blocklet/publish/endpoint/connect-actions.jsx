import PropTypes from 'prop-types';
import { useState } from 'react';

import { Box, Button, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { joinURL } from 'ufo';
import LaunchIcon from '@mui/icons-material/Launch';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import ConfirmDialog from '../../../confirm';
import DeleteEndpoint from './delete';
import getSafeUrlWithToast from '../../../util/get-safe-url';

function ConnectActions({
  connectedEndpoint,
  onDisconnect = () => {},
  onDelete = () => {},
  endpoint,
  teamDid,
  projectId = '',
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const { t } = useLocaleContext();

  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const handleOpenUrl = (e) => {
    e.stopPropagation();
    window.open(getSafeUrlWithToast(`${joinURL(endpoint.url)}`, { allowDomains: null }));
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
      label: t('blocklet.publish.endpoint.visitEndpoint'),
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
      hidden: !connectedEndpoint,
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

        <DeleteEndpoint endpoint={endpoint} teamDid={teamDid} onDelete={onDelete} projectId={projectId}>
          <MenuItem dense disabled={endpoint.protected}>
            <DeleteOutlineIcon sx={{ color: endpoint.protected ? 'action' : 'error.main', marginRight: 1 }} />
            <Box
              sx={{
                color: endpoint.protected ? 'action' : 'error.main',
              }}>
              {t('common.delete')}
            </Box>
          </MenuItem>
        </DeleteEndpoint>
      </Menu>
      {showDisconnectConfirm && (
        <ConfirmDialog
          displayError
          title={`${t('common.disconnect')} ${endpoint.appName}`}
          description={t('blocklet.publish.endpoint.disconnectEndpointTip', { url: endpoint.url })}
          confirm={t('common.confirm')}
          onConfirm={handleDisconnect}
          onCancel={() => setShowDisconnectConfirm(false)}
        />
      )}
    </>
  );
}

ConnectActions.propTypes = {
  connectedEndpoint: PropTypes.object.isRequired,
  onDisconnect: PropTypes.func,
  onDelete: PropTypes.func,
  endpoint: PropTypes.object.isRequired,
  teamDid: PropTypes.string.isRequired,
  projectId: PropTypes.string,
};

export default ConnectActions;
