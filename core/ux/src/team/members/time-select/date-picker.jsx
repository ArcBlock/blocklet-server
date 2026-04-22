import React from 'react';
import PropTypes from 'prop-types';
import { FormControl } from '@mui/material';
import dayjs from '@abtnode/util/lib/dayjs';
import { useCreation } from 'ahooks';
import { DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

export default function DateTimeInput({
  value = null,
  onChange,
  error = false,
  helperText = '',
  label = '',
  timezone = '',
  minDateTime = null,
}) {
  const formatValue = useCreation(() => {
    let date = dayjs();
    if (value) {
      date = timezone ? dayjs(value).tz(timezone) : dayjs(value);
    }

    return date;
  }, [value, timezone]);

  const onDateChange = (date) => {
    const formattedDate = timezone ? dayjs(date).tz(timezone) : dayjs(date);
    onChange(new Date(formattedDate.format('YYYY-MM-DD HH:mm:00')));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <FormControl fullWidth error={error}>
        <DateTimePicker
          label={label}
          minDateTime={minDateTime}
          value={formatValue}
          onChange={onDateChange}
          slotProps={{
            textField: {
              error,
              helperText: error ? helperText : '',
            },
          }}
          format="YYYY-MM-DD HH:mm"
        />
      </FormControl>
    </LocalizationProvider>
  );
}

DateTimeInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  onChange: PropTypes.func.isRequired,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  label: PropTypes.string,
  timezone: PropTypes.string,
  minDateTime: PropTypes.instanceOf(Date),
};
