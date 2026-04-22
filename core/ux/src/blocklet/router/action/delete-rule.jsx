import { useState } from 'react';
import PropTypes from 'prop-types';

import ActionIcon from '@mui/icons-material/Delete';
import Spinner from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import Toast from '@arcblock/ux/lib/Toast';
import { useNodeContext } from '../../../contexts/node';
import { useBlockletContext } from '../../../contexts/blocklet';
import DelConfirm from '../../../delete-confirm';

export default function DeleteRule({ id: ruleId, from, children = null }) {
  const { t } = useLocaleContext();
  const { api } = useNodeContext();
  const { blocklet } = useBlockletContext();
  const [loading, setLoading] = useState(false);
  const [confirmSetting, setConfirmSetting] = useState(null);

  const teamDid = blocklet.meta.did;
  const siteId = blocklet.site.id;
  const name = from.pathPrefix;

  const onCancel = () => {
    setLoading(false);
    setConfirmSetting(null);
  };

  const onConfirm = async () => {
    setLoading(true);
    try {
      await api.deleteRoutingRule({ input: { id: siteId, ruleId, teamDid } });
    } catch (error) {
      Toast.error(error.message);
    } finally {
      setConfirmSetting(null);
      setLoading(false);
    }
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

  const onMenuItemClick = (e) => {
    e.stopPropagation();
    setConfirmSetting(setting);
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
  from: PropTypes.object.isRequired,
  children: PropTypes.any,
};
