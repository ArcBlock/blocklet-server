/**
 * 过滤目录数组，过滤重复目录，只保留最上层目录，并且只保留 baseDir 开头的目录。
 */
function filterParentDirs(dirs, baseDir) {
  if (!dirs.length || !Array.isArray(dirs)) {
    return [];
  }
  const sets = Array.from(new Set(dirs));
  const filteredDirs = sets.filter((dir) => dir.startsWith(baseDir));

  // 按路径长度从短到长排序
  const sortedDirs = filteredDirs.sort((a, b) => a.length - b.length);

  // 依次检查，如果当前目录被已加入的目录包含，则跳过
  const result = [];
  for (const dir of sortedDirs) {
    // eslint-disable-next-line prefer-template
    if (!result.some((parent) => dir.startsWith(parent + '/'))) {
      result.push(dir);
    }
  }
  return result;
}

module.exports = filterParentDirs;
