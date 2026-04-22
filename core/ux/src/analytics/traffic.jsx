/* eslint-disable react/prop-types */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useCallback } from 'react';
import dayjs from '@abtnode/util/lib/dayjs';
import nthArg from 'lodash/nthArg';
import { joinURL } from 'ufo';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';
import Iframe from 'react-iframe';
import { Alert, CircularProgress, Grid, Typography, Button, IconButton, Popover, useTheme } from '@mui/material';
import ViewIcon from '@mui/icons-material/LaunchOutlined';
import { DateRangePicker } from 'mui-daterange-picker';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { formatError } from '@blocklet/error';

import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  startOfMonth,
  endOfMonth,
  addMonths,
  startOfYear,
  endOfYear,
  addYears,
} from 'date-fns';

import { formatToDate, filesize } from '../util';
import { useNodeContext } from '../contexts/node';
import Chart from './trend';

const noop = nthArg(0);

export const getDefaultRanges = (date, locale) => [
  {
    label: 'This Week',
    startDate: startOfWeek(date, { locale }),
    endDate: endOfWeek(date, { locale }),
  },
  {
    label: 'Last Week',
    startDate: startOfWeek(addWeeks(date, -1), { locale }),
    endDate: endOfWeek(addWeeks(date, -1), { locale }),
  },
  {
    label: 'Last 7 Days',
    startDate: addWeeks(date, -1),
    endDate: date,
  },
  {
    label: 'This Month',
    startDate: startOfMonth(date),
    endDate: endOfMonth(date),
  },
  {
    label: 'Last Month',
    startDate: startOfMonth(addMonths(date, -1)),
    endDate: endOfMonth(addMonths(date, -1)),
  },
  {
    label: 'This Year',
    startDate: startOfYear(date),
    endDate: endOfYear(date),
  },
  {
    label: 'Last Year',
    startDate: startOfYear(addYears(date, -1)),
    endDate: endOfYear(addYears(date, -1)),
  },
];

const defaultData = Array.from({ length: 7 }, (_, i) => ({
  value: 0,
  date: dayjs().subtract(i, 'day').format('YYYY-MM-DD'),
})).reverse();

export default function TrafficInsights({ client, did }) {
  const maxDate = dayjs().subtract(1, 'day').toDate();

  const { info, inService } = useNodeContext();
  const { t, locale } = useLocaleContext();
  const [anchorEl, setAnchorEl] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [date, setDate] = useState(maxDate);
  const [dateRange, setDateRange] = useState({
    startDate: dayjs().subtract(30, 'day').toDate(),
    endDate: maxDate,
  });

  const theme = useTheme();

  const [hoverIndex, setHoverIndex] = useState(null);

  const onHover = useCallback((params) => {
    setHoverIndex(params);
  }, []);

  const data = useAsyncRetry(async () => {
    const result = await client.getTrafficInsights({
      input: {
        did,
        startDate: dayjs(dateRange.startDate).format('YYYY-MM-DD'),
        endDate: dayjs(dateRange.endDate).format('YYYY-MM-DD'),
      },
    });
    return result.list;
  });

  useEffect(() => {
    if (data.loading) {
      return;
    }

    if (dateRange.startDate && dateRange.endDate) {
      data.retry();
    }
  }, [dateRange]);

  const onTriggerClick = (e) => {
    if (anchorEl) {
      setAnchorEl(null);
    } else {
      setAnchorEl(e.currentTarget);
    }
  };

  const list = data.value || [];
  const { loading, error } = data;

  if (!list.length && loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{formatError(error)}</Alert>;
  }

  const metrics = {
    totalRequests: noop,
    validRequests: noop,
    failedRequests: noop,
    uniqueVisitors: noop,
    uniqueFiles: noop,
    uniqueReferrers: noop,
    uniqueNotFound: noop,
    uniqueStaticFiles: noop,
    logSize: filesize,
    bandwidth: filesize,
  };

  const charts = Object.keys(metrics).map((key) => ({
    id: `${key}_chart`,
    title: t(`analytics.traffic.${key}`),
    current: list.length ? metrics[key](list[0][key]) : 0,
    data: list.length ? list.map((v) => ({ date: v.date, value: v[key] })).reverse() : defaultData,
    dateFn: noop,
    valueFn: metrics[key],
    total: 0,
  }));

  const open = Boolean(anchorEl);
  const id = open ? 'date-range-picker-popover' : undefined;

  // eslint-disable-next-line no-nested-ternary
  const pathPrefix = inService
    ? WELLKNOWN_SERVICE_PATH_PREFIX
    : process.env.NODE_ENV === 'production'
      ? info.routing.adminPath
      : '';

  const breakdownUrl = joinURL(
    window.location.origin,
    pathPrefix,
    `/api/analytics/traffic?date=${dayjs(date).format('YYYY-MM-DD')}&did=${did}&theme=${theme.palette.mode}`
  );

  const onRangeChange = (range) => {
    setDateRange(range);
    setAnchorEl(null);
  };

  const onDateChange = (newDate) => {
    setDate(newDate.toDate());
    setLoaded(false);
  };

  const onOpenBreakdown = () => {
    window.open(breakdownUrl);
  };

  return (
    <div>
      <Typography
        component="div"
        variant="h5"
        className="page-header"
        color="textPrimary"
        style={{ fontSize: 18, fontWeight: 'bold' }}
        sx={{
          mb: 2,
        }}>
        {t('analytics.trend')}
        <Button onClick={onTriggerClick} variant="outlined" size="small" color="inherit" sx={{ fontWeight: 400 }}>
          {formatToDate(dateRange.startDate, locale)} - {formatToDate(dateRange.endDate, locale)}
        </Button>
      </Typography>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <DateRangePicker
          open
          toggle={onTriggerClick}
          maxDate={maxDate}
          definedRanges={getDefaultRanges(date)}
          onChange={onRangeChange}
        />
      </Popover>
      <Grid container spacing={4}>
        {charts.map((x) => (
          <Grid
            key={x.id}
            sx={{ pt: '16px !important' }}
            size={{
              lg: 4,
              md: 6,
              sm: 6,
              xs: 12,
            }}>
            <Chart
              title={`${x.title}`}
              total={x.total}
              empty={null}
              history={x.data}
              style={{ height: 150 }}
              valueFn={x.valueFn}
              hoverIndex={hoverIndex}
              onHover={onHover}
            />
          </Grid>
        ))}
      </Grid>
      <Typography
        component="div"
        variant="h5"
        className="page-header"
        color="textPrimary"
        style={{ fontSize: 18, fontWeight: 'bold' }}
        sx={{
          mt: 4,
          mb: 1,
        }}>
        {t('analytics.detail')}
        <span>
          {loaded && (
            <IconButton onClick={onOpenBreakdown} style={{ marginRight: 32 }}>
              <ViewIcon />
            </IconButton>
          )}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              disableFuture
              format="ll"
              value={dayjs(date)}
              onChange={onDateChange}
              slotProps={{ textField: { size: 'small' } }}
            />
          </LocalizationProvider>
        </span>
      </Typography>
      <Iframe
        url={breakdownUrl}
        width="100%"
        height="100%"
        frameBorder={0}
        onLoad={() => setLoaded(true)}
        styles={{ border: 0, minHeight: '400vh' }}
      />
    </div>
  );
}
