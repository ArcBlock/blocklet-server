import { createContext, useState, useContext } from 'react';
import { fromBlockletStatus, BlockletEvents } from '@blocklet/constant';
import { forEachBlockletSync, isExternalBlocklet } from '@blocklet/meta/lib/util';
import { fixBlocklet } from '@abtnode/ux/lib/blocklet/util';

import { useNodeContext } from './node';
import { useSubscription } from '../libs/ws';
import getIP from '../libs/get-ip';

const BlockletsContext = createContext({});
const { Provider, Consumer } = BlockletsContext;

const mergeBlocklets = (oldList, newList, updates) => {
  if (!updates) {
    return newList;
  }

  return oldList.map(old => {
    const d = { ...old };

    // update props in updates
    const cur = newList.find(x => x.meta.did === old.meta.did);
    if (cur) {
      updates.forEach(key => {
        d[key] = cur[key];
      });
    }

    return d;
  });
};

// eslint-disable-next-line react/prop-types
function BlockletsProvider({ children }) {
  const node = useNodeContext();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [blocklets, setInternalBlocklets] = useState([]);
  const [externalBlocklets, setExternalBlocklets] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [paging, setPaging] = useState({ total: 0 });
  const [externalPaging, setExternalPaging] = useState({ total: 0 });

  const setBlocklets = (blocklet, setFn) => {
    if (isExternalBlocklet(blocklet)) {
      setExternalBlocklets(setFn);
    } else {
      setInternalBlocklets(setFn);
    }
  };

  const MAX_RETRY = 4;

  const getBlocklets = async ({
    silent = true,
    retries = MAX_RETRY,
    updates,
    useCache = true,
    includeRuntimeInfo = false,
    // eslint-disable-next-line no-shadow
    paging = {},
    search = '',
    external = false,
    sort = {},
  } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      setError(null);
      const result = await node.api.getBlocklets({
        input: { includeRuntimeInfo, useCache, paging, search, external, sort },
      });
      const data = result.blocklets || [];
      const pagingInfo = result.paging;

      for (const blocklet of data) {
        // eslint-disable-next-line no-await-in-loop
        await fixBlocklet(blocklet, { getIP });
      }

      // If paginated query with external filter, don't split internally
      if (paging && typeof external === 'boolean') {
        if (external) {
          setExternalBlocklets(oldList => mergeBlocklets(oldList, data, updates));
          if (pagingInfo) setExternalPaging(pagingInfo);
        } else {
          setInternalBlocklets(oldList => mergeBlocklets(oldList, data, updates));
          if (pagingInfo) setPaging(pagingInfo);
        }
        setLoading(false);
        setInitialized(true);
        return { data, paging: pagingInfo };
      }

      // Legacy behavior: split by internal/external
      const internals = data.filter(x => !isExternalBlocklet(x));
      const externals = data.filter(isExternalBlocklet);

      setInternalBlocklets(oldList => mergeBlocklets(oldList, internals, updates));
      setExternalBlocklets(oldList => mergeBlocklets(oldList, externals, updates));

      // Update paging totals for legacy behavior
      if (pagingInfo) {
        setPaging({ total: pagingInfo.total || internals.length });
        setExternalPaging({ total: externals.length });
      }

      setLoading(false);

      setInitialized(true);
      return { data, paging: pagingInfo };
    } catch (err) {
      if (retries > 0) {
        setTimeout(
          () => getBlocklets({ silent, retries: retries - 1, useCache, includeRuntimeInfo, paging, search, external }),
          1000
        );
      } else {
        setLoading(false);
        setError(err);
      }
    }
    return { data: [], paging: null };
  };

  const getBlocklet = async b => {
    try {
      const { blocklet } = await node.api.getBlocklet({ input: { did: b.meta.did, attachRuntimeInfo: true } });
      await fixBlocklet(blocklet, { getIP });

      setBlocklets(blocklet, list => {
        // new blocklet
        if (!list.some(d => d.meta.did === blocklet.meta.did)) {
          return [...list, blocklet];
        }

        // existing blocklet
        return list.map(d => {
          if (d.meta.did === blocklet.meta.did) {
            return blocklet;
          }
          return d;
        });
      });
    } catch (err) {
      setError(err);
    }
  };

  const onInstallOrUpgrade = b => {
    node.refresh();
    getBlocklet(b);
  };

  // Note: Initial fetch is now controlled by the consuming page component
  // to support server-side pagination with proper paging params

  const updateBlockletStatus = blocklet => {
    const statusMap = {};
    forEachBlockletSync(blocklet, (x, { id }) => {
      statusMap[id] = fromBlockletStatus(x.status);
    });

    setBlocklets(blocklet, list =>
      list.map(d => {
        if (d.meta.did === blocklet.meta.did) {
          forEachBlockletSync(d, (b, { id }) => {
            if (statusMap[id]) {
              b.status = statusMap[id];
            }
          });
        }
        return d;
      })
    );
  };

  useSubscription(BlockletEvents.added, blocklet => {
    blocklet.status = fromBlockletStatus(blocklet.status);
    setBlocklets(blocklet, list => [...list, blocklet]);
  });

  useSubscription(BlockletEvents.removed, blocklet => {
    node.refresh();
    setBlocklets(blocklet, list => list.filter(item => item.meta.did !== blocklet.meta.did));
  });

  useSubscription(BlockletEvents.statusChange, updateBlockletStatus);

  useSubscription(BlockletEvents.installed, onInstallOrUpgrade);
  useSubscription(BlockletEvents.upgraded, onInstallOrUpgrade);

  useSubscription(BlockletEvents.updated, getBlocklet);
  useSubscription(BlockletEvents.startFailed, getBlocklet);

  const value = {
    loading,
    error,
    data: blocklets,
    externalData: externalBlocklets,
    paging,
    externalPaging,
    refresh: getBlocklets,
    initialized,
    api: node.api,
  };

  return <Provider value={{ blocklets: value }}>{children}</Provider>;
}

function useBlockletsContext() {
  const { blocklets } = useContext(BlockletsContext);
  return blocklets;
}

export { BlockletsContext, BlockletsProvider, Consumer as BlockletsConsumer, useBlockletsContext };
