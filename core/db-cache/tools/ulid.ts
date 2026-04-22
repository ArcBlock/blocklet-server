export function ulid() {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

  // 时间部分（10 chars）
  let t = Date.now();
  let timeStr = '';
  for (let i = 0; i < 10; i++) {
    timeStr = alphabet[t % 32] + timeStr;
    t = Math.floor(t / 32);
  }

  // 随机部分直接用 Math.random().toString(32)
  // 去掉 "0."，取 16 个字符，不足时递补
  let rand = Math.random().toString(32).substring(2);
  while (rand.length < 16) {
    rand += Math.random().toString(32).substring(2);
  }
  rand = rand.substring(0, 16).toUpperCase();

  return timeStr + rand;
}
