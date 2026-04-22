import { useEffect, useMemo, lazy } from 'react';
import { useAppInfo } from '@blocklet/ui-react/lib/Dashboard';
import { useBlockletContext } from '@abtnode/ux/lib/contexts/blocklet';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import AppContent from '../app-content';

const BlockletDomains = lazy(() => import('@abtnode/ux/lib/blocklet/domains'));
const Branding = lazy(() => import('@abtnode/ux/lib/blocklet/branding'));
const Appearance = lazy(() => import('@abtnode/ux/lib/blocklet/appearance'));
const BlockletConfigNavigation = lazy(() => import('@abtnode/ux/lib/blocklet/config-navigation'));

export default function WebsiteService() {
  const { t } = useLocaleContext();
  const { navItem, updateAppInfo, TabComponent } = useAppInfo();
  const {
    blocklet,
    actions: { refreshBlocklet },
  } = useBlockletContext();

  // 计算域名相关数据
  const domainInfo = useMemo(() => {
    if (!blocklet) return null;

    const domains = blocklet?.site?.domainAliases || [];
    const domainCount = domains.length;

    return {
      domainCount,
    };
  }, [blocklet]);

  const themeName = useMemo(() => {
    return blocklet?.settings?.theme?.name ?? 'Default';
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
    const { domainCount = 0 } = domainInfo;

    // Domain 数量
    badges.push({
      variant: 'number',
      label: t('common.domains'),
      value: domainCount,
      to: `${navItem.link}/domains`,
    });

    // 当前 Theme 名称
    badges.push({
      label: t('common.theme'),
      value: themeName,
      to: `${navItem.link}/theming`,
    });

    updateAppInfo({ badges });
  }, [updateAppInfo, domainInfo, themeName, t, navItem.link]);

  // app tabs
  const tabs = useMemo(() => {
    return [
      { label: t('common.domains'), value: 'domains', render: BlockletDomains },
      {
        label: t('common.branding'),
        value: 'branding',
        render: <Branding blocklet={blocklet} onUpdate={refreshBlocklet} />,
      },
      { label: t('common.theming'), value: 'theming', render: <Appearance /> },
      { label: t('common.navigation'), value: 'navigation', render: BlockletConfigNavigation },
    ];
  }, [t, blocklet, refreshBlocklet]);

  useEffect(() => {
    updateAppInfo({ tabs });
  }, [tabs, updateAppInfo]);

  return <AppContent component={TabComponent} />;
}
