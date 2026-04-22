import PropTypes from 'prop-types';

import styled from '@emotion/styled';

import colors from '@arcblock/ux/lib/Colors';

const map = {
  warning: 'warning',
  error: 'error',
  info: 'primary',
};

const types = {
  error: {
    color: colors.error.main,
    backgroundColor: 'rgba(241, 110, 110, 0.3)',
    border: '1px solid rgba(241, 110, 110, 0.4)',
  },
  warning: {
    color: colors.warning.main,
    backgroundColor: 'rgba(222, 158, 55, 0.3)',
    border: '1px solid rgba(222, 158, 55, 0.4)',
  },
  success: {
    color: colors.success.main,
    backgroundColor: 'rgba(52, 190, 116, 0.3)',
    border: '1px solid rgba(52, 190, 116, 0.4)',
  },
  primary: {
    color: colors.primary.main,
    backgroundColor: 'rgba(55, 115, 242, 0.3)',
    border: '1px solid rgba(55, 115, 242, 0.4)',
  },
  reverse: {
    color: '#fff',
    backgroundColor: '#222',
  },
};

export default function NotificationTag({ status, ...rest }) {
  if (!status || status === 'info' || status === 'success') {
    return null;
  }
  const type = map[status];

  const styles = Object.assign({}, types[type] || types.primary, { borderRadius: 5 });

  return (
    <Span component="span" style={styles} {...rest}>
      {status}
    </Span>
  );
}

NotificationTag.propTypes = {
  status: PropTypes.string.isRequired,
};

const Span = styled('span')`
  && {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    padding: 2px 10px;
    height: 20px;
    line-height: 20px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 4px;
  }
`;
