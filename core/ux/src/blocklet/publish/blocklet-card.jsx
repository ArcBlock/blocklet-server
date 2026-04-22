import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { Avatar, Box, useMediaQuery } from '@mui/material';
import PropTypes from 'prop-types';
import { useState } from 'react';
import ShortenLabel from '../component/shorten-label';

function BlockletCard({ did, projectId, title, logo, describe }) {
  const uploadLogoPrefix = `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/project/${did}/${projectId}/logo/upload`;
  const logoUrl = `${uploadLogoPrefix}/${logo}`;
  const [hover, setHover] = useState(false);
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        color: hover ? 'primary.main' : 'grey.900',
        gap: 1,
      }}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}>
      <Avatar sx={{ borderRadius: 1 }} src={logoUrl} />
      <Box>
        <ShortenLabel
          hiddenTip
          maxLength="24"
          sx={{ fontSize: '14px', fontWeight: '500', color: isMobile ? 'primary.main' : '' }}>
          {title || '/'}
        </ShortenLabel>
        <ShortenLabel
          hiddenTip
          maxLength="58"
          sx={{ fontSize: '12px', color: isMobile || hover ? 'primary.main' : 'grey.700' }}>
          {describe || '/'}
        </ShortenLabel>
      </Box>
    </Box>
  );
}

BlockletCard.propTypes = {
  projectId: PropTypes.string.isRequired,
  did: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  logo: PropTypes.string.isRequired,
  describe: PropTypes.string.isRequired,
};

export default BlockletCard;
