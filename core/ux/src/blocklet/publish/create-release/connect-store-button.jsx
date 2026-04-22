import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Icon } from '@iconify/react';
import AddIcon from '@mui/icons-material/Add';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  ClickAwayListener,
  Divider,
  Grow,
  IconButton,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useRef, useState } from 'react';
import { formatError } from '@blocklet/error';

import Toast from '@arcblock/ux/lib/Toast';
import ConfirmDialog from '../../../confirm';
import { useBlockletContext } from '../../../contexts/blocklet';
import { useNodeContext } from '../../../contexts/node';
import { useSessionContext } from '../../../contexts/session';
import AddStore from '../../../store/add';
import ShortenLabel from '../../component/shorten-label';
import canDeleteStore from '../utils/can-delete-store';
import getStudioStoreList from '../utils/get-studio-store-list';

export default function ConnectStoreButton({
  blocklet = null,
  store = null,
  onChangeStore,
  onClick,
  disabled,
  loading,
  componentDid,
}) {
  const { t } = useLocaleContext();
  const { session } = useSessionContext();
  const { api, info: nodeInfo, inService } = useNodeContext();
  const blockletContext = useBlockletContext();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const [openAddStore, setOpenAddStore] = useState(false);
  const [deleteStore, setDeleteStore] = useState(null);

  const handleSelectStore = (nextStore) => {
    onChangeStore(nextStore);
    setOpen(false);
  };

  const handleToggle = () => {
    setOpen(!open);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }

    setOpen(false);
  };

  const handleOpenAddStore = () => {
    setOpenAddStore(true);
  };
  const handleCloseAddStore = () => {
    setOpenAddStore(false);
  };

  const handleDeleteStore = async () => {
    if (!deleteStore) {
      return;
    }
    try {
      await api.deleteBlockletStore({
        input: {
          teamDid: blocklet.meta.did,
          url: deleteStore.url,
          projectId: '',
          scope: deleteStore.scope || 'studio',
        },
      });
      await blockletContext?.actions?.refreshBlocklet();
    } catch (err) {
      Toast.error(`Remove Blocklet Store Error: ${formatError(err)}`);
    } finally {
      setDeleteStore(null);
    }
  };

  const { storeList } = getStudioStoreList({
    fromBlocklet: inService,
    blocklet,
    nodeInfo,
    componentDid,
    userDid: session?.user?.did,
  });
  const did = blocklet?.meta?.did;

  return (
    <>
      <ButtonGroup
        disabled={disabled}
        ref={anchorRef}
        variant="contained"
        color="primary"
        aria-label="Button group with connect store">
        <Button onClick={onClick}>
          {loading && <CircularProgress size={14} sx={{ mr: 0.5 }} />}
          {`${t('common.connect')} ${store.name || ''}`}
        </Button>
        <Button
          size="small"
          aria-controls={open ? 'split-button-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-label="select merge strategy"
          aria-haspopup="menu"
          onClick={handleToggle}>
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        sx={{
          zIndex: 10,
        }}
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-end"
        role={undefined}
        transition
        disablePortal>
        {({ TransitionProps }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: 'center top',
            }}>
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu" autoFocusItem sx={{ maxHeight: 300, overflowY: 'auto', zIndex: 10 }}>
                  {storeList?.map((option) => (
                    <MenuItem
                      key={option.url}
                      selected={option.id === store?.id}
                      sx={{ height: 56 }}
                      onClick={() => handleSelectStore(option)}>
                      <Box>
                        <ShortenLabel sx={{ fontSize: '16px' }} maxLength={24}>
                          {option.name}
                        </ShortenLabel>
                        <ShortenLabel sx={{ fontSize: '13px', opacity: 0.6 }} maxLength={30}>
                          {option.url}
                        </ShortenLabel>
                      </Box>
                      {canDeleteStore({ store: option, userDid: session?.user?.did }) && (
                        <IconButton
                          sx={{ ml: 1 }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteStore(option);
                          }}>
                          <Icon icon="ic:outline-delete" />
                        </IconButton>
                      )}
                    </MenuItem>
                  ))}
                  <Divider />
                  <MenuItem onClick={handleOpenAddStore}>
                    <AddIcon font />
                    <Typography variant="inherit">{t('store.blockletRegistry.addRegistry')}</Typography>
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
      {openAddStore && (
        <AddStore
          hiddenChildren
          open
          onClose={handleCloseAddStore}
          teamDid={did}
          storeList={storeList}
          scope="studio"
          onAdd={blockletContext?.actions?.refreshBlocklet}
        />
      )}
      {deleteStore && (
        <ConfirmDialog
          displayError
          title={`${t('common.delete')} ${deleteStore.name}`}
          description={t('blocklet.publish.deleteStoreTip', { name: deleteStore.name })}
          confirm={t('common.confirm')}
          onConfirm={handleDeleteStore}
          onCancel={() => setDeleteStore(null)}
        />
      )}
    </>
  );
}

ConnectStoreButton.propTypes = {
  store: PropTypes.object,
  blocklet: PropTypes.object,
  onChangeStore: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  disabled: PropTypes.bool.isRequired,
  componentDid: PropTypes.string.isRequired,
  projectType: PropTypes.string.isRequired,
  getData: PropTypes.func.isRequired,
};
