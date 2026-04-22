import React from 'react';
import PropTypes from 'prop-types';
import EditIcon from '@arcblock/icons/lib/EditIcon';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';

export default function InputTriggers({ triggers = [], onEnterEdit, disabled }) {
  const anchorRef = React.useRef(null);
  const [open, setOpen] = React.useState(false);

  const handleTriggerClick = (cb) => {
    setOpen(false);
    cb();
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }

    setOpen(false);
  };

  if (triggers.length === 0) {
    return (
      <IconButton data-cy="schema-form-item-edit" onClick={onEnterEdit} disabled={disabled} size="large">
        <EditIcon />
      </IconButton>
    );
  }

  return (
    <>
      <ButtonGroup variant="outlined" ref={anchorRef} aria-label="split button">
        {/* <Button data-cy="schema-form-item-edit" onClick={onEnterEdit} disabled={disabled} size="large">
          <EditIcon />
        </Button> */}
        <Button
          size="large"
          aria-controls={open ? 'split-button-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          sx={{
            paddingLeft: '12px',
            paddingRight: '12px',
          }}
          onClick={handleToggle}>
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper sx={{ zIndex: 9999 }} open={open} anchorEl={anchorRef.current} role={undefined} placement="bottom-end">
        <Paper>
          <ClickAwayListener onClickAway={handleClose}>
            <MenuList id="split-button-menu" autoFocusItem>
              {triggers.map((x) => (
                <MenuItem key={x.key} onClick={() => handleTriggerClick(x.handler)}>
                  {x.title}
                </MenuItem>
              ))}
            </MenuList>
          </ClickAwayListener>
        </Paper>
      </Popper>
    </>
  );
}

InputTriggers.propTypes = {
  triggers: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      handler: PropTypes.func.isRequired,
    })
  ),
  onEnterEdit: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
};
