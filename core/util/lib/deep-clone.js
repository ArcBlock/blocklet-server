function deepClone(o) {
  if (typeof o === 'undefined') {
    return undefined;
  }

  // prefer structuredClone (better perf, more type support; Node.js 17+ / modern browsers)
  try {
    return structuredClone(o);
  } catch {
    return JSON.parse(JSON.stringify(o));
  }
}

module.exports = deepClone;
