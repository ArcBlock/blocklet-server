import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { IconButton, Typography } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Confirm from '@arcblock/ux/lib/Dialog/confirm';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { formatError } from '@blocklet/error';
import toast from '@arcblock/ux/lib/Toast';

/**
 * @typedef {import('../../../contexts/config-space').SpaceGateway} SpaceGateway
 */

/**
 * @param {{
 *  spaceGateway: SpaceGateway,
 *  onDeleteSpace: (spaceGateway: SpaceGateway) => Promise<void> | void
 * }} { spaceGateway, onDelete }
 * @return {React.Component}
 */
function SpaceDelete({ spaceGateway, onDeleteSpace = () => undefined }) {
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
  const handleOnDelete = async (e) => {
    try {
      e?.stopPropagation();
      setLoading(true);
      await onDeleteSpace(spaceGateway);
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
      <IconButton size="small" onClick={(e) => handleOpen(e, true)}>
        <DeleteOutlineIcon />
      </IconButton>

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
          },
        }}
        onConfirm={handleOnDelete}
        onCancel={(e) => handleOpen(e, false)}>
        <Typography sx={{ wordWrap: 'break-word' }}>
          {t('storage.spaces.gateway.delete.descForStorage', { name: `${spaceGateway?.name}` })}
        </Typography>
      </Confirm>
    </>
  );
}

SpaceDelete.propTypes = {
  onDeleteSpace: PropTypes.func,
  spaceGateway: PropTypes.shape({
    name: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    protected: PropTypes.bool,
  }).isRequired,
};

export default SpaceDelete;
