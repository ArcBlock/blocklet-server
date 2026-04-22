const defaultLogger = {
  error: console.error,
};

async function getOrigin({ req, blockletInfo }, { printError = defaultLogger.error } = {}) {
  if (!req) {
    return '';
  }
  try {
    if (req.getBlockletInfo) {
      const _blockletInfo = blockletInfo || (await req.getBlockletInfo());
      return _blockletInfo.appUrl;
    }
    const host = req.get('x-real-hostname') || req.get('host');
    return `https://${host}`;
  } catch (err) {
    printError('Failed to get origin', { error: err });
    return '';
  }
}

module.exports = getOrigin;
