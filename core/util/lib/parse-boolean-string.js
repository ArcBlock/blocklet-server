/**
 * Parses boolean strings in an object and converts them to boolean values.
 * @param {Object} obj - The object to parse.
 * @param {Array} [keys] - Optional array of keys to parse. If not provided, all keys in the object will be parsed.
 * @returns {Object} - The object with boolean values parsed from boolean strings.
 * @throws {Error} - If the input is not an object.
 */
function parseBooleanString(obj, keys) {
  if (typeof obj !== 'object') {
    throw new Error('parseBooleanString should be an object');
  }

  const newObj = { ...obj };

  (keys || Object.keys(newObj)).forEach((key) => {
    if ([true, 1, 'true', '1'].includes(newObj[key])) {
      newObj[key] = true;
    } else if ([false, 0, 'false', '0'].includes(newObj[key])) {
      newObj[key] = false;
    }
  });

  return newObj;
}

module.exports = parseBooleanString;
