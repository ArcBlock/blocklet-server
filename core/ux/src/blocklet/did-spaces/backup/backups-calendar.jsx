import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Box, Typography, Stack, useTheme } from '@mui/material';
import React, { useMemo, useCallback, useRef } from 'react';
import dayjs from '@abtnode/util/lib/dayjs';
import ReactECharts from 'echarts-for-react';
import { useMobile } from '@blocklet/did-space-react';
import { green, orange, purple } from '@mui/material/colors';
import { useBlockletStorageContext } from '../../../contexts/blocklet-storage';

function SpacesBackupRecordsCalendar() {
  const { t } = useLocaleContext();
  const { setBackupDate, backupSummary } = useBlockletStorageContext();
  const isMobile = useMobile({ key: 'lg' });
  const chartContainerRef = useRef(null);
  const theme = useTheme();

  // 处理日期点击事件
  const handleDateClick = useCallback(
    (date) => {
      setBackupDate(date);
    },
    [setBackupDate]
  );

  // 生成热力图数据
  const calendarData = useMemo(() => {
    const endDate = dayjs().add(1, 'day');
    // 统一使用过去12个月的数据
    const startDate = endDate.subtract(1, 'year');

    // 将现有数据转换为日期-值映射
    const dataMap = new Map(
      backupSummary.map((x) => [
        x.date,
        {
          date: x.date,
          successCount: x.successCount,
          errorCount: x.errorCount,
        },
      ])
    );

    // 生成完整的日期范围并添加数据
    const data = [];
    for (let d = startDate.clone(); dayjs(d).isBefore(endDate); d = d.add(1, 'day')) {
      const date = d.format('YYYY-MM-DD');
      data.push(dataMap.get(date) || { date, successCount: 0, errorCount: 0 });
    }

    return data;
  }, [backupSummary]);

  // ECharts 配置
  const chartOption = useMemo(() => {
    const min = -12;
    const max = 12;
    const rangeSize = (max - min) / 8;

    const cellSize = 8; // 严格设置为 8x8 的单元格大小

    /** @type {import('echarts').EChartsOption} */
    const options = {
      grid: {
        containLabel: true,
        right: 10,
        top: 30,
        bottom: 12,
      },
      tooltip: {
        formatter: (params) => {
          const { date, successCount, errorCount } = calendarData[params.dataIndex] || {
            date: params.data[0],
            successCount: 0,
            errorCount: 0,
          };

          return [
            `<div>${t('common.time')}: ${date}</div>`,
            `<div>${t('common.succeeded')}: ${successCount}</div>`,
            `<div>${t('common.failed')}: ${errorCount}</div>`,
          ].join('\n');
        },
        backgroundColor: theme.palette.background.paper,
        borderColor: theme.palette.divider,
        textStyle: {
          color: theme.palette.text.primary,
          fontSize: 14,
        },
        extraCssText: `box-shadow: ${theme.shadows[2]}; border-radius: 4px;`,
        padding: [8, 10],
      },
      visualMap: {
        show: false,
        min,
        max,
        pieces: [
          // 负数部分，从较暗黄色到较亮黄色
          { min: Number.MIN_SAFE_INTEGER, max: min + rangeSize, color: orange[600] },
          { min: min + rangeSize, max: min + 2 * rangeSize, color: orange[500] },
          { min: min + 2 * rangeSize, max: min + 3 * rangeSize, color: orange[400] },
          { min: min + 3 * rangeSize, max: -1, color: orange[300] },
          // 0值使用默认颜色
          { min: 0, max: 0, color: theme.palette.grey[200] },
          // 正数部分保持原有绿色渐变
          { min: 1, max: min + 5 * rangeSize, color: green[300] },
          { min: min + 5 * rangeSize, max: min + 6 * rangeSize, color: green[400] },
          { min: min + 6 * rangeSize, max: min + 7 * rangeSize, color: green[500] },
          { min: min + 7 * rangeSize, max: Number.MAX_SAFE_INTEGER, color: green[600] },
        ],
        orient: 'horizontal',
        left: 'center',
        bottom: 12,
        itemWidth: 12,
        itemHeight: 12,
        textStyle: {
          color: theme.palette.text.secondary,
          fontSize: 12,
        },
      },
      calendar: {
        top: 30,
        left: 50,
        right: 10,
        bottom: 4,
        cellSize: [cellSize, cellSize],
        splitLine: {
          show: false,
        },
        itemStyle: {
          borderWidth: 2,
          borderColor: theme.palette.background.default,
          color: theme.palette.background.default,
        },
        dayLabel: {
          show: true,
          firstDay: 0,
          nameMap: ['', 'Mon', '', 'Wed', '', 'Fri', ''],
          position: 'start',
          margin: 4,
          fontSize: 10,
          color: theme.palette.text.primary,
          fontWeight: '400',
          width: 20,
        },
        monthLabel: {
          show: true,
          nameMap: 'cn',
          align: 'left',
          color: theme.palette.text.primary,
          fontWeight: '400',
          fontSize: 12,
          position: 'start',
          margin: 4,
          width: 30,
          padding: [0, 2],
        },
        yearLabel: {
          show: false,
        },
        range: [
          dayjs().subtract(11, 'month').startOf('month').format('YYYY-MM-DD'),
          dayjs().endOf('month').format('YYYY-MM-DD'),
        ],
        orient: 'horizontal',
      },
      series: {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: calendarData.map((x) => [x.date, x.errorCount ? -x.errorCount : x.successCount]),
        label: {
          show: false,
        },
        itemStyle: {
          borderWidth: 2,
          borderColor: theme.palette.background.default,
          borderRadius: 4,
        },
        emphasis: {
          itemStyle: {
            borderWidth: 2,
            borderColor: purple[200],
            color: 'inherit',
          },
        },
      },
    };

    return options;
  }, [calendarData, t, theme]);

  return (
    <>
      <Box
        ref={chartContainerRef}
        sx={{
          maxWidth: '1280px',
          border: '1px solid',
          borderColor: 'divider',
          padding: '8px',
          overflowX: 'auto',
        }}>
        <Box
          sx={{
            width: '1200px',
            height: '180px',
            position: 'relative',
          }}>
          <ReactECharts
            option={chartOption}
            style={{ height: '100%', width: '100%' }}
            notMerge
            lazyUpdate={false}
            opts={{ renderer: 'canvas' }}
            onEvents={{
              click: (params) => {
                if (params.componentType === 'series' && params.data) {
                  handleDateClick(params.data[0]);
                }
              },
            }}
          />
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          mt: 1,
          mr: isMobile ? 2 : 5,
          mb: 2,
        }}>
        <Stack
          direction={isMobile ? 'column' : 'row'}
          spacing={isMobile ? 2 : 1}
          sx={{
            width: '100%',
            justifyContent: 'flex-start',
            alignItems: isMobile ? 'flex-start' : 'center',
          }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
            }}>
            <Box
              sx={{
                width: 32,
                height: 12,
                borderRadius: 0.5,
                background: 'linear-gradient(90deg, #8B5000 0%, #A36200 33%, #C17700 66%, #E29000 100%)',
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
              }}>
              {t('storage.spaces.backup.failed')}
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
            }}>
            <Box
              sx={{
                width: 32,
                height: 12,
                borderRadius: 0.5,
                bgcolor: 'grey.200',
                border: '1px solid',
                borderColor: 'grey.200',
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
              }}>
              {t('storage.spaces.backup.without')}
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
            }}>
            <Box
              sx={{
                width: 32,
                height: 12,
                borderRadius: 0.5,
                background: 'linear-gradient(90deg, #9be9a8 0%, #40c463 33%, #30a14e 66%, #216e39 100%)',
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
              }}>
              {t('storage.spaces.backup.succeeded')}
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </>
  );
}

export default SpacesBackupRecordsCalendar;
