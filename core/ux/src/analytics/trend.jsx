/* eslint-disable react/jsx-one-expression-per-line */
import { useTheme } from '@emotion/react';
import { alpha } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import BaseChart from './base-chart';
import { formatTime } from '../util';

export default function TrendMonitor({
  title = '',
  total = 0,
  hoverIndex = null,
  onHover = () => {},
  history = [],
  valueFn = (value) => value,
}) {
  const theme = useTheme();
  const { locale } = useLocaleContext();

  const visualMapPieces = [
    { min: 0, max: total, color: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.15 : 0.08) },
    { min: total, color: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.15 : 0.08) },
  ];

  return (
    <BaseChart
      title={title}
      total={total}
      history={history}
      valueFn={valueFn}
      onHover={onHover}
      hoverIndex={hoverIndex}
      xAxisFormat={(date) => formatTime(date, 'MM-DD', locale)}
      visualMapPieces={visualMapPieces}
      markLineData={undefined}
      extraInfo={null}
    />
  );
}

TrendMonitor.propTypes = {
  title: PropTypes.string,
  total: PropTypes.number,
  history: PropTypes.array,
  valueFn: PropTypes.func,
  hoverIndex: PropTypes.number,
  onHover: PropTypes.func,
};
