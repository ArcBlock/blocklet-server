import { useEffect, useMemo, lazy } from 'react';
import { WELLKNOWN_BLOCKLET_HEALTH_PATH } from '@abtnode/constant';
import axios from '@abtnode/util/lib/axios';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Result from '@arcblock/ux/lib/Result';
import { useAppInfo } from '@blocklet/ui-react/lib/Dashboard';
import { useBlockletContext } from '@abtnode/ux/lib/contexts/blocklet';
import { useSessionContext } from '@abtnode/ux/lib/contexts/session';
import { useTeamContext } from '@abtnode/ux/lib/contexts/team';
import { BlockletAdminRoles } from '@abtnode/ux/lib/util';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';
import AppContent from '../app-content';

const NotificationRecords = lazy(() => import('@abtnode/ux/lib/blocklet/notification-records'));
const NotificationSettings = lazy(() => import('@abtnode/ux/lib/blocklet/notification'));

export default function NotificationService() {
  const { t } = useLocaleContext();
  const { navItem, updateAppInfo, TabComponent } = useAppInfo();
  const { blocklet } = useBlockletContext();
  const { session } = useSessionContext();

  const { teamDid } = useTeamContext();

  const isAdmin = useMemo(() => {
    return session?.user?.role && BlockletAdminRoles.includes(session.user.role);
  }, [session]);

  // 获取最新通知(24h)
  const notificationStats = useAsyncRetry(async () => {
    const response = await axios.get(`${WELLKNOWN_BLOCKLET_HEALTH_PATH}/notification`, {
      params: { since: '24h' },
    });

    return response.data?.data;
  }, [teamDid]);

  // 获取通知设置（从 blocklet settings）
  const enabledChannels = useMemo(() => {
    const settings = blocklet?.settings?.notification || {};
    const result = [];

    result.push({ name: 'Email', icon: 'lucide:mail', enabled: settings.email?.enabled });
    result.push({ name: 'Push Kit', icon: 'lucide:bell', enabled: settings.pushKit?.enabled });
    // 先占位，未来会提供配置
    result.push({ name: 'Wallet', icon: 'lucide:wallet', enabled: true });
    result.push({ name: 'Webhook', icon: 'lucide:webhook', enabled: true });

    return result;
  }, [blocklet]);

  // 设置 app info
  useEffect(() => {
    updateAppInfo({
      name: navItem?.title || '',
      description: navItem?.description || t('navigation.websiteDesc'),
    });
  }, [navItem, t, updateAppInfo]);

  // app badges
  useEffect(() => {
    const badges = [];

    // 消息发送数量统计
    const channels = notificationStats.value?.channels || [];
    let total = 0;
    let success = 0;
    Object.values(channels).forEach((v) => {
      total += v.state?.total ?? 0;
      success += v.state?.success ?? 0;
    });

    badges.push({
      label: `${t('notification.sendStatus.success')}(24h)`,
      value: (
        <span>
          {success} / {total}
        </span>
      ),
      to: `${navItem.link}/notifications`,
    });

    // 通知方式及启用状态
    enabledChannels.forEach((channel) => {
      badges.push({
        label: channel.name,
        value: channel.enabled ? 'ON' : 'OFF',
        to: `${navItem.link}/settings`,
      });
    });

    updateAppInfo({ badges });
  }, [updateAppInfo, enabledChannels, notificationStats.value, t, navItem.link]);

  // app tabs
  const tabs = useMemo(() => {
    return [
      {
        label: t('notification.history'),
        value: 'notifications',
        render: isAdmin ? <NotificationRecords blocklet={blocklet} /> : <Result status={403} />,
      },
      {
        label: t('common.settings'),
        value: 'settings',
        render: isAdmin ? <NotificationSettings /> : <Result status={403} />,
      },
    ].filter(Boolean);
  }, [isAdmin, t, blocklet]);

  useEffect(() => {
    updateAppInfo({ tabs });
  }, [tabs, updateAppInfo]);

  return <AppContent component={TabComponent} />;
}
