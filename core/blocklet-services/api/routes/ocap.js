const { getChainClient } = require('@abtnode/util/lib/get-chain-client');
const {
  MAIN_CHAIN_ENDPOINT,
  WELLKNOWN_SERVICE_PATH_PREFIX,
  WELLKNOWN_BLOCKLET_USER_PATH,
} = require('@abtnode/constant');
const get = require('lodash/get');
const { joinURL } = require('ufo');
const { Joi } = require('@arcblock/validator');

const logger = require('../libs/logger')('blocklet-services:ocap');
const checkUser = require('../middlewares/check-user');
const ensureBlocklet = require('../middlewares/ensure-blocklet');
const { t } = require('../util/check-user');

const PREFIX = WELLKNOWN_SERVICE_PATH_PREFIX;

const USER_NFT_PATH = joinURL(WELLKNOWN_BLOCKLET_USER_PATH, 'nfts');

const queryParamsSchema = Joi.object({
  ownerAddress: Joi.DID().trim().required(),
  page: Joi.number().integer().min(0).default(1),
  size: Joi.number().integer().min(1).default(20),
});

module.exports = {
  init(server, node) {
    const chainClient = getChainClient(MAIN_CHAIN_ENDPOINT);

    if (!chainClient) {
      logger.error('get chain client failed');
      return;
    }

    server.get(`${PREFIX}/ocap/listAssets`, checkUser, ensureBlocklet(), async (req, res) => {
      const { blocklet, blockletLocale } = req;
      const teamDid = blocklet.appPid;

      const reqUserDid = req?.user?.did;
      if (!reqUserDid) {
        // 未登录用户访问
        res.status(401).json({
          error: t('notAuthorized', blockletLocale),
        });
        return;
      }

      if (!req.query.ownerAddress) {
        res.status(400).json({
          error: t('ownerAddressIsRequired', blockletLocale),
        });
        return;
      }

      const { error, value } = queryParamsSchema.validate(req.query);
      if (error) {
        res.status(400).json({
          error: error.message,
        });
        return;
      }

      const { ownerAddress, page = 0, size = 20 } = value;

      if (reqUserDid !== ownerAddress) {
        const user = await node.getUser({
          teamDid,
          user: { did: ownerAddress },
          options: {
            enableConnectedAccount: true,
          },
        });
        if (!user?.approved) {
          res.status(404).send({ error: t('notExist', blockletLocale) });
          return;
        }

        // 这里拆分两行进行判断的原因是因为 USER_NFT_PATH 中包含 ., 使用`进行拼接会导致取值错误
        const privacyInfo = get(user, 'extra.privacy', {});
        const isPrivate = get(privacyInfo, USER_NFT_PATH, false);

        if (isPrivate) {
          res.status(403).json({
            error: t('userSettingsArePrivate', blockletLocale),
          });
          return;
        }
      }

      const data = await chainClient.listAssets({
        ownerAddress,
        paging: {
          cursor: `${Math.max(0, page - 1) * (size || 20)}`,
          size: size || 20,
        },
      });
      res.json(data);
    });
  },
};
