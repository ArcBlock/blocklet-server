import { useState } from 'react';
import PropTypes from 'prop-types';

import ActionIcon from '@mui/icons-material/Delete';
import Spinner from '@mui/material/CircularProgress';
import Button from '@arcblock/ux/lib/Button';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import Toast from '@arcblock/ux/lib/Toast';
import DelConfirm from '../../../delete-confirm';
import { useNodeContext } from '../../../contexts/node';
import { sleep } from '../../../util';

export default function DeleteDomainAlias({ id, domain, children = null, teamDid = '', onDelete = null }) {
  const { t } = useLocaleContext();
  const [loading, setLoading] = useState(false);
  const [confirmSetting, setConfirmSetting] = useState(null);

  const { api } = useNodeContext();

  const onCancel = () => {
    setLoading(false);
    setConfirmSetting(null);
  };

  const onConfirm = async () => {
    setLoading(true);
    try {
      await api.deleteDomainAlias({ input: { id, domainAlias: domain, teamDid } });
      onDelete?.();
      await sleep(2000);
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setConfirmSetting(null);
      setLoading(false);
    }
  };

  const setting = {
    keyName: domain,
    title: t('router.domainAlias.delete.title'),
    description: t('router.domainAlias.delete.description', { domain }),
    confirmPlaceholder: t('router.domainAlias.delete.confirmPlaceholder', { domain }),
    confirm: t('common.delete'),
    onConfirm,
    onCancel,
  };

  const onClick = (e) => {
    e.stopPropagation();
    setConfirmSetting(setting);
  };

  return (
    <>
      {typeof children === 'function' ? (
        children({ loading, open: onClick })
      ) : (
        <Button
          edge="end"
          onClick={onClick}
          size="small"
          className="rule-action"
          color="error"
          data-cy="action-delete-domain-alias">
          {loading ? <Spinner size={16} /> : <ActionIcon style={{ fontSize: 16 }} />}
          {t('common.delete')}
        </Button>
      )}

      {confirmSetting && (
        <DelConfirm
          keyName={confirmSetting.keyName}
          title={confirmSetting.title}
          description={confirmSetting.description}
          confirmPlaceholder={confirmSetting.confirmPlaceholder}
          confirm={confirmSetting.confirm}
          params={confirmSetting.params}
          onConfirm={confirmSetting.onConfirm}
          onCancel={confirmSetting.onCancel}
        />
      )}
    </>
  );
}

DeleteDomainAlias.propTypes = {
  id: PropTypes.string.isRequired,
  domain: PropTypes.string.isRequired,
  children: PropTypes.any,
  teamDid: PropTypes.string,
  onDelete: PropTypes.func,
};
