/* eslint-disable no-console */
const fs = require('fs-extra');
const path = require('path');
const get = require('lodash/get');
const cloneDeep = require('@abtnode/util/lib/deep-clone');
const dayjs = require('@abtnode/util/lib/dayjs');
const JWT = require('@arcblock/jwt');
const { isValid } = require('@arcblock/did');
const { joinURL } = require('ufo');
const cors = require('cors');
const { getPassportStatusEndpoint } = require('@abtnode/auth/lib/auth');
const { createPassportVC, createPassport, createUserPassport } = require('@abtnode/auth/lib/passport');
const formatContext = require('@abtnode/util/lib/format-context');
const { getStatusFromError } = require('@blocklet/error');
const { getUserAvatarUrl, getAvatarFile, getAppAvatarUrl, extractUserAvatar } = require('@abtnode/util/lib/user');
const {
  attachSendLogoContext,
  ensureBlockletExist,
  ensureCustomSquareLogo,
  ensureBundleLogo,
  ensureDefaultLogo,
  ensureCustomFavicon,
  ensureCustomRectLogo,
  ensureCustomRectDarkLogo,
  ensureCustomSquareDarkLogo,
  fallbackLogo,
  cacheError,
} = require('@abtnode/util/lib/logo-middleware');
const formatName = require('@abtnode/util/lib/format-name');
const { getAppOgCacheDir, getAppImageCacheDir } = require('@abtnode/util/lib/blocklet');
const { verifyAigneConfig } = require('@abtnode/core/lib/util/aigne-verify');
const {
  fixBlockletStatus,
  wipeSensitiveData,
  findComponentByIdV2,
  forEachComponentV2Sync,
  hasResourceType,
} = require('@blocklet/meta/lib/util');
const {
  WELLKNOWN_SERVICE_PATH_PREFIX,
  USER_AVATAR_PATH_PREFIX,
  ROLES,
  USER_AVATAR_URL_PREFIX,
  WELLKNOWN_BLOCKLET_HEALTH_PATH,
  PASSPORT_SOURCE,
  PASSPORT_LOG_ACTION,
  PASSPORT_ISSUE_ACTION,
} = require('@abtnode/constant');
const { createDownloadLogStream } = require('@abtnode/core/lib/util/log');
const { BlockletStatus, BLOCKLET_INTERFACE_TYPE_WEB } = require('@blocklet/constant');

const logger = require('../libs/logger')();
const { checkAdminPermission } = require('../middlewares/check-permission');
const { isImageAccepted, isImageRequest, processAndRespond } = require('../libs/image');
const { getOgImage } = require('../libs/open-graph');
const { isDev } = require('../libs/env');
const { hasAigneRequirement } = require('../util/blocklet-utils');

const polishBlocklet = (doc) => {
  const res = cloneDeep(doc);
  fixBlockletStatus(res);
  return wipeSensitiveData(res);
};

const prefix = WELLKNOWN_SERVICE_PATH_PREFIX;
const staticDir =
  process.env.NODE_ENV === 'production'
    ? path.resolve(__dirname, '../../dist')
    : path.resolve(__dirname, '../../public');

module.exports = {
  init(server, node) {
    const onSendFallbackLogo = ({ res, sendOptions }) => {
      res.sendStaticFile('/images/blocklet.png', sendOptions);
    };

    const attachSendLogoFn = (req, res, next) => {
      res.sendLogoFile = (fileName, options) => {
        if (isImageRequest(req, fileName)) {
          logger.info('send logo with image service', { fileName, options });
          const appDir = path.join(req.blocklet.env.cacheDir, '.services', 'image-filter');
          processAndRespond(req, res, {
            srcPath: fileName,
            cacheDir: appDir,
            getSrc: () => Promise.resolve([fs.createReadStream(fileName), path.extname(fileName).slice(1)]),
            extension: path.extname(fileName).slice(1),
            sendOptions: req.sendOptions,
          });
        } else {
          logger.info('send logo with file', { fileName, options });
          res.sendFile(fileName, options);
        }
      };

      next();
    };

    const logoWorkflow = (...chain) => {
      return [
        attachSendLogoContext({
          onSendFallbackLogo,
          onGetBlocklet: ({ req }) => {
            return req.getBlocklet();
          },
        }),
        attachSendLogoFn,
        ensureBlockletExist,
        ...chain,
        ensureCustomSquareLogo,
        ensureBundleLogo,
        ensureDefaultLogo,
        fallbackLogo,
        cacheError,
      ].filter(Boolean);
    };

    server.get(`${prefix}/blocklet/logo`, ...logoWorkflow());
    server.get(`${prefix}/blocklet/logo-dark`, ...logoWorkflow(ensureCustomSquareDarkLogo));

    ['/favicon.ico', `${prefix}/blocklet/favicon`, `${prefix}/blocklet/logo-favicon`].forEach((x) => {
      server.get(x, ...logoWorkflow(ensureCustomFavicon));
    });
    server.get(`${prefix}/blocklet/logo-rect`, ...logoWorkflow(ensureCustomRectLogo));
    server.get(
      `${prefix}/blocklet/logo-rect-dark`,
      ...logoWorkflow(ensureCustomRectDarkLogo, ensureCustomSquareDarkLogo)
    );

    server.get(
      `${prefix}/blocklet/logo-bundle/?**`,
      attachSendLogoContext({
        onSendFallbackLogo,
        onGetBlocklet: async ({ req }) => {
          const blocklet = await req.getBlocklet();
          const dids = req.url.split('?')[0].replace(`${prefix}/blocklet/logo-bundle`, '').split('/').filter(Boolean);
          const component = findComponentByIdV2(blocklet, [blocklet.meta.did].concat(dids));
          return component;
        },
      }),
      attachSendLogoFn,
      ensureBlockletExist,
      ensureBundleLogo,
      ensureDefaultLogo,
      fallbackLogo,
      cacheError
    );

    server.get(`${prefix}${USER_AVATAR_PATH_PREFIX}/:fileName`, async (req, res) => {
      let stream;
      try {
        const blocklet = await req.getBlocklet();
        const { dataDir, cacheDir } = blocklet.env;
        let { fileName } = req.params;

        if (isValid(fileName)) {
          const user = await node.getUser({ teamDid: blocklet.appPid, user: { did: fileName } });
          if (user) {
            if (user.avatar.startsWith(USER_AVATAR_URL_PREFIX)) {
              fileName = user.avatar.split('/').pop();
            } else if (user.avatar.startsWith('data:')) {
              logger.info('extract user avatar from base64', { user });
              user.avatar = await extractUserAvatar(user.avatar, { dataDir });
              await node.updateUser({ teamDid: blocklet.appPid, user: { did: user.did, avatar: user.avatar } });
              fileName = user.avatar.split('/').pop();
            }
          }
        }

        const avatarFilePath = getAvatarFile(dataDir, fileName);
        if (!fs.existsSync(avatarFilePath)) {
          res.status(404).send('Avatar Not Found');
          return;
        }

        if (isImageAccepted(req) && isImageRequest(req)) {
          const appDir = path.join(cacheDir, '.services', 'image-filter');
          processAndRespond(req, res, {
            srcPath: avatarFilePath,
            cacheDir: appDir,
            getSrc: () => {
              stream = fs.createReadStream(avatarFilePath);
              return Promise.resolve([stream, path.extname(avatarFilePath).slice(1)]);
            },
          });
        } else {
          res.sendFile(avatarFilePath, { maxAge: '365d', immutable: true });
        }
      } catch (err) {
        stream?.destroy();
        logger.error('failed to send user avatar', { fileName: req.params.fileName, error: err });
        res.status(getStatusFromError(err)).send(err.message);
      }
    });

    server.get(`${prefix}/api/blocklet/detail`, checkAdminPermission, async (req, res) => {
      const useCache = req.query.nocache !== '1';

      const blocklet = await req.getBlocklet({ useCache });

      res.json(polishBlocklet(blocklet));
    });

    server.post(`${prefix}/api/blocklet/start`, checkAdminPermission, async (req, res) => {
      // 不能使用 useCache 可能会拿不到最新的 blocklet 信息
      const blocklet = await req.getBlocklet({ useCache: false });

      const { fromSetup } = req.query;
      const { did: userDid } = req.user;

      // eslint-disable-next-line no-unreachable

      let startError;
      let doc;
      try {
        doc = await node.startBlocklet({
          did: blocklet.meta.did,
          checkHealthImmediately: true,
          throwOnError: true,
          // 整个项目只有这里用了 atomic false; 暂时改为 true, 未来把 atomic false 的逻辑都移除
          atomic: true,
        });
      } catch (error) {
        startError = error;
      }

      if (!startError) {
        try {
          await node.createAuditLog(
            {
              action: 'startBlocklet',
              args: { did: blocklet.meta.did },
              context: formatContext(req),
              result: doc,
            },
            node
          );
        } catch (error) {
          logger.error('create start-blocklet audit log failed', { error });
        }
      }

      if (fromSetup === '1') {
        const teamDid = blocklet.meta.did;
        const { wallet, name, passportColor } = await req.getBlockletInfo();
        // NOTICE: 这里的 did 是从 session 中取到的永久 did，不需要查询 connectedAccount
        const user = await node.getUser({ teamDid, user: { did: userDid } });
        const appUrl = blocklet.environments.find((x) => x.key === 'BLOCKLET_APP_URL').value;
        user.avatar = getUserAvatarUrl(appUrl, user.avatar);

        const { pk, locale = 'en' } = user;

        await node.setBlockletInitialized({ did: blocklet.meta.did, owner: { did: userDid, pk } });

        // send notification to wallet
        const receiver = userDid;
        const token = await JWT.sign(wallet.address, wallet.secretKey);

        // send passport to wallet if no passport for this user
        const role = ROLES.OWNER;
        const hasOwnerPassport = (user.passports || []).some((x) => x.name === role);
        if (hasOwnerPassport === false) {
          // create vc
          const vc = await createPassportVC({
            issuerName: name,
            issuerWallet: wallet,
            issuerAvatarUrl: getAppAvatarUrl(appUrl),
            ownerDid: userDid,
            ...(await createPassport({
              name: role,
              node,
              teamDid,
              locale,
              endpoint: appUrl,
            })),
            endpoint: getPassportStatusEndpoint({
              baseUrl: joinURL(appUrl, WELLKNOWN_SERVICE_PATH_PREFIX),
              userDid,
              teamDid,
            }),
            ownerProfile: user,
            preferredColor: passportColor,
            expirationDate: undefined,
          });

          // write passport to db
          const passport = createUserPassport(vc, { role, source: PASSPORT_SOURCE.ISSUE });

          const result = await node.updateUser({
            teamDid,
            user: {
              did: userDid,
              passports: [passport],
            },
          });
          await node.createAuditLog(
            {
              action: 'updateUser',
              args: { teamDid, passport, reason: 'setup blocklet' },
              context: formatContext(req),
              result,
            },
            node
          );

          if (passport) {
            await node.createPassportLog(teamDid, {
              passportId: passport.id,
              action: PASSPORT_LOG_ACTION.ISSUE,
              operatorDid: userDid,
              metadata: {
                action: PASSPORT_ISSUE_ACTION.ISSUE_ON_BLOCKLET_START,
                context: formatContext(req),
              },
            });
          }

          // send owner vc
          const notificationText = {
            title: {
              en: 'You have become the application owner',
              zh: '你已成为应用所有者',
            }[locale],
            body: {
              en: 'You have become the application owner',
              zh: '你已成为应用所有者',
            }[locale],
          };

          const data = {
            sender: { token, appDid: wallet.address },
            receiver,
            notification: {
              ...notificationText,
              source: 'system',
              attachments: [
                {
                  type: 'vc',
                  data: {
                    credential: vc,
                    tag: ROLES.OWNER,
                  },
                },
              ],
            },
          };
          server.emit('sendToUser', data);
        }

        // send message
        const notificationText = startError
          ? {
              title: {
                en: 'Application start failed',
                zh: '应用启动失败',
              }[locale],
              body: {
                en: `Application start failed: ${startError.message}`,
                zh: `应用启动失败: ${startError.message}`,
              }[locale],
            }
          : {
              title: {
                en: 'Up and Running',
                zh: '启动并运行',
              }[locale],
              body: {
                en: 'The application is up and running successfully',
                zh: '应用程序已启动并成功运行',
              }[locale],
            };

        // send vc to wallet
        const data = {
          sender: { token, appDid: wallet.address },
          receiver,
          notification: {
            ...notificationText,
            source: 'system',
          },
        };
        server.emit('sendToUser', data);
      }

      if (startError) {
        throw startError;
      }

      return res.json(polishBlocklet(doc));
    });

    server.get(`${prefix}/api/blocklet/meta`, async (req, res) => {
      const blocklet = await req.getBlocklet();

      res.json(blocklet.meta);
    });

    server.get(WELLKNOWN_BLOCKLET_HEALTH_PATH, cors({ origin: true }), async (req, res) => {
      const blocklet = await req.getBlocklet();

      if (!blocklet) {
        return res.status(404).json({ message: 'blocklet not found' });
      }

      const components = {};
      let webInterfaceCount = 0;
      forEachComponentV2Sync(blocklet, (component) => {
        components[component.meta.did] = {
          running: component.status === BlockletStatus.running || component.greenStatus === BlockletStatus.running,
        };

        const hasWebInterface = (component.meta?.interfaces || []).some((x) => x.type === BLOCKLET_INTERFACE_TYPE_WEB);
        if (hasWebInterface) {
          webInterfaceCount++;
        }
      });

      if (blocklet.status !== BlockletStatus.running && blocklet.greenStatus !== BlockletStatus.running) {
        return res.status(503).json({ message: 'not running', components });
      }

      const isAigneRequired = hasAigneRequirement(blocklet);
      const response = {
        message: 'ok',
        components,
        routing: {
          webInterfaceCount,
          running: true,
          date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        },
      };

      if (isAigneRequired) {
        const aigne = get(blocklet, 'settings.aigne', {});
        const verifyResult = await verifyAigneConfig(aigne, blocklet);
        response.aigne = { running: verifyResult.valid, ...(verifyResult.error && { error: verifyResult.error }) };
      }

      return res.json(response);
    });

    server.get(`${WELLKNOWN_BLOCKLET_HEALTH_PATH}/:componentId`, cors({ origin: true }), async (req, res) => {
      const { componentId } = req.params;

      const blocklet = await req.getBlocklet();

      if (!blocklet) {
        return res.status(404).json({ message: 'blocklet not found' });
      }

      // 特殊逻辑，用于检测消息通知服务的健康状态
      if (componentId === 'notification') {
        const since = req.query.since || '1h';
        const result = await node.getNotificationStats({ teamDid: blocklet.appPid, since });
        return res.json({ message: 'ok', data: result });
      }
      const isAigneRequired = hasAigneRequirement(blocklet);
      if (componentId === 'aigne') {
        if (isAigneRequired) {
          const aigne = get(blocklet, 'settings.aigne', {});
          const verifyResult = await verifyAigneConfig(aigne, blocklet);
          return res.json({
            message: 'ok',
            running: verifyResult.valid,
            ...(verifyResult.error && { error: verifyResult.error }),
          });
        }
        return res.json({ message: 'ok' });
      }

      const component = findComponentByIdV2(blocklet, componentId);

      if (!component) {
        return res.status(404).json({ message: 'component not found' });
      }

      if (component.status !== BlockletStatus.running && component.greenStatus !== BlockletStatus.running) {
        return res.status(503).json({ message: 'not running' });
      }

      return res.json({ message: 'ok' });
    });

    server.get(`${prefix}/api/download/log`, checkAdminPermission, async (req, res) => {
      const { days } = req.query;

      if (days > 7) {
        res.status(400).send('Interval should not > 1 week');
        return;
      }

      const blocklet = await req.getBlocklet();
      const { did } = blocklet.meta;

      try {
        const stream = await createDownloadLogStream({ node, did, days });

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader(
          'Content-Disposition',
          `attachment;filename=${formatName(blocklet.meta.name)}.${dayjs().format('YYYYMMDDHHmmss')}.log.zip`
        );

        stream.pipe(res);

        node
          .createAuditLog(
            {
              action: 'downloadLog',
              args: { teamDid: did, days },
              context: formatContext(req),
              result: {},
            },
            node
          )
          .catch(console.error);
      } catch (error) {
        res.status(getStatusFromError(error)).send(error.message);
      }
    });

    server.get(`${prefix}/api/blocklet/transfer`, async (req, res) => {
      const { transferId } = req.query;

      if (!transferId) {
        res.status(400).send('transferId is required');
        return;
      }

      try {
        const blocklet = await req.getBlocklet();
        const transfer = await node.getTransferAppOwnerSession({ appDid: blocklet.appDid, transferId });

        if (!transfer || Date.now() > new Date(transfer.expireDate).getTime()) {
          res.status(404).send('Transfer session not found or has been used');
          return;
        }

        res.json(transfer);
      } catch (err) {
        logger.error('failed to get transfer info', { transferId, error: err });
        res.status(getStatusFromError(err)).send(err.message);
      }
    });

    server.get(`${prefix}/manifest.json`, async (req, res) => {
      const blocklet = await req.getBlocklet();
      const name = `${blocklet.meta.title || 'Blocklet'} - Dashboard`;
      const description = blocklet.meta.description || 'Blocklet Dashboard';
      res.json({
        name,
        short_name: name,
        description,
        start_url: `${WELLKNOWN_SERVICE_PATH_PREFIX}/admin`,
        display: 'standalone',
        theme_color: '#000000',
        background_color: '#ffffff',
        icons: [
          {
            src: `${WELLKNOWN_SERVICE_PATH_PREFIX}/blocklet/logo`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: `${WELLKNOWN_SERVICE_PATH_PREFIX}/blocklet/logo`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      });
    });

    const tmpDir = getAppOgCacheDir(node.dataDirs.tmp);
    const extensions = isDev ? 'png|html' : 'png';
    server.get(`${prefix}/blocklet/og.(${extensions})`, async (req, res) => {
      let stream;
      try {
        const format = req.path.split('.').pop();
        const info = await req.getBlockletInfo();
        const blocklet = await req.getBlocklet();
        const cache = req.query.nocache !== '1';

        // include content hash in default logo
        const appLogo = blocklet.environmentObj?.BLOCKLET_APP_LOGO_SQUARE;
        if (appLogo) {
          info.logoHash = encodeURIComponent(appLogo.split('/').slice(-1)[0].slice(0, 7));
        }

        const ogImage = blocklet.environmentObj?.BLOCKLET_APP_OG_IMAGE;
        if (ogImage) {
          info.ogImageHash = encodeURIComponent(ogImage.split('/').slice(-1)[0].slice(0, 7));
        }

        const sourceFilePath = await getOgImage({
          input: req.query,
          info,
          format,
          cacheDir: getAppOgCacheDir(blocklet.env.cacheDir),
          tmpDir,
        });
        if (format === 'png' && isImageAccepted(req) && isImageRequest(req)) {
          const appDir = getAppImageCacheDir(blocklet.env.cacheDir);
          processAndRespond(req, res, {
            srcPath: sourceFilePath,
            cacheDir: appDir,
            getSrc: () => {
              stream = fs.createReadStream(sourceFilePath);
              return Promise.resolve([stream, path.extname(sourceFilePath).slice(1)]);
            },
          });
        } else {
          res.sendFile(sourceFilePath, cache ? { maxAge: '365d', immutable: true } : { maxAge: 0 });
        }
      } catch (err) {
        stream?.destroy();
        logger.error('failed to send open graph', { fileName: req.params.fileName, error: err });
        res.status(getStatusFromError(err)).send(err.message);
      }
    });

    server.get(`${prefix}/blocklet/splash/:type(portrait|landscape)`, async (req, res) => {
      let stream;
      try {
        const { type } = req.params;
        const blocklet = await req.getBlocklet();
        const appSplash = get(blocklet, `environmentObj.BLOCKLET_APP_SPLASH_${type.toUpperCase()}`);
        if (appSplash) {
          const splashFilePath = path.join(get(blocklet, 'env.dataDir'), appSplash);
          if (fs.existsSync(splashFilePath)) {
            if (isImageRequest(req)) {
              const appDir = getAppImageCacheDir(blocklet.env.cacheDir);
              processAndRespond(req, res, {
                srcPath: splashFilePath,
                cacheDir: appDir,
                getSrc: () => {
                  stream = fs.createReadStream(splashFilePath);
                  return Promise.resolve([stream, path.extname(splashFilePath).slice(1)]);
                },
              });
            } else {
              const cache = req.query.nocache !== '1';
              res.sendFile(splashFilePath, cache ? { maxAge: '365d', immutable: true } : { maxAge: 0 });
            }
          } else {
            res.sendFile(`/images/splash-${type}.png`, { root: staticDir, maxAge: '1h' });
          }
        } else {
          res.sendFile(`/images/splash-${type}.png`, { root: staticDir, maxAge: '1h' });
        }
      } catch (err) {
        stream?.destroy();
        logger.error('failed to send splash image', { type: req.params.type, error: err });
        res.status(getStatusFromError(err)).send(err.message);
      }
    });

    server.get(`${prefix}/blocklet/og-image`, async (req, res) => {
      let stream;
      try {
        const blocklet = await req.getBlocklet();
        const appOgImage = get(blocklet, 'environmentObj.BLOCKLET_APP_OG_IMAGE');
        if (appOgImage) {
          const ogImageFilePath = path.join(get(blocklet, 'env.dataDir'), appOgImage);
          if (fs.existsSync(ogImageFilePath)) {
            if (isImageRequest(req)) {
              const appDir = getAppImageCacheDir(blocklet.env.cacheDir);
              processAndRespond(req, res, {
                srcPath: ogImageFilePath,
                cacheDir: appDir,
                getSrc: () => {
                  stream = fs.createReadStream(ogImageFilePath);
                  return Promise.resolve([stream, path.extname(ogImageFilePath).slice(1)]);
                },
              });
            } else {
              const cache = req.query.nocache !== '1';
              res.sendFile(ogImageFilePath, cache ? { maxAge: '365d', immutable: true } : { maxAge: 0 });
            }
          } else {
            res.sendFile('/images/og-image.jpg', { root: staticDir, maxAge: '1h' });
          }
        } else {
          res.sendFile('/images/og-image.jpg', { root: staticDir, maxAge: '1h' });
        }
      } catch (err) {
        stream?.destroy();
        logger.error('failed to send og image', { error: err });
        res.status(getStatusFromError(err)).send(err.message);
      }
    });

    server.get(`${prefix}/api/resources`, checkAdminPermission, async (req, res) => {
      const { resourceType, resourceDid } = req.query;
      const blocklet = await req.getBlocklet();

      const components = (blocklet.children || []).filter((x) => hasResourceType(x, resourceType, resourceDid));

      const resources = components.map((x) => ({
        did: x.meta.did,
        title: x.meta.title,
        description: x.meta.description,
        version: x.meta.version,
        logo: `${prefix}/blocklet/logo-bundle/${x.meta.did}?v=${x.meta.version}`,
      }));

      res.json(resources);
    });
  },
};
