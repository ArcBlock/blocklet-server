/**
 * 验证是否开启了 org，如果没有开启，那么相关接口不应该被请求
 */

function ensureOrgEnabled({ useCache = true } = {}) {
  return async (req, res, next) => {
    const blocklet = req.blocklet ? await req.getBlocklet({ useCache }) : null;
    const { org = {} } = blocklet.settings || {};
    if (!org?.enabled) {
      res.status(403).send('Org is not enabled, Can not request this api');
      return;
    }
    next();
  };
}

module.exports = ensureOrgEnabled;
