import { useContext } from 'react';
import PropTypes from 'prop-types';

import Spinner from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';

import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import { isInProgress } from '@blocklet/meta/lib/util';
import { Box } from '@mui/material';

import Dot from '../dot';
import Tag from '../tag';

const colors = {
  yellow: '#FFCF71',
  grey: '#aaaaaa',
  reverse: '#444',
  success: '#3ab39d',
  running: '#34BE74',
  error: '#D0021B',
  primary: '#1DC1C7',
};

const colorMap = {
  added: colors.grey,
  waiting: colors.yellow,
  downloading: colors.yellow,
  extracting: colors.yellow,
  downloaded: colors.grey,
  installing: colors.yellow,
  installed: colors.grey,
  starting: colors.yellow,
  running: colors.running,
  stopping: colors.yellow,
  stopped: colors.reverse,
  error: colors.error,
  upgrading: colors.yellow,
  restarting: colors.yellow,
  corrupted: colors.error,
  deleting: colors.yellow,
  resource: colors.primary,
};

const map = {
  added: 'primary',
  waiting: 'info',
  downloading: 'info',
  extracting: 'info',
  downloaded: 'primary',
  installing: 'info',
  installed: 'primary',
  starting: 'info',
  running: 'success',
  stopping: 'warning',
  stopped: 'reverse',
  error: 'error',
  upgrading: 'info',
  restarting: 'info',
  corrupted: 'error',
  deleting: 'warning',
  resource: 'primary',
};

export { colorMap, map };

export default function BlockletStatus({
  isResource = false,
  status,
  variant = 'tag',
  progress = 0,
  tip = '',
  ...rest
}) {
  const { t } = useContext(LocaleContext);

  const inProgress = isInProgress(status);

  let statusType = isResource && status === 'stopped' ? 'resource' : status;

  // 如果是未知的，就显示为已安装
  if (!map[statusType]) {
    statusType = 'installed';
  }

  const statusTxt = t(`blocklet.status.${statusType}`);

  if (variant === 'pin') {
    return (
      <Tooltip title={t('blocklet.statusTip', { status: statusTxt })}>
        <Box
          {...rest}
          sx={[
            {
              position: 'relative',
              minHeight: 14,
              minWidth: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },
            ...(Array.isArray(rest.sx) ? rest.sx : [rest.sx]),
          ]}>
          <Box
            style={{ opacity: 0.15 }}
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              bgcolor: colorMap[statusType],
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: '55%',
              height: '55%',
              borderRadius: '50%',
              bgcolor: colorMap[statusType],
            }}
          />
        </Box>
      </Tooltip>
    );
  }

  if (variant === 'dot') {
    return (
      <Tooltip title={t('blocklet.statusTip', { status: statusTxt })}>
        <Dot color={colorMap[statusType]} {...rest} />
      </Tooltip>
    );
  }

  return (
    <Tag type={map[statusType]} {...rest}>
      {inProgress && <Spinner size={12} color="inherit" style={{ marginRight: 5 }} />}
      {statusTxt}
      {tip && <span style={{ marginLeft: 5 }}>{tip}</span>}
      {statusType === 'downloading' && progress ? <div style={{ marginLeft: 5 }}>{`${progress} %`}</div> : null}
    </Tag>
  );
}

BlockletStatus.propTypes = {
  status: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['dot', 'tag', 'pin']),
  source: PropTypes.string,
  progress: PropTypes.number,
  isResource: PropTypes.bool,
  tip: PropTypes.string,
};
