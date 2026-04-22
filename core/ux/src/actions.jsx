import PropTypes from 'prop-types';
import { useState } from 'react';

import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box, Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material';

export default function Actions({ actions = [], size = 'small', ...props }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);

  const onOpen = (e) => {
    try {
      e.stopPropagation();
      e.preventDefault();
      // eslint-disable-next-line no-empty
    } catch {}
    setAnchorEl(e.currentTarget);
  };

  const onClose = (e) => {
    try {
      e.stopPropagation();
      e.preventDefault();
      // eslint-disable-next-line no-empty
    } catch {}
    setAnchorEl(null);
  };

  return (
    <Box {...props}>
      <IconButton
        aria-label="more"
        aria-controls="actions-menu"
        aria-haspopup="true"
        data-cy="actions-menu-icon"
        onClick={onOpen}
        size={size}>
        <MoreHorizIcon fontSize={size} />
      </IconButton>

      <Menu
        id="actions-menu"
        data-cy="actions-menu"
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {},
        }}>
        {actions.map((action, index) => {
          if (typeof action === 'function') {
            return action({ close: onClose });
          }
          if (action.separator) {
            // eslint-disable-next-line react/no-array-index-key
            return <Divider key={`separator-${index}`} />;
          }
          const { icon, text, render, onClick, disabled = false, tip, ...opts } = action;
          const item =
            render && typeof render === 'function' ? (
              render({ close: onClose })
            ) : (
              <MenuItem
                {...opts}
                disabled={disabled}
                dense
                onClick={async (e) => {
                  e.stopPropagation();
                  await onClick?.(e);
                  onClose();
                }}
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                data-cy={`actions-menu-${index}`}>
                <ListItemIcon style={{ minWidth: 24, marginRight: 8 }}>{icon}</ListItemIcon>
                <ListItemText primary={text} />
              </MenuItem>
            );

          return tip ? (
            <Tooltip title={tip}>
              <span>{item}</span>
            </Tooltip>
          ) : (
            item
          );
        })}
      </Menu>
    </Box>
  );
}

Actions.propTypes = {
  actions: PropTypes.array,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
};
