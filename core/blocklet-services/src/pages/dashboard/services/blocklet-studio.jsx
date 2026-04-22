import { useEffect, useMemo, lazy } from 'react';
import { useAppInfo } from '@blocklet/ui-react/lib/Dashboard';
import { useNodeContext } from '@abtnode/ux/lib/contexts/node';
import { useTeamContext } from '@abtnode/ux/lib/contexts/team';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';
import AppContent from '../app-content';

const Publish = lazy(() => import('@abtnode/ux/lib/blocklet/publish'));

export default function PublishService() {
  const { t } = useLocaleContext();
  const { navItem, updateAppInfo, TabComponent } = useAppInfo();
  const { teamDid } = useTeamContext();
  const { api } = useNodeContext();

  // 获取数据
  const blockletStats = useAsyncRetry(() => api.getBlockletBaseInfo({ input: { teamDid } }), [teamDid, api]);

  // 设置 app info
  useEffect(() => {
    updateAppInfo({
      name: navItem?.title || '',
      description: navItem?.description || t('navigation.publishDesc'),
    });
  }, [navItem, t, updateAppInfo]);

  // app badges
  useEffect(() => {
    const badges = [];
    const { blocklets = 0, releases = 0 } = blockletStats.value?.studio ?? {};

    badges.push({
      variant: 'number',
      label: t('common.blocklets'),
      value: blocklets,
      round: 0,
      loading: blockletStats.loading,
    });

    badges.push({
      variant: 'number',
      label: t('common.releases'),
      value: releases,
      round: 0,
      loading: blockletStats.loading,
    });

    updateAppInfo({ badges });
  }, [updateAppInfo, blockletStats.value, blockletStats.loading, t]);

  // app tabs
  const tabs = useMemo(() => {
    return [
      {
        label: t('common.blocklets'),
        value: 'publish',
        render: <Publish />,
      },
    ];
  }, [t]);

  useEffect(() => {
    updateAppInfo({ tabs });
  }, [tabs, updateAppInfo]);

  return <AppContent component={TabComponent} />;
}
