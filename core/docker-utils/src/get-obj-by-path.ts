// 获取对象的值，支持通过路径获取, 忽略大小写
// 类似 path 例如: port.BLOCKLET_PORT, interfaces[0].name
// 支持数组条件 例如: interfaces[type=web].name
export function getObjByPath(data: Record<string, unknown>, path: string) {
  const obj = JSON.parse(JSON.stringify(data));
  const keys = path
    .split('.')
    .map((key) => {
      const match = key.match(/(.+)\[(.+?)\]/);
      return match ? [match[1], match[2]] : key;
    })
    .flat();

  return keys.filter(Boolean).reduce((acc, key) => {
    if (!acc || !key) {
      return undefined;
    }

    // 检测数组条件
    const conditionMatch = key?.match(/(.+?)=(.+)/);
    if (Array.isArray(acc) && conditionMatch) {
      const [, field, value] = conditionMatch;
      if (field && value) {
        /* eslint-disable no-param-reassign */
        acc = acc.find((item: Record<string, unknown>) => {
          const lowerField = Object.keys(item).find((k) => k.toLowerCase() === field.toLowerCase());
          return lowerField && item[lowerField] === value;
        });
      }
      return acc;
    }

    // 忽略大小写查找对象键
    const lowerKey = Object.keys(acc).find((k) => k.toLowerCase() === key.toLowerCase());
    return lowerKey ? acc[lowerKey] : undefined;
  }, obj);
}
