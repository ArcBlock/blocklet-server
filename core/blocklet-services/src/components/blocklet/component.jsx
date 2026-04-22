import PropTypes from 'prop-types';
import { joinURL } from 'ufo';

import Components from '@abtnode/ux/lib/blocklet/component';

export default function BlockletComponent({ blocklet, ...props }) {
  const getComponentUrl = (mountPoint) => `${joinURL(window.location.origin, mountPoint)}`;

  return <Components blocklet={blocklet} getComponentUrl={getComponentUrl} {...props} />;
}

BlockletComponent.propTypes = {
  blocklet: PropTypes.object.isRequired,
};
