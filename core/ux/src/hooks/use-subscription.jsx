import { useEffect } from 'react';

// eslint-disable-next-line import/prefer-default-export
export function useSubscription({ wsClient, event, cb = () => {}, deps = [] }) {
  useEffect(() => {
    // if deps has false value, do not sub
    const shouldSub = wsClient && (!deps.length || deps.every(Boolean));

    if (shouldSub) {
      wsClient.on(event, cb);
    }

    return () => {
      if (shouldSub) {
        wsClient.off(event, cb);
      }
    };
  }, deps); // eslint-disable-line
}
