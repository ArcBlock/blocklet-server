/* eslint-disable react/prop-types */
import { useState } from 'react';

import ActionIcon from '@mui/icons-material/Delete';
import Spinner from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useRoutingContext, isSpecialDomain } from '../../../../contexts/routing';

import DelConfirm from '../../../delete-confirm';

export default function DeleteDomain(props) {
  const { t } = useLocaleContext();
  const { actions } = useRoutingContext();
  const [loading, setLoading] = useState(false);
  const [confirmSetting, setConfirmSetting] = useState(null);
  const { id, name } = props;

  if (isSpecialDomain(name)) {
    return null;
  }

  const onCancel = () => {
    setLoading(false);
    setConfirmSetting(null);
  };

  const onConfirm = async () => {
    setLoading(true);

    await actions.deleteSite(id);
    setLoading(false);
    setConfirmSetting(null);
  };

  const setting = {
    title: t('router.domain.delete.title'),
    description: t('router.domain.delete.description', { name: `<b>${name}</b>` }),
    confirmPlaceholder: t('router.domain.delete.confirm_desc', { name }),
    confirm: t('common.delConfirm'),
    cancel: t('common.cancel'),
    onConfirm,
    onCancel,
    keyName: name,
  };

  const onMenuItemClick = e => {
    e.stopPropagation();
    // eslint-disable-next-line no-unused-expressions
    setConfirmSetting(setting) || props.onActivate();
  };

  return (
    <>
      <MenuItem onClick={onMenuItemClick} className="rule-action" data-cy="action-delete-domain">
        {loading ? <Spinner size={16} /> : <ActionIcon style={{ fontSize: 18, marginRight: 5 }} />}
        {t('router.domain.delete.title')}
      </MenuItem>
      {confirmSetting && (
        <DelConfirm
          keyName={confirmSetting.keyName}
          title={confirmSetting.title}
          description={confirmSetting.description}
          confirmPlaceholder={confirmSetting.confirmPlaceholder}
          confirm={confirmSetting.confirm}
          cancel={confirmSetting.cancel}
          params={confirmSetting.params}
          onConfirm={confirmSetting.onConfirm}
          onCancel={confirmSetting.onCancel}
        />
      )}
    </>
  );
}
