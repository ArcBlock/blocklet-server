import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';
import { Typography } from '@mui/material';
import TipsActivity from './tips';

/**
 * 根据 activity 的类型 渲染 activity 的 meta 信息
 */

Meta.propTypes = {
  meta: PropTypes.object.isRequired,
  type: PropTypes.string.isRequired,
  hideTips: PropTypes.bool,
  sx: PropTypes.object,
};

export default function Meta({ meta, type, hideTips = false, sx = {} }) {
  if (isEmpty(meta)) {
    return null;
  }

  if (type === 'tips' && !hideTips) {
    return <TipsActivity meta={meta} />;
  }

  return (
    <Typography
      variant="subtitle2"
      component="p"
      sx={[
        {
          fontSize: 16,
          color: 'text.secondary',
          wordBreak: 'break-all',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}>
      {meta.content}
    </Typography>
  );
}
