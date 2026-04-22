import { useEffect, useMemo, lazy } from 'react';
import { APP_STRUCT_VERSION } from '@abtnode/constant';
import { filesize } from '@abtnode/ux/lib/util';
import { useAppInfo } from '@blocklet/ui-react/lib/Dashboard';
import { useBlockletContext } from '@abtnode/ux/lib/contexts/blocklet';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useNodeContext } from '@abtnode/ux/lib/contexts/node';
import { useTeamContext } from '@abtnode/ux/lib/contexts/team';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';
import AppContent from '../app-content';

const Traffic = lazy(() => import('@abtnode/ux/lib/analytics/traffic'));
const AuditLogs = lazy(() => import('@abtnode/ux/lib/blocklet/audit-logs'));
const Logs = lazy(() => import('@abtnode/ux/lib/blocklet/log'));
const Runtime = lazy(() => import('@abtnode/ux/lib/analytics/runtime'));

export default function OperationsService() {
  const { t } = useLocaleContext();
  const { navItem, updateAppInfo, TabComponent } = useAppInfo();
  const { blocklet, client, did: blockletDid } = useBlockletContext();
  const { teamDid } = useTeamContext();
  const { api } = useNodeContext();

  const did = blocklet?.meta?.did;

  // 获取数据
  const blockletStats = useAsyncRetry(() => api.getBlockletBaseInfo({ input: { teamDid } }), [teamDid, api]);

  // 设置 app info
  useEffect(() => {
    updateAppInfo({
      name: navItem?.title || '',
      description: navItem?.description || t('navigation.operationsDesc'),
    });
  }, [navItem, t, updateAppInfo]);

  // app badges
  useEffect(() => {
    const badges = [];
    const { totalRequests = 0, failedRequests = 0 } = blockletStats.value?.traffic ?? {};
    const { cpuUsage = 0, memoryUsage = 0 } = blockletStats.value?.appRuntimeInfo ?? {};

    // 访问量摘要（最近30天）
    badges.push({
      variant: 'number',
      label: t('analytics.traffic.totalRequests'),
      value: totalRequests,
      round: 0,
      to: `${navItem.link}/analytics`,
      loading: blockletStats.loading,
    });

    badges.push({
      variant: 'number',
      label: t('analytics.traffic.failedRequests'),
      value: failedRequests,
      round: 0,
      to: `${navItem.link}/analytics`,
      loading: blockletStats.loading,
    });

    // 性能摘要
    badges.push({
      label: t('blocklet.runtimeInfo.cpuUsage'),
      value: `${cpuUsage.toFixed(1)}%`,
      to: `${navItem.link}/performance`,
      loading: blockletStats.loading,
    });

    badges.push({
      label: t('blocklet.runtimeInfo.memoryUsage'),
      value: filesize(memoryUsage),
      to: `${navItem.link}/performance`,
      loading: blockletStats.loading,
    });

    updateAppInfo({ badges });
  }, [updateAppInfo, blockletStats.value, blockletStats.loading, navItem?.link, t]);

  // app tabs
  const tabs = useMemo(() => {
    return [
      blocklet?.children?.length &&
        blocklet.structVersion === APP_STRUCT_VERSION && {
          label: t('common.logs'),
          value: 'logs',
          render: Logs,
        },
      {
        label: t('common.auditLogs'),
        value: 'audit-logs',
        render: <AuditLogs scope={did} categories={['blocklet', 'team', 'security', 'certificates', 'gateway']} />,
      },
      {
        label: t('common.performance'),
        value: 'performance',
        render: <Runtime client={client} did={blockletDid} />,
      },
      {
        label: t('common.analytics'),
        value: 'analytics',
        render: <Traffic client={client} did={blockletDid} />,
      },
    ].filter(Boolean);
  }, [t, blocklet, client, blockletDid, did]);

  useEffect(() => {
    updateAppInfo({ tabs });
  }, [tabs, updateAppInfo]);

  return <AppContent component={TabComponent} />;
}
