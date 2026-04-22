import PropTypes from 'prop-types';
import { useRef, useState } from 'react';

import { isInServerlessMode } from '@abtnode/util/lib/serverless';
import Button from '@arcblock/ux/lib/Button';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import styled from '@emotion/styled';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import uniqBy from 'lodash/uniqBy';
import useLocalStorage from 'react-use/lib/useLocalStorage';

import { useBlockletContext } from '../../contexts/blocklet';
import { useNodeContext } from '../../contexts/node';
import AddStore from '../../store/add';
import StoreItem from '../../store/item';
import { getStoreList } from '../../util';

export default function SelectStore({
  onChange = () => {},
  loading = false,
  children,
  extra = '',
  stores: customStores = [],
  storageKey = '',
}) {
  const { t } = useLocaleContext();

  const { info: nodeInfo, inService } = useNodeContext();
  const { blocklet } = useBlockletContext();
  const [open, setOpen] = useState(false);
  const storeSelectRef = useRef(null);

  const [storeUrlMem, setStoreUrlMem] = useState();
  const [storeUrlLs, setStoreUrlLs] = useLocalStorage(storageKey || 'tmp');
  const [storeUrl, setStoreUrl] = storageKey ? [storeUrlLs, setStoreUrlLs] : [storeUrlMem, setStoreUrlMem];

  const { storeList: appStoreList, teamDid } = getStoreList({ fromBlocklet: inService, blocklet, nodeInfo });

  const storeList = uniqBy([...customStores.map((x) => ({ ...x, protected: true })), ...appStoreList], 'url');

  const currentRegistry = (storeUrl && storeList.find((x) => storeUrl === x.url)) || storeList[0];

  return (
    <>
      <SelectStoreTitle>
        <Button
          ref={storeSelectRef}
          color="primary"
          data-cy="add-component-select-store"
          endIcon={<ArrowDropDownIcon color="primary" />}
          onClick={() => {
            setOpen(true);
          }}
          style={{
            padding: '0 2px',
          }}>
          <Typography color="primary">{currentRegistry.name}</Typography>
        </Button>
        {/* {t('blocklet.component.selectRegistry')} */}
        <Typography color="primary">{extra}</Typography>
      </SelectStoreTitle>
      <TextField
        id="mui-registry-select"
        select
        autoComplete="off"
        variant="outlined"
        name="did"
        helperText={t('blocklet.component.selectRegistryTip')}
        data-cy="component-registry-select"
        fullWidth
        value={currentRegistry}
        autoFocus
        onChange={(e) => {
          const newRegistry = e.target.value;
          setStoreUrl(newRegistry.url);
          onChange(newRegistry);
        }}
        style={{ display: 'none' }}
        margin="normal"
        slotProps={{
          select: {
            open,
            MenuProps: {
              anchorEl: storeSelectRef.current,
            },
            renderValue: (item) => {
              return item?.name;
            },
            onClose: () => {
              setOpen(false);
            },
          },
        }}>
        {storeList?.map((x) => {
          return (
            <MenuItem sx={{ width: '400px', maxWidth: '90vw' }} key={x.url} value={x} data-cy={x.url}>
              <StoreItem
                teamDid={teamDid}
                store={x}
                onDelete={() => {
                  if (storeUrl === x.url) {
                    setStoreUrl(storeList[0]?.url);
                  }
                }}
              />
            </MenuItem>
          );
        })}
        {!isInServerlessMode(nodeInfo) && (
          <AddStore
            disabled={loading}
            storeList={storeList}
            teamDid={teamDid}
            onAdd={(url) => {
              setStoreUrl(url);
            }}
          />
        )}
      </TextField>
      {children({ currentRegistry })}
    </>
  );
}

SelectStore.propTypes = {
  onChange: PropTypes.func,
  loading: PropTypes.bool,
  children: PropTypes.any.isRequired,
  extra: PropTypes.node,
  storageKey: PropTypes.string,
  stores: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
    })
  ),
};

const SelectStoreTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  span {
    font-size: 16px;
    color: ${(props) => props.theme.palette.text.primary};
    // font-weight: bold;
  }
`;
