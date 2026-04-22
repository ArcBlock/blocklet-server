import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import { EVENTS } from '@abtnode/constant';
import { TeamEvents } from '@blocklet/constant';

import { useNodeContext } from '../contexts/node';
import { useSessionContext } from '../contexts/session';
import { useSubscription } from '../libs/ws';

// eslint-disable-next-line react/prop-types
export default function GlobalSubscriber() {
  const { t } = useLocaleContext();
  const { session } = useSessionContext();
  const { info: nodeInfo, refresh: refreshNode } = useNodeContext();

  // auto logout
  useSubscription(TeamEvents.userUpdated, ({ teamDid, user }) => {
    if (teamDid === nodeInfo.did) {
      if (user && !user.approved && session && session.user && session.user.did === user.did) {
        Toast.warning(t('session.blockAccess'), { autoHideDuration: 10 * 1000 });
        session.logout();
      }
    }
  });

  // refresh node info
  useSubscription(EVENTS.NOTIFICATION_CREATE, notification => {
    if (notification.entityType === 'node') {
      refreshNode({ silent: true });
    }
  });

  useSubscription(EVENTS.NODE_UPDATED, () => {
    refreshNode({ silent: true });
  });

  return null;
}
