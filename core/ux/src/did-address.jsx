import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Link as ExternalLink } from '@mui/material';
import DidAddress from '@arcblock/ux/lib/DID';

function WrappedDidAddress({ did, href = '', external = false, avatarProps = {}, to = '', ...rest }) {
  const content = <DidAddress did={did} {...rest} avatarProps={avatarProps} to={to} />;

  if (href) {
    if (external) {
      return (
        <ExternalLink target="_blank" href={href} underline="hover">
          {content}
        </ExternalLink>
      );
    }

    return <Link to={href}>{content}</Link>;
  }

  return content;
}

WrappedDidAddress.propTypes = {
  did: PropTypes.string.isRequired,
  to: PropTypes.string,
  href: PropTypes.string,
  avatarProps: PropTypes.object,
  external: PropTypes.bool,
};

export default WrappedDidAddress;
