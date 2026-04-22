import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import React, { useState } from 'react';
import ClickAwayListener from '@mui/material/ClickAwayListener';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import PropTypes from 'prop-types';
import useMobile from '../hooks/use-mobile';

function TableTip({ title, tooltipTitle, link }) {
  const { t } = useLocaleContext();
  const isMobile = useMobile();

  const [open, setOpen] = useState(false);

  const handleClick = () => setOpen((v) => !v);
  const handleClose = () => setOpen(false);

  if (isMobile) {
    return (
      <Box sx={{ color: 'text.secondary', fontSize: '14px', lineHeight: 1.5 }}>
        {title}
        <ClickAwayListener onClickAway={handleClose}>
          <span>
            <Tooltip
              open={open}
              onClose={handleClose}
              disableFocusListener
              disableHoverListener
              disableTouchListener
              title={
                <Box sx={{ fontSize: '14px', lineHeight: 1.5 }}>
                  {tooltipTitle}

                  <Box
                    sx={{ color: 'primary.main', ml: 0.5 }}
                    component="a"
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer">
                    {t('dashboard.document')}
                  </Box>
                </Box>
              }>
              <IconButton size="small" onClick={handleClick} sx={{ ml: 0.5 }}>
                <InfoOutlinedIcon fontSize="14" />
              </IconButton>
            </Tooltip>
          </span>
        </ClickAwayListener>
      </Box>
    );
  }

  return (
    <Box sx={{ color: 'text.secondary', fontSize: '14px', lineHeight: 1.5 }}>
      {title}

      <Tooltip
        enterTouchDelay={0}
        leaveTouchDelay={3000}
        title={
          <Box sx={{ fontSize: '14px', lineHeight: 1.5 }}>
            {tooltipTitle}

            <Box
              sx={{ color: 'primary.main', ml: 0.5 }}
              component="a"
              href={link}
              target="_blank"
              rel="noopener noreferrer">
              {t('dashboard.document')}
            </Box>
          </Box>
        }>
        <IconButton size="small" sx={{ ml: 0.5 }}>
          <InfoOutlinedIcon fontSize="14" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

TableTip.propTypes = {
  title: PropTypes.string.isRequired,
  tooltipTitle: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
};

export default TableTip;
