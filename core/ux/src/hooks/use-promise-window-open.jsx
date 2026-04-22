import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import Toast from '@arcblock/ux/lib/Toast';
import { useMemoizedFn } from 'ahooks';
import { useEffect, useRef } from 'react';
import getSafeUrlWithToast from '../util/get-safe-url';

function usePromiseWindowOpen({ messageType, onOpen, onClose }) {
  const windowRef = useRef(null);
  const timer = useRef(null);
  const openWindow = async (fn) => {
    setTimeout(() => {
      try {
        onClose?.();
      } catch (error) {
        //
      }
    }, 10 * 1000);
    if (windowRef.current) {
      clearInterval(timer.current);
      windowRef.current.close();
    }
    const key = Math.random().toString(36).slice(2);
    windowRef.current = window.open(`${WELLKNOWN_SERVICE_PATH_PREFIX}/open-window?key=${key}`, '_blank');
    onOpen?.(windowRef.current);
    timer.current = setInterval(() => {
      if (!windowRef.current || windowRef.current.closed) {
        windowRef.current = null;
        clearInterval(timer.current);
        // close 之前, 需要多等待一次 project-id 的轮询
        setTimeout(() => {
          onClose?.();
        }, 1100);
      }
    }, 200);

    await Promise.resolve(
      fn(windowRef.current, (url) => {
        if (!windowRef.current) {
          localStorage.setItem(`open-window-url-${key}`, JSON.stringify({ url, time: Date.now() }));
          return;
        }
        // 由 api.connectToStore 接口获得，可以信任
        windowRef.current.location.href = getSafeUrlWithToast(url, { allowDomains: null });
      })
    );
  };

  const listen = useMemoizedFn((event) => {
    const { type, error } = event.data;
    if (windowRef.current && type === messageType && error) {
      Toast.error(error);
      onClose?.();
    }
  });

  useEffect(() => {
    window.addEventListener('message', listen);
    return () => {
      window.removeEventListener('message', listen);
    };
  }, [listen]);
  return openWindow;
}

export default usePromiseWindowOpen;
