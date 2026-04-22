import { useEffect, useMemo, lazy } from 'react';
import { useTheme } from '@mui/material';
import Badge from '@mui/material/Badge';
import { useAppInfo } from '@blocklet/ui-react/lib/Dashboard';
import { useNodeContext } from '@abtnode/ux/lib/contexts/node';
import { useBlockletContext } from '@abtnode/ux/lib/contexts/blocklet';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import BlockletActions from '@abtnode/ux/lib/blocklet/actions';
import BlockletStatus from '@abtnode/ux/lib/blocklet/status';
import { getAppMissingConfigs } from '@blocklet/meta/lib/util';
import { isInstalling } from '@abtnode/ux/lib/util';
import Toast from '@arcblock/ux/lib/Toast';
import AppContent from '../app-content';

const Overview = lazy(() => import('@abtnode/ux/lib/blocklet/overview'));
const Components = lazy(() => import('../../../components/blocklet/component'));
const Advanced = lazy(() => import('@abtnode/ux/lib/blocklet/advanced'));

export default function OverviewService() {
  const theme = useTheme();
  const { info, inService } = useNodeContext();
  const { t } = useLocaleContext();
  const { navItem, updateAppInfo, TabComponent } = useAppInfo();
  const {
    blocklet,
    actions: { refreshBlocklet },
  } = useBlockletContext();

  const missingRequiredConfigs = !blocklet || isInstalling(blocklet.status) ? [] : getAppMissingConfigs(blocklet);
  const isServerWafEnabled = Boolean(
    inService ? window.env?.gateway?.wafPolicy?.enabled : info?.routing.wafPolicy?.enabled
  );
  const blockletWafEnabled = isServerWafEnabled && (blocklet?.settings?.gateway?.wafPolicy?.enabled ?? true);

  // 设置 app info
  useEffect(() => {
    updateAppInfo({
      name: navItem?.title || '',
      description: navItem?.description || t('navigation.overviewDesc'),
    });
  }, [navItem, t, updateAppInfo]);

  // 设置 app actions
  useEffect(() => {
    const actions = blocklet ? (
      <BlockletActions
        className="page-actions"
        hasPermission
        blocklet={blocklet}
        onStart={() => {}}
        onComplete={({ error } = {}) => {
          if (error) {
            Toast.error(error.message);
          }
        }}
        variant="group"
      />
    ) : null;
    updateAppInfo({ actions });
  }, [blocklet, updateAppInfo]);

  // 设置 app badges
  useEffect(() => {
    const badges = [];

    if (blocklet) {
      badges.push(
        <BlockletStatus
          key="blocklet-status"
          data-cy="blocklet-status"
          status-blocklet-did={blocklet.meta?.did}
          status={blocklet.status}
          source={blocklet.source}
          progress={blocklet.progress}
          style={{ lineHeight: theme.spacing(3), height: theme.spacing(3) }}
        />
      );
    }

    badges.push({
      label: 'WAF',
      value: blockletWafEnabled ? 'ON' : 'OFF',
      to: `${navItem?.link}/settings`,
    });

    updateAppInfo({ badges });
  }, [blocklet, updateAppInfo, blockletWafEnabled, navItem?.link, theme]);

  // 设置 app tabs
  const tabs = useMemo(() => {
    return [
      { label: t('common.overview'), value: 'overview', render: Overview },
      {
        label: (
          <Badge data-cy="blocklet-list" color="error" variant="dot" invisible={!missingRequiredConfigs.length}>
            {t('common.components')}
          </Badge>
        ),
        labelText: t('common.components'),
        value: 'components',
        render: Components,
      },
      {
        label: t('common.globalSettings'),
        value: 'settings',
        render: <Advanced blocklet={blocklet} onUpdate={refreshBlocklet} />,
      },
    ];
  }, [t, missingRequiredConfigs.length, blocklet, refreshBlocklet]);

  useEffect(() => {
    updateAppInfo({ tabs });
  }, [tabs, updateAppInfo]);

  return <AppContent component={TabComponent} />;
}
