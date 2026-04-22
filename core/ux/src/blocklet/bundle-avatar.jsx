import PropTypes from 'prop-types';
import Avatar from '@mui/material/Avatar';
import DiDAvatar from '@arcblock/did-connect-react/lib/Avatar';
import useBundleLogo from '../hooks/use-bundle-logo';
import { useNodeContext } from '../contexts/node';

export default function BlockletAvatar({ blocklet, style = {}, size = 40, ancestors = [], ...rest }) {
  const node = useNodeContext();
  const { logoUrl, inService } = useBundleLogo({ blocklet, ancestors });
  const { variant } = rest;

  const setFallBackUrl = inService
    ? () => {}
    : (ev) => {
        ev.target.src = `${node.imgPrefix}/blocklet.png`;
      };

  let imgEle = <img src={logoUrl} onError={setFallBackUrl} alt={blocklet.meta.name} style={{ width: size }} />;

  if (!blocklet.meta.logo) {
    imgEle = <DiDAvatar did={blocklet.meta.did || ''} responsive />;
  }

  return (
    <Avatar
      variant={variant || 'square'}
      style={Object.assign({ backgroundColor: 'transparent', width: size, height: size, borderRadius: 10 }, style)}
      {...rest}>
      {imgEle}
    </Avatar>
  );
}

BlockletAvatar.propTypes = {
  blocklet: PropTypes.object.isRequired,
  style: PropTypes.object,
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  ancestors: PropTypes.array,
};
