import PropTypes from 'prop-types';

export default {
  description: PropTypes.string,
  editing: PropTypes.bool,
  onChange: PropTypes.func,
  required: PropTypes.bool,
  // eslint-disable-next-line react/no-unused-prop-types
  value: PropTypes.any,
  // eslint-disable-next-line react/no-unused-prop-types
  componentProps: PropTypes.object,
  render: PropTypes.func,
  renderFormItem: PropTypes.func,
};
