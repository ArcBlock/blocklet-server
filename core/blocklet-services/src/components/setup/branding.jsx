import BlockletBrandingWithPermission from '@abtnode/ux/lib/blocklet/branding';
import { Box } from '@mui/material';
import PropTypes from 'prop-types';

import { BLOCKLET_CONFIGURABLE_KEY } from '@blocklet/constant';

export default function Branding({ blocklet }) {
  return (
    <Box
      sx={{
        width: '100%',
        '& .section-left': { width: 340 },
        '& .section': { gap: 3 },
      }}>
      <BlockletBrandingWithPermission
        blocklet={blocklet}
        showFields={[
          BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_NAME,
          BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_DESCRIPTION,
          BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO,
        ]}
      />
    </Box>
  );
}
Branding.propTypes = {
  blocklet: PropTypes.object.isRequired,
};
