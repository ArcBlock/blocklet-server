/* eslint-disable consistent-return */
const fs = require('fs-extra');
const yaml = require('@blocklet/meta/lib/file');
const express = require('express');
const path = require('path');
// eslint-disable-next-line import/no-unresolved
const { initLocalStorageServer } = require('@blocklet/uploader-server');
const serveStatic = require('serve-static');
const nocache = require('nocache');
const {
  BLOCKLET_META_FILE,
  BLOCKLET_PREFERENCE_FILE,
  BLOCKLET_UPLOADS_DIR,
  BLOCKLET_MODES,
} = require('@blocklet/constant');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');

const builderPath = path.dirname(require.resolve('@blocklet/form-builder'));
const collectorPath = path.dirname(require.resolve('@blocklet/form-collector'));
const themeBuilderPath = path.dirname(require.resolve('@blocklet/theme-builder'));

const BLOCKLET_SCREENSHOTS_DIR = 'screenshots';

const findComponent = (blocklet) => {
  const component = blocklet.children.find((c) => c.meta.name === blocklet.meta.name);

  // if blocklet is an gateway blocklet, then component will be empty and blocklet.deployedFrom will be the local folder of the blocklet
  return component || blocklet;
};

module.exports = {
  init(app, node) {
    const staticOptions = {
      maxAge: '365d',
      extensions: ['html', 'htm'],
      index: ['index.html', 'index.htm'],
      setHeaders: (res, file) => {
        if (serveStatic.mime.lookup(file) === 'text/html') {
          res.setHeader('Cache-Control', 'public, max-age=0');
        }
      },
    };

    const getIndexSender = (dir) => (_, res) => {
      res.sendFile(path.join(dir, 'index.html'), {
        headers: { 'Cache-Control': 'public, max-age=0' },
      });
    };

    const ensureComponent = async (req, res, next) => {
      const blocklet = await req.getBlocklet();
      if (blocklet.mode !== BLOCKLET_MODES.DEVELOPMENT) {
        return res.status(400).json({ error: 'Blocklet Studio can only be used for blocklets in development mode' });
      }

      const component = findComponent(blocklet);
      if (!component || !component.deployedFrom) {
        return res.status(400).json({ error: 'Can not find current component' });
      }

      req.blocklet = blocklet;
      req.component = component;

      const metaFile = path.join(req.component.deployedFrom, BLOCKLET_META_FILE);
      if (fs.existsSync(metaFile)) {
        req.meta = yaml.read(metaFile);
      } else {
        req.meta = {};
      }

      const screenshotsDir = path.join(req.component.deployedFrom, BLOCKLET_SCREENSHOTS_DIR);
      fs.ensureDirSync(screenshotsDir);
      if (!fs.existsSync(path.join(screenshotsDir, '.gitkeep'))) {
        fs.writeFileSync(path.join(screenshotsDir, '.gitkeep'), '');
      }

      next();
    };

    // handle upload for @blocklet/uploader
    const getUploader = (key) =>
      initLocalStorageServer({
        path: node.dataDirs.tmp,
        express,
        onUploadFinish: async (req, res, uploadMetadata) => {
          const {
            id: filename,
            size,
            metadata: { filename: originalname, filetype: mimetype },
          } = uploadMetadata;

          const srcFile = path.join(node.dataDirs.tmp, filename);
          if (fs.existsSync(srcFile)) {
            const isLogo = key === 'logo';
            const dirName = isLogo ? '' : BLOCKLET_SCREENSHOTS_DIR;
            // logo file name always should be logo.${extname}, screenshots file name should be the original name
            const copyFileName = isLogo ? `logo${path.extname(filename)}` : filename;

            const destDir = path.join(req.component.deployedFrom, dirName);
            await fs.ensureDir(destDir);
            await fs.copy(srcFile, path.join(destDir, copyFileName)); // maybe rewrite the file if the file already exists

            if (isLogo) {
              const oldLogo = path.join(req.component.deployedFrom, req.meta.logo);
              // exist and not the same filename remove the old logo
              if (req.meta.logo !== copyFileName && fs.existsSync(oldLogo)) {
                fs.unlinkSync(oldLogo);
              }
              req.meta.files = req.meta.files.filter((x) => x !== req.meta.logo);
              req.meta.files.push(copyFileName);
              req.meta.logo = copyFileName;
            } else {
              // scan the real screenshots in the screenshots dir, ignore the non-image files
              const realScreenshots = fs.readdirSync(destDir).filter((file) => {
                const mimeType = serveStatic.mime.lookup(file);
                return ['image/svg+xml', 'image/'].some((type) => mimeType.startsWith(type));
              });
              // Combine historical and new screenshots
              const oldScreenshots = req.meta.screenshots || [];
              const newScreenshots = realScreenshots.filter((x) => !oldScreenshots.includes(x));
              req.meta.screenshots = [...oldScreenshots, ...newScreenshots];
            }

            yaml.update(path.join(req.component.deployedFrom, BLOCKLET_META_FILE), req.meta, { fix: false });
          }

          return { filename, size, originalname, mimetype, uploadType: req.uploadType };
        },
      });

    // preferences loading and saving
    const preferenceUrl = `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/studio/preferences`;
    app.get(preferenceUrl, nocache(), ensureComponent, (req, res) => {
      const schemaFile = path.join(req.component.deployedFrom, BLOCKLET_PREFERENCE_FILE);
      if (fs.existsSync(schemaFile)) {
        try {
          const schema = JSON.parse(fs.readFileSync(schemaFile, 'utf8'));
          return res.json(schema);
        } catch {
          return res.json({});
        }
      }

      return res.json({});
    });
    app.put(preferenceUrl, ensureComponent, (req, res) => {
      const schemaFile = path.join(req.component.deployedFrom, BLOCKLET_PREFERENCE_FILE);
      fs.writeFileSync(schemaFile, JSON.stringify(req.body, null, 2));
      return res.json(req.body);
    });

    // logo loading
    const logoUrl = `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/studio/logo`;
    app.get(logoUrl, nocache(), ensureComponent, (req, res) => {
      const logoFile = path.join(req.component.deployedFrom, req.meta.logo);
      if (fs.existsSync(logoFile)) {
        return res.sendFile(logoFile);
      }

      return res.status(404).json({ error: 'Logo not set' });
    });
    app.use(`${logoUrl}/upload`, ensureComponent, getUploader('logo').handle);

    // screenshot loading
    const screenshotUrl = `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/studio/${BLOCKLET_SCREENSHOTS_DIR}`;
    app.get(screenshotUrl, nocache(), ensureComponent, (req, res) => {
      const screenshotsDir = path.join(req.component.deployedFrom, BLOCKLET_SCREENSHOTS_DIR);
      const validScreenshots = (req.meta.screenshots || []).filter((x) => fs.existsSync(path.join(screenshotsDir, x)));

      if (validScreenshots.length !== (req.meta.screenshots || []).length) {
        req.meta.screenshots = validScreenshots;
        yaml.update(path.join(req.component.deployedFrom, BLOCKLET_META_FILE), req.meta);
      }

      res.json({
        did: req.meta.did,
        title: req.meta.title,
        description: req.meta.description,
        screenshots: req.meta.screenshots || [],
        videos: req.meta.videos,
        logo: req.meta.logo,
      });
    });
    app.post(`${screenshotUrl}/reorder`, nocache(), ensureComponent, (req, res) => {
      req.meta.screenshots = req.body.screenshots;
      yaml.update(path.join(req.component.deployedFrom, BLOCKLET_META_FILE), req.meta);
      return res.json({ success: true });
    });
    app.get(`${screenshotUrl}/:filename`, nocache(), ensureComponent, (req, res) => {
      const screenshotFile = path.join(req.component.deployedFrom, BLOCKLET_SCREENSHOTS_DIR, req.params.filename);
      if (fs.existsSync(screenshotFile)) {
        return res.sendFile(screenshotFile);
      }

      return res.status(404).json({ error: 'Screenshot not found' });
    });
    app.delete(`${screenshotUrl}/:filename`, nocache(), ensureComponent, (req, res) => {
      const screenshotFile = path.join(req.component.deployedFrom, BLOCKLET_SCREENSHOTS_DIR, req.params.filename);
      if (fs.existsSync(screenshotFile)) {
        fs.unlinkSync(screenshotFile);
        req.meta.screenshots = req.meta.screenshots.filter((x) => x !== req.params.filename);
        req.meta.videos = req.meta.videos.filter((x) => x.screenshot !== req.params.filename);
        yaml.update(path.join(req.component.deployedFrom, BLOCKLET_META_FILE), req.meta);
        return res.json({ success: true });
      }

      return res.status(404).json({ error: 'Screenshot not found' });
    });
    app.use(`${screenshotUrl}/upload`, ensureComponent, getUploader(BLOCKLET_SCREENSHOTS_DIR).handle);

    // video uploading
    const videoUrl = `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/studio/videos`;
    app.post(videoUrl, nocache(), ensureComponent, (req, res) => {
      req.meta.videos = req.body.videos;
      yaml.update(path.join(req.component.deployedFrom, BLOCKLET_META_FILE), req.meta, { fix: false });
      return res.json({ success: true });
    });

    app.get(`${WELLKNOWN_SERVICE_PATH_PREFIX}/hosted/form-builder`, getIndexSender(builderPath));
    app.use(`${WELLKNOWN_SERVICE_PATH_PREFIX}/hosted/form-builder`, serveStatic(builderPath, staticOptions));

    app.get(`${WELLKNOWN_SERVICE_PATH_PREFIX}/hosted/form-collector`, getIndexSender(collectorPath));
    app.use(`${WELLKNOWN_SERVICE_PATH_PREFIX}/hosted/form-collector`, serveStatic(collectorPath, staticOptions));

    app.get(`${WELLKNOWN_SERVICE_PATH_PREFIX}/hosted/theme-builder`, getIndexSender(themeBuilderPath));
    app.use(`${WELLKNOWN_SERVICE_PATH_PREFIX}/hosted/theme-builder`, serveStatic(themeBuilderPath, staticOptions));

    app.use(`${WELLKNOWN_SERVICE_PATH_PREFIX}/${BLOCKLET_UPLOADS_DIR}`, async (req, res, next) => {
      const blocklet = await req.getBlocklet();
      if (!blocklet) {
        return res.status(400).json({ error: 'blocklet not found' });
      }

      serveStatic(path.join(blocklet.env.dataDir, BLOCKLET_UPLOADS_DIR), staticOptions)(req, res, next);
    });
  },
};
