const { BlockletStatus } = require('@blocklet/constant');
const { WELLKNOWN_BLOCKLET_ADMIN_PATH } = require('@abtnode/constant');
const { getBlockletMaintenanceTemplate } = require('@abtnode/router-templates/lib/blocklet-maintenance');
const { findComponentByIdV2 } = require('@blocklet/meta/lib/util');

const { shouldGotoStartPage, getRedirectUrl, redirectWithoutCache } = require('../util');
const logger = require('../libs/logger')('blocklet-services:check-running');

const checkRunning = async (req, res, next) => {
  const app = await req.getBlocklet();
  const componentId = req.getBlockletComponentId();
  let component = findComponentByIdV2(app, componentId);

  // for backward compatibility
  component = component || app;

  const isRunningStatus = [
    BlockletStatus.running,
    // Waiting, Downloading should be allowed because blocklet is currently being upgrading
    BlockletStatus.waiting,
    BlockletStatus.downloading,
  ];
  const isRunning = isRunningStatus.includes(component.status) || isRunningStatus.includes(component.greenStatus);

  if (!isRunning) {
    if (shouldGotoStartPage(req, component)) {
      if (req.query.setupToken) {
        await req
          .attachSetupToken({ res, token: req.query.setupToken, visitorId: req.query.visitorId })
          .catch((error) => {
            logger.error('attach login token failed when redirecting to starting page', { error }); // 不阻跳转
          });
      }
      if (app.settings.initialized) {
        redirectWithoutCache(res, getRedirectUrl({ req, pagePath: '/start' }));
      } else {
        redirectWithoutCache(res, getRedirectUrl({ req, pagePath: '/setup' }));
      }
      return;
    }

    const nodeInfo = await req.getNodeInfo();
    res.status(503);

    // return json if json has high priority, e.g. "*/*,application/json"
    if (req.accepts(['html', 'json']) === 'json') {
      res.json({ code: 'error', error: 'blocklet is under maintenance' });
    } else {
      res.send(getBlockletMaintenanceTemplate(app, nodeInfo, WELLKNOWN_BLOCKLET_ADMIN_PATH));
    }
    return;
  }

  const url = new URL(`http://localhost${req.url}`);
  if (url.searchParams.get('__start__')) {
    url.searchParams.delete('__start__');
    redirectWithoutCache(res, `${url.pathname}${url.search}`);
    return;
  }

  next();
};

module.exports = checkRunning;
