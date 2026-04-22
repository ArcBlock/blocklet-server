const normalizePathPrefix = require('./normalize-path-prefix');

module.exports = (a, b) => normalizePathPrefix(a) === normalizePathPrefix(b);
