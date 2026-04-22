const path = require('node:path');

const fs = require('fs-extra');
const express = require('express');
const { isValid: isValidDid } = require('@arcblock/did');
// eslint-disable-next-line import/no-unresolved
const { initLocalStorageServer } = require('@blocklet/uploader-server');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');

const mutateBlockletPermission = require('../middlewares/mutate-blocklet-permission');

const getUploader = ({ blocklet, folder, tmpFolder }) =>
  initLocalStorageServer({
    path: tmpFolder,
    express,
    onUploadFinish: async (_req, _res, uploadMetadata) => {
      const {
        id: filename,
        size,
        metadata: { filename: originalname, filetype: mimetype },
      } = uploadMetadata;

      const srcFile = path.join(tmpFolder, filename);

      if (!fs.existsSync(srcFile)) {
        throw new Error(`file not found: ${filename}`);
      }

      const destDir = path.join(blocklet.env.dataDir, 'media', folder);
      await fs.ensureDir(destDir);
      await fs.copy(srcFile, path.join(destDir, filename));
      // NOTICE: 由管理员从页面自主清除缓存
      // await fs.unlink(srcFile);

      return {
        filename,
        size,
        originalname,
        mimetype,
        url: path.join(WELLKNOWN_SERVICE_PATH_PREFIX, 'media', folder, filename),
      };
    },
  });

module.exports = {
  // eslint-disable-next-line no-unused-vars
  init(app, node, options) {
    const ensurePermission = mutateBlockletPermission(node);

    const ensureBlocklet = async (req, res, next) => {
      const { did } = req.params;
      if (!did) {
        return res.status(400).json({ code: 'bad_request', error: 'no blocklet did' });
      }

      if (!isValidDid(did)) {
        return res.status(400).json({ code: 'bad_request', error: 'invalid blocklet did' });
      }

      const blocklet = await node.getBlocklet({ did, useCache: true });
      if (!blocklet) {
        return res.status(400).json({ code: 'bad_request', error: 'blocklet not found' });
      }
      req.blocklet = blocklet;

      return next();
    };

    app.use('/api/media/upload/:did', ensurePermission, ensureBlocklet, (req, res) => {
      const { blocklet } = req;
      const uploader = getUploader({ blocklet, tmpFolder: node.dataDirs.tmp, folder: 'blocklet-service' }).handle;
      uploader(req, res);
    });
  },
};
