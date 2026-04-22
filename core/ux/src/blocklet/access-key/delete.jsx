import PropTypes from 'prop-types';
import { format } from 'timeago.js';

import Toast from '@arcblock/ux/lib/Toast';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import { formatLocale, formatToDatetime } from '../../../lib/util';

import DelConfirm from '../../delete-confirm';

import { useNodeContext } from '../../contexts/node';
import { useTeamContext } from '../../contexts/team';

export default function DeleteAccessKey({ accessKeyId, time, remark, onDelete = () => {}, onClose = () => {} }) {
  const { t, locale } = useLocaleContext();
  const { api } = useNodeContext();
  const { teamDid } = useTeamContext();

  const onCancel = () => {
    onClose();
  };

  const onConfirm = async () => {
    try {
      await api.deleteAccessKey({ input: { teamDid, accessKeyId } });
      onDelete();
    } catch (error) {
      Toast.error(error?.message);
    } finally {
      onCancel();
    }
  };

  const descData = (v) => ({
    key: `<b>${accessKeyId}</b>`,
    name: `<b>${remark}</b>`,
    time: formatToDatetime(v, locale),
    timeAge: format(new Date(v), formatLocale(locale)),
  });

  const confirmSetting = {
    keyName: remark,
    title: t('setting.accessKey.title'),
    description: time
      ? `${t('setting.accessKey.description', descData(time))}`
      : `${t('setting.accessKey.descriptionNoTime', { key: `<b>${accessKeyId}</b>`, name: `<b>${remark}</b>` })}`,
    confirmPlaceholder: t('setting.accessKey.confirm_desc', { name: remark }),
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

DeleteAccessKey.propTypes = {
  accessKeyId: PropTypes.string.isRequired,
  time: PropTypes.string.isRequired,
  remark: PropTypes.string.isRequired,
  onDelete: PropTypes.func,
  onClose: PropTypes.func,
};
