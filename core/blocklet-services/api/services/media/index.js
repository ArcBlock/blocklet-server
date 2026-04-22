const path = require('node:path');

const fs = require('fs-extra');
const express = require('express');

// eslint-disable-next-line import/no-unresolved
const { initLocalStorageServer } = require('@blocklet/uploader-server');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');

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

const getMediaFile = (filename, { blocklet }) => {
  const filePath = path.join(blocklet.env.dataDir, filename);
  return filePath;
};

module.exports = {
  getUploader,
  getMediaFile,
};
