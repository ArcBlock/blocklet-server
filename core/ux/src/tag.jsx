import PropTypes from 'prop-types';
import Tag from '@arcblock/ux/lib/Tag';

export default function Wrapped({ children, style = {}, ...rest }) {
  return (
    <Tag style={style} {...rest}>
      {children}
    </Tag>
  );
}

Wrapped.propTypes = {
  children: PropTypes.any.isRequired,
  style: PropTypes.object,
};
