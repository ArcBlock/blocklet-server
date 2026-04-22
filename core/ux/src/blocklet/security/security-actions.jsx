/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';
import { Box, IconButton, Switch, Tooltip } from '@mui/material';
import { Icon } from '@iconify/react';
import iconArrowDownwardAltRounded from '@iconify-icons/material-symbols/arrow-downward-alt-rounded';
import iconArrowUpwardAltRounded from '@iconify-icons/material-symbols/arrow-upward-alt-rounded';
import iconDeleteRounded from '@iconify-icons/material-symbols/delete-rounded';
import iconEditRounded from '@iconify-icons/material-symbols/edit-rounded';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

export default function BlockletSecurityActions({
  enabled,
  showUp = true,
  showDown = true,
  showSwitch = true,
  showDelete = true,
  showEdit = true,
  disableEdit = false,
  disableSwitch = false,
  onClickUp = () => {},
  onClickDown = () => {},
  onClickSwitch = () => {},
  onClickDelete = () => {},
  onClickEdit = () => {},
}) {
  const { t } = useLocaleContext();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }} onClick={(e) => e.stopPropagation()}>
      {showEdit ? (
        <Tooltip title={t('common.edit')}>
          <IconButton size="small" onClick={onClickEdit} color="success" disabled={disableEdit}>
            <Icon icon={iconEditRounded} fontSize={18} />
          </IconButton>
        </Tooltip>
      ) : null}
      {showDelete ? (
        <Tooltip title={t('common.delete')}>
          <IconButton size="small" onClick={onClickDelete} color="error">
            <Icon icon={iconDeleteRounded} fontSize={18} />
          </IconButton>
        </Tooltip>
      ) : null}
      {showSwitch ? (
        <Tooltip title={enabled ? t('common.enabled') : t('common.disabled')}>
          <Switch size="small" checked={enabled} onClick={onClickSwitch} disabled={disableSwitch} />
        </Tooltip>
      ) : null}
      {showUp ? (
        <Tooltip title={t('common.moveUp')}>
          <IconButton size="small" onClick={onClickUp} disabled={disableEdit}>
            <Icon icon={iconArrowUpwardAltRounded} fontSize={20} />
          </IconButton>
        </Tooltip>
      ) : null}
      {showDown ? (
        <Tooltip title={t('common.moveDown')}>
          <IconButton size="small" onClick={onClickDown} disabled={disableEdit}>
            <Icon icon={iconArrowDownwardAltRounded} fontSize={20} />
          </IconButton>
        </Tooltip>
      ) : null}
    </Box>
  );
}

BlockletSecurityActions.propTypes = {
  enabled: PropTypes.bool.isRequired,
  showUp: PropTypes.bool,
  showDown: PropTypes.bool,
  showSwitch: PropTypes.bool,
  showDelete: PropTypes.bool,
  showEdit: PropTypes.bool,
  disableEdit: PropTypes.bool,
  disableSwitch: PropTypes.bool,
  onClickUp: PropTypes.func,
  onClickDown: PropTypes.func,
  onClickSwitch: PropTypes.func,
  onClickDelete: PropTypes.func,
  onClickEdit: PropTypes.func,
};
