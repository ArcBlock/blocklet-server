const url = require('url');
const SealedBox = require('tweetnacl-sealedbox-js');
const { decodeEncryptionKey } = require('@abtnode/util/lib/security');
const { getServerAvatarUrl } = require('@abtnode/util/lib/user');
const { MAX_UPLOAD_FILE_SIZE } = require('@abtnode/constant');

const { getBaseUrl } = require('../util');
const env = require('../libs/env');
const { createSessionToken, createToken } = require('../libs/login');

const getUnreadNotificationCount = async ({ receiver }, node, context) => {
  if (!node || !receiver) {
    return 0;
  }
  const info = await node.getNodeInfo();
  const result = await node.getNotificationsUnreadCount(
    {
      teamDid: info.did,
      receiver,
    },
    context
  );
  return result;
};

module.exports = {
  init(app, node) {
    app.get('/api/did/session', async (req, res) => {
      // Must be some one try to trick daemon with a blocklet token
      if (req.user && req.user.bid) {
        res.status(403).send('Forbidden');
        return;
      }

      if (!req.user) {
        res.json({});
        return;
      }

      // Authentication request from dashboard
      const user = { ...req.user };
      const rbac = await node.getRBAC();
      user.permissions = await rbac.getScope(user.role);

      const encKey = '_ek_';
      let nextToken = '';
      if (req.query[encKey]) {
        try {
          const encryptionKey = decodeEncryptionKey(req.query[encKey]);
          nextToken = JSON.stringify(
            createSessionToken(user.did, {
              secret: await node.getSessionSecret(),
              passport: user.passport,
              role: user.role,
              elevated: false,
              fullName: user?.fullName,
            })
          );
          nextToken = Buffer.from(SealedBox.seal(Buffer.from(nextToken), encryptionKey)).toString('base64');
        } catch {
          // Do nothing
        }
      }

      res.json({ user, nextToken });
    });

    app.get('/api/notifications/unread-count', async (req, res) => {
      // Must be some one try to trick daemon with a blocklet token
      if (req.user && req.user.bid) {
        res.status(403).send('Forbidden');
        return;
      }

      if (!req.user) {
        res.json({ unReadCount: 0 });
        return;
      }

      try {
        const unReadCount = await getUnreadNotificationCount({ receiver: req.user.did }, node, { user: req.user });
        res.json({ unReadCount });
      } catch (err) {
        res.status(500).send(err.message);
      }
    });

    app.use('/api/did/refreshSession', async (req, res) => {
      if (req.user && req.user.bid) {
        res.status(403).send('Forbidden');
        return;
      }

      if (!req.user) {
        res.json({});
        return;
      }

      const user = { ...req.user };
      const rbac = await node.getRBAC();
      user.permissions = await rbac.getScope(user.role);

      const { sessionToken, refreshToken } = await createToken(user.did, {
        secret: await node.getSessionSecret(),
        passport: user.passport,
        role: user.role,
        fullName: user?.fullName,
        elevated: false,
      });
      res.json({
        user,
        nextToken: sessionToken,
        nextRefreshToken: refreshToken,
      });
    });

    app.get('/api/env', async (req, res) => {
      res.type('js');

      const info = await node.getNodeInfo();
      const baseUrl = url.format({
        protocol: req.protocol,
        host: req.get('host'),
        pathname: '',
      });

      let appLogo = '';
      try {
        const avatarUrl = getServerAvatarUrl('http://localhost', info);
        const avatarUrlInstance = new URL(avatarUrl);
        appLogo = `${avatarUrlInstance.pathname}${avatarUrlInstance.search}`;
      } catch {
        console.error('Failed to get server logo');
      }

      // FIXME: 建议将 apiPrefix 命名为 scope，代表当前应用运行的前缀
      // 参考来自 service-worker(https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register#scope)
      res.send(`window.env = {
  appId: "${info.did}",
  appPid: "${info.did}",
  appName: "${info.name}",
  appDescription: "${info.description}",
  apiPrefix: "${getBaseUrl(req)}",
  baseUrl: "${env.baseUrl || baseUrl}",
  appLogo: "${appLogo}",
  isE2E: ${env.isE2E},
  serverVersion: "${info.version}",
  maxUploadFileSize: ${Number(process.env.MAX_UPLOAD_FILE_SIZE) || MAX_UPLOAD_FILE_SIZE},
}`);
    });
  },
};
