import dayjs from '@abtnode/util/lib/dayjs';
import isEmpty from 'lodash/isEmpty';

function getWebhookStatusColor(status) {
  switch (status) {
    case 'enabled':
      return 'success';
    case 'disabled':
    default:
      return 'default';
  }
}

export const formatLocale = (locale = 'en') => {
  if (locale === 'tw') {
    return 'zh';
  }

  return locale;
};

function formatTime(date, format = 'YYYY-MM-DD HH:mm:ss', locale = 'en') {
  if (!date) {
    return '-';
  }

  return dayjs(date).locale(formatLocale(locale)).format(format);
}

export function isEmptyExceptNumber(value) {
  if (typeof value === 'number') {
    return false;
  }
  return isEmpty(value);
}

export { getWebhookStatusColor, formatTime };

export function isSuccessAttempt(code) {
  return code >= 200 && code < 300;
}

export function getWordBreakStyle(value) {
  if (typeof value === 'string' && /\s/.test(value)) {
    return 'break-word';
  }

  return 'break-all';
}
