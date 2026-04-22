/**
 * 将短横线格式的字符串转换为驼峰式。
 * @param str - 输入的短横线格式字符串，例如 '--aa-bb'
 * @returns 驼峰式字符串，例如 'aaBb'
 */
export const dockerArgsToCamelCase = (str: string): string => {
  // 移除前导的 '--' 或 '-'
  const strippedStr = str.replace(/^[-]+/, '');

  // 将短横线后的字母转换为大写
  const camelCaseStr = strippedStr.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

  return camelCaseStr;
};

/**
 * 将驼峰式字符串转换为短横线格式。
 * @param str - 输入的驼峰式字符串，例如 'aaBb'
 * @returns 短横线格式字符串，例如 '--aa-bb'
 */
export const dockerCamelCaseToDash = (str: string): string => {
  // 在大写字母前添加短横线，并转换为小写
  const kebabCaseStr = str.replace(/([A-Z])/g, '-$1').toLowerCase();

  // 在结果前添加 '--'
  return `--${kebabCaseStr}`;
};
