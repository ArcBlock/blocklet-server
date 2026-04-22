const { isMaster, getFederatedMaster } = require('@abtnode/auth/lib/util/federated');
const { getVerifyData, verify } = require('@blocklet/sdk/lib/util/verify-sign');
const logger = require('../libs/logger')('check-federated');

/**
 * 检查站点群的调用权限
 * @param {object} options
 * @param {'all'|'masterToMember'|'memberToMaster'} options.mode
 * @param {Array<'pending'|'approved'|'rejected'|'revoked'>} options.allowStatus
 */
function checkFederatedCall({ mode = 'all', allowStatus = ['approved', 'revoked'] } = {}) {
  return async (req, res, next) => {
    const { blocklet } = req;
    if (!blocklet) {
      res.status(400).send('blocklet not exists');
      return;
    }

    const { sig, data, sigPk } = getVerifyData(req, 'blocklet');

    if (!(sig && data && sigPk)) {
      res.status(400).send('missing sig or data or sigPk');
    }

    const masterSite = getFederatedMaster(blocklet);

    if (masterSite) {
      if (mode === 'memberToMaster') {
        if (masterSite.appPid !== blocklet.appPid) {
          res.status(403).send('Only master can handle this request');
          return;
        }
      } else if (mode === 'masterToMember') {
        if (masterSite.appPid === blocklet.appPid) {
          res.status(403).send('Only member can handle this request');
          return;
        }
      }
    }

    const federated = blocklet?.settings?.federated || {};
    const sites = federated?.sites || [];

    const validSite = sites.find((siteItem) => {
      const valid = siteItem.pk === sigPk;
      if (!valid) return false;

      // master 发过来的请求，无条件信任（后面会检查签名）
      if (isMaster(siteItem)) return true;
      if (mode === 'masterToMember') return false;
      if (!allowStatus.includes(siteItem.status)) return false;
      return true;
    });
    if (!validSite) {
      res.status(401).send('Unauthorized');
      return;
    }

    const verified = await verify(data, sig, {
      appPk: sigPk,
    });
    if (!verified) {
      logger.error('verify blocklet sig failed', { data, sig });
      res.status(401).send('verify sig failed');
      return;
    }

    req.verifySite = validSite;
    req.verifyData = req.body;

    next();
  };
}
function checkFederatedCallWrapper(options) {
  return (req, res, next) => {
    const { blocklet } = req;
    if (!blocklet) {
      res.status(400).send('blocklet not exists');
      return;
    }
    checkFederatedCall(options)(req, res, next);
  };
}

module.exports = { checkFederatedCall: checkFederatedCallWrapper };
