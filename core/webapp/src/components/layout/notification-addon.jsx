import { useCallback, useMemo } from 'react';
import Addon from '@abtnode/ux/lib/notifications/addon';
import useSnackbar from '@abtnode/ux/lib/hooks/use-snackbar';
import { EVENTS } from '@abtnode/constant';
import NotificationComponent from '@abtnode/ux/lib/notifications/notification';

import { withQuery } from 'ufo';
import { useNotificationContext } from '../../contexts/notification';
import { useBlockletsContext } from '../../contexts/blocklets';
import { useSubscription } from '../../libs/ws';

const viewAllUrl = '/notifications';

export default function NotificationAddon() {
  const { data: internalData, externalData } = useBlockletsContext();
  const context = useNotificationContext();
  const { enqueueSnackbar } = useSnackbar();

  const blocklets = useMemo(() => {
    return [].concat(internalData).concat(externalData);
  }, [internalData, externalData]);

  const getNotificationLink = useCallback(notification => {
    return withQuery(viewAllUrl, {
      id: notification.id,
      severity: notification.severity || 'all',
      entityId: notification.entityId || 'all',
    });
  }, []);

  useSubscription(EVENTS.NOTIFICATION_CREATE, notification => {
    const link = getNotificationLink(notification);
    const disableAutoHide = ['error', 'warning'].includes(notification.severity) || notification.sticky;
    enqueueSnackbar(notification.description, {
      variant: notification.severity,
      autoHideDuration: disableAutoHide ? null : 5000,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'center',
      },
      // eslint-disable-next-line react/no-unstable-nested-components
      content: key => <NotificationComponent viewAllUrl={link} keyId={key} notification={notification} />,
    });
  });

  return <Addon context={context} blocklets={blocklets} viewAllUrl={viewAllUrl} />;
}
