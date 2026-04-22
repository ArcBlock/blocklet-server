import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ListItemIcon, ListItemText, MenuItem, Typography } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Confirm from '@arcblock/ux/lib/Dialog/confirm';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import toast from '@arcblock/ux/lib/Toast';
import { formatError } from '../../../util';

/**
 * @export
 * @param {{
 *  spaceGateway: import('./connected').SpaceGateway,
 *  onConfirm?: (spaceGateway: import('./connected').SpaceGateway) => Promise<void> | void
 *  onCancel?: (event: React.MouseEvent) => void
 * }}
 * @return {*}
 */
function DeleteDIDSpacesGateWay({ spaceGateway, onConfirm = () => undefined, onCancel = () => undefined }) {
  const { t } = useLocaleContext();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  /**
   * @param {React.MouseEvent} event
   * @param {boolean} isOpen
   */
  const helpOpen = (event, isOpen) => {
    event?.preventDefault();
    event?.stopPropagation();
    setOpen(isOpen);
  };

  /**
   * @param {React.MouseEvent} event
   */
  const handleOnConfirm = async (event) => {
    try {
      event?.stopPropagation();
      setLoading(true);
      await onConfirm?.(spaceGateway);
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(`${t('storage.space.gateway.delete.failed')}: ${formatError(error)}`);
    } finally {
      setOpen(false);
      setLoading(false);
    }
  };

  /**
   * @param {React.MouseEvent} event
   */
  const handleOnCancel = (e) => {
    helpOpen(e, false);
    onCancel?.(e);
  };

  return (
    <>
      <MenuItem color="red" onClick={(e) => helpOpen(e, true)}>
        <ListItemIcon style={{ minWidth: 24, color: 'red' }}>
          <DeleteOutlineIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText style={{ color: 'red' }}>{t('common.disconnect')}</ListItemText>
      </MenuItem>

      <Confirm
        title={t('storage.spaces.gateway.delete.title')}
        open={open}
        confirmButton={{
          text: t('common.confirm'),
          props: {
            size: 'small',
            variant: 'contained',
            color: 'error',
            loading,
          },
        }}
        cancelButton={{
          text: t('common.cancel'),
          props: {
            size: 'small',
            variant: 'outlined',
            disabled: loading,
          },
        }}
        onConfirm={handleOnConfirm}
        onCancel={handleOnCancel}>
        <Typography sx={{ wordWrap: 'break-word' }}>
          {t('storage.spaces.gateway.delete.descForBackup', { name: `${spaceGateway?.name}` })}
        </Typography>
      </Confirm>
    </>
  );
}

DeleteDIDSpacesGateWay.propTypes = {
  spaceGateway: PropTypes.shape({
    name: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    protected: PropTypes.bool,
  }).isRequired,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
};

export default DeleteDIDSpacesGateWay;
