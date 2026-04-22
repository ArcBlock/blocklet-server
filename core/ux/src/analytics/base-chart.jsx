import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import ReactECharts from 'echarts-for-react';
import { Card, Typography, Box, useTheme } from '@mui/material';
import isEmpty from 'lodash/isEmpty';
import { smartInterval } from '../util/echarts';

export default function BaseChart({
  title = '',
  total = 0,
  history = [],
  valueFn = (value) => value,
  xAxisFormat = (value) => value,
  visualMapPieces = [],
  markLineData = {},
  extraInfo = null,
  empty = null,
  onHover = () => {},
  hoverIndex = null,
}) {
  const theme = useTheme();
  const chartRef = useRef(null);

  const xAxisData = useMemo(() => {
    return isEmpty(history) ? [] : history.map((x) => xAxisFormat(x.date));
  }, [history, xAxisFormat]);

  useEffect(() => {
    if (!chartRef.current) return;
    if (hoverIndex?.ref === chartRef) return;
    const chartInstance = chartRef.current.getEchartsInstance();
    const seriesIndex = hoverIndex?.seriesIndex;
    const dataIndex = xAxisData.findIndex((x) => x === hoverIndex?.dataValue);

    if (hoverIndex && dataIndex !== -1) {
      chartInstance.dispatchAction({
        type: 'showTip',
        seriesIndex,
        dataIndex,
      });
    } else {
      chartInstance.dispatchAction({ type: 'hideTip' });
      chartInstance.dispatchAction({ type: 'showTip', seriesIndex: 0, dataIndex: -1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoverIndex?.dataIndex]);

  const handleMouseLeave = useCallback(() => {
    onHover?.(null);
  }, [onHover]);

  useEffect(() => {
    if (chartRef.current) {
      const chartInstance = chartRef.current.getEchartsInstance();
      const chartDom = chartInstance.getDom();
      chartDom.addEventListener('mouseleave', handleMouseLeave);
      return () => {
        chartDom.removeEventListener('mouseleave', handleMouseLeave);
        chartInstance.dispose();
      };
    }
    return undefined;
  }, [handleMouseLeave]);

  if (isEmpty(history)) return empty || null;

  const maxValue = Math.max(...history.map((item) => item.value), total || 0, 0);

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter(params) {
        const value = params[0].data;
        const formatted = valueFn(value);
        const { seriesIndex, dataIndex } = params[0];

        onHover?.({
          seriesIndex,
          dataIndex,
          dataValue: xAxisData[dataIndex],
          ref: hoverIndex?.ref || chartRef,
        });

        return `${params[0].name}: <b>${formatted}</b>`;
      },
      backgroundColor: theme.palette.background.paper,
      borderColor: theme.palette.divider,
      textStyle: { color: theme.palette.text.primary },
      extraCssText: `box-shadow: ${theme.shadows[2]}; border-radius: 4px;`,
    },
    grid: { top: '48px', left: '16px', right: '16px', bottom: '0px', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData,
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: {
        interval: smartInterval(history.map((item) => new Date(item.date))),
      },
    },
    yAxis: {
      type: 'value',
      axisTick: { show: false },
      splitLine: { show: false },
      min: 0,
      max: maxValue,
      interval: Math.ceil(maxValue / 2),
      axisLabel: { formatter: valueFn, padding: [5, 0, 0, 0] },
    },

    visualMap: {
      show: false,
      type: 'piecewise',
      dimension: 1,
      seriesIndex: 0,
      pieces: visualMapPieces,
    },

    series: [
      {
        name: `${title} Usage`,
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: {
          color: theme.palette.primary.main,
          width: 2.5, // 仅设置线宽，颜色由visualMap控制
        },
        areaStyle: {}, // 保留空的areaStyle，颜色由visualMap控制
        itemStyle: {
          // 不设置固定颜色，让visualMap控制
        },
        emphasis: {
          disabled: true, // 禁用hover效果，确保颜色不变
        },
        data: history.map((item) => item.value),
        markLine: markLineData,
      },
    ],
  };

  return (
    <Card sx={{ p: 1, position: 'relative' }}>
      <Typography
        sx={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: 'text.secondary',
          position: 'absolute',
          top: 8,
          left: 16,
          zIndex: 10,
        }}>
        {title}
      </Typography>
      <ReactECharts
        ref={chartRef}
        option={option}
        style={{ width: '100%', height: '200px' }}
        onEvents={{ globalout: handleMouseLeave }}
      />
      {extraInfo && (
        <Box
          sx={{
            color: 'text.secondary',
            ml: 2,
            mt: 1,
            fontSize: 12,
          }}>
          {extraInfo}
        </Box>
      )}
    </Card>
  );
}

BaseChart.propTypes = {
  title: PropTypes.string,
  total: PropTypes.number,
  history: PropTypes.array,
  valueFn: PropTypes.func,
  xAxisFormat: PropTypes.func,
  visualMapPieces: PropTypes.array,
  markLineData: PropTypes.object,
  extraInfo: PropTypes.node,
  empty: PropTypes.node,
  onHover: PropTypes.func,
  hoverIndex: PropTypes.object,
};
