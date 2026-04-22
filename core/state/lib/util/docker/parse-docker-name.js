// 要改短 docker name 的长度，因为 docker 容器名称范围是255个字符，但是 network 名称范围是64个字符
function extractChunks(input) {
  // 以 '-' 分割字符串, 长度大于 30 的 chunk， 获取后 8 位
  let splited = false;
  const result = input.split('-').map((chunk) => {
    if (splited) {
      return chunk;
    }
    if (chunk.length > 30) {
      splited = true;
      return chunk.slice(-8);
    }
    return chunk;
  });
  return result.join('-');
}

function parseDockerName(input, dockerNamePrefix) {
  // docker 容器名称不能包含特殊字符
  const name = input
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/^"|"$/g, '')
    .replace(/\\/g, '_')
    .replace(new RegExp(`^${dockerNamePrefix}-`, 'g'), '')
    .replace(new RegExp(`^${dockerNamePrefix}-`, 'g'), '')
    .replace(new RegExp(`^${dockerNamePrefix}-`, 'g'), '');

  const out = `${dockerNamePrefix}-${name}`.toLocaleLowerCase();
  return extractChunks(out);
}

module.exports = parseDockerName;
