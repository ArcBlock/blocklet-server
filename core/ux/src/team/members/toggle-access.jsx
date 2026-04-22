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

export default function ToggleAccess({
  user = {},
  onCancel = () => {},
  onSuccess = () => {},
  onError = () => {},
  children = null,
}) {
  const { api, info: nodeInfo, inService } = useNodeContext();
  const { session } = useSessionContext();
  const { teamDid, refresh, blocklet } = useTeamContext();
  const { t } = useLocaleContext();
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const open = () => setShow(true);

  const updateUserApproval = async (_user) => {
    const { did, approved } = _user;
    if (loading) {
      return;
    }
    setLoading(true);
    try {
      await api.updateUserApproval({
        input: {
          teamDid,
          user: {
            did,
            approved: !approved,
          },
          options: {
            includeFederated: true,
          },
        },
      });
      setShow(false);
      onSuccess();
      refresh();
    } catch (error) {
      Toast.error(formatError(error));
      onError();
    } finally {
      setLoading(false);
    }
  };

  const approveConfirm = {
    title: user.approved ? t('team.member.blockAccess') : t('team.member.allowAccess'),
    description: user.approved ? t('team.member.blockAccessDescription') : t('team.member.allowAccessDescription'),
    confirm: t('common.confirm'),
    cancel: t('common.cancel'),
    onConfirm: () => {
      updateUserApproval(user);
    },
    onCancel: () => {
      setLoading(false);
      setShow(false);
      onCancel();
    },
    color: user.approved ? 'error' : 'primary',
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
          title={approveConfirm.title}
          description={approveConfirm.description}
          confirm={approveConfirm.confirm}
          cancel={approveConfirm.cancel}
          params={approveConfirm.params}
          onConfirm={approveConfirm.onConfirm}
          onCancel={approveConfirm.onCancel}
          color={approveConfirm.color}
        />
      ) : null}
    </>
  );
}

ToggleAccess.propTypes = {
  user: PropTypes.object,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func,
  onError: PropTypes.func,
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
};
