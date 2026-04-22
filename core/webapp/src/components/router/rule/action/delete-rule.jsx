import { useState } from 'react';
import PropTypes from 'prop-types';

import ActionIcon from '@mui/icons-material/Delete';
import Spinner from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useRoutingContext } from '../../../../contexts/routing';

import DelConfirm from '../../../delete-confirm';

export default function DeleteRule({
  id,
  name,
  parent: { id: siteId },
  children = null,
  onActivate = () => {},
  teamDid = '',
}) {
  const { t } = useLocaleContext();
  const { actions } = useRoutingContext();
  const [loading, setLoading] = useState(false);
  const [confirmSetting, setConfirmSetting] = useState(null);

  const onCancel = () => {
    setLoading(false);
    setConfirmSetting(null);
  };

  const onConfirm = async () => {
    setLoading(true);
    await actions.deleteRule(siteId, id, teamDid);
    setLoading(false);
    setConfirmSetting(null);
  };

  const setting = {
    keyName: name,
    title: t('router.rule.delete.title'),
    description: t('router.rule.delete.description', { name: `<b>${name}</b>` }),
    confirmPlaceholder: t('router.rule.delete.confirm_desc', { name }),
    confirm: t('common.delConfirm'),
    cancel: t('router.rule.delete.cancel'),
    onConfirm,
    onCancel,
  };

  const onMenuItemClick = e => {
    e.stopPropagation();
    // eslint-disable-next-line no-unused-expressions
    setConfirmSetting(setting) || onActivate();
  };

  return (
    <>
      {typeof children === 'function' ? (
        children({ loading, open: onMenuItemClick })
      ) : (
        <MenuItem onClick={onMenuItemClick} className="rule-action" data-cy="action-delete-rule">
          {loading ? <Spinner size={16} /> : <ActionIcon style={{ fontSize: 18, marginRight: 5 }} />}
          {t('router.rule.delete.title')}
        </MenuItem>
      )}
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

DeleteRule.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  parent: PropTypes.object.isRequired,
  children: PropTypes.any,
  onActivate: PropTypes.func,
  teamDid: PropTypes.string,
};
