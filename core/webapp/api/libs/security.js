const get = require('lodash/get');
const { parse } = require('graphql');
const {
  NODE_MODES,
  ROLES,
  SERVER_ROLES,
  SDK_ALLOWED_METHODS,
  STUDIO_ALLOWED_METHODS,
  SKIP_ACCESS_VERIFY_METHODS,
} = require('@abtnode/constant');
const { BLOCKLET_TENANT_MODES, ALLOW_VERIFY_PROVIDERS } = require('@blocklet/constant');
const { isInServerlessMode } = require('@abtnode/util/lib/serverless');
const { isE2E } = require('./env');
const { ensureUserLoginWhiteList } = require('./white-list');

const isDebugMode = info => info.enableWelcomePage && info.mode === NODE_MODES.DEBUG;

const whiteList = {
  getNodeInfo: true,
  getLauncherSession: true,
  getBlockletMetaFromUrl: true,
  getDynamicComponents: true,
  getBlocklets: info => isDebugMode(info),
  getRoutingSites: info => isDebugMode(info),
  resetNode: isE2E,
  launchBlockletByLauncher: info => isInServerlessMode(info),
  handleLaunchBlockletWithoutWallet: true,
  ...ensureUserLoginWhiteList,
};

const protectGQL = (instance, gqlConfig) => async (req, res, next) => {
  const query = (req.query?.query || req.body?.query || '').trim();
  if (query) {
    const info = await instance.getNodeInfo({ useCache: true });

    try {
      const { definitions } = parse(query);

      // get operations that need checked, excluded by whitelist
      const operations = definitions
        .map(x => {
          const selections = get(x, 'selectionSet.selections') || [];
          const names = selections.map(y => get(y, 'name.value'));
          return names;
        })
        .reduce((arr, names) => {
          arr.push(...names);
          return arr;
        }, [])
        .filter(d => d !== '__schema')
        .filter(name => {
          if (typeof whiteList[name] === 'function') {
            return !whiteList[name](info, req.user);
          }
          return !whiteList[name];
        });

      const hasPermission = async () => {
        if (req.user.role === ROLES.OWNER) {
          return true;
        }

        const rbac = await instance.getRBAC();
        const results = await Promise.all(
          operations.map(async apiName => {
            if (!gqlConfig[apiName]) {
              return true;
            }

            return !!(await rbac.canAny(
              req.user.role,
              gqlConfig[apiName].permissions.map(p => p.split('_'))
            ));
          })
        );

        return results.every(Boolean);
      };

      // check auth
      if (!req.user && operations.length) {
        return res.status(401).json({ code: 'forbidden', error: 'not allowed' });
      }

      // check batch mutation
      const isBatchMutation = definitions.filter(x => x.operation === 'mutation').length > 1;
      if (isBatchMutation) {
        return res.status(403).json({ code: 'forbidden', error: 'batch mutation not allowed' });
      }

      const hasMutation = definitions.some(x => x.operation === 'mutation');
      if (hasMutation && operations.length > 0) {
        // check maintenance
        if ([NODE_MODES.MAINTENANCE].includes(info.mode)) {
          return res.status(503).json({ code: 'under maintenance', error: 'Blocklet server is under maintenance' });
        }

        if (operations.every(op => SKIP_ACCESS_VERIFY_METHODS[op])) {
          return next();
        }

        if (operations.every(op => STUDIO_ALLOWED_METHODS[op])) {
          if (req.user.tenantMode === BLOCKLET_TENANT_MODES.MULTIPLE) {
            return next();
          }

          const authorized = await hasPermission();
          if (authorized) {
            return next();
          }

          return res.status(403).json({ code: 'forbidden', error: 'no permission' });
        }

        // For security reasons, we only allow mutation when user is in a short lived elevated session
        // esh 是 blocklet 的 enableSessionHardening 的别名, 从 blocklet service 中传递过来
        const teamDid = req.headers['x-blocklet-did'];
        const enableSessionHardening = teamDid ? req.user.esh : info.enableSessionHardening;
        if (enableSessionHardening && !req.user.elevated) {
          // 如果连接的账户中没有 passkey 或 wallet，则不进行验证
          const did = teamDid || info.did;
          const findUser = await instance.getUser({ teamDid: did, user: { did: req.user.did } });
          const connectedAccounts = findUser?.connectedAccounts || [];
          if (connectedAccounts.some(x => ALLOW_VERIFY_PROVIDERS.includes(x.provider))) {
            return res
              .status(403)
              .json({ code: 'need verification', error: 'you need to verify your access as admin' });
          }
        }
      }

      // check permission
      if (req.user && req.user.role !== ROLES.OWNER && operations.length) {
        if (operations.every(op => SKIP_ACCESS_VERIFY_METHODS[op])) {
          return next();
        }

        // blocklet sdk can skip access verify for some methods
        if (req.user.role === SERVER_ROLES.BLOCKLET_SDK && operations.every(op => SDK_ALLOWED_METHODS[op])) {
          return next();
        }

        // studio can skip access verify for some methods in multiple tenant mode
        if (operations.every(op => STUDIO_ALLOWED_METHODS[op])) {
          if (req.user.tenantMode === BLOCKLET_TENANT_MODES.MULTIPLE) {
            return next();
          }
        }

        const authorized = await hasPermission();
        if (!authorized) {
          return res.status(403).json({ code: 'forbidden', error: 'no permission' });
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        // eslint-disable-next-line no-console
        console.error('Failed to validate query', { err, query });
      }
      return res.json({ code: 'internal', error: err.message });
    }
  } else {
    return res.status(400).json({ code: 'invalid query', error: 'Please provide a valid query' });
  }

  return next();
};

module.exports = { protectGQL };
