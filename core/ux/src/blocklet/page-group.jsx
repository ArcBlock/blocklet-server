import PropTypes from 'prop-types';

import Tag from '../tag';

export default function BlockletPageGroup({ group, ...rest }) {
  if (group) {
    return (
      <Tag type="reverse" {...rest}>
        {group}
      </Tag>
    );
  }

  return null;
}

BlockletPageGroup.propTypes = {
  group: PropTypes.string.isRequired,
};
