/* eslint-disable react/no-unstable-nested-components */
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useContext, useImperativeHandle } from 'react';
import { useMemoizedFn, useReactive } from 'ahooks';
import Button from '@arcblock/ux/lib/Button';
import Dialog from '@arcblock/ux/lib/Dialog';
import copy from 'copy-to-clipboard';
import { useTheme } from '@arcblock/ux/lib/Theme';

import ClickToCopy from '../../../click-to-copy';

export default function FederatedInviteDialog({ ref = null }) {
  const theme = useTheme();
  const leavingScreen = theme?.transitions?.duration?.leavingScreen || 300;
  const { t } = useContext(LocaleContext);
  const state = useReactive({
    show: false,
    data: {
      link: '',
    },
  });
  const reset = useMemoizedFn(() => {
    state.data.link = '';
  }, []);
  const close = useMemoizedFn(() => {
    state.show = false;
    setTimeout(() => {
      reset();
    }, leavingScreen);
  }, []);
  const open = useMemoizedFn(({ link }) => {
    state.show = true;
    state.data.link = link;
  }, []);
  useImperativeHandle(
    ref,
    () => ({
      open,
      close,
    }),
    [open, close]
  );
  const copyAndClose = useMemoizedFn(() => {
    copy(state.data.link);
    close();
  }, [close]);
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
        <Button color="primary" autoFocus variant="contained" onClick={copyAndClose}>
          {t('common.copyAndClose')}
        </Button>
      }>
      <Box
        sx={{
          mb: 2,
        }}>
        {t('federated.inviteJoinFederatedLoginDescription')}
      </Box>
      <Box
        sx={{
          '& .copy-button': {
            display: 'none !important',
          },
        }}>
        <ClickToCopy>{state.data.link}</ClickToCopy>
      </Box>
    </Dialog>
  );
}

FederatedInviteDialog.propTypes = {
  ref: PropTypes.any,
};
