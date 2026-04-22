const fs = require('fs');
const path = require('path');
const { formatError } = require('@blocklet/error');
const logger = require('@abtnode/logger')('@abtnode/webapp');
const { isValid: isValidDid } = require('@arcblock/did');
const { NODE_DATA_DIR_NAME, USER_AVATAR_PATH_PREFIX, WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { getAvatarFile } = require('@abtnode/util/lib/user');
const { getUserPublicInfo } = require('@abtnode/auth/lib/util/user-info');

const PREFIX = WELLKNOWN_SERVICE_PATH_PREFIX;

const prefixApi = `${PREFIX}/api/user`;

module.exports = {
  init(app, node) {
    // eslint-disable-next-line consistent-return
    app.get(`${USER_AVATAR_PATH_PREFIX}/:did/:fileName`, async (req, res) => {
      const sendOptions = { maxAge: '365d' };
      const info = await node.getNodeInfo();
      const { did, fileName } = req.params;
      if (!isValidDid(did)) {
        res.status(400).json({ code: 'bad_request', error: 'invalid blocklet did' });
        return;
      }

      let dataDir;
      if (did === info.did) {
        dataDir = path.join(node.dataDirs.data, NODE_DATA_DIR_NAME);
      } else {
        const blocklet = await node.getBlocklet({ did, attachConfig: false });
        if (!blocklet) {
          res.status(404).send('Blocklet Not Found');
          return;
        }

        dataDir = path.join(node.dataDirs.data, blocklet.meta.name);
      }

      const avatarFile = getAvatarFile(dataDir, fileName);

      if (!fs.existsSync(avatarFile)) {
        res.status(404).send('Avatar Not Found');
        return;
      }

      res.sendFile(avatarFile, sendOptions);
    });

    app.get(`${prefixApi}`, async (req, res) => {
      try {
        const userInfo = await getUserPublicInfo({ req, node });
        res.json(userInfo);
      } catch (err) {
        logger.error('Failed to get user public info', { error: err, userDid: req.user.did });
        res.status(400).send(formatError(err));
      }
    });
  },
};
