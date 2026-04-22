const { minimatch } = require('minimatch');

const checkMatch = (file, match) => {
  let m = match;
  if (!m.includes('*')) {
    return false;
  }
  if (!m.endsWith('*')) {
    return minimatch(file, m);
  }
  if (!m.endsWith('**')) {
    m = `${m}*`;
  }

  return minimatch(file, m);
};

const checkInclude = (list, f) =>
  f === '.' ||
  f === '' || // root folder maybe '.' and ''
  list.some(
    (x) =>
      x.indexOf(f) === 0 || // f is 'website' && x is 'website/public'
      f.indexOf(x) === 0 || // f is website/public/index.html && x is website/public
      checkMatch(f, x) // f is hooks/pre-start.js && x is hooks/*
  );

/**
 * Whether a file should be deployed
 * @param {string} file a file will be deployed
 * @param {object} opts
 * @param {array<string>} opts.diffList
 * @param {BundleType} opts.bundleType
 * @param {array<string>} opts.staticList
 * @return {boolean} Should this file be deployed
 */
const fileFilter = (file, opts = {}) => {
  const { diffList, bundleType, staticList } = opts;
  // only include diffList if has one
  if (diffList) {
    return checkInclude(diffList, file);
  }
  // only include staticList if bundleType is static
  if (bundleType === 'static') {
    if (!staticList) {
      throw new Error('staticList should not be empty when bundleType is static');
    }
    return checkInclude(staticList, file);
  }
  // include all files
  return true;
};

module.exports = {
  fileFilter,
  checkMatch,
};
