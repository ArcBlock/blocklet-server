import { useRef, useState } from 'react';
import { joinURL } from 'ufo';
import styled from '@emotion/styled';
import useLocalStorage from 'react-use/lib/useLocalStorage';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import { STORAGE_KEY_STORE_SERVER } from '@abtnode/ux/lib/util/constants';
import { useNodeContext } from '../../contexts/node';
import BlockletList from '../../components/blocklet/list';
import SwitchBlockletStore from '../../components/registry/switch';

export default function BlockletStore() {
  const { t } = useLocaleContext();
  const { info } = useNodeContext();
  const [defaultStoreUrl] = useLocalStorage(STORAGE_KEY_STORE_SERVER);

  const { blockletRegistryList } = info;
  const defaultStore = blockletRegistryList.find(x => defaultStoreUrl === x.url) || blockletRegistryList[0];
  const [storeUrl, setStoreUrl] = useState(defaultStore.url);

  const adminPath = process.env.NODE_ENV === 'production' ? info.routing.adminPath : '';
  const serverUrl = joinURL(window.location.origin, adminPath);
  const handleSearchSelect = ({ detailUrl }) => {
    const tmp = new URL(detailUrl);
    tmp.searchParams.set('server-url', serverUrl);
    const aEle = document.createElement('a');
    aEle.setAttribute('target', '_blank');
    aEle.setAttribute('href', tmp.href);
    aEle.click();
  };

  const switchEl = useRef(null);

  return (
    <Main>
      <Breadcrumbs separator="›" aria-label="breadcrumb" className="page-breadcrumb">
        <Typography color="textPrimary">{t('common.store')}</Typography>
        <SwitchBlockletStore
          ref={switchEl}
          onChange={url => setStoreUrl(url)}
          onDelete={url => {
            if (storeUrl === url) {
              setStoreUrl(info.blockletRegistryList[0]?.url);
            }
          }}
        />
      </Breadcrumbs>
      <Box
        className="store-header"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          p: 0,
          m: 0,
        }}>
        <Typography component="h2" variant="h4" color="textPrimary">
          {t('store.headerDescription')}
        </Typography>
      </Box>
      <BlockletList className="blocklet-list" handleSearchSelect={handleSearchSelect} storeUrl={storeUrl} />
    </Main>
  );
}

const Main = styled.main`
  .blocklet-list {
    aside:hover {
      height: calc(100vh - 235px);
    }
  }

  .blocklet-list {
    margin-top: -3px;
    .filter-bar {
      margin-top: -10px;
      padding-top: 0;
      background-color: ${props => props.theme.palette.background.default};
    }
  }
`;
