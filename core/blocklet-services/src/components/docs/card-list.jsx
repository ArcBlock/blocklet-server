import { Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { mergeSx, lineClamp } from './utils';

export function CardList({ sx = {}, ...rest }) {
  const mergedSx = mergeSx({ display: 'flex', flexWrap: 'wrap', mx: -1 }, sx);
  return <Box sx={mergedSx} {...rest} />;
}

CardList.propTypes = {
  sx: PropTypes.object,
};

function CardIcon({ icon }) {
  const [error, setError] = useState(false);
  if (!icon || error) {
    return null;
  }
  if (typeof icon === 'string') {
    return <Box component="img" src={icon} alt="" sx={{ width: 1, height: 1 }} onError={() => setError(true)} />;
  }
  return icon;
}

CardIcon.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
};

export function Card({ title, desc, extra, cover, icon, to, sx }) {
  const mergedSx = mergeSx(
    {
      position: 'relative',
      flexBasis: { xs: '100%', sm: '50%', md: '33.33%', lg: '25%' },
      maxWidth: { xs: '100%', sm: '50%', md: '33.33%', lg: '25%' },
      mb: { xs: 2, md: 6 },
      px: 1,
    },
    sx
  );

  const borderRadius = 1;

  return (
    <Box sx={mergedSx}>
      <Box
        component={Link}
        to={to}
        target="_blank"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          height: 1,
          pt: 0,
          color: 'inherit',
          textDecoration: 'none',
          borderRadius,
          cursor: 'pointer',
        }}>
        <Box>
          <Box sx={{ position: 'relative' }}>
            {cover}

            {icon && (
              <Box sx={{ position: 'absolute', top: 44, left: 16, zIndex: 1, width: 56, height: 56 }}>
                <CardIcon icon={icon} />
              </Box>
            )}
          </Box>
          <Typography sx={{ mt: 1, fontSize: '1.25rem', fontWeight: 600, ...lineClamp() }}>{title}</Typography>
          {desc && (
            <Typography variant="body2" sx={{ my: 1, ...lineClamp(), color: 'text.secondary' }}>
              {desc}
            </Typography>
          )}

          {extra}
        </Box>
      </Box>
    </Box>
  );
}

Card.propTypes = {
  title: PropTypes.string.isRequired,
  desc: PropTypes.string.isRequired,
  extra: PropTypes.node.isRequired,
  cover: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  sx: PropTypes.object.isRequired,
};
