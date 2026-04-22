import { useEffect, useRef } from 'react';
import getSafeUrlWithToast from '@abtnode/ux/lib/util/get-safe-url';

export default function OpenWindow() {
  const timer = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = `open-window-url-${params.get('key')}`;
    timer.current = setInterval(() => {
      if (Date.now() - startTimeRef.current > 10 * 1000) {
        localStorage.removeItem(key);
        clearInterval(timer.current);
        return;
      }
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const { url, time } = JSON.parse(data);
          localStorage.removeItem(key);
          if (Date.now() - time < 10 * 1000) {
            // 可能是 store url，由后端生成，可以信任，放开 allowDomains 限制
            window.location.href = getSafeUrlWithToast(url, { allowDomains: null });
          }
        } catch (error) {
          //
        }
      }
    }, 200);
    return () => clearInterval(timer.current);
  }, []);
  return <div />;
}
