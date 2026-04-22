import BaseButton from '@arcblock/ux/lib/Button';
import PropTypes from 'prop-types';

export default function Button({ children, ...props }) {
  return (
    <BaseButton variant="contained" color="primary" {...props}>
      {children}
    </BaseButton>
  );
}

Button.propTypes = {
  children: PropTypes.any.isRequired,
};
