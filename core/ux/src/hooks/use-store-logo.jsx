import { useTheme } from '@mui/material';
import StoreLogo from '@arcblock/icons/lib/StoreLogo';
import StoreLogoDark from '@arcblock/icons/lib/StoreLogoDark';
import StoreLogoNotext from '@arcblock/icons/lib/StoreLogoNotext';
import useMobile from './use-mobile';

export default function useStoreLogo({ style, ...rest } = {}) {
  const { palette } = useTheme();
  const isMobile = useMobile({ key: 'md' });

  const isDark = palette.mode === 'dark';
  const ServerLogoRect = isDark ? StoreLogoDark : StoreLogo;

  return !isMobile ? (
    <ServerLogoRect width="128" height="48" style={{ cursor: 'pointer', ...style }} {...rest} />
  ) : (
    <StoreLogoNotext width="32" height="32" style={{ cursor: 'pointer', ...style }} {...rest} />
  );
}
