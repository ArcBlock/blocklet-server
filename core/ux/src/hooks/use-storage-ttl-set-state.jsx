import { useSetState } from 'ahooks';
import { useEffect, useCallback, useRef } from 'react';
import { getStorageWithTTL, removeStorageTTL, setStorageWithTTL } from '../util/storage-ttl';

export default function useStorageTTLSetState(
  key,
  defaultValue,
  { ttl = 1000 * 60 * 60, skipStorage = false, onUpdate = () => {} } = {}
) {
  const [state, setState] = useSetState(defaultValue);
  const historyStateRef = useRef(null);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    if (skipStorage) {
      return;
    }
    const value = getStorageWithTTL(key);
    if (value) {
      setState(value);
      historyStateRef.current = value;
    }
    onUpdateRef.current(value);
  }, [key, setState, skipStorage]);

  const wrappedSetState = useCallback(
    (patch) => {
      setState((prevState) => {
        const nextState = typeof patch === 'function' ? patch(prevState) : { ...prevState, ...patch };
        setStorageWithTTL(key, nextState, ttl, 100);
        return nextState;
      });
    },
    [key, ttl, setState]
  );

  return {
    state,
    setState: skipStorage ? setState : wrappedSetState,
    historyStateRef,
    removeStorage: () => {
      removeStorageTTL(key);
    },
  };
}
