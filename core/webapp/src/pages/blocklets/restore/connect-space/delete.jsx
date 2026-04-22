import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { IconButton } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Confirm from '@arcblock/ux/lib/Dialog/confirm';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import toast from '@arcblock/ux/lib/Toast';
import { formatError } from '@blocklet/error';

/**
 * @typedef {import('./selector').SpaceGateway} SpaceGateway
 */

/**
 *
 *
 * @export
 * @param {{
 *  spaceGateway: SpaceGateway,
 *  onDeleteSpaceGateway: (spaceGateway: SpaceGateway) => Promise<void> | void
 * }} { spaceGateway, onDelete }
 * @return {*}
 */
function SpaceGatewayDelete({ spaceGateway, onDeleteSpaceGateway = () => undefined }) {
  const { t } = useLocaleContext();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  /**
   * @description
   * @param {React.MouseEvent} e
   */
  const handleOpen = (e, bool) => {
    e?.stopPropagation();
    setOpen(bool);
  };

  /**
   * @description
   * @param {React.MouseEvent} e
   */
  const handleOnDelete = async e => {
    try {
      e?.stopPropagation();
      setLoading(true);
      await onDeleteSpaceGateway(spaceGateway);
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(`${t('storage.spaces.gateway.delete.failed')}: ${formatError(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <IconButton size="small" onClick={e => handleOpen(e, true)}>
        <DeleteOutlineIcon />
      </IconButton>

      <Confirm
        title={t('common.delConfirmDescription', {
          data: `${spaceGateway?.name}`,
        })}
        open={open}
        confirmButton={{
          text: t('common.confirm'),
          props: {
            variant: 'contained',
            color: 'error',
            loading,
          },
        }}
        cancelButton={{
          text: t('common.cancel'),
          props: {
            variant: 'contained',
            color: 'primary',
          },
        }}
        onConfirm={handleOnDelete}
        onCancel={e => handleOpen(e, false)}
      />
    </>
  );
}

SpaceGatewayDelete.propTypes = {
  onDeleteSpaceGateway: PropTypes.func,
  spaceGateway: PropTypes.shape({
    name: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    protected: PropTypes.bool,
  }).isRequired,
};

export default SpaceGatewayDelete;
