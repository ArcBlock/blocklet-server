/* eslint-disable react/no-unstable-nested-components */
import PropTypes from 'prop-types';

import Dialog from '@arcblock/ux/lib/Dialog';
import useMediaQuery from '@mui/material/useMediaQuery';
import styled from '@emotion/styled';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import { getDisplayName } from '@blocklet/meta/lib/util';

import { STORAGE_KEY_STORE_BLOCKLET, STORAGE_KEY_STORE_SERVER } from '../../../util/constants';
import { useNodeContext } from '../../../contexts/node';
import AddComponentCore from './add-component-core';

export default function AddComponentDialog({
  blocklet,
  showDialog,
  setShowDialog,
  selectedMeta = null,
  showFromUrl = true,
  installFromUrlParams = null,
}) {
  const { t } = useLocaleContext();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const { inService } = useNodeContext();

  const onClose = () => {
    setShowDialog(false);
  };

  if (!showDialog) {
    return null;
  }

  return (
    <DialogWrapper
      title={t('blocklet.component.addWithName', {
        name: getDisplayName(blocklet),
      })}
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
      // eslint-disable-next-line no-unused-vars
      onClose={(event, reason) => {
        // disable backdropClick
        if (reason === 'backdropClick') {
          return;
        }
        onClose();
      }}
      showCloseButton
      disableEscapeKeyDown
      open>
      <AddComponentCore
        selectedMeta={selectedMeta}
        onClose={onClose}
        storageKey={inService ? STORAGE_KEY_STORE_BLOCKLET : STORAGE_KEY_STORE_SERVER}
        showFromUrl={showFromUrl}
        installFromUrlParams={installFromUrlParams}
      />
    </DialogWrapper>
  );
}

AddComponentDialog.propTypes = {
  selectedMeta: PropTypes.object,
  showDialog: PropTypes.bool.isRequired,
  setShowDialog: PropTypes.func.isRequired,
  blocklet: PropTypes.object.isRequired,
  showFromUrl: PropTypes.bool,
  installFromUrlParams: PropTypes.object,
};

const DialogWrapper = styled(Dialog)`
  .ux-dialog_header {
    background-color: ${({ theme }) => theme.palette.background.paper};
  }
  .MuiDialogContent-root {
    background-color: ${({ theme }) => theme.palette.background.paper};
  }
`;
