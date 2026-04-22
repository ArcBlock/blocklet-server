import PropTypes from 'prop-types';

import Tag from '../tag';

export default function BlockletMode({ mode, ...rest }) {
  if (mode === 'development') {
    return (
      <Tag type="primary" {...rest}>
        DEV
      </Tag>
    );
  }

  return null;
}

BlockletMode.propTypes = {
  mode: PropTypes.string.isRequired,
};
