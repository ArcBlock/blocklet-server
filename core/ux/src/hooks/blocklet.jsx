/* eslint-disable import/prefer-default-export */
import { useState, useMemo, useEffect } from 'react';
import merge from 'lodash/merge';
import omit from 'lodash/omit';

import { BlockletEvents, fromBlockletStatus } from '@blocklet/constant';
import Toast from '@arcblock/ux/lib/Toast';
import uniqBy from 'lodash/uniqBy';
import { useBoolean } from 'ahooks';
import { toSlotDomain, getBlockletUrlParams, getBlockletUrl } from '../util';
import { fixBlocklet } from '../blocklet/util';
import { useDomainsAccessibility } from './url-evaluation';
import parseProgress from '../util/parse-progress';
import { getStorageWithTTL, removeStorageTTL, setStorageWithTTL } from '../util/storage-ttl';
import { getAppNameWithDid, getAppRuntimeInfo } from '../util/blocklet';

const parseStatusKey = (id) => `blocklet-status-${id}`;

const excludeDownloadingStatus = {
  installed: 1,
  starting: 1,
  running: 1,
  stopped: 1,
  upgrading: 1,
  restarting: 1,
  deleting: 1,
};

function rollbackSessionBlockletStatus(blocklet) {
  if (blocklet) {
    const children = blocklet.children || [];
    let isExtracting = false;
    children.forEach((item) => {
      if (item.status === 'downloading') {
        const status = getStorageWithTTL(parseStatusKey(item.meta?.bundleDid));
        item.status = status || item.status;
        if (status === 'extracting') {
          isExtracting = true;
        }
      } else if (excludeDownloadingStatus[blocklet.status]) {
        removeStorageTTL(parseStatusKey(item.meta?.bundleDid));
      }
    });
    if (isExtracting) {
      // blocklet.status = 'extracting';
    }
  }
}

/**
 *
 *
 * @export
 * @param {{
 *   did: string;
 *   client: import('@blocklet/server-js');
 *   useSubscription: (event: string, callback: (data: any) => void, deps: any[]) => void;
 *   getIP: () => string;
 *   useLocaleContext: () => { t: (key: string) => string; locale: string };
 *   disableSubscription: boolean;
 *   getOptionalComponents: boolean;
 * }} {
 *   did,
 *   client,
 *   useSubscription,
 *   getIP,
 *   useLocaleContext,
 *   disableSubscription,
 *   getOptionalComponents = false,
 * }
 * @return {*}
 */
let intervalId = null;

export function useBlocklet({
  did,
  client,
  useSubscription,
  getIP,
  useLocaleContext,
  disableSubscription,
  getOptionalComponents = false,
}) {
  const { t, locale } = useLocaleContext();

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingRuntimeInfo, setLoadingRuntimeInfo] = useState(false);
  const [loadingDiskInfo, setLoadingDiskInfo] = useState(true);
  const [connected, { setTrue: setConnected, setFalse: setDisconnected }] = useBoolean(false);

  const [blocklet, setBlocklet] = useState();
  const [runtimeHistory, setRuntimeHistory] = useState(
    /** @type {{ key: string, cpu: { date: number, value: number }[], memory: { date: number, value: number }[] }[]} */
    ([])
  );
  const [domainStatus, setDomainStatus] = useState({});

  const domainListStr = blocklet?.site?.domainAliases?.length
    ? JSON.stringify(blocklet.site.domainAliases.map((x) => x.value))
    : '';
  const domains = useMemo(() => (blocklet?.site?.domainAliases || []).map((x) => x.value), [domainListStr]); // eslint-disable-line

  const { domainsAccessibility, recommendedDomain } = useDomainsAccessibility(domains, 1000);

  const refreshRuntimeInfo = async (attachDiskInfo = false) => {
    if (attachDiskInfo) {
      setLoadingDiskInfo(true);
    } else {
      setLoadingRuntimeInfo(true);
    }
    try {
      const { blocklet: data } = await client.getBlocklet({
        input: { did, attachRuntimeInfo: true, attachDiskInfo, getOptionalComponents },
      });
      await fixBlocklet(data, { getIP });
      rollbackSessionBlockletStatus(data);
      setBlocklet(data);
    } catch (err) {
      Toast.error(err.message);
    } finally {
      if (attachDiskInfo) {
        setLoadingDiskInfo(false);
      } else {
        setLoadingRuntimeInfo(false);
      }
    }
  };

  const getRuntimeHistory = async (hours = 6) => {
    try {
      const data = await client.getBlockletRuntimeHistory({ input: { did, hours } });
      if (data) {
        const historyList = data.historyList
          .map((x) => {
            return {
              key: x.key,
              name: x.key === did ? 'App' : getAppNameWithDid(blocklet, x.key),
              appRuntimeInfo: getAppRuntimeInfo(blocklet, x.key),
              cpu: x.value.sort((a, b) => a.date - b.date).map((y) => ({ date: y.date, value: y.cpu })),
              memory: x.value.sort((a, b) => a.date - b.date).map((y) => ({ date: y.date, value: y.mem })),
            };
          })
          .sort((a, b) => {
            if (a.key === did) {
              return -1;
            }
            if (b.key === did) {
              return 1;
            }
            return a.name.localeCompare(b.name);
          });

        setRuntimeHistory(historyList);
      }
    } catch (err) {
      Toast.error(err.message);
    }
  };

  const refreshBlocklet = async ({
    showError = true,
    attachRuntimeInfo = true,
    attachDiskInfo = false,
    hours = 6,
  } = {}) => {
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { blocklet: data } = await client.getBlocklet({
        input: { did, getOptionalComponents },
      });

      if (data) {
        setBlocklet((oldBlocklet) => {
          fixBlocklet(data, { fixRuntime: 'merge-old', oldBlocklet });
          rollbackSessionBlockletStatus(data);
          return data;
        });
        setLoading(false);

        if (attachRuntimeInfo) {
          refreshRuntimeInfo(attachDiskInfo);
          getRuntimeHistory(hours);
        }
      } else {
        throw new Error(t('blocklet.notFound'));
      }
    } catch (err) {
      setLoading(false);
      setError(err);
      if (showError) {
        Toast.error(err.message);
      }
    }
  };

  const handleRefresh = (data) => {
    if (data?.meta?.did === blocklet.meta.did) {
      refreshBlocklet({ showError: false });
    }
  };

  const handleRefreshWithoutRuntime = (data) => {
    if (data?.meta?.did === blocklet.meta.did) {
      refreshBlocklet({ attachRuntimeInfo: false, showError: false });
    }
  };

  const handleProgress = (data) => {
    if (!data || data.meta?.did !== blocklet?.meta?.did) {
      return;
    }

    if (data.status === 'extracting') {
      setBlocklet((oldBlocklet) => {
        if (!oldBlocklet) {
          return oldBlocklet;
        }
        const children = oldBlocklet.children || [];
        children.forEach((x) => {
          if (x.meta?.bundleDid === data.component?.did) {
            setStorageWithTTL(parseStatusKey(x.meta?.bundleDid), data.status, 1000 * 60 * 5);
            if (x.status === 'downloading') {
              x.status = data.status;
            } else if (x.greenStatus === 'downloading') {
              x.greenStatus = data.status;
            }
          }
        });
        return {
          ...oldBlocklet,
          children,
          // status: data.status,
        };
      });
    }

    if (data.status === 'downloading' && data.total) {
      setBlocklet((oldBlocklet) => {
        if (!oldBlocklet) {
          return oldBlocklet;
        }

        // keep largest files as progress
        const children = oldBlocklet.children || [];

        let progress = oldBlocklet.progress || 0;

        children.forEach((item) => {
          if (item.meta?.bundleDid === data.component?.did) {
            item.progress = parseProgress(data.current, data.total);
            // item.status = data.status;
            if (item.progress > progress) {
              progress = item.progress;
            }
            removeStorageTTL(parseStatusKey(item.meta?.bundleDid));
          }
        });

        return {
          ...oldBlocklet,
          children,
          progress,
        };
      });
    }
  };

  const refreshDomainStatus = () => {
    if (did && domainListStr) {
      client.checkDomains({ input: { did } }).catch(console.error);
    }
  };

  const configNavigations = async (value) => {
    const { blocklet: data } = await client.configNavigations({
      input: { did, navigations: value },
    });
    setBlocklet(data);
  };

  useEffect(() => {
    if (domainListStr && !disableSubscription && connected) {
      refreshDomainStatus();
    }
  }, [domainListStr, disableSubscription, connected]); // eslint-disable-line

  const subscription = useSubscription(
    BlockletEvents.domainStatus,
    (data) => {
      setDomainStatus((pre) => ({ ...pre, [data.domain]: { ...pre[data.domain], ...data } }));
    },
    [blocklet?.meta?.did, !disableSubscription]
  );

  useEffect(() => {
    if (!subscription) return;

    intervalId = setInterval(() => {
      if (subscription.isConnected()) {
        clearInterval(intervalId);
        setConnected();
      }
    }, 500);
  }, [subscription, setConnected, setDisconnected]);

  useSubscription(
    BlockletEvents.statusChange,
    (data) => {
      if (data?.meta?.did === blocklet.meta.did) {
        setBlocklet((oldBlocklet) => {
          const newBlocklet = { ...oldBlocklet };
          newBlocklet.status = fromBlockletStatus(data.status);
          (newBlocklet.children || []).forEach((x) => {
            const y = data.children.find((z) => z.meta?.did === x.meta?.did);
            if (y) {
              if (y.status) {
                x.status = fromBlockletStatus(y.status);
              }
              if (y.greenStatus) {
                x.greenStatus = fromBlockletStatus(y.greenStatus);
              }
            }
          });
          return newBlocklet;
        });
        handleRefreshWithoutRuntime(data);
      }
    },
    [blocklet?.meta?.did, !disableSubscription]
  ); // eslint-disable-line prettier/prettier
  useSubscription(BlockletEvents.storeChange, handleRefreshWithoutRuntime, [blocklet?.meta?.did, !disableSubscription]);

  useSubscription(BlockletEvents.installed, handleRefresh, [blocklet?.meta?.did, !disableSubscription]);
  useSubscription(BlockletEvents.upgraded, handleRefresh, [blocklet?.meta?.did, !disableSubscription]);
  useSubscription(BlockletEvents.updated, handleRefresh, [blocklet?.meta?.did, !disableSubscription]);
  useSubscription(BlockletEvents.downloadBundleProgress, handleProgress, [blocklet?.meta?.did, !disableSubscription]);

  const updateBlockletDomainAliases = (data = null, action = 'add') => {
    setBlocklet((oldBlocklet) => {
      const newBlocklet = { ...oldBlocklet };

      if (data) {
        const domainAliases = oldBlocklet.site.domainAliases.findIndex((x) => x.value === data.value);
        if (domainAliases !== -1) {
          if (action === 'delete') {
            newBlocklet.site.domainAliases = oldBlocklet.site.domainAliases.filter((x) => x.value !== data.value);
          } else {
            newBlocklet.site.domainAliases[domainAliases] = data;
          }
        } else {
          newBlocklet.site.domainAliases = uniqBy([...oldBlocklet.site.domainAliases, data].filter(Boolean), 'value');
        }
      }

      return newBlocklet;
    });
  };

  const data = blocklet
    ? merge(blocklet, {
        site: {
          domainAliases: blocklet.site.domainAliases.map((x) => {
            const domain = x.value;

            const key = toSlotDomain(domain);
            const status = domainStatus[key];

            x.domainStatus = omit(status, ['domain', 'meta']);

            x.accessibility = omit(domainsAccessibility[domain], ['domain']);

            x.href = getBlockletUrl({ blocklet, domain: x, params: getBlockletUrlParams(blocklet, locale) });

            // For nft-domain-forwarding, skip CNAME check since these domains use A records
            const isForwardingDomain = x.type === 'nft-domain-forwarding';
            x.canGenerateCertificate = status?.dns?.isDnsResolved && (isForwardingDomain || status?.dns?.isCnameMatch);

            return x;
          }),
        },
      })
    : null;

  return {
    loading,
    loadingRuntimeInfo,
    loadingDiskInfo,
    error,
    blocklet: data,
    runtimeHistory,
    recommendedDomain: recommendedDomain || '',
    actions: {
      refreshBlocklet,
      refreshDomainStatus,
      setBlocklet,
      configNavigations,
      updateBlockletDomainAliases,
    },
  };
}
