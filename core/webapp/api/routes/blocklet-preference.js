const fs = require('fs-extra');
const qs = require('querystring');
const get = require('lodash/get');
const { joinURL } = require('ufo');
const multer = require('multer');

const { isValid: isValidDid } = require('@arcblock/did');
const formatContext = require('@abtnode/util/lib/format-context');
const serveStatic = require('serve-static');
const { getStatusFromError, formatError } = require('@blocklet/error');
const path = require('path');

const { BLOCKLET_PREFERENCE_FILE, BLOCKLET_PREFERENCE_PREFIX, BLOCKLET_UPLOADS_DIR } = require('@blocklet/constant');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');

const mutateBlockletPermission = require('../middlewares/mutate-blocklet-permission');
const DiskStorage = require('../libs/storage');

// For reading and updating blocklet preferences
module.exports = {
  init(app, node) {
    // find a component from the dependency tree
    const findComponent = (parent, id) => {
      if (parent.env.id === id) {
        return parent;
      }

      const possible = parent.children.find(item => id.startsWith(item.env.id));
      return possible ? findComponent(possible, id) : null;
    };

    const mergeConfigToSchema = (properties, configs, uploadAction) => {
      Object.keys(properties).forEach(key => {
        const prop = properties[key];
        if (prop.properties) {
          mergeConfigToSchema(prop.properties, configs, uploadAction);
        }
        if (prop['x-decorator'] === 'FormItem') {
          const prefixedKey = `${BLOCKLET_PREFERENCE_PREFIX}${key}`;
          if (typeof configs[prefixedKey] !== 'undefined') {
            prop.default = configs[prefixedKey];
          }
          if (prop['x-component'].startsWith('Upload') && !prop['x-component-props'].action) {
            prop['x-component-props'].action = uploadAction;
          }
        }
      });
    };

    const ensurePermission = mutateBlockletPermission(node);

    const ensureBlocklet = async (req, res, next) => {
      if (!req.query.id) {
        return res.status(400).json({ code: 'bad_request', error: 'no blocklet did' });
      }

      const [did] = req.query.id.split('/');
      if (!isValidDid(did)) {
        return res.status(400).json({ code: 'bad_request', error: 'invalid blocklet did' });
      }
      try {
        req.blocklet = await node.getBlocklet({ did, useCache: false });
        if (!req.blocklet) {
          return res.status(400).json({ code: 'bad_request', error: 'blocklet not found' });
        }
        return next();
      } catch (err) {
        return res.status(400).json({ code: 'bad_request', error: 'invalid blocklet did' });
      }
    };

    const ensureComponent = (req, res, next) => {
      req.component = findComponent(req.blocklet, req.query.id);
      if (!req.component) {
        return res.status(400).json({ code: 'bad_request', error: 'component not found' });
      }

      return next();
    };

    const uploadApi = '/api/uploads';

    // load preferences schema
    app.get('/api/preferences', ensurePermission, ensureBlocklet, ensureComponent, async (req, res) => {
      const schemaFile = path.join(req.component.env.appDir, BLOCKLET_PREFERENCE_FILE);
      if (fs.existsSync(schemaFile)) {
        try {
          const info = await node.getNodeInfo();
          const isFromService = req.get('source') === 'blocklet-service';
          const uploadAction = `${
            // eslint-disable-next-line no-nested-ternary
            isFromService
              ? joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, uploadApi)
              : process.env.NODE_ENV === 'production'
                ? joinURL(info.routing.adminPath, uploadApi)
                : uploadApi
          }?${qs.stringify(req.query)}`;

          const schema = JSON.parse(fs.readFileSync(schemaFile, 'utf8'));
          mergeConfigToSchema(get(schema, 'schema.properties', {}), req.component.configObj, uploadAction);
          return res.json(schema);
        } catch (err) {
          console.error(err);
          return res.json({});
        }
      }

      return res.json({});
    });

    // save preferences data
    app.post('/api/preferences', ensurePermission, ensureBlocklet, ensureComponent, async (req, res) => {
      const configs = Object.keys(req.body).reduce((acc, key) => {
        const value = req.body[key];
        acc.push({ key: `${BLOCKLET_PREFERENCE_PREFIX}${key}`, value });
        return acc;
      }, []);
      const result = await node.configBlocklet({ did: req.query.id.split('/'), configs }, { user: req.user });
      node
        .createAuditLog({
          action: 'configBlocklet',
          args: { did: req.query.id.split('/'), configs },
          context: formatContext(req),
          result,
        })
        .catch(err => console.error('Failed to create audit log for blocklet preference config', err));
      res.json(req.body);
    });

    // download dataDir
    // FIXME: we should limit this feature when dataDir is too large
    app.get('/api/export', ensurePermission, ensureBlocklet, async (req, res) => {
      const timestamp = new Date().toISOString().split('.')[0].split(':').join('-').replaceAll('-', '');
      const fileName = `blocklet-${req.blocklet.env.appId}-${timestamp}.zip`;
      const filePath = await node.createBlockletDataArchive(req.blocklet.env.dataDir, fileName);
      res.download(filePath, err => err && console.error(err));
    });

    const upload = multer({
      storage: new DiskStorage({
        destination: (req, file, cb) => {
          const uploadDir = path.join(req.blocklet.env.dataDir, BLOCKLET_UPLOADS_DIR);
          if (fs.existsSync(uploadDir) === false) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
      }),
    });

    // handle upload for blocklet prefs
    // FIXME: should ensurePermission here
    app.post(uploadApi, ensureBlocklet, ensureComponent, upload.single('file'), (req, res) => {
      res.json({
        url: joinURL(
          req.blocklet?.environmentObj?.BLOCKLET_APP_URL,
          WELLKNOWN_SERVICE_PATH_PREFIX,
          BLOCKLET_UPLOADS_DIR,
          req.file.filename
        ),
      });
    });

    // get theme data
    app.get('/api/theme', ensurePermission, ensureBlocklet, (req, res) => {
      const { theme } = req.blocklet.settings;

      return res.json(theme.raw);
    });

    // save theme data
    app.post('/api/theme', ensurePermission, ensureBlocklet, async (req, res) => {
      try {
        const { theme } = req.body;
        await node.configTheme({ did: req.blocklet.meta.did, theme }, { user: req.user });
        res.json(req.body);
      } catch (err) {
        const status = getStatusFromError(err);
        res.status(status).json({ code: 'internal_server_error', error: formatError(err) });
      }
    });

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

    const getIndexSender = dir => (_, res) => {
      res.sendFile(path.join(dir, 'index.html'), {
        headers: { 'Cache-Control': 'public, max-age=0' },
      });
    };

    // serve hosted version
    app.get('/hosted/form-collector', getIndexSender(node.collectorPath));
    app.use('/hosted/form-collector', serveStatic(node.collectorPath, staticOptions));
    app.get('/hosted/theme-builder', getIndexSender(node.themeBuilderPath));
    app.use('/hosted/theme-builder', serveStatic(node.themeBuilderPath, staticOptions));
  },
};
