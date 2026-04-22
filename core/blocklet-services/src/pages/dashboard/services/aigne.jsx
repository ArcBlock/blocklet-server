import { useEffect, useMemo, lazy } from 'react';
import Box from '@mui/material/Box';
import { useAppInfo } from '@blocklet/ui-react/lib/Dashboard';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import AppContent from '../app-content';

const AigneConfig = lazy(() => import('@abtnode/ux/lib/blocklet/aigne-config/config'));
const MCPServers = lazy(() => import('@abtnode/ux/lib/blocklet/mcp-servers'));

export default function AigneService() {
  const { t } = useLocaleContext();
  const { navItem, updateAppInfo, TabComponent } = useAppInfo();

  // 设置 app info
  useEffect(() => {
    const description = navItem?.description || (
      <Box
        dangerouslySetInnerHTML={{
          __html: t('navigation.aigneDesc', {
            aigneHubUrl: 'https://store.blocklet.dev/blocklets/z8ia3xzq2tMq8CRHfaXj1BTYJyYnEcHbqP8cJ',
            mcpUrl: 'https://modelcontextprotocol.io/',
          }),
        }}
      />
    );

    updateAppInfo({
      name: navItem?.title || '',
      description,
    });
  }, [navItem, t, updateAppInfo]);

  // app badges
  useEffect(() => {
    const badges = [];

    updateAppInfo({ badges });
  }, [updateAppInfo]);

  // app tabs
  const tabs = useMemo(() => {
    return [
      {
        label: t('setup.steps.aigne'),
        value: 'aigne-config',
        render: (
          <Box sx={{ maxWidth: 1536 }}>
            <AigneConfig />
          </Box>
        ),
      },
      { label: t('common.mcpServers'), value: 'mcp-servers', render: <MCPServers /> },
      // 先隐藏
      // { label: t('setup.aigne.observability'), value: 'aigne-observability', render: <AigneObservability /> },
      // { label: t('setup.aigne.playground'), value: 'aigne-playground', render: <AignePlayground /> },
    ];
  }, [t]);

  useEffect(() => {
    updateAppInfo({ tabs });
  }, [tabs, updateAppInfo]);

  return <AppContent component={TabComponent} />;
}
