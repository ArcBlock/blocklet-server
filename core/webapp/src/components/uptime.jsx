import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';

const times = {
  oneSecond: 1,
  oneMin: 1 * 60,
  oneHour: 1 * 60 * 60,
  oneDay: 24 * 60 * 60,
};

export const useUpTime = (initialTime, format) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  const setDelayTimes = time => {
    if (time >= times.oneDay) {
      return times.oneDay;
    }

    if (time >= times.oneHour) {
      return times.oneHour;
    }

    if (time >= times.oneMin) {
      return times.oneMin;
    }

    return times.oneSecond;
  };

  const [delay, setDelay] = useState(setDelayTimes(initialTime / 1000));

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(elapsedTime + delay);

      const delayTime = setDelayTimes(initialTime / 1000 + elapsedTime + delay);
      if (delay !== delayTime) {
        setDelay(delayTime);
      }
    }, delay * 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line
  }, [delay, elapsedTime]);

  useEffect(() => {
    setElapsedTime(0);
    setDelay(setDelayTimes(initialTime / 1000));
  }, [initialTime]); // eslint-disable-line

  return format(initialTime + elapsedTime * 1000);
};

export default function UpTime({ initialTime, format = t => t, ...rest }) {
  const useFormat = useUpTime(initialTime, format);

  return <Typography {...rest}>{useFormat}</Typography>;
}

UpTime.propTypes = {
  initialTime: PropTypes.number.isRequired,
  format: PropTypes.func,
};
