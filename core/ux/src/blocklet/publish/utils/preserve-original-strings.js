export default function preserveOriginalStrings(obj) {
  // eslint-disable-next-line no-restricted-syntax
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].replace(/\\\\/g, '\\');
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      preserveOriginalStrings(obj[key]);
    }
  }
  return obj;
}
