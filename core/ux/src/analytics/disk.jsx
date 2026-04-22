import { useContext } from 'react';
import PropTypes from 'prop-types';

import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';

import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import { mergeSx } from '@arcblock/ux/lib/Util/style';

import Card from './card';
import { filesize } from '../util/index';

function BorderLinearProgress(props) {
  return (
    <LinearProgress
      {...props}
      sx={mergeSx(
        (theme) => ({
          '.MuiLinearProgress-root': {
            height: 10,
          },
          '.MuiLinearProgress-colorPrimary': {
            backgroundColor: theme.palette.grey[theme.palette.mode === 'light' ? 200 : 700],
          },
          '.MuiLinearProgress-bar': {
            backgroundColor: theme.palette.secondary.main,
          },
        }),
        // eslint-disable-next-line react/prop-types
        props.sx
      )}
    />
  );
}

function LinearProgressWithLabel(props) {
  const { value } = props;
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        mt: 2,
      }}>
      <Box
        style={{ overflow: 'hidden' }}
        sx={{
          width: '100%',
          mr: 1,
        }}>
        <BorderLinearProgress variant="determinate" {...props} />
      </Box>
      <Box
        sx={{
          minWidth: 35,
        }}>
        <Typography variant="body2" color="textSecondary">{`${Math.round(value)}%`}</Typography>
      </Box>
    </Box>
  );
}

LinearProgressWithLabel.propTypes = {
  value: PropTypes.number.isRequired,
};

export default function DiskMonitor({
  disk = {
    used: 0,
    free: 0,
    total: 1,
    device: '',
  },
}) {
  const { t } = useContext(LocaleContext);

  const metrics = [
    {
      id: 1,
      className: 'used',
      title: t('system.used'),
      metric: filesize(disk.used),
    },
    {
      id: 2,
      className: 'free',
      title: t('system.free'),
      metric: filesize(disk.free),
    },
    {
      id: 3,
      className: 'total',
      title: t('system.total'),
      metric: filesize(disk.total),
    },
  ];

  return (
    <Card
      title={`${t('common.disk')} (${disk.device})`}
      value={filesize(disk.used)}
      graph={
        <Box
          sx={{
            mt: 3,
          }}>
          <LinearProgressWithLabel value={(disk.used / disk.total) * 100} />
        </Box>
      }
      description={metrics.map((x, index) => (
        <Box key={x.title} sx={{ marginLeft: index === 0 ? 0 : 2 }}>
          {x.title}: {x.metric}
        </Box>
      ))}
    />
  );
}

DiskMonitor.propTypes = {
  disk: PropTypes.shape({
    used: PropTypes.number,
    free: PropTypes.number,
    total: PropTypes.number,
    device: PropTypes.string,
  }),
};
