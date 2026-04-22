import { useContext, useEffect } from 'react';
import NotificationList from '@abtnode/ux/lib/notifications/pages';
import Box from '@mui/material/Box';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useSearchParams } from 'react-router-dom';
import { generateKey, getNotificationQueryParams } from '@abtnode/util/lib/notification-preview/util';
import { useNotificationContext } from '../../contexts/notification';

export default function NotificationsPage() {
  const context = useNotificationContext();
  const { blocklets, refresh } = context;
  const { t } = useContext(LocaleContext);
  const key = generateKey();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const storageParams = getNotificationQueryParams(key) ?? {};
    const entityId = searchParams.get('entityId');
    const severity = searchParams.get('severity');
    const queryParams = {
      ...storageParams,
      ...(severity
        ? { severity: severity === 'all' ? [] : severity.split(','), paging: { ...storageParams.paging, page: 1 } }
        : {}),
      ...(entityId ? { entityId: entityId === 'all' ? [] : entityId.split(',') } : {}),
      componentDid: [], // 兼容之前的内容，将 componentDid 设置为空数组
    };
    refresh(queryParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <h1>{t('notification.title')}</h1>
      <NotificationList tabType="line" blocklets={blocklets} context={context} filterType="entity" type="server" />
    </Box>
  );
}
