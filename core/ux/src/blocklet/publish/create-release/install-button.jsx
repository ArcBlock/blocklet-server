import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Box, Button, ClickAwayListener, Grow, MenuItem, MenuList, Paper, Popper, Typography } from '@mui/material';
import { Icon } from '@iconify/react';
import PropTypes from 'prop-types';
import { useRef, useState } from 'react';

export default function InstallButton({ downloadUrl, installUrl, handleSetTip, isPack, disabled }) {
  const { t } = useLocaleContext();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const handleToggle = () => {
    setOpen(!open);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }

    setOpen(false);
  };

  return (
    <>
      <Button disabled={disabled} ref={anchorRef} onClick={handleToggle}>
        <Box component={Icon} sx={{ fontSize: 18 }} icon="bxs:download" />
      </Button>
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
                  {isPack && (
                    <Box
                      component="a"
                      href={installUrl}
                      target="_blank"
                      rel="noreferrer"
                      sx={{ textDecoration: 'none' }}>
                      <MenuItem sx={{ color: '#333' }}>
                        <Box component={Icon} sx={{ mr: 1 }} icon="ic:round-install-desktop" />
                        <Typography variant="inherit">{t('blocklet.publish.installToThisServer')}</Typography>
                      </MenuItem>
                    </Box>
                  )}
                  <MenuItem onClick={handleSetTip}>
                    <Box component={Icon} sx={{ mr: 1 }} icon="iconamoon:copy" />
                    <Typography variant="inherit">{t('blocklet.publish.copyInstallUrl')}</Typography>
                  </MenuItem>
                  <Box
                    component="a"
                    href={downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    sx={{ textDecoration: 'none' }}>
                    <MenuItem sx={{ color: '#333' }}>
                      <Box component={Icon} sx={{ mr: 1 }} icon="ph:download" />
                      <Typography variant="inherit">{t('common.download')}</Typography>
                    </MenuItem>
                  </Box>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
}

InstallButton.propTypes = {
  disabled: PropTypes.bool.isRequired,
  isPack: PropTypes.bool.isRequired,
  downloadUrl: PropTypes.string.isRequired,
  installUrl: PropTypes.string.isRequired,
  handleSetTip: PropTypes.func.isRequired,
};
