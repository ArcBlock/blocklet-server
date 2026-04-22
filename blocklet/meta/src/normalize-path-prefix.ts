const normalizePathPrefix = (prefix) => {
  if (typeof prefix === 'string') {
    if (!prefix || prefix === '/') {
      return '/';
    }

    return `/${prefix}/`.replace(/\/+/g, '/');
  }

  return '/';
};

export { normalizePathPrefix };

export default { normalizePathPrefix };
