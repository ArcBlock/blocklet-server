const maxBy = require('lodash/maxBy');

const getHistoryList = ({ history, hours, recordIntervalSec, props = [] }) => {
  if (hours < 1 || hours > 24) {
    throw new Error('hours should be between 1 and 24');
  }
  const intHours = Math.floor(hours);

  const nPerHour = (60 / recordIntervalSec) * 60;
  const n = nPerHour * intHours;
  const list = history.slice(-n);

  let i = list.length;

  const res = [];

  while (i > 0 && res.length < nPerHour) {
    const arr = list.slice(Math.max(0, i - intHours), i);

    // 取一段时间的最大值
    if (props && props.length) {
      const obj = {};
      props.forEach((p) => {
        obj[p] = (maxBy(arr, (x) => x[p]) || {})[p];
      });
      res.unshift(obj);
    } else {
      res.unshift(Math.max(...arr));
    }

    i -= intHours;
  }

  return res;
};

module.exports = getHistoryList;
