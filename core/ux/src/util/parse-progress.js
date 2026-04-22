// 0~100
const parseProgress = (current, total) => {
  const totalNumber = typeof total !== 'number' ? Number(total) : total;
  if (Number.isNaN(totalNumber) || totalNumber <= 0) {
    return 0;
  }
  const value = Math.floor((current / totalNumber) * 100);

  return Math.min(Math.max(value, 0), 100);
};

export default parseProgress;
