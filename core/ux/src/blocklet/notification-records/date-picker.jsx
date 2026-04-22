/* eslint-disable react/require-default-props */
import { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Typography, Button, Popover } from '@mui/material';
import { DateRangePicker } from 'mui-daterange-picker';
import dayjs from '@abtnode/util/lib/dayjs';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import { getDefaultRanges } from '../../analytics/traffic';
import { formatToDate } from '../../util';

CustomDateRangePicker.propTypes = {
  value: PropTypes.array.isRequired,
  onChange: PropTypes.func,
};

export default function CustomDateRangePicker({ value, onChange }) {
  const { locale } = useLocaleContext();
  const maxDate = dayjs().toDate();
  const [anchorEl, setAnchorEl] = useState(null);

  const onTriggerClick = useCallback(
    (e) => {
      if (anchorEl) {
        setAnchorEl(null);
      } else {
        setAnchorEl(e.currentTarget);
      }
    },
    [anchorEl]
  );

  const open = Boolean(anchorEl);

  const onDateChange = useCallback(
    (range) => {
      if (!range.startDate || !range.endDate) {
        Toast.error('Please select a date range');
        return;
      }
      if (
        dayjs(range.startDate).isAfter(range.endDate) ||
        !dayjs(range.startDate).isValid() ||
        !dayjs(range.endDate).isValid()
      ) {
        Toast.error('Invalid date range');
        return;
      }

      onChange([range.startDate, range.endDate]);
      setAnchorEl(null);
    },
    [onChange]
  );

  return (
    <div>
      <Typography
        component="div"
        variant="h5"
        color="textPrimary"
        style={{ fontSize: 18, fontWeight: 'bold' }}
        sx={{
          mb: 0,
        }}>
        <Button onClick={onTriggerClick} variant="outlined" size="small" color="inherit">
          {formatToDate(value[0], locale)} - {formatToDate(value[1], locale)}
        </Button>
      </Typography>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => {
          setAnchorEl(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <DateRangePicker
          open
          maxDate={maxDate}
          initialDateRange={{
            startDate: value[0],
            endDate: value[1],
          }}
          toggle={onTriggerClick}
          definedRanges={getDefaultRanges(maxDate)}
          onChange={onDateChange}
        />
      </Popover>
    </div>
  );
}
