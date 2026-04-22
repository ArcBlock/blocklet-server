import { useState } from 'react';
import PropTypes from 'prop-types';
import Spinner from '@mui/material/CircularProgress';
import Dialog from '@arcblock/ux/lib/Dialog';
import DialogContentText from '@mui/material/DialogContentText';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import ListItem from '@mui/material/ListItem';
import AddIcon from '@mui/icons-material/Add';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Button from '@arcblock/ux/lib/Button';
import Alert from '@mui/material/Alert';

import { useNodeContext } from '../contexts/node';
import { formatError, isNewStoreUrl } from '../util';

export default function AddStore({
  disabled = false,
  storeList = [],
  teamDid,
  onAdd = () => {},
  scope = '',
  hiddenChildren = false,
  open = false,
  onClose = () => {},
}) {
  const { api } = useNodeContext();
  const [loading, setLoading] = useState(false);
  const [disable, setDisable] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const { t } = useLocaleContext();

  const onConfirm = async () => {
    setLoading(true);
    try {
      const { decoded } = isNewStoreUrl(url, storeList);

      await api.addBlockletStore({ input: { teamDid, url: decoded, scope } });

      onAdd(decoded);

      setIsOpen(false);
      onClose();
    } catch (err) {
      const errMsg = `${t('store.blockletRegistry.addFailed')} ${formatError(err)}`;
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  return (
    <>
      {!hiddenChildren && (
        <ListItem
          button
          disabled={disabled}
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 1,
          }}
          onClick={() => {
            setIsOpen(true);
          }}>
          <AddIcon font />
          <Typography variant="inherit">{t('store.blockletRegistry.addRegistry')}</Typography>
        </ListItem>
      )}
      <Dialog
        title={t('store.blockletRegistry.addRegistry')}
        fullWidth
        maxWidth="md"
        open={open || isOpen}
        onClose={handleClose}
        PaperProps={{ style: { minHeight: 'auto' } }}
        actions={
          <>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              color="inherit">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onConfirm();
              }}
              color="primary"
              data-cy="install-blocklet-next-step"
              disabled={loading || !url || disable}
              variant="contained"
              autoFocus>
              {loading && <Spinner size={16} />}
              {t('common.confirm')}
            </Button>
          </>
        }>
        <div style={{ paddingTop: 12, overflowY: 'hidden' }}>
          <DialogContentText component="div">
            <Typography component="div">
              <TextField
                label={t('store.blockletRegistry.registryUrl')}
                autoComplete="off"
                variant="outlined"
                name="url"
                data-cy="add-blocklet-store-url"
                fullWidth
                value={url}
                onChange={(e) => {
                  setError(null);
                  let isDisabled = false;
                  if (!e.target.value.trim()) {
                    isDisabled = true;
                  }
                  if (!e.target.value.trim()) {
                    setError(t('store.blockletRegistry.registryUrlEmpty'));
                  }
                  setUrl(e.target.value);
                  setDisable(isDisabled);
                }}
                disabled={loading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!e.target.value.trim()) {
                      setError(t('store.blockletRegistry.registryUrlEmpty'));
                    } else {
                      onConfirm();
                    }
                  }
                }}
              />
            </Typography>
          </DialogContentText>
        </div>
        {!!error && (
          <Alert severity="error" style={{ width: '100%' }}>
            {error}
          </Alert>
        )}
      </Dialog>
    </>
  );
}

AddStore.propTypes = {
  teamDid: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  storeList: PropTypes.array,
  onAdd: PropTypes.func,
  scope: PropTypes.string,
  hiddenChildren: PropTypes.bool,
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
