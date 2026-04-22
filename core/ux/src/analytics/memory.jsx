/* eslint-disable react/jsx-one-expression-per-line */
import { alpha } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { Box, useTheme } from '@mui/material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import xbytes from 'xbytes';
import { formatTime, filesize } from '../util';
import BaseChart from './base-chart';

export default function MemoryMonitor({
  instanceCount = null,
  title = '',
  total = null,
  used = null,
  history = [],
  empty = null,
  onHover = () => {},
  hoverIndex = null,
}) {
  const { t, locale } = useLocaleContext();
  const theme = useTheme();

  const showPercent = !!total;
  const available = total - used;
  const memoryPercent = showPercent ? `(${filesize(used)}, ${Math.floor((used / total) * 100)}%)` : '';

  const chartTitle = `${title || t('common.memory')} ${memoryPercent}`;
  const warningThreshold = Math.ceil(total * 0.8);

  const valueFn = (v) => xbytes(v, { short: true, iec: true });

  const metricInfos = [];
  if (instanceCount) {
    metricInfos.push({
      title: t('system.instances'),
      metric: instanceCount,
    });
  }
  if (showPercent) {
    metricInfos.push({
      title: t('system.free'),
      metric: valueFn(available),
    });
  }

  const visualMapPieces = [
    { max: warningThreshold, color: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.15 : 0.08) },
    {
      min: warningThreshold,
      max: total,
      color: alpha(theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.18 : 0.12),
    },
    { min: total, color: alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.25 : 0.18) },
  ];

  const markLineData = {
    silent: true,
    symbol: ['none', 'none'],
    data: [
      {
        yAxis: total,
        lineStyle: { color: theme.palette.error.main, type: 'dashed', width: 1.5 },
        label: {
          formatter: `${valueFn(total)}`,
          position: 'insideEndTop',
          color: theme.palette.text.secondary,
          padding: [2, 4],
          borderRadius: 2,
        },
      },
      {
        yAxis: warningThreshold,
        lineStyle: { color: theme.palette.warning.light, type: 'dashed', width: 1.5 },
        label: {
          formatter: `${valueFn(warningThreshold)}`,
          position: 'insideEndTop',
          color: theme.palette.text.secondary,
          padding: [2, 4],
          borderRadius: 2,
        },
      },
    ],
  };

  const extraInfo = (
    <>
      {metricInfos.map((x, index) => (
        <Box key={x.title} sx={{ marginLeft: index === 0 ? 0 : 1, display: 'inline-flex' }}>
          {x.title}: {x.metric}
        </Box>
      ))}
    </>
  );

  // x 轴格式化为 HH:mm
  const xAxisFormat = (date) => formatTime(Number(date), 'HH:mm', locale);

  return (
    <BaseChart
      title={chartTitle}
      total={total}
      history={history}
      valueFn={valueFn}
      xAxisFormat={xAxisFormat}
      visualMapPieces={visualMapPieces}
      markLineData={markLineData}
      extraInfo={extraInfo}
      empty={empty}
      onHover={onHover}
      hoverIndex={hoverIndex}
    />
  );
}

MemoryMonitor.propTypes = {
  title: PropTypes.string,
  instanceCount: PropTypes.number,
  total: PropTypes.number,
  used: PropTypes.number,
  history: PropTypes.array,
  empty: PropTypes.node,
  onHover: PropTypes.func,
  hoverIndex: PropTypes.number,
};
