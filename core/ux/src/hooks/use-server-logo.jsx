import { useTheme } from '@mui/material';
import ServerLogo from '@arcblock/icons/lib/ServerLogo';
import ServerLogoDark from '@arcblock/icons/lib/ServerLogoDark';
import ServerLogoNotext from '@arcblock/icons/lib/ServerLogoNotext';
import useMobile from './use-mobile';

export default function useServerLogo({ style, ...rest } = {}) {
  const { palette } = useTheme();
  const isMobile = useMobile({ key: 'md' });

  const isDark = palette.mode === 'dark';
  const ServerLogoRect = isDark ? ServerLogoDark : ServerLogo;

  return !isMobile ? (
    <ServerLogoRect width="128" height="48" style={{ cursor: 'pointer', ...style }} {...rest} />
  ) : (
    <ServerLogoNotext width="32" height="32" style={{ cursor: 'pointer', ...style }} {...rest} />
  );
}
