const get = require('lodash/get');
const { joinURL, parseURL } = require('ufo');
const { SERVER_ROLES } = require('@abtnode/constant');
const pathToRegExp = require('path-to-regexp');

const { findComponentByIdV2, getMountPoints } = require('@blocklet/meta/lib/util');
const { getDefaultServiceConfig } = require('@blocklet/meta/lib/service');
const logger = require('@abtnode/logger')('@abtnode/blocklet-services:security');
const { authBySimpleAccessKey, isLoginToken, isAccessKey } = require('@abtnode/util/lib/auth-simple-access-key');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const md5 = require('@abtnode/util/lib/md5');

const cache = require('../cache');
const formatContext = require('./format-context');
const getStaticServiceConfig = require('./get-static-service-config');
const initJwt = require('../libs/jwt');
const { isFeDev } = require('../libs/env');

const SKIP_CHECK_ORG_ROLES = Object.values(SERVER_ROLES);

const _getSecurityConfig = async ({ node, blockletDid, id, componentMountPoints, rawUrl, realUrl }) => {
  const defaultConfig = {
    accessPolicyConfig: null,
    responseHeaderPolicyConfig: null,
  };

  // NOTICE: 由于无法预知还会有什么错误导致错误，所以在最外层做一个 catch，并记录错误信息
  try {
    const { securityRules: rawSecurityRules } = await node.getBlockletSecurityRules({
      did: blockletDid,
      formatted: true,
    });
    // NOTICE: 如果指定的组件已经不存在，则跳过对应的安全规则
    const securityRules = rawSecurityRules.filter((x) => {
      const matchComponent = componentMountPoints.find((componentItem) => componentItem.did === x.componentDid);
      if (x.componentDid) return Boolean(matchComponent);
      return true;
    });
    if (id) {
      // NOTICE: 在指定 ID 的情况下，可能会查不到，这时候需要返回默认配置
      return securityRules.find((rule) => rule.id === id) ?? defaultConfig;
    }
    const matchedAccessPolicyRules = [];
    const matchedResponseHeaderPolicyRules = [];

    for (const securityRuleItem of securityRules) {
      const keys = [];
      const matchComponent = componentMountPoints.find(
        (componentItem) => componentItem.did === securityRuleItem.componentDid
      );
      const mergePathPattern = joinURL(matchComponent?.mountPoint || '/', securityRuleItem.pathPattern);
      const regexp = pathToRegExp(mergePathPattern, keys);
      const match = regexp.exec(realUrl);
      if (match) {
        if (securityRuleItem.accessPolicy) {
          matchedAccessPolicyRules.push(securityRuleItem);
        }
        if (securityRuleItem.responseHeaderPolicy) {
          matchedResponseHeaderPolicyRules.push(securityRuleItem);
        }
      }
    }

    const matchedRule = {
      accessPolicyConfig: matchedAccessPolicyRules.length > 0 ? matchedAccessPolicyRules[0] : null,
      responseHeaderPolicyConfig:
        matchedResponseHeaderPolicyRules.length > 0 ? matchedResponseHeaderPolicyRules[0] : null,
    };

    return matchedRule;
  } catch (error) {
    logger.error('Failed to getSecurityConfig(internal)', { error, rawUrl, blockletDid });
    return defaultConfig;
  }
};

module.exports = ({ node, req, options }) => {
  req.getBlockletDid = () => req.headers['x-blocklet-did'] || get(options, 'blockletDid', '');
  req.getBlockletComponentId = () => req.headers['x-blocklet-component-id'] || get(options, 'blockletComponentId', '');
  req.getRoutingRuleId = () => req.headers['x-routing-rule-id'] || get(options, 'routingRuleId', '');

  req.getServiceContext = () => formatContext(req);

  req.getRoutingRule = async () => {
    const ruleId = req.getRoutingRuleId(req);
    if (!ruleId) {
      return null;
    }

    let rule = await cache.rule.get(ruleId);

    if (!rule) {
      rule = await node.getRoutingRuleById(ruleId);
      cache.rule.set(ruleId, rule);
    }

    return rule;
  };

  /**
   * @return obj | null
   * @FIXME this api should ensure high performance
   */
  req.getServiceConfig = (serviceName, { componentId } = {}) => {
    if (!serviceName) {
      return null;
    }

    const configId = componentId || req.getRoutingRuleId(req);
    if (!configId) {
      return null;
    }

    return cache.autoCache(`${serviceName}:${configId}`, async () => {
      const defaultConfig = getDefaultServiceConfig(serviceName);

      const app = await req.getBlocklet();
      if (!app) {
        return defaultConfig;
      }

      const _componentId = componentId || req.getBlockletComponentId();

      const componentStaticConfig = getStaticServiceConfig(serviceName, app, _componentId);

      const config = { ...defaultConfig, ...componentStaticConfig };
      delete config.whoCanAccess;

      return config;
    });
  };

  req.getBlocklet = ({ useCache = true, attachRuntimeInfo = false } = {}) => {
    const did = req.getBlockletDid();
    const context = req.getServiceContext();

    return cache.getBlocklet({ did, context, node, useCache, attachRuntimeInfo });
  };

  req.getUserOrg = async (roleName) => {
    try {
      const role = roleName || req.user?.role || '';
      // 如果 role 为空，或者 role 是系统role，则不检查 org
      if (!role || SKIP_CHECK_ORG_ROLES.includes(role)) {
        return '';
      }
      const blocklet = await req.getBlocklet();

      const orgEnabled = get(blocklet, 'settings.org.enabled', false);

      if (orgEnabled) {
        const roleInfo = await node.getRole({
          teamDid: req.getBlockletDid(),
          role: { name: role },
        });
        return roleInfo?.orgId || '';
      }
      return '';
    } catch (error) {
      logger.error('Failed to getUserOrg', { error, role: req.user.role, userDid: req.user.did });
      return '';
    }
  };
  req.getComponent = async ({ useCache = true, attachRuntimeInfo = false } = {}) => {
    const app = await req.getBlocklet({ useCache, attachRuntimeInfo });
    const componentId = req.getBlockletComponentId();
    const component = findComponentByIdV2(app, componentId);
    return component;
  };

  req.getNodeInfo = () => cache.getNodeInfo({ node });

  req.getBlockletInfo = () => {
    const did = req.getBlockletDid();

    return cache.getBlockletInfo({ did, node });
  };

  const { verifySessionToken } = initJwt(node, options);

  /**
   * set user info to req.user
   */
  req.ensureUser = async ({ token, visitorId, appPid } = {}) => {
    try {
      const teamDid = req.getBlockletDid();
      if (isLoginToken(token)) {
        // TODO: 设置跳过的开关
        const blocklet = await req.getBlocklet();
        if (blocklet.settings?.session?.enableBlacklist) {
          const cacheData = await cache.sessionToken.get(md5(token));
          if (cacheData?.block) {
            req.user = null;
            return;
          }
        }
        const opt = {
          checkFromDb: (decoded) => cache.sessionCacheDisabledUser.get(decoded?.did),
          teamDid,
          locale: req.blockletLocale,
        };

        const { secret } = await req.getBlockletInfo();
        const user = await verifySessionToken(token, secret, opt);

        if (user && visitorId) {
          // 这里只取第一个有效的会话
          const { list: userSessions } = await node.getUserSessions({
            teamDid,
            query: {
              appPid,
              userDid: user.did,
              visitorId,
            },
          });
          // 获取用户会话
          if (userSessions.length > 0) {
            const [userSession] = userSessions;
            req.userSession = userSession;
          } else {
            // HACK: 需要强制设置为 null，因为在 core/blocklet-services/api/index.js L603 中会给 req.user 赋值
            req.user = null;
            return;
          }
        }
        req.user = user;
      } else if (isAccessKey(token)) {
        const user = await authBySimpleAccessKey(token, node, teamDid);
        req.user = user;
      }
    } catch (error) {
      logger.error('Failed to ensureUser', {
        error,
        token,
        headers: req.headers,
        originalUrl: req.originalUrl,
        query: req.query,
        body: req.body,
      });
    }
  };

  req.attachSetupToken = async ({ res, token, visitorId }) => {
    await req.ensureUser({ token, visitorId });

    if (req.user) {
      res.cookie('login_token', token, { maxAge: 24 * 60 * 60 * 1000, secure: true, sameSite: 'lax' });
      if (visitorId) {
        res.cookie('vid', visitorId, { maxAge: 365 * 24 * 60 * 60 * 1000, secure: true, sameSite: 'lax' });
      }
    }
  };

  /**
   * @description 获取指定请求的安全配置（默认获取当前请求的安全配置，可以指定 url，也可以指定 ID）
   * @param {object} [options]
   * @param {object} [options.req] - 请求对象，默认为当前请求对象
   * @param {string} [options.url] - 指定的 URL
   * @param {string} [options.id] - 指定的 security-rule ID
   * @param {string} [options.componentDid] - 指定的 component DID
   * @returns {Promise<object | null>}
   */
  req.getSecurityConfig = async ({
    req: inputReq = req,
    url: inputUrl,
    id,
    componentDid: inputComponentDid,
    blocklet: _blocklet,
  } = {}) => {
    const defaultConfig = {
      accessPolicyConfig: null,
      responseHeaderPolicyConfig: null,
    };
    try {
      const rawUrl = inputUrl || inputReq.originalUrl;
      const currentUrl = parseURL(rawUrl).pathname;
      // NOTICE: 排除 node_modules, .yalc 等目录下的请求，这部分没有必要做安全处理
      if (currentUrl.startsWith('/node_modules') || currentUrl.startsWith('/.yalc') || currentUrl.includes('/@fs/')) {
        return defaultConfig;
      }
      // NOTICE: 如果 service 处于开发环境中，则会有很多 vite 相关的请求，这部分不需要做安全处理
      if (
        isFeDev &&
        (currentUrl.startsWith(`${WELLKNOWN_SERVICE_PATH_PREFIX}/node_modules/`) ||
          currentUrl.startsWith(`${WELLKNOWN_SERVICE_PATH_PREFIX}/src/`) ||
          currentUrl.startsWith(`${WELLKNOWN_SERVICE_PATH_PREFIX}/@react-refresh`) ||
          currentUrl.startsWith(`${WELLKNOWN_SERVICE_PATH_PREFIX}/@vite/client`))
      ) {
        return defaultConfig;
      }
      // NOTICE: 如果当前连接是 websocket，则 inputReq 上不包含 get 方法，需要读取 header 只能通过 inputReq.headers 来获取
      // HACK: ws 链接默认不拦截，ws 不会携带 cookie，无法进行 access 的权限判断，目前只能默认放行
      if (inputReq.headers.upgrade && inputReq.headers.upgrade.toLowerCase() === 'websocket') {
        return defaultConfig;
      }
      if (typeof inputReq.get !== 'function') {
        return defaultConfig;
      }

      const blockletDid = inputReq.getBlockletDid();

      let componentPrefix = inputReq.get('x-path-prefix') || '/';
      const blocklet = _blocklet || (await inputReq.getBlocklet());
      const componentMountPoints = getMountPoints(blocklet);

      if (inputComponentDid) {
        const customComponent = componentMountPoints.find((x) => x.did === inputComponentDid);
        if (customComponent) {
          componentPrefix = customComponent.mountPoint;
        }
      }

      // NOTICE: 上面拿到的 originalUrl 是被移除了 componentPrefix 的 URL，所以需要重新拼接；如果指定了要匹配的 URL，就不需要拼接 componentPrefix 了
      let realUrl = inputUrl || joinURL(componentPrefix, currentUrl);
      // HACK: 如果当前 url 是 /，则 joinURL 返回的值结尾是不包含 / 的，需要自己手动进行拼接一次
      if (currentUrl === '/') {
        realUrl += '/';
      }

      const result = await cache.getSecurityConfig({
        did: blockletDid,
        // NOTICE: 必须存储 realUrl，否则不同组件的 cache 会混乱
        url: realUrl,
        getDataFn: () => _getSecurityConfig({ node, blockletDid, id, componentMountPoints, rawUrl, realUrl }),
      });
      return result;
    } catch (error) {
      logger.error('Failed to getSecurityConfig', { error, inputReq, inputUrl, id, inputComponentDid });
      return defaultConfig;
    }
  };

  req.cache = cache;
};

exports.formatContext = formatContext;
