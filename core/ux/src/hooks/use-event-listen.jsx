import { useRef, useEffect } from 'react';

function useEventListen(key, callback) {
  // reduce rerender
  const ref = useRef(callback);

  useEffect(() => {
    const event = (e) => ref.current(e.detail);
    window.addEventListener(key, event);
    return () => window.removeEventListener(key, event);
  }, [key]);
}

export default useEventListen;
