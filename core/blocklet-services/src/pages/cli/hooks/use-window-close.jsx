import useBrowser from '@arcblock/react-hooks/lib/useBrowser';
import { useCallback } from 'react';

function useWindowClose() {
  const browser = useBrowser();
  return useCallback(() => {
    if (browser?.wallet) {
      import('dsbridge').then((dsbridge) => {
        setTimeout(() => {
          dsbridge.call('arcClosePage');
        }, 2000);
      });
      return;
    }
    setTimeout(() => {
      window.close();
    }, 500);
  }, [browser?.wallet]);
}

export default useWindowClose;
