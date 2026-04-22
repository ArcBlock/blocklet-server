import { BLOCKLET_STORE } from '@abtnode/constant';
import { useCallback, useMemo, useState } from 'react';
import { useSessionContext } from '../../../contexts/session';

const LOCAL_STORAGE_KEY = 'lastWantToConnectStoreId';

function useWantToConnectStore(blocklet) {
  const [_wantToConnectStore, _setWantToConnectStore] = useState(null);
  const { session } = useSessionContext();

  const setWantToConnectStore = useCallback(
    (x) => {
      _setWantToConnectStore(x);
      localStorage.setItem(LOCAL_STORAGE_KEY, x?.id);
    },
    [_setWantToConnectStore]
  );

  const baseStore = useMemo(() => {
    const lastStoreId = localStorage.getItem(LOCAL_STORAGE_KEY);
    const lastStore = lastStoreId ? (blocklet?.settings?.storeList || []).find((x) => x.id === lastStoreId) : null;
    if (lastStore) {
      return lastStore;
    }
    let firstStore = (blocklet?.settings?.storeList || []).find((x) => {
      if (x.id !== BLOCKLET_STORE.id) {
        return false;
      }
      if (x.scope && x.scope !== 'studio' && x.scope !== session?.user?.did) {
        return false;
      }
      return true;
    });
    if (!firstStore) {
      firstStore = blocklet?.settings?.storeList?.[0];
    }
    return firstStore;
  }, [blocklet?.settings?.storeList, session?.user?.did]);

  const wantToConnectStore = _wantToConnectStore || baseStore || {};
  return [wantToConnectStore, setWantToConnectStore];
}

export default useWantToConnectStore;
