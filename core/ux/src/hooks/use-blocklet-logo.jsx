import { useMemo } from 'react';
import useBlockletLogoUrl from '@arcblock/ux/lib/hooks/use-blocklet-logo';
import useAppLogo from './use-app-logo';

export default function useBlockletLogo({ blocklet, square } = {}) {
  const { logoUrl, logoDarkUrl, rectLogoUrl, rectLogoDarkUrl } = useAppLogo({
    blocklet,
  });

  const meta = useMemo(
    () => ({
      appLogo: logoUrl,
      appLogoDark: logoDarkUrl,
      appLogoRect: rectLogoUrl,
      appLogoRectDark: rectLogoDarkUrl,
    }),
    [logoUrl, logoDarkUrl, rectLogoUrl, rectLogoDarkUrl]
  );

  return useBlockletLogoUrl({ meta, square });
}
