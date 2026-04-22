import React from 'react'; // eslint-disable-line
import { Link } from 'react-router-dom';
import Button from '@arcblock/ux/lib/Button';
import { Stack } from '@mui/material';

import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';

import StudioLayout from '../../components/layout/studio';

export default function StudioHome() {
  return (
    <StudioLayout>
      <Stack
        direction="row"
        spacing={2}
        sx={{
          m: 4,
        }}>
        <Button
          component={Link}
          to={`${WELLKNOWN_SERVICE_PATH_PREFIX}/studio/preferences`}
          size="large"
          color="primary"
          variant="outlined">
          Preference Builder
        </Button>
        <Button
          component={Link}
          to={`${WELLKNOWN_SERVICE_PATH_PREFIX}/studio/branding`}
          size="large"
          color="primary"
          variant="outlined">
          Branding Images
        </Button>
        <Button
          component={Link}
          to={`${WELLKNOWN_SERVICE_PATH_PREFIX}/studio/localization`}
          size="large"
          color="primary"
          variant="outlined">
          Localization
        </Button>
      </Stack>
    </StudioLayout>
  );
}
