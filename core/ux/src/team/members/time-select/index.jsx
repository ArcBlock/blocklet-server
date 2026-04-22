import { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useCreation } from 'ahooks';
import { FormControl, TextField, MenuItem, Box } from '@mui/material';
import dayjs from '@abtnode/util/lib/dayjs';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import ArrowDownwardIcon from '@arcblock/icons/lib/ArrowDown';
import DateTimeInput from './date-picker';

function SelectIcon(props) {
  return <ArrowDownwardIcon {...props} width={20} height={20} />;
}

const TIME_INTERVALS = {
  MINUTES_30: 30 * 60 * 1000,
  HOUR_1: 60 * 60 * 1000,
  HOURS_3: 3 * 60 * 60 * 1000,
  DAY_1: 24 * 60 * 60 * 1000,
  DAYS_7: 7 * 24 * 60 * 60 * 1000,
  DAYS_30: 30 * 24 * 60 * 60 * 1000,
};

function TimeSelect({ placeholder = '', value = '', onChange, timezone = '', showError = true }) {
  const { t } = useLocaleContext();
  const [selectedTime, setSelectedTime] = useState(value || '');
  const [customDate, setCustomDate] = useState(null);
  const [minDateTime, setMinDateTime] = useState(null);

  const timeOptions = useMemo(() => {
    return [
      { value: TIME_INTERVALS.MINUTES_30, label: `30 ${t('common.minutes')}` },
      { value: TIME_INTERVALS.HOUR_1, label: `1 ${t('common.hour')}` },
      { value: TIME_INTERVALS.HOURS_3, label: `3 ${t('common.hours')}` },
      { value: TIME_INTERVALS.DAY_1, label: `1 ${t('common.day')}` },
      { value: TIME_INTERVALS.DAYS_7, label: `7 ${t('common.days')}` },
      { value: TIME_INTERVALS.DAYS_30, label: `30 ${t('common.days')}` },
      { value: 'custom', label: t('common.custom') },
    ];
  }, [t]);

  const handleTimeChange = (newValue) => {
    setSelectedTime(newValue);

    if (newValue === 'custom') {
      const currentMinDateTime = timezone ? dayjs().tz(timezone) : dayjs();
      // 默认设置的时间需要 +1d，否则会显示错误，很不友好
      const now = currentMinDateTime.add(1, 'day').toDate();

      setMinDateTime(currentMinDateTime);
      setCustomDate(now);
      onChange(now);
    } else {
      // 应该在选中的时刻进行时间计算，这样更贴近目标时间
      onChange(new Date(Date.now() + newValue));
    }
  };

  const handleDateChange = (date) => {
    setCustomDate(date);
    onChange(date);
  };

  useEffect(() => {
    if (value) {
      const found = timeOptions.find((item) => dayjs(item.value).isSame(value));
      if (!found) {
        setSelectedTime('custom');
        setCustomDate(value);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const error = useCreation(() => {
    if (!showError) return false;

    if (!customDate) return true;
    if (dayjs(customDate).isBefore(dayjs())) return true;
    return false;
  }, [customDate, t]);

  return (
    <>
      <FormControl fullWidth>
        <TextField
          select
          value={selectedTime}
          label={placeholder || t('team.passport.passportExpireTime')}
          onChange={(e) => handleTimeChange(e.target.value)}
          variant="outlined"
          slotProps={{
            select: {
              IconComponent: SelectIcon,
            },
          }}
          sx={{
            '& .MuiInputLabel-root': {
              width: 'calc(100% - 46px)',
            },
          }}>
          {timeOptions.map((item) => (
            <MenuItem key={item.value} value={item.value}>
              {item.label}
            </MenuItem>
          ))}
        </TextField>
      </FormControl>
      {selectedTime === 'custom' && (
        <Box>
          <DateTimeInput
            value={customDate}
            onChange={handleDateChange}
            label={t('team.passport.customExpireTime')}
            timezone={timezone}
            error={!!error}
            helperText={error ? t('team.passport.customExpireTimeIsInvalid') : undefined}
            minDateTime={minDateTime}
          />
        </Box>
      )}
    </>
  );
}

TimeSelect.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  onChange: PropTypes.func.isRequired,
  timezone: PropTypes.string,
  placeholder: PropTypes.string,
  showError: PropTypes.bool,
};

export default TimeSelect;
