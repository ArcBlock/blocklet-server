import PropTypes from 'prop-types';
import Img from '@arcblock/ux/lib/Img';
import Avatar from '@arcblock/did-connect-react/lib/Avatar';
import defaultLogo from '../../assets/defaultLogo.png';
import { getBlockletLogoUrl } from '../../libs/util';

export default function AppLogo({ blocklet, blockletMetaUrl, storeUrl = '' }) {
  const { did, version, logo: logoPath } = blocklet.meta;

  let content;

  if (logoPath) {
    content = (
      <Img
        src={getBlockletLogoUrl({
          did,
          version,
          logoPath,
          baseUrl: storeUrl || new URL(blockletMetaUrl).origin,
        })}
        fallback={defaultLogo}
        width={64}
        size="contain"
        placeholder="application logo"
      />
    );
  } else {
    content = <Avatar did={did} size={64} />;
  }

  return content;
}

AppLogo.propTypes = {
  blocklet: PropTypes.object.isRequired,
  blockletMetaUrl: PropTypes.string.isRequired,
  storeUrl: PropTypes.string,
};
