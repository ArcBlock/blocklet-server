import dayjs from '@abtnode/util/lib/dayjs';

export const formatDate = (date) => {
  return dayjs(date).format('YYYY/MM/DD');
};

export const formatDatetime = (date) => {
  return dayjs(date).format('YYYY/MM/DD HH:mm');
};

export const mergeSx = (initial, sx) => {
  const mergedSx = [initial, ...(Array.isArray(sx) ? sx : [sx])];
  return mergedSx;
};

export const lineClamp = (n = 2) => ({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  wordBreak: 'break-word',
  display: '-webkit-box',
  WebkitLineClamp: n,
  WebkitBoxOrient: 'vertical',
});
