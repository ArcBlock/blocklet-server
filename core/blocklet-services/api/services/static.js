const fs = require('fs-extra');
const path = require('path');
const serveStatic = require('serve-static');
const { withTrailingSlash } = require('ufo');
const { buildThemeStyles, buildThemeScript } = require('@blocklet/theme');
const { formatError, getStatusFromError } = require('@blocklet/error');

const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { isFeDev } = require('../libs/env');

const distDir = path.resolve(__dirname, '../../dist');
const devDir = path.resolve(__dirname, '../../public');

let indexTemplate = null;

const getIndexTemplate = () => {
  if (!indexTemplate) {
    try {
      indexTemplate = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
    } catch (error) {
      throw new Error('index.html template not found or unreadable');
    }
  }
  return indexTemplate;
};

const attachUtils = ({ req, res, proxy }) => {
  res.sendWebPage = async () => {
    if (isFeDev) {
      proxy.safeWeb(req, res, {
        target: `http://127.0.0.1:${process.env.ABT_NODE_SERVICE_FE_PORT}`,
      });
      return;
    }

    // 注入主题样式和脚本
    try {
      const blocklet = await req.getBlocklet({ useCache: true });
      const theme = blocklet?.settings?.theme ?? {};
      const html = getIndexTemplate()
        .replace('</head>', `${buildThemeStyles(theme)}\n</head>`)
        .replace('</head>', `${buildThemeScript(theme)}\n</head>`);

      res
        .set({
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
          'Surrogate-Control': 'no-store',
        })
        .send(html);
    } catch (error) {
      res.status(getStatusFromError(error)).send(formatError(error));
    }
  };

  res.sendStaticFile = (file, sendOptions) => {
    if (isFeDev) {
      res.sendFile(path.join(devDir, file), sendOptions);
    } else {
      res.sendFile(path.join(distDir, file), sendOptions);
    }
  };
};

const attachStaticResources = ({ app, proxy, extraResources = [] }) => {
  extraResources.forEach((x) => {
    fs.ensureDirSync(x.dir);
    app.use(x.prefix, serveStatic(x.dir, { index: false, maxAge: 0 }));
  });

  if (isFeDev) {
    // 在开发模式下代理 /static/share 到 /share
    app.use(`${WELLKNOWN_SERVICE_PATH_PREFIX}/static/share`, (req, res) => {
      proxy.safeWeb(req, res, {
        target: `http://127.0.0.1:${process.env.ABT_NODE_SERVICE_FE_PORT}${WELLKNOWN_SERVICE_PATH_PREFIX}/share`,
        pathRewrite: {
          [`^${WELLKNOWN_SERVICE_PATH_PREFIX}/static/share`]: `${WELLKNOWN_SERVICE_PATH_PREFIX}/share`,
        },
      });
    });

    app.use('/static', (req, res) => {
      proxy.safeWeb(req, res, {
        target: `http://127.0.0.1:${process.env.ABT_NODE_SERVICE_FE_PORT}/static`,
      });
    });
  } else {
    app.get(`${WELLKNOWN_SERVICE_PATH_PREFIX}/static/service-worker.js`, (req, res) => {
      // HACK: 需要允许 service-worker 将 scope 设置为 '/.well-known/service/'
      res.set('Service-Worker-Allowed', withTrailingSlash(WELLKNOWN_SERVICE_PATH_PREFIX));
      res.sendFile(path.join(distDir, 'service-worker.js'));
    });
    app.use(`${WELLKNOWN_SERVICE_PATH_PREFIX}/static`, serveStatic(distDir, { maxAge: '365d', index: false }));
  }
};

const attachDevProxy = ({ wsRouter, proxy }) => {
  if (isFeDev) {
    ['/sockjs-node', '/ws'].forEach((prefix) => {
      wsRouter.use(prefix, (req, socket, head) => {
        const target = `http://127.0.0.1:${process.env.ABT_NODE_SERVICE_FE_PORT}`;
        proxy.ws(req, socket, head, { target }, (error) => {
          if (error) {
            console.error('socket proxy error', { from: req.url, to: target, error });
          }
        });
      });
    });
  }
};

module.exports = { attachUtils, attachStaticResources, attachDevProxy };
