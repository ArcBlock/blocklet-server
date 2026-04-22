import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { joinURL } from 'ufo';
import axios from 'axios';
import useMediaQuery from '@mui/material/useMediaQuery';
import Dialog from '@arcblock/ux/lib/Dialog';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { STORAGE_KEY_STORE_RESOURCE } from '@abtnode/ux/lib/util/constants';
import AddComponentCore from '@abtnode/ux/lib/blocklet/component/add-component/add-component-core';
import { useMemoizedFn, useMount, useUnmount } from 'ahooks';

import getWsClient from '../libs/ws';
import { useBlockletContext } from '../contexts/blocklet';

export default function AddResource() {
  const { t } = useLocaleContext();
  const { blocklet } = useBlockletContext();
  const { componentDid } = useParams();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));

  const urlObj = new URL(window.location.href);
  const isDialog = urlObj.searchParams.get('mode') === 'dialog';
  const resourceType = urlObj.searchParams.get('resourceType') || '';
  const resourceDid = urlObj.searchParams.get('resourceDid') || componentDid;
  const paramsStore = urlObj.searchParams.get('store') || '';
  const showFromUrl = !(urlObj.searchParams.get('showFromUrl') === 'false');
  const showResourcesSwitch = !(urlObj.searchParams.get('showResourcesSwitch') === 'false');
  const enableRunBackground = !(urlObj.searchParams.get('enableRunBackground') === 'false');
  const showCategory = !(urlObj.searchParams.get('showCategory') === 'false');

  const did = blocklet?.meta?.did;

  const storeOrigins = paramsStore
    .split(',')
    .filter(Boolean)
    .map((x) => {
      try {
        return new URL(x.startsWith('http') ? x : `https://${x}`).origin;
      } catch (error) {
        console.error(error);
        return null;
      }
    })
    .filter(Boolean);
  const [stores, setStores] = useState(
    storeOrigins.map((origin) => ({
      url: origin,
      name: origin.replace('https://', ''),
    }))
  );
  const [selectedMeta, setSelectedMeta] = useState(null);
  const [storeUrl, setStoreUrl] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const list = await Promise.all(
          storeOrigins.map(async (origin) => {
            const url = joinURL(origin, '/api/store.json');
            const { data } = await axios.get(url);
            return {
              url: origin,
              name: data.name,
            };
          })
        );
        setStores(list || []);
      } catch (error) {
        console.error(error);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeOrigins.join(',')]);

  const onClose = () => {
    window.parent.postMessage({ event: 'resourceDialog.close', componentDid }, '*');
  };

  useEffect(() => {
    const wsClient = getWsClient();

    if (did) {
      wsClient.connect();
    }

    return () => {
      if (did && wsClient.isConnected()) {
        wsClient.disconnect();
      }
    };
  }, [did]);

  useMount(() => {
    window.parent.postMessage({ event: 'resourceDialog.loaded', componentDid }, '*');
  });

  const listener = useMemoizedFn((e) => {
    if (e.data?.event === 'resourceDialog.select' && e.data?.componentDid === componentDid) {
      setSelectedMeta(e.data.data);
      setStoreUrl(e.data.storeUrl);
    }
  });

  useMount(() => {
    window.addEventListener('message', listener);
  });
  useUnmount(() => {
    window.removeEventListener('message', listener);
  });

  const core = ({ inDialog = true } = {}) => (
    <AddComponentCore
      stores={stores}
      selectedMeta={selectedMeta}
      storeUrl={storeUrl}
      resourceType={resourceType}
      resourceDid={resourceDid}
      mode="embed"
      inDialog={inDialog}
      storageKey={STORAGE_KEY_STORE_RESOURCE(`${resourceType}+${resourceDid}`)}
      showResourcesSwitch={showResourcesSwitch}
      showFromUrl={showFromUrl}
      enableRunBackground={enableRunBackground}
      showCategory={showCategory}
    />
  );

  if (isDialog) {
    return (
      <Dialog
        className="resource-dialog"
        title={t('blocklet.publish.addResource')}
        maxWidth={false}
        fullWidth={false}
        PaperProps={{
          style: isMobile
            ? {
                width: '100%',
                height: window.innerHeight,
              }
            : {
                maxWidth: 1350,
                minWidth: 930,
                width: '80%',
              },
        }}
        onClose={(_, reason) => {
          if (reason === 'backdropClick') {
            return;
          }
          onClose();
        }}
        showCloseButton
        disableEscapeKeyDown
        open>
        {core()}
      </Dialog>
    );
  }

  return core({ inDialog: false });
}
