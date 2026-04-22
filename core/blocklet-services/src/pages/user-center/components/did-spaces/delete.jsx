import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { IconButton } from '@mui/material';
import { DeleteOutline as DeleteOutlineIcon } from '@mui/icons-material';
import Confirm from '@arcblock/ux/lib/Dialog/confirm';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import toast from '@arcblock/ux/lib/Toast';

function SpaceDelete({ spaceGateway, onDeleteSpace }) {
  const { t } = useLocaleContext();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOpen = (e, bool) => {
    e?.stopPropagation();
    setOpen(bool);
  };

  const handleOnDelete = async (e) => {
    try {
      e?.stopPropagation();
      setLoading(true);
      await onDeleteSpace(spaceGateway);
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(`${t('userCenter.storage.spaces.gateway.delete.failed')}: ${error.message}`);
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
        onCancel={(e) => handleOpen(e, false)}
      />
    </>
  );
}

SpaceDelete.propTypes = {
  spaceGateway: PropTypes.object.isRequired,
  onDeleteSpace: PropTypes.func.isRequired,
};

export default SpaceDelete;
