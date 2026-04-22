import { useEffect, useMemo, lazy } from 'react';
import { useAppInfo } from '@blocklet/ui-react/lib/Dashboard';
import { useNodeContext } from '@abtnode/ux/lib/contexts/node';
import { useTeamContext } from '@abtnode/ux/lib/contexts/team';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useSessionContext } from '@abtnode/ux/lib/contexts/session';
import { BlockletAdminRoles } from '@abtnode/ux/lib/util';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';
import AppContent from '../app-content';

const Webhook = lazy(() => import('@abtnode/ux/lib/blocklet/webhook'));
const AccessKey = lazy(() => import('@abtnode/ux/lib/blocklet/access-key'));
const OAuthClients = lazy(() => import('@abtnode/ux/lib/blocklet/oauth/list'));

export default function IntegrationsService() {
  const { t } = useLocaleContext();
  const { navItem, updateAppInfo, TabComponent } = useAppInfo();
  const { api } = useNodeContext();
  const { teamDid } = useTeamContext();
  const { session } = useSessionContext();

  const isAdmin = useMemo(() => {
    return session?.user?.role && BlockletAdminRoles.includes(session.user.role);
  }, [session]);

  // 获取数据
  const blockletStats = useAsyncRetry(() => api.getBlockletBaseInfo({ input: { teamDid } }), [teamDid, api]);

  // 设置 app info
  useEffect(() => {
    updateAppInfo({
      name: navItem?.title || '',
      description: navItem?.description || t('navigation.integrationsDesc'),
    });
  }, [navItem, t, updateAppInfo]);

  // app badges
  useEffect(() => {
    const badges = [];
    const { webhooks = 0, accessKeys = 0, oauthApps = 0 } = blockletStats.value?.integrations ?? {};

    // Webhooks 数量
    badges.push({
      variant: 'number',
      label: 'Webhooks',
      value: webhooks,
      to: `${navItem.link}/webhooks`,
      loading: blockletStats.loading,
    });

    // AccessKey 数量
    badges.push({
      variant: 'number',
      label: 'API Keys',
      value: accessKeys,
      to: `${navItem.link}/access-keys`,
      loading: blockletStats.loading,
    });

    // OAuth 应用数量
    badges.push({
      variant: 'number',
      label: 'OAuth Apps',
      value: oauthApps,
      to: `${navItem.link}/oauth`,
      loading: blockletStats.loading,
    });

    updateAppInfo({ badges });
  }, [updateAppInfo, blockletStats.value, blockletStats.loading, navItem.link]);

  // app tabs
  const tabs = useMemo(() => {
    return [
      isAdmin && { label: 'Webhooks', value: 'webhooks', render: <Webhook /> },
      { label: t('common.accessKeys'), value: 'access-keys', render: <AccessKey /> },
      { label: t('common.oauth'), value: 'oauth', render: <OAuthClients /> },
      // { label: t('common.mcpServers'), value: 'mcp-servers', render: <MCPServers /> },
    ].filter(Boolean);
  }, [isAdmin, t]);

  useEffect(() => {
    updateAppInfo({ tabs });
  }, [tabs, updateAppInfo]);

  return <AppContent component={TabComponent} />;
}
