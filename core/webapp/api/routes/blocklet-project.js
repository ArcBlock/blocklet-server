const fs = require('fs-extra');
const express = require('express');
const path = require('path');
const { isValid: isValidDid } = require('@arcblock/did');
// eslint-disable-next-line import/no-unresolved
const { initLocalStorageServer } = require('@blocklet/uploader-server');

module.exports = {
  init(app, node) {
    // handle upload for @blocklet/uploader
    const localStorageServer = initLocalStorageServer({
      path: node.dataDirs.tmp,
      express, // 需要把 express 库传到里面，生成一个根 app
      onUploadFinish: async (req, res, uploadMetadata) => {
        const {
          id: filename,
          size,
          metadata: { filename: originalname, filetype: mimetype },
        } = uploadMetadata;

        const srcFile = path.join(node.dataDirs.tmp, filename);
        if (fs.existsSync(srcFile)) {
          const destDir = path.join(req.blocklet.env.dataDir, '.projects', req.projectId, 'assets');
          await fs.ensureDir(destDir);
          await fs.copy(srcFile, path.join(destDir, filename));
        }

        return { filename, size, originalname, mimetype, uploadType: req.uploadType };
      },
    });

    const ensureProject = async (req, res, next) => {
      const { did, projectId, releaseId, type, file } = req.params;
      if (!did) {
        return res.status(400).json({ code: 'bad_request', error: 'no blocklet did' });
      }

      if (!isValidDid(did)) {
        return res.status(400).json({ code: 'bad_request', error: 'invalid blocklet did' });
      }

      req.blocklet = await node.getBlocklet({ did, useCache: true });
      if (!req.blocklet) {
        return res.status(400).json({ code: 'bad_request', error: 'blocklet not found' });
      }

      req.projectId = projectId;
      req.releaseId = releaseId;
      req.uploadType = type;
      req.releaseFile = file;

      return next();
    };

    app.use('/api/project/:did/:projectId/:type/upload', ensureProject, localStorageServer.handle);

    app.use('/api/project/:did/:projectId/:releaseId/download/:file', ensureProject, (req, res) => {
      const filePath = path.join(
        req.blocklet.env.dataDir,
        '.projects',
        req.projectId,
        'releases',
        req.releaseId,
        req.releaseFile
      );
      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
        return;
      }

      res.status(404).send('Not found');
    });

    app.use('/api/project/:did/:projectId/:releaseId/release/:file', ensureProject, (req, res) => {
      const filePath = path.join(
        req.blocklet.env.dataDir,
        '.projects',
        req.projectId,
        'releases',
        req.releaseId,
        '.blocklet',
        'release',
        req.params.file
      );

      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
        return;
      }

      res.status(404).send('Not found');
    });

    // 这里需要放在末尾handle，因为如果放在前面，会覆盖掉 /api/project/:did/:projectId/:releaseId/release/:file 的请求
    app.use('/api/project/:did/:projectId/:latestFile', ensureProject, async (req, res) => {
      let project;
      try {
        project = await node.getProject({ did: req.params.did, projectId: req.params.projectId });
      } catch {
        res.status(404).send('Not found project info!');
      }
      const filePath = path.join(
        req.blocklet.env.dataDir,
        '.projects',
        req.projectId,
        'releases',
        project.lastReleaseId || '',
        '.blocklet',
        'release',
        req.params.latestFile
      );

      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
        return;
      }

      res.status(404).send('Not found');
    });
  },
};
