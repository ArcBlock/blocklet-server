import PropTypes from 'prop-types';
import Avatar from '@mui/material/Avatar';
import useBlockletLogo from '../hooks/use-blocklet-logo';

export default function BlockletAppAvatar({ blocklet, style = {}, size = 40, ...rest }) {
  const logoUrl = useBlockletLogo({ blocklet, square: true });
  const { variant } = rest;

  return (
    <Avatar
      variant={variant || 'square'}
      style={Object.assign({ backgroundColor: 'transparent', width: size, height: size, borderRadius: 10 }, style)}
      {...rest}>
      <img src={logoUrl} alt="" style={{ width: size }} />
    </Avatar>
  );
}

BlockletAppAvatar.propTypes = {
  blocklet: PropTypes.object.isRequired,
  style: PropTypes.object,
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};
