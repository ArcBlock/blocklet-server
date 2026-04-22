const logger = require('../libs/logger')('check-blocklet');

function ensureBlocklet({ useCache = true } = {}) {
  return async (req, res, next) => {
    const blocklet = req.getBlocklet ? await req.getBlocklet({ useCache }) : null;
    if (!blocklet) {
      logger.error('blocklet not found', { url: req.url, method: req.method, headers: req.headers });
      res.status(404).send('blocklet not found');
      return;
    }
    req.blocklet = blocklet;
    next();
  };
}

module.exports = ensureBlocklet;
