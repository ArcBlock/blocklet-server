import { useState } from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import { Typography, Stack } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';

import { getDisplayName } from '@blocklet/meta/lib/util';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Dialog from '@arcblock/ux/lib/Dialog';

import { isInstalling } from '../../util';
import ComponentEnvironment from './environment';

export default function ComponentConfiguration({
  open = false,
  onClose = null,
  hiddenChildren = false,
  blocklet,
  ancestors = [],
  children = null,
}) {
  const [showDialog, setShowDialog] = useState(false);
  const { t } = useLocaleContext();

  const name = t('environmentFor', { name: getDisplayName(blocklet, true) });

  if (isInstalling(blocklet.status)) {
    return null;
  }

  if (blocklet.status === 'unknown' && isInstalling(blocklet.status)) {
    return null;
  }

  const handleClose = () => {
    onClose?.();
    setShowDialog(false);
  };

  const handleOpen = (e) => {
    e.stopPropagation();
    // eslint-disable-next-line no-unused-expressions
    setShowDialog(true);
  };

  let child = null;
  if (!hiddenChildren) {
    child =
      typeof children === 'function' ? (
        children({ open: handleOpen })
      ) : (
        <IconButton onClick={handleOpen} data-cy="action-config-component">
          <EditIcon />
        </IconButton>
      );
  }

  return (
    <>
      {child}
      {(open || showDialog) && (
        <StyledDialog
          open
          fullWidth
          maxWidth="md"
          title={name}
          onClose={handleClose}
          PaperProps={{ style: { minHeight: 'auto', backgroundImage: 'none' } }}>
          <Stack
            sx={{
              gap: 0,
            }}>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.5 }}>
              {t('description.environment', { name: getDisplayName(blocklet, true) })}
            </Typography>

            <ComponentEnvironment blocklet={blocklet} ancestors={ancestors} />
          </Stack>
        </StyledDialog>
      )}
    </>
  );
}

ComponentConfiguration.propTypes = {
  blocklet: PropTypes.object.isRequired,
  ancestors: PropTypes.array,
  children: PropTypes.any,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  hiddenChildren: PropTypes.bool,
};

const StyledDialog = styled(Dialog)`
  .MuiDialogContent-root {
    padding-top: 0;
    padding-bottom: 24px;
  }

  .MuiToolbar-root {
    padding-right: 0;
  }

  .ux-dialog_closeButton {
    margin: 0;
  }
`;
