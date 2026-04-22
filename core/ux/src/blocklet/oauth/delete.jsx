import PropTypes from 'prop-types';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import DelConfirm from '../../delete-confirm';

import { useNodeContext } from '../../contexts/node';
import { useTeamContext } from '../../contexts/team';

export default function DeleteOAuthClient({ clientId, clientName, onDelete = () => {}, onClose = () => {} }) {
  const { t } = useLocaleContext();
  const { api } = useNodeContext();
  const { teamDid } = useTeamContext();

  const onCancel = () => {
    onClose();
  };

  const onConfirm = async () => {
    try {
      await api.deleteOAuthClient({ input: { teamDid, clientId } });
      onDelete();
    } catch (error) {
      Toast.error(error?.message);
    } finally {
      onCancel();
    }
  };

  const confirmSetting = {
    keyName: clientName,
    title: t('oauth.client.delete.title'),
    description: t('oauth.client.delete.description', { name: `<b>${clientName}</b>` }),
    confirmPlaceholder: t('oauth.client.delete.description', { name: clientName }),
    confirm: t('common.delConfirm'),
    cancel: t('common.cancel'),
    onConfirm,
    onCancel,
  };

  return (
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
  );
}

DeleteOAuthClient.propTypes = {
  clientId: PropTypes.string.isRequired,
  clientName: PropTypes.string.isRequired,
  onDelete: PropTypes.func,
  onClose: PropTypes.func,
};
