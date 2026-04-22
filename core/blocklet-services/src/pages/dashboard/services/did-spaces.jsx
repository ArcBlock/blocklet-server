import { useEffect, useMemo, lazy } from 'react';
import { useTheme } from '@mui/material';
import { filesize } from '@abtnode/ux/lib/util';
import { useAppInfo } from '@blocklet/ui-react/lib/Dashboard';
import DIDIcon from '@abtnode/ux/lib/component/did-icon';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { getSpaceBackupEndpoint } from '@abtnode/ux/lib/util/spaces';
import { useBlockletContext } from '@abtnode/ux/lib/contexts/blocklet';
import useBlockletWithDiskInfo from '@abtnode/ux/lib/hooks/use-bocklet-with-disk-info';
import AppContent from '../app-content';

const DIDSpaces = lazy(() => import('@abtnode/ux/lib/blocklet/did-spaces'));

export default function DidSpacesService() {
  const { palette } = useTheme();
  const { t, locale } = useLocaleContext();
  const { navItem, updateAppInfo, TabComponent } = useAppInfo();
  const { blocklet: originalBlocklet } = useBlockletContext();
  const { blocklet, loading } = useBlockletWithDiskInfo();

  // 是否链接 DID Space
  const didSpacesConnected = useMemo(() => {
    const backupEndpoint = getSpaceBackupEndpoint(originalBlocklet?.environments);
    return !!backupEndpoint;
  }, [originalBlocklet?.environments]);

  // 设置 app info
  useEffect(() => {
    const desc = t('navigation.didSpacesDesc');
    const poweredBy = t('common.poweredBy', { brand: '$placeholder' });
    const period = desc ? desc.slice(-1) : '';
    const [p1, p2] = poweredBy.split('$placeholder');

    updateAppInfo({
      name: navItem?.title || '',
      description: (
        <span>
          {desc} {p1}
          <a href={`https://www.didspaces.com/${locale}`} target="_blank" style={{ color: '#876bf4' }} rel="noreferrer">
            <DIDIcon color="#876bf4" /> Spaces
          </a>
          {p2} {period}
        </span>
      ),
    });
  }, [navItem, t, locale, updateAppInfo]);

  // app badges
  useEffect(() => {
    const badges = [];

    // 是否链接 DID Space
    badges.push({
      variant: 'state',
      value: didSpacesConnected ? t('storage.spaces.connected.tag') : t('storage.spaces.disconnected.tag'),
      color: didSpacesConnected ? 'success' : palette.text.secondary,
      loading,
    });

    // 磁盘占用空间大小
    badges.push({
      label: t('blocklet.runtimeInfo.dataStorage'),
      value: filesize(blocklet?.diskInfo?.data ?? 0),
      loading,
    });

    updateAppInfo({ badges });
  }, [updateAppInfo, didSpacesConnected, blocklet, loading, t, palette]);

  // app tabs
  const tabs = useMemo(() => {
    return [
      {
        label: t('common.backup'),
        value: 'did-spaces',
        render: <DIDSpaces navOrientation="horizontal" />,
      },
    ];
  }, [t]);

  useEffect(() => {
    updateAppInfo({ tabs });
  }, [tabs, updateAppInfo]);

  return <AppContent component={TabComponent} />;
}
