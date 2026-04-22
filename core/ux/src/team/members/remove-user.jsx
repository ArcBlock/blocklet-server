import { useState } from 'react';
import PropTypes from 'prop-types';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import { hasActiveOwnerPassport } from '@abtnode/util/lib/passport';

import Confirm from '../../confirm';
import { useNodeContext } from '../../contexts/node';
import { useTeamContext } from '../../contexts/team';
import { useSessionContext } from '../../contexts/session';
import { formatError } from '../../util';
import { isNodeOwner, isSelf } from './util';

export default function RemoveUser({
  user = {},
  onCancel = () => {},
  onSuccess = () => {},
  onError = () => {},
  children = null,
}) {
  const { api, info: nodeInfo, inService } = useNodeContext();
  const { session } = useSessionContext();
  const { teamDid, blocklet } = useTeamContext();
  const { t } = useLocaleContext();
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const open = () => setShow(true);

  const removeUser = async (_user) => {
    const { did } = _user;
    if (loading) {
      return;
    }
    setLoading(true);
    try {
      await api.removeUser({ input: { teamDid, user: { did } } });
      setShow(false);
      onSuccess();
      Toast.success(t('team.member.removeUserSuccess'));
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      Toast.error(formatError(error));
      onError();
    } finally {
      setLoading(false);
    }
  };

  const removeConfirm = {
    title: t('team.member.removeUser'),
    description: t('team.member.removeUserDescription', { did: user.did }),
    confirm: t('common.confirm'),
    cancel: t('common.cancel'),
    onConfirm: () => {
      removeUser(user);
    },
    onCancel: () => {
      setLoading(false);
      setShow(false);
      onCancel();
    },
    color: 'error',
  };

  let can;
  if (hasActiveOwnerPassport(user, { blocklet, nodeInfo })) {
    can = false;
  } else if (!inService) {
    can = nodeInfo.nodeOwner && !isNodeOwner(nodeInfo, user.did) && !isSelf(session.user, user.did);
  } else {
    can = !isSelf(session.user, user.did);
  }

  if (!can) {
    return null;
  }

  return (
    <>
      {typeof children === 'function' ? children({ can, open }) : children}
      {show ? (
        <Confirm
          title={removeConfirm.title}
          description={removeConfirm.description}
          confirm={removeConfirm.confirm}
          cancel={removeConfirm.cancel}
          params={removeConfirm.params}
          onConfirm={removeConfirm.onConfirm}
          onCancel={removeConfirm.onCancel}
          color={removeConfirm.color}
        />
      ) : null}
    </>
  );
}

RemoveUser.propTypes = {
  user: PropTypes.object,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func,
  onError: PropTypes.func,
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
};
