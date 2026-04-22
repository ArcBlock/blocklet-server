import PropTypes from 'prop-types';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { formatTime } from '../util';
import BaseChart from './base-chart';

export default function CpuMonitor({
  title = '',
  cpus = [],
  currentLoad = 0,
  history = [],
  empty = null,
  onHover = () => {},
  hoverIndex = null,
}) {
  const { t, locale } = useLocaleContext();
  const theme = useTheme();

  const chartTitle = `${title || t('common.cpu')} (${Math.floor(currentLoad || 0)}%)`;
  const total = 100;
  const warningThreshold = 80;
  const valueFn = (v) => `${v}%`;

  const visualMapPieces = [
    {
      max: warningThreshold,
      color: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.15 : 0.08),
    },
    {
      min: warningThreshold,
      max: 100,
      color: alpha(theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.18 : 0.12),
    },
    {
      min: 100,
      color: alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.25 : 0.18),
    },
  ];

  const markLineData = {
    silent: true,
    symbol: ['none', 'none'],
    data: [
      {
        yAxis: 100,
        lineStyle: {
          color: theme.palette.error.main,
          type: 'dashed',
          width: 1.5,
        },
        label: {
          formatter: `${valueFn(100)}`,
          position: 'insideEndTop',
          color: theme.palette.text.secondary,
          padding: [2, 4],
          borderRadius: 2,
        },
      },
      {
        yAxis: warningThreshold,
        lineStyle: {
          color: theme.palette.warning.light,
          type: 'dashed',
          width: 1.5,
        },
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

  // 额外信息：CPU核心数
  const extraInfo = <span>{`${t('system.cores')}: ${cpus?.length || 0}`}</span>;

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

CpuMonitor.propTypes = {
  title: PropTypes.string,
  cpus: PropTypes.array,
  currentLoad: PropTypes.number,
  history: PropTypes.array,
  empty: PropTypes.node,
  onHover: PropTypes.func,
  hoverIndex: PropTypes.number,
};
