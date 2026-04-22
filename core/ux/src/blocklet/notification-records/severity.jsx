/* eslint-disable react/require-default-props */

/**
 * 消息级别
 */
import PropTypes from 'prop-types';
import Tag from '@arcblock/ux/lib/Tag';

NotificationSeverity.propTypes = {
  severity: PropTypes.oneOf(Object.values(['info', 'success', 'error', 'warning'])).isRequired,
};

const SEVERITY_MAP = {
  info: 'primary',
  success: 'success',
  error: 'error',
  warning: 'warning',
};

export default function NotificationSeverity({ severity = 'info' }) {
  return <Tag type={SEVERITY_MAP[severity]}>{severity}</Tag>;
}
