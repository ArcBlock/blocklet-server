/* eslint-disable react/jsx-one-expression-per-line */
import { useImperativeHandle, useState } from 'react';
import Toast from '@arcblock/ux/lib/Toast';
import Spinner from '@mui/material/CircularProgress';
import Dialog from '@arcblock/ux/lib/Dialog';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import PropTypes from 'prop-types';
import useLocalStorage from 'react-use/lib/useLocalStorage';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Button from '@arcblock/ux/lib/Button';

import { STORAGE_KEY_STORE_SERVER } from '@abtnode/ux/lib/util/constants';
import AddBlockletRegistry from '@abtnode/ux/lib/store/add';
import StoreItem from '@abtnode/ux/lib/store/item';

import Permission from '../permission';
import { useNodeContext } from '../../contexts/node';
import { formatError } from '../../libs/util';

export default function SwitchBlockletStore({ ref = null, onChange = () => {}, onDelete = () => {} }) {
  const { info } = useNodeContext();
  const { t } = useLocaleContext();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [menuIndex, setMenuIndex] = useState(-1);
  const [currentStoreUrl, setCurrentStoreUrl] = useLocalStorage(STORAGE_KEY_STORE_SERVER);

  const selectedIndex = Math.max(
    info.blockletRegistryList.findIndex(x => x.url === currentStoreUrl),
    0
  );

  const onSelect = index => {
    try {
      setLoading(true);
      setMenuIndex(index);

      const store = info.blockletRegistryList[index];
      setCurrentStoreUrl(store.url);
      onChange(store.url);
      setOpen(false);
    } catch (err) {
      console.error(err);
      Toast.error(`${t('store.blockletRegistry.changeFailed')} ${formatError(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    setOpen,
  }));

  return (
    <>
      <Button
        sx={{ textTransform: 'none !important' }}
        color="secondary"
        data-cy="store-toggle"
        onClick={() => {
          setOpen(true);
        }}
        endIcon={<ArrowDropDownIcon />}>
        <Typography color="secondary">{info.blockletRegistryList[selectedIndex].name}</Typography>
      </Button>
      <Dialog
        title={t('store.blockletRegistry.switchRegistry')}
        disableEscapeKeyDown
        disablePortal={false}
        fullWidth
        open={open}
        onClose={() => setOpen(false)}>
        <List>
          {info.blockletRegistryList.map((x, index) => (
            <ListItem
              button
              disabled={loading}
              key={x.url}
              selected={selectedIndex === index}
              data-cy="store-switch"
              onClick={() => {
                if (loading) {
                  return;
                }

                if (index === selectedIndex) {
                  setOpen(false);
                  return;
                }

                onSelect(index);
              }}>
              {menuIndex === index && loading && (
                <ListItemIcon sx={{ minWidth: 24 }}>
                  <Spinner size={16} />
                </ListItemIcon>
              )}
              <ListItemText>
                <StoreItem teamDid={info.did} store={x} onDelete={() => onDelete(x.url)} />
              </ListItemText>
            </ListItem>
          ))}
          <Permission permission="mutate_node">
            {hasPermission => (
              <AddBlockletRegistry
                disabled={loading || !hasPermission}
                onAdd={onChange}
                teamDid={info.did}
                blockletRegistryList={info.blockletRegistryList}
              />
            )}
          </Permission>
        </List>
      </Dialog>
    </>
  );
}

SwitchBlockletStore.propTypes = {
  ref: PropTypes.any,
  onChange: PropTypes.func,
  onDelete: PropTypes.func,
};
