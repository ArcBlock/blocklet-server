const { verify, getVerifyData } = require('@blocklet/sdk/lib/util/verify-sign');
const { getAccessWallet } = require('@abtnode/util/lib/blocklet');
const { joinURL } = require('ufo');
const logger = require('../libs/logger')('blocklet-services:verify-sig');

const tryVerify = async (data, sig, blocklet, accessWallet) => {
  let verified = await verify(data, sig, {
    // NOTICE: blocklet-service 的运行环境中不包含以下环境变量，必须从 blocklet 信息中去获取并传递
    type: blocklet.environmentObj.BLOCKLET_APP_CHAIN_TYPE,
    appSk: accessWallet.secretKey,
  });
  if (!verified) {
    verified = await verify(data, sig, {
      type: blocklet.environmentObj.BLOCKLET_APP_CHAIN_TYPE,
      appSk: blocklet.environmentObj.BLOCKLET_APP_SK,
    });
  }
  return verified;
};

const verifySig = async (req, res, next) => {
  try {
    const [blocklet, nodeInfo] = await Promise.all([req.getBlocklet(), req.getNodeInfo()]);

    const { data, sig } = getVerifyData(req, 'blocklet');

    if (!sig) {
      res.status(400).json({ error: 'Bad Request' });
      return;
    }

    const accessWallet = getAccessWallet({
      serverSecretKey: nodeInfo.sk,
      blockletAppDid: blocklet.appDid || blocklet.meta.did,
    });

    let verified = await tryVerify(data, sig, blocklet, accessWallet);
    const pathPrefix = req?.get('x-path-prefix');

    if (!verified && pathPrefix && data?.url && !data.url?.startsWith(pathPrefix)) {
      verified = await tryVerify(
        {
          ...data,
          url: joinURL(pathPrefix, data.url),
        },
        sig,
        blocklet,
        accessWallet
      );
    }

    if (!verified) {
      logger.error('verify sig failed', { data, sig });
      res.status(401).json('verify sig failed');
      return;
    }
  } catch (error) {
    logger.error('verify sig failed', { error });
    res.status(401).json('verify sig failed');
    return;
  }
  next();
};

module.exports = verifySig;
