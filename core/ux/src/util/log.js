export const logColors = {
  info: '\x1b[34m', // 蓝色
  error: '\x1b[31m', // 红色
  stderr: '\x1b[31m', // 红色
  access: '\x1b[32m', // 绿色
  stdout: '\x1b[37m', // 白色
  pm2: '\x1b[36m', // 青色
};

// Define a regular expression for matching a date.
const regex1 = /\[\d{2}\/[A-Za-z]{3}\/\d{4}:\d{2}:\d{2}:\d{2} \+\d{4}\]/g; // [dd/MMM/yyyy:HH:mm:ss Z]
const regex2 = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}:/g; // YYYY-MM-DDTHH:MM:SS:
const regex3 = /\(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\):/g; // (YYYY-MM-DD HH:MM:SS):
const regex4 = /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]/g; // [2024-10-11 10:02:21]
const regex5 = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/g; // 2024/10/12 00:15:07

export const printColoredLog = (log, type) => {
  const color = logColors[type.toLowerCase()] || logColors.stdout;
  // 拆分出多行
  const lines = log.split('\r\n');

  lines.forEach((line, index) => {
    const timeMatch =
      line.match(regex1) || line.match(regex2) || line.match(regex3) || line.match(regex4) || line.match(regex5);
    // 如果匹配的时间存在，高亮显示
    if (timeMatch) {
      const time = timeMatch[0]; // 获取匹配的时间部分
      const highlightedTime = `\x1b[33m${time}\x1b[0m${color}`; // 用黄色高亮时间部分
      lines[index] = line.replace(time, highlightedTime); // 替换原始消息中的时间部分
    }
  });
  return `${color}${lines.join('\r\n')}\x1b[0m`;
};
