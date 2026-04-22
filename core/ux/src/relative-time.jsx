import { useEffect, useState } from 'react';
import UxRelativeTime from '@arcblock/ux/lib/RelativeTime';
import PropTypes from 'prop-types';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

// 处理日期字符串，如果包含空格，则替换为 T
// 需要将 2025-05-08 03:16:26.927 +00:00 转换为 2025-05-08T03:16:26.927+00:00
// 避免在 Safari 浏览器中 new Date(dateString) 解析错误
function parseDate(dateString) {
  if (dateString.includes(' ')) {
    return new Date(dateString.replace(' ', 'T').replace(' ', '')).getTime();
  }
  return new Date(dateString).getTime();
}

export default function RelativeTime({ value = '', shouldUpdate = false, ...rest }) {
  const { locale } = useLocaleContext();
  const [updateInterval, setUpdateInterval] = useState(0);

  useEffect(() => {
    let intervalId;
    if (shouldUpdate) {
      const valTime = new Date(value).getTime();
      const now = Date.now();
      const diffInSeconds = Math.abs(Math.floor((valTime - now) / 1000));
      const forceUpdate = () => {
        setUpdateInterval((prev) => {
          const random = Math.random() * 1000;
          return parseFloat((prev + random).toFixed(4));
        });
      };
      if (diffInSeconds < 60) {
        intervalId = setInterval(forceUpdate, 1000); // 每秒更新一次
      } else if (diffInSeconds < 60 * 60) {
        intervalId = setInterval(forceUpdate, 60000); // 每分钟更新一次
      } else {
        intervalId = setInterval(forceUpdate, 3600000); // 每小时更新一次
      }
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [value, updateInterval, shouldUpdate]);

  if (!value) {
    return '-';
  }

  const parsedValue = parseDate(value);

  return <UxRelativeTime value={parsedValue} locale={locale} {...rest} />;
}

RelativeTime.propTypes = {
  value: PropTypes.any,
  shouldUpdate: PropTypes.bool, // 是否需要动态更新
};
