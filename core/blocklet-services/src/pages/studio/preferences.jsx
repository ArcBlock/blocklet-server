import { joinURL } from 'ufo';
import Iframe from 'react-iframe';

import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';

import StudioLayout from '../../components/layout/studio';

export default function StudioPreferences() {
  const searchParams = new URLSearchParams();
  searchParams.set('title', 'Preference Builder');
  searchParams.set(
    'schemaKey',
    joinURL(window.location.origin, WELLKNOWN_SERVICE_PATH_PREFIX, '/api/studio/preferences')
  );
  const configUrl = `${joinURL(
    window.location.origin,
    WELLKNOWN_SERVICE_PATH_PREFIX,
    '/hosted/form-builder/'
  )}?${searchParams.toString()}`;

  return (
    <StudioLayout>
      <Iframe url={configUrl} width="100%" height="100%" frameBorder={0} styles={{ border: 0 }} />
    </StudioLayout>
  );
}
