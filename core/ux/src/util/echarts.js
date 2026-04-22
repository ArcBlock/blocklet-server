/* eslint-disable import/prefer-default-export */
// 定义 interval 函数，根据时长确定刻度间隔
export const smartInterval = (dates) => {
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  const durationMs = maxDate - minDate;
  const durationMinutes = durationMs / (1000 * 60);

  return (index) => {
    if (durationMinutes <= 10) {
      // 时长 < 10分钟，每分钟都是刻度
      const totalPoints = dates.length - (dates.length % durationMinutes);
      const interval = totalPoints / durationMinutes;
      return index % interval === 0;
    }

    // @note: 按理来说，刻度应该都是小时和分钟的整点，但是由于数据不是连续的且还可能出现同一分钟数重叠的数据，尝试过了目前无法实现，所以现在只能等分刻度
    // 其他情况，平均分成6等分
    const totalPoints = dates.length - (dates.length % 6);
    const interval = totalPoints / 6;

    return index % interval === 0;
  };
};
