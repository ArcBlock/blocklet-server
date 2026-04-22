import isAbsoluteUrl from 'is-absolute-url';

const isValidUrlPath = (name) => {
  // Check if the path contains any non-ASCII characters
  if (/[^\x20-\x7F]/.test(name)) {
    return false;
  }

  // Check if the resulting string matches the pattern of a valid URL path
  const regex = /^[a-z0-9/\-._]*$/i;
  return regex.test(name) && !name.includes('//');
};

const urlPathFriendly = (name, { keepSlash = true } = {}) => {
  // Replace non-URL path friendly characters with hyphens
  const pathFriendlyStr = name
    .trim()
    .replace(/[^\x20-\x7F]/g, '')
    .replace(/[^a-z0-9_.\-/]/gi, '-');

  // Remove consecutive hyphens
  const noConsecutiveHyphens = pathFriendlyStr.replace(/-+/g, '-');

  // Replace consecutive periods with a single period
  const result = noConsecutiveHyphens.replace(/\.+/g, '.');

  // Remove consecutive slashes if keepSlash is true
  const noConsecutiveSlashes = result.replace(/\/+/g, '/');

  // Remove leading/trailing slashes if keepSlash is false
  if (!keepSlash) {
    return noConsecutiveSlashes.replace(/^\/|\/$/g, '');
  }

  return noConsecutiveSlashes;
};

/**
 * Determine whether a URL is a valid URL path segment
 * /abc, /abc/bcd valid
 * /abc, /abc//bcd invalid
 * @param value The URL path to check
 * @returns boolean
 */
const checkUrlPath = (value: string) => {
  return /^\/(?:[^/]+\/)*$/.test(value) || /^\/(?:[^/]+\/)*[^/]+$/.test(value);
};
const checkLink = (value: string) => {
  if (isAbsoluteUrl(value) || checkUrlPath(value)) {
    return true;
  }
  return false;
};

export { isValidUrlPath, checkLink, urlPathFriendly };
