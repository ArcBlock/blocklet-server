import { CopyButton } from '@arcblock/ux/lib/ClickToCopy';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Box, Stack, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import React from 'react';

export default function Copyable({ text, children = null, style = {} }) {
  const { locale } = useLocaleContext();
  return (
    <CopyButton
      showTooltip={false}
      content={text}
      locale={locale}
      style={style}
      render={({ copyButton, containerRef }) => (
        <Stack
          ref={containerRef}
          direction="row"
          sx={{
            alignItems: 'center',
            color: 'text.secondary',
          }}>
          {children || (
            <Typography
              className="copyable-text"
              component="span"
              sx={{
                mr: 0.5,
                maxWidth: 480,
                wordBreak: 'break-all',
                whiteSpace: 'break-spaces',
                minWidth: '60px',
              }}>
              {text}
            </Typography>
          )}
          <Box sx={{ height: '1em' }}>{copyButton}</Box>
        </Stack>
      )}
    />
  );
}

Copyable.propTypes = {
  text: PropTypes.string.isRequired,
  children: PropTypes.node,
  style: PropTypes.object,
};
