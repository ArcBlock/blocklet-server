import { useState } from 'react';
import useInterval from 'react-use/lib/useInterval';
import { formatTime } from '../util';

function Clock() {
  const [currentTime, setCurrentTime] = useState(+new Date());

  useInterval(() => {
    setCurrentTime(+new Date());
  }, 1000);

  return formatTime(currentTime, 'MMMM Do YYYY, h:mm:ss a');
}

export default Clock;
