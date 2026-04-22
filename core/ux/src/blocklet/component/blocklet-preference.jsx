import { useMemo } from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Dialog from '@arcblock/ux/lib/Dialog';
import { Typography, Stack } from '@mui/material';
import { getDisplayName } from '@blocklet/meta/lib/util';
import { isInstalling } from '../../util';
import Preference from '../preferences/preference';

export default function BlockletPreferences({ open = false, onClose = null, blocklet, ancestors = [] }) {
  const { t } = useLocaleContext();

  const key = [...(ancestors || []).map((x) => x?.meta?.did || ''), blocklet?.meta?.did || '']
    .filter(Boolean)
    .join('/');

  const name = t('preferencesFor', { name: getDisplayName(blocklet, true) });

  const tabBodyStyle = useMemo(() => {
    return {
      position: 'relative',
      minHeight: '50vh',
      height: '100%',
      overflow: 'hidden',
      border: 0,
    };
  }, []);

  if (isInstalling(blocklet.status)) {
    return null;
  }

  if (blocklet.status === 'unknown' && isInstalling(blocklet.status)) {
    return null;
  }

  const handleClose = () => {
    onClose?.();
  };

  return (
    <StyledDialog
      open={open}
      fullWidth
      maxWidth="md"
      title={name}
      onClose={handleClose}
      PaperProps={{ style: { minHeight: '500px' } }}>
      <Stack
        sx={{
          gap: 1,
        }}>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.5 }}>
          {t('description.preferences', { name: getDisplayName(blocklet, true) })}
        </Typography>
        <Preference id={key} styles={tabBodyStyle} />
      </Stack>
    </StyledDialog>
  );
}

BlockletPreferences.propTypes = {
  blocklet: PropTypes.object.isRequired,
  ancestors: PropTypes.array,
  open: PropTypes.bool,
  onClose: PropTypes.func,
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
