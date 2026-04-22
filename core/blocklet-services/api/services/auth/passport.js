const { getPassportStatus } = require('@abtnode/auth/lib/auth');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { CustomError } = require('@blocklet/error');
const logger = require('../../libs/logger');

const messages = {
  passportStatusCheckFailed: {
    en: 'Failed to get passport status',
    zh: '获取通行证状态失败',
  },
};

module.exports = {
  init(router, node) {
    router.get(`${WELLKNOWN_SERVICE_PATH_PREFIX}/api/passport/status`, async (req, res) => {
      const { vcId, userDid, locale } = req.query;
      const teamDid = req.headers['x-blocklet-did'];

      try {
        // HACK: 2025-06-13 经沟通，不再对 query 中的 teamDid 做校验，应该直接使用 req.headers['x-blocklet-did'] 中的 teamDid
        const status = await getPassportStatus({ node, teamDid, userDid, vcId, locale });

        res.json(status);
      } catch (err) {
        logger.error('failed to get passport status', { teamDid, userDid, vcId, locale, err });

        if (err instanceof CustomError) {
          throw err;
        }
        throw new CustomError(500, messages.passportStatusCheckFailed[locale] || messages.passportStatusCheckFailed.en);
      }
    });
  },
};
