const path = require('node:path');
const fs = require('fs-extra');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const ensureBlocklet = require('../middlewares/ensure-blocklet');
const { getMediaFile } = require('../services/media');

const prefix = `${WELLKNOWN_SERVICE_PATH_PREFIX}/media`;
// const prefixApi = `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/media`;

module.exports = {
  // eslint-disable-next-line no-unused-vars
  init(app, node, options) {
    // 暂时移到 webapp 中实现
    // app.use(`${prefixApi}/upload`, ensureBlocklet(), checkUser, (req, res) => {
    //   const { blocklet } = req;
    //   const uploader = getUploader({
    //     blocklet,
    //     tmpFolder: node.dataDirs.tmp,
    //     folder: 'blocklet-service',
    //   }).handle;
    //   uploader(req, res);
    // });

    app.get(`${prefix}/**`, ensureBlocklet(), async (req, res) => {
      const { blocklet } = req;
      const filename = req.params[0];
      const filePath = getMediaFile(path.join('media', filename), { blocklet });
      const isFileExist = await fs.exists(filePath);
      if (isFileExist) {
        res.sendFile(filename, {
          root: path.join(blocklet.env.dataDir, 'media'),
        });
        return;
      }

      res.status(404).send('File not found');
    });
  },
};
