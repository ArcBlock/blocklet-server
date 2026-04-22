import { useTheme } from '@mui/material';
import LauncherLogo from '@arcblock/icons/lib/LauncherLogo';
import LauncherLogoDark from '@arcblock/icons/lib/LauncherLogoDark';
import LauncherLogoNotext from '@arcblock/icons/lib/LauncherLogoNotext';
import useMobile from './use-mobile';

export default function useLauncherLogo({ style, ...rest } = {}) {
  const { palette } = useTheme();
  const isMobile = useMobile({ key: 'md' });

  const isDark = palette.mode === 'dark';
  const ServerLogoRect = isDark ? LauncherLogoDark : LauncherLogo;

  return !isMobile ? (
    <ServerLogoRect width="145" height="48" style={{ cursor: 'pointer', ...style }} {...rest} />
  ) : (
    <LauncherLogoNotext width="32" height="32" style={{ cursor: 'pointer', ...style }} {...rest} />
  );
}
