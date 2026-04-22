import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import { useContext, useImperativeHandle } from 'react';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useMemoizedFn, useReactive } from 'ahooks';
import Button from '@arcblock/ux/lib/Button';
import Dialog from '@arcblock/ux/lib/Dialog';
import { CircularProgress, TextField } from '@mui/material';
import { useTheme } from '@arcblock/ux/lib/Theme';
import noop from 'lodash/noop';
import isUrl from 'is-url';

import { useBlockletContext } from '../../../contexts/blocklet';
import { useNodeContext } from '../../../contexts/node';

export default function FederatedJoinDialog({ ref = null }) {
  const { t } = useContext(LocaleContext);
  const { api } = useNodeContext();
  const { blocklet } = useBlockletContext();
  const did = blocklet?.appPid;
  const theme = useTheme();
  const leavingScreen = theme?.transitions?.duration?.leavingScreen || 300;
  const state = useReactive({
    loading: false,
    show: false,
    appUrl: '',
    appUrlError: '',
    callback: noop,
  });
  const reset = useMemoizedFn(() => {
    state.appUrl = '';
    state.appUrlError = '';
    state.callback = noop;
  }, []);
  const close = useMemoizedFn(() => {
    state.show = false;
    setTimeout(() => {
      reset();
    }, leavingScreen);
  }, []);
  const open = useMemoizedFn((callback = noop) => {
    state.show = true;
    state.callback = callback;
  }, []);
  useImperativeHandle(
    ref,
    () => ({
      open,
      close,
    }),
    [open, close]
  );
  const validateAppUrl = useMemoizedFn((value) => {
    if (!value) {
      throw new Error(t('federated.federatedJoinAppUrlRequired'));
    }
    if (!isUrl(value)) {
      throw new Error(t('federated.federatedJoinAppUrlInvalid'));
    }
  });

  const confirm = useMemoizedFn(async () => {
    try {
      validateAppUrl(state.appUrl);
      state.loading = true;
      const data = await api.joinFederatedLogin({
        input: {
          did,
          appUrl: state.appUrl,
        },
      });
      state.show = false;
      close();
      state?.callback(data);
    } catch (err) {
      state.appUrlError = err.message;
    } finally {
      state.loading = false;
    }
  }, [close, did]);
  return (
    <Dialog
      open={state.show}
      title={t('federated.joinFederatedLogin')}
      onClose={close}
      PaperProps={{
        style: {
          minHeight: 'unset',
        },
      }}
      actions={
        <Button color="primary" autoFocus variant="contained" onClick={confirm} disabled={state.loading}>
          {state.loading ? <CircularProgress size={16} sx={{ mr: 1 }} color="grey" /> : null}
          {t('common.confirm')}
        </Button>
      }>
      <Box
        sx={{
          mb: 1,
        }}>
        {t('federated.joinFederatedLoginDescription')}
      </Box>
      <TextField
        fullWidth
        variant="outlined"
        margin="dense"
        placeholder={t('federated.federatedJoinAppUrl')}
        label={t('federated.federatedJoinAppUrl')}
        value={state.appUrl}
        error={!!state.appUrlError}
        helperText={state.appUrlError || 'eg: https://www.arcblock.io'}
        onChange={(e) => {
          state.appUrl = e.target.value;
        }}
      />
    </Dialog>
  );
}

FederatedJoinDialog.propTypes = {
  ref: PropTypes.any,
};
