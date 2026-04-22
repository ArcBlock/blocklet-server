/* eslint-disable no-case-declarations */
/* eslint-disable no-async-promise-executor */
const pick = require('lodash/pick');
const get = require('lodash/get');
const uniq = require('lodash/uniq');
const isEqual = require('lodash/isEqual');
const isNil = require('lodash/isNil');
const isObject = require('lodash/isObject');
const isArray = require('lodash/isArray');
const isString = require('lodash/isString');
const mapValues = require('lodash/mapValues');
const map = require('lodash/map');
const omit = require('lodash/omit');
const { Joi } = require('@arcblock/validator');
const { joinURL } = require('ufo');
const { Op } = require('sequelize');
const { getDisplayName } = require('@blocklet/meta/lib/util');
const { BLOCKLET_SITE_GROUP_SUFFIX, NODE_SERVICES, WHO_CAN_ACCESS } = require('@abtnode/constant');
const logger = require('@abtnode/logger')('@abtnode/core:states:audit-log');

const BaseState = require('./base');

const { parse } = require('../util/ua');
const { getScope } = require('../util/audit-log');

const emailSchema = Joi.string().email().required();

const getServerInfo = (info) =>
  `[${info.name}](${joinURL(process.env.NODE_ENV === 'production' ? info.routing.adminPath : '', '/settings/about')})`;
/**
 * @description
 * @param {import('@blocklet/server-js').BlockletState} blocklet
 * @param {{
 *  routing: { adminPath: string }
 * }} info
 * @returns {string}
 */
const getBlockletInfo = (blocklet, info) => `[${getDisplayName(blocklet)}](${joinURL(process.env.NODE_ENV === 'production' ? info.routing.adminPath : '', '/blocklets/', blocklet.meta.did, '/overview')})`; // prettier-ignore
const componentOrApplication = (componentDids) => (componentDids?.length ? 'component' : 'application');
const getComponentNames = (blocklet, componentDids, withVersion) =>
  uniq(componentDids || [])
    .map((x) => {
      const component = blocklet.children.find((y) => y.meta.did === x);
      if (component) {
        const version = withVersion ? `@${component.meta.version}` : '';
        return `${component.meta.title}${version}`;
      }

      return '';
    })
    .filter(Boolean)
    .join(', ');
const getComponentNamesWithVersion = (blocklet, componentDids) => getComponentNames(blocklet, componentDids, true);
const componentOrApplicationInfo = (app, componentDids) =>
  `${componentOrApplication(componentDids)} ${getComponentNamesWithVersion(app, componentDids)}`;

const getSiteInfo = (site) => `[${site.appName}](${site.appUrl})(${site.appPid})`;

const expandSite = async (siteId, info, node) => {
  if (!siteId) {
    return '';
  }

  const { blocklet, site } = node.states;
  const doc = await site.findOne({ id: siteId });
  if (!doc) {
    return '';
  }

  if (doc.domain === '*') {
    return 'default site';
  }

  if (doc.domain === '') {
    return getServerInfo(info);
  }

  if (doc.domain.endsWith(BLOCKLET_SITE_GROUP_SUFFIX)) {
    const tmp = await blocklet.getBlocklet(doc.domain.replace(BLOCKLET_SITE_GROUP_SUFFIX, ''));
    return tmp ? getBlockletInfo(tmp, info) : '';
  }

  return '';
};
const expandUser = async (teamDid, userDid, passportId, info, node) => {
  if (!teamDid || !userDid) {
    return ['', ''];
  }

  const user = await node.getUser({
    teamDid,
    user: { did: userDid },
    options: {
      enableConnectedAccount: true,
    },
  });
  if (!user) {
    return ['', ''];
  }

  const passport = user.passports.find((x) => x.id === passportId);
  const prefix = process.env.NODE_ENV === 'production' ? info.routing.adminPath : '';

  if (teamDid === info.did) {
    return [`[${user.fullName}](${joinURL(prefix, '/team/members')})`, passport ? passport.name : ''];
  }

  return [`[${user.fullName}](${joinURL(prefix, '/blocklets/', teamDid, '/members')})`, passport ? passport.name : '']; // prettier-ignore
};

const convertSecurityRule = (raw) => {
  const result = {
    ...raw,
    ...(isNil(raw.enabled) ? {} : { enabled: String(raw.enabled) }),
  };
  return result;
};
const getSecurityRuleInfo = (rule) => {
  const infoMap = {
    pathPattern: 'Path Pattern',
    componentDid: 'Belong to component',
    responseHeaderPolicyId: 'Response Header Policy',
    accessPolicyId: 'Access Policy',
    remark: 'Remark',
    enabled: 'Enabled',
  };
  const parsedRule = convertSecurityRule(rule);
  return Object.keys(parsedRule)
    .filter((x) => infoMap[x])
    .map((x) => `${infoMap[x]}: \`${parsedRule[x] || '\u200B'}\``)
    .join(', ');
};

const convertAccessPolicy = (raw) => {
  const result = {
    name: raw.name,
    description: raw.description,
  };
  if (raw.roles === null) {
    result.access = 'Public';
  } else if (raw.roles.length === 0 && raw.reverse === true) {
    result.access = 'Invite Only';
  } else if (isEqual(raw.roles, [WHO_CAN_ACCESS.OWNER])) {
    result.access = 'Owner Only';
  } else if (isEqual(raw.roles, [WHO_CAN_ACCESS.OWNER, WHO_CAN_ACCESS.ADMIN])) {
    result.access = 'Admin Only';
  } else {
    result.reverse = String(raw.reverse ?? '') || 'false';
    result.access = `Custom roles (${raw.roles.join(', ')})`;
  }
  return result;
};
const getAccessPolicyInfo = (policy) => {
  const infoMap = {
    name: 'Name',
    description: 'Description',
    reverse: 'Is Reverse',
    access: 'Access',
  };
  const parsedPolicy = convertAccessPolicy(policy);
  return Object.keys(parsedPolicy)
    .filter((x) => infoMap[x])
    .map((x) => `${infoMap[x]}: \`${parsedPolicy[x] || '\u200B'}\``)
    .join(', ');
};
const safeStringifyParse = (obj) => {
  try {
    return JSON.stringify(JSON.parse(obj), null, 2);
  } catch (err) {
    return obj;
  }
};
const convertResponseHeaderPolicy = (raw) => {
  const securityHeader = safeStringifyParse(raw.securityHeader);
  const cors = safeStringifyParse(raw.cors);
  const result = {
    name: `\`${raw.name || '\u200B'}\``,
    description: `\`${raw.description || '\u200B'}\``,
    securityHeader: securityHeader
      ? `
\`\`\`json
${securityHeader}
\`\`\`
`
      : '\u200B',
    cors: cors
      ? `
\`\`\`json
${cors}
\`\`\`
`
      : '\u200B',
  };
  return result;
};
const getResponseHeaderPolicyInfo = (policy) => {
  const parsedPolicy = convertResponseHeaderPolicy(policy);
  const infoMap = {
    name: 'Name',
    description: 'Description',
    securityHeader: 'Security Header',
    cors: 'CORS',
  };
  return Object.keys(parsedPolicy)
    .filter((x) => infoMap[x])
    .map((x) => `${infoMap[x]}: ${parsedPolicy[x]}`)
    .join(', ');
};

const getTaggingInfo = async (args, node, info) => {
  const { teamDid, tagging } = args;
  const { routing, did } = info;

  const prefix = process.env.NODE_ENV === 'production' ? routing.adminPath : '';

  const [tag, users] = await Promise.all([
    node.getTag({ teamDid, tag: { id: tagging.tagId } }),
    Promise.allSettled(tagging.taggableIds.map((id) => node.getUser({ teamDid, user: { did: id } }))),
  ]);

  const basePath =
    teamDid === did ? joinURL(prefix, '/team/members') : joinURL(prefix, '/blocklets/', teamDid, '/members');

  const userLinks = users
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map(({ value: u }) => `[${u.fullName}](${basePath})`)
    .join(', ');

  return {
    tag: tag?.title || tagging.tagId,
    userLinks,
  };
};

/**
 * 隐藏私密信息，主要字段有
 * 1. email
 * 2. password
 */
const hidePrivateInfo = (result, fields = []) => {
  // 默认需要隐藏的字段（不区分大小写匹配）
  const defaultFields = ['email', 'password'];
  // 合并默认字段和自定义字段
  const sensitiveFields = [...defaultFields, ...fields].map((f) => f.toLowerCase());

  // 检查字段名是否需要隐藏
  const isSensitiveField = (key) => {
    if (!key) return false;
    const lowerKey = key.toLowerCase();
    return sensitiveFields.some((field) => lowerKey.includes(field));
  };

  const processValue = (value, key) => {
    // 如果字段名匹配敏感字段，则隐藏
    // 使用反引号包裹，以代码样式显示星号，避免被 Markdown 渲染为加粗/斜体
    if (isSensitiveField(key) || (isString(value) && !emailSchema.validate(value).error)) {
      return '`***`';
    }

    // 递归处理对象
    if (isObject(value) && !isArray(value)) {
      return mapValues(value, processValue);
    }

    // 递归处理数组
    if (isArray(value)) {
      return map(value, (item) => processValue(item));
    }

    return value;
  };

  return processValue(result);
};

/**
 * Create log content in markdown format
 *
 * @param {string} action - GraphQL query/mutation name
 * @param {Record<string, string>} args - GraphQL arguments
 * @param {object} context - request context: user, ip, user-agent, etc.
 * @param {object} result - GraphQL resolve result
 * @param {object} info - server info
 * @param {object} node - server instance
 * @return {Promise<string>} the generated markdown source
 */
const getLogContent = async (action, args, context, result, info, node) => {
  const [site, [user, passport]] = await Promise.all([
    expandSite(args.id, info, node),
    expandUser(
      args.teamDid,
      args.userDid || get(args, 'user.did') || args.ownerDid || args.did || context.user.did,
      args.passportId,
      info,
      node
    ),
  ]);

  const prefix = process.env.NODE_ENV === 'production' ? info.routing.adminPath : '';

  switch (action) {
    // blocklets
    case 'installBlocklet':
      return `installed application ${result.meta.title}`;
    case 'deleteBlocklet':
      return `removed application ${result.meta.title}`; // prettier-ignore
    case 'backupBlocklet':
      return `backup application ${result.meta.title} to ${args.to}`; // prettier-ignore
    case 'startBlocklet':
      return `started ${componentOrApplicationInfo(result, args.componentDids)}`;
    case 'restartBlocklet':
      return `restarted ${componentOrApplicationInfo(result, args.componentDids)}`;
    case 'reloadBlocklet':
      return `reloaded ${componentOrApplicationInfo(result, args.componentDids)}`;
    case 'stopBlocklet':
      return `stopped ${componentOrApplicationInfo(result, args.componentDids)}`;
    case 'resetBlocklet':
      return `reset ${componentOrApplicationInfo(result, args.childDid ? [args.childDid] : [])}`;
    case 'upgradeBlocklet':
      const actionName = result.action || 'upgraded';
      if (result.resultStatus === 'failed') {
        const errMsg = result.error?.message ? `: ${result.error.message}` : '';
        return `${actionName} component failed: **${getComponentNamesWithVersion(
          result,
          result.componentDids
        )}**${errMsg}`;
      }
      const newVersions = getComponentNamesWithVersion(result, result.componentDids);
      if (result.oldBlocklet) {
        const oldVersions = getComponentNamesWithVersion(result.oldBlocklet, result.componentDids);
        return `${actionName} component: **${newVersions}** from **${oldVersions}**`;
      }
      return `${actionName} component: **${newVersions}**`;
    case 'deleteComponent':
      return `removed ${result.deletedComponent.meta.title}@${result.deletedComponent.meta.version} ${args.keepData !== false ? 'but kept its data and config' : 'and its data and config'}`; // prettier-ignore
    case 'configBlocklet':
      return `updated following config for ${args.did?.length > 1 ? componentOrApplicationInfo(result, [args.did[1]]) : 'application'}: ${args.configs.map(x => `*${x.key}*`).join(', ')}`; // prettier-ignore
    case 'configVault':
      return `updated vault for ${args.teamDid} to ${args.vaultDid}`;
    // @see: core/state/lib/event.js#311
    case 'backupToSpaces':
      if (args?.success) {
        // @note: 目前只需要给出手动备份的审计日志,自动备份的审计日志不再显示出来
        return `Manual backup application to ${args.url} successfully:\n- Backup files have been stored [here](${args.backupUrl})`;
      }
      return `Backup application to ${args.url} failed:\n- Reason: <span style='color:red'>${args.errorMessage}</span>`;
    case 'disableAutoBackup':
      return `disabled auto backup for application ${args.did}`;
    case 'configNavigations':
      // eslint-disable-next-line prettier/prettier
      return `updated following navigations:\n${args.navigations.map((x) => `- ${x.title}: ${x.link}\n`)}`;
    case 'configTheme':
      return `updated theme for application ${args.did}`;
    case 'configAuthentication':
      return `updated authentication for blocklet ${getBlockletInfo(result, info)}:\n${args.authentication}`;
    case 'configDidConnect':
      return `updated DID Connect for blocklet ${getBlockletInfo(result, info)}:\n${args.didConnect}`;
    case 'configDidConnectActions':
      return `updated DID Connect Actions for blocklet ${getBlockletInfo(result, info)}:\n${args.actionConfig}`;
    case 'joinFederatedLogin':
      return `blocklet ${getBlockletInfo(result, info)} join federated login to ${args.appUrl}`;
    case 'quitFederatedLogin':
      return args.targetDid
        ? `blocklet ${getBlockletInfo(result, info)} force quit federated member: ${args.targetDid}`
        : `blocklet ${getBlockletInfo(result, info)} quit federated login`;
    case 'disbandFederatedLogin':
      return `blocklet ${getBlockletInfo(result, info)} disband federated login`;
    case 'auditFederatedLogin':
      return `blocklet ${getBlockletInfo(result, info)} audit federated login member ${args.memberPid} with status: ${
        args.status
      }`;
    case 'configNotification': {
      const { notification } = args;
      const notificationObject = JSON.parse(notification || '{}');
      const resultObj = {};
      if (notificationObject.email) {
        resultObj.email = hidePrivateInfo(notificationObject.email, ['from', 'host', 'password']);
      }
      if (notificationObject.push) {
        resultObj.push = hidePrivateInfo(notificationObject.push);
      }

      return `updated following notification setting: ${JSON.stringify(resultObj)}`;
    }
    case 'updateComponentTitle':
      return `update component title to **${args.title}**`;
    case 'updateComponentMountPoint':
      return `update component mount point to **${args.mountPoint}**`;
    // store
    case 'addBlockletStore':
      return `added blocklet store ${args.url}${args.scope ? ` for ${args.scope}` : ''}`;
    case 'deleteBlockletStore':
      return `removed blocklet store ${args.url}`;
    case 'selectBlockletStore':
      return `selected blocklet store ${args.url}`;
    case 'updateAppSessionConfig':
      return `updated session config: ${JSON.stringify(args.config)}`;

    // blocklet federated config
    case 'requestJoinFederated':
      return `request join in federated: member site ${getSiteInfo(
        args.memberSite
      )} applied to join master site ${getBlockletInfo(result, info)}`;
    case 'quitFederated':
      return `quit federated: member site ${getSiteInfo(args.memberSite)} quit ${getBlockletInfo(result, info)}`;
    case 'disbandFederated':
      return `disband federated: master site ${getSiteInfo(args.masterSite)} disband federated site`;
    case 'auditFederated':
      return `audit federated: master site ${getSiteInfo(
        args.masterSite
      )} audit federated login member site ${getBlockletInfo(result, info)} with status: ${args.status}`;

    // federated user relate
    case 'loginFederated':
      return `auto login federated member: ${user} with master site ${getBlockletInfo(
        result,
        info
      )} try to login into member site ${getSiteInfo(args.memberSite)}`;
    case 'loginFederatedMaster':
      return `user login federated master: user ${user} with member site ${getBlockletInfo(
        result,
        info
      )} login state try to login master site ${getSiteInfo(args.masterSite)}`;
    case 'loginByMaster':
      return `user login: user ${user} with master site ${getSiteInfo(
        args.masterSite
      )} login state auto login into member site ${getBlockletInfo(result, info)}`;
    case 'migrateFederatedAccount':
      return `migrate federated account: member site ${getSiteInfo(args.callerSite)} ask account ${
        args.fromUserDid
      } bind account ${args.toUserDid}`;
    case 'syncMasterAuthorization':
      return `get federated master authorization: member site ${getBlockletInfo(result, info)} ask master site authorization`;
    case 'syncFederatedConfig':
      return `sync federated site config: site ${getBlockletInfo(result, info)} trigger sync federated sites config`;

    // teams: members/passports
    case 'addUser':
      if (args.passport) {
        return `${args.reason} and received **${args.passport.name}** passport`;
      }
      return `joined team by ${args.reason}`;
    case 'updateUser':
      return `${args.reason} and received **${args.passport.name}** passport`;
    case 'connectAccount':
      return `user ${user} connect with account ${args.connectedAccount.provider}: ${args.connectedAccount.did}`;
    case 'switchProfile':
      return `switched profile to ${args.profile.fullName}`;
    case 'switchPassport':
      return `${args?.provider ? `${args?.provider} ` : ''}${user} switched passport to ${args?.passport?.name}`;
    case 'login':
      return `${args?.provider ? `${args?.provider} ` : ''}${user} logged in with passport ${args?.passport?.name || 'Guest'}`;
    case 'configPassportIssuance':
      return `${args.enabled ? 'enabled' : 'disabled'} passport issuance`;
    case 'createPassportIssuance':
      return `issued **${args.name}** passport to ${user}, issuance id: ${result.id}`;
    case 'processPassportIssuance':
      return `claimed passport **${args.name}**, issuance id: ${args.sessionId}`;
    case 'revokeUserPassport':
      return `revoked **${passport}** passport of user ${user}`;
    case 'enableUserPassport':
      return `enabled **${passport}** passport of user ${user}`;
    case 'removeUser':
      return `removed user ${user}`;
    case 'removeUserPassport':
      return `remove **${passport}** passport of user ${user}`;
    case 'updateUserApproval':
      return `${args.user.approved ? 'enabled' : 'disabled'} user ${user}`;
    case 'updateUserTags':
      return `set tags to ${args.tags} for user ${user}`;
    case 'updateUserExtra':
      let type = args.type || '';
      const extraResult = result.extra || result;
      let resultStr = '\n';
      let isFormat = false;
      if (type === 'privacy' || Object.prototype.hasOwnProperty.call(extraResult, 'privacy')) {
        resultStr += Object.keys(extraResult.privacy)
          .map((x) => {
            const value = extraResult.privacy[x];
            let v = value;
            if (value === true || value === 'all') {
              v = 'public';
            } else if (value === false || value === 'private') {
              v = 'private';
            } else if (value === 'follower-only') {
              v = 'follower-only';
            } else {
              v = value;
            }
            return `- ${x}: ${v}`;
          })
          .join('\n');
        isFormat = true;
        type = 'privacy';
      }
      if (type === 'notifications' || Object.prototype.hasOwnProperty.call(extraResult, 'notifications')) {
        resultStr += Object.keys(extraResult?.notifications || {})
          .map((x) => `- ${x}: ${extraResult.notifications[x]}`)
          .join('\n');
        isFormat = true;
        type = 'notifications';
      }
      if (type === 'webhooks' || Object.prototype.hasOwnProperty.call(extraResult, 'webhooks')) {
        resultStr += (extraResult?.webhooks || []).length
          ? extraResult.webhooks.map((x) => `- ${x.type}: ${x.url}`).join('\n')
          : 'removed all webhooks';
        isFormat = true;
        type = 'webhooks';
      }
      if (!isFormat) {
        resultStr = JSON.stringify(hidePrivateInfo(extraResult));
        type = 'extra';
      }
      return `updated user ${type} for user ${user}: \n${resultStr}`;
    case 'updateUserAddress':
      const addressResult = Object.prototype.hasOwnProperty.call(result, 'address') ? result.address : result;
      return `updated user address for user ${user}: \n${JSON.stringify(hidePrivateInfo(addressResult))}`;
    case 'updateUserInfo':
      return `update user info for user ${user}: \n\n${JSON.stringify(hidePrivateInfo(result))}`;
    case 'deletePassportIssuance':
      return `removed passport issuance ${args.sessionId}`;
    case 'createMemberInvitation':
      return `created member invitation(${result.inviteId}: ${args.remark}) with **${args.role}** passport(within app: ${args.sourceAppPid})`; // prettier-ignore
    case 'deleteInvitation':
      return `removed unused member invitation(${args.inviteId})`;
    case 'issueKyc':
      return `issued ${args.doc.scope} kyc passport for ${args.doc.subject} to user ${user}`;
    case 'createRole':
      return `created passport ${args.name}(${args.title})`;
    case 'updateRole':
      return `updated passport ${args.role.name}(${args.role.title})`;
    case 'updatePermissionsForRole':
      return `granted following permissions to passport ${args.roleName}: \n${args.grantNames.map(x => `- ${x}`).join('\n')}`; // prettier-ignore
    case 'configTrustedPassports':
      const trustedPassports = args.trustedPassports || [];
      if (trustedPassports.length === 0) {
        return 'removed all trusted passport issuers';
      }
      return `updated trusted passport issuers to following: \n${trustedPassports.map(x => `- ${x.remark}: ${x.issuerDid}`).join('\n')}`; // prettier-ignore
    case 'configTrustedFactories':
      const trustedFactories = args.trustedFactories || [];
      if (trustedFactories.length === 0) {
        return 'removed all trusted factories';
      }
      return `updated trusted factories to following: \n${trustedFactories.map(x => `- ${x.remark}: ${x.factoryAddress}`).join('\n')}`; // prettier-ignore
    case 'delegateTransferNFT':
      return `${args.owner} ${args.reason}`;
    case 'issuePassportToUser':
      return `issued **${args.role}** passport to ${user}`;
    case 'downloadLog':
      return `download log for ${args.days} day${args.days > 1 ? 's' : ''}`;
    case 'createTag':
      return `create tag ${args.tag.title}`;
    case 'updateTag':
      return `updated tag ${args.tag.id}`;
    case 'deleteTag':
      return `deleted tag ${args.tag.id}`;
    case 'destroySelf':
      return `user ${result.did} initiated account deletion`;
    case 'createTagging':
      if (args.tagging.taggableType === 'user') {
        const { tag, userLinks } = await getTaggingInfo(args, node, info);
        return `created tagging **${tag}** for ${userLinks}`;
      }

      return `created tagging **${args.tagging.tagId}** for ${args.tagging.taggableIds.join(', ')}`;
    case 'deleteTagging':
      if (args.tagging.taggableType === 'user') {
        const { tag, userLinks } = await getTaggingInfo(args, node, info);
        return `deleted tagging **${tag}** for ${userLinks}`;
      }

      return `deleted tagging ${args.tagging.tagId} for ${args.tagging.taggableIds.join(', ')}`;

    // accessKeys
    case 'createAccessKey':
      return `created access key ${result.accessKeyId} with passport ${args.passport}: ${args.remark}`;
    case 'updateAccessKey':
      return `updated access key ${result.accessKeyId} with following changes:\n - passport: ${args.passport}\n - remark: ${args.remark}`; // prettier-ignore
    case 'deleteAccessKey':
      return `deleted access key ${args.accessKeyId}`; // prettier-ignore

    // remote signing
    case 'remoteSign':
      return `component \`${args.componentId}\` signed payload remotely (type: ${args.payloadType}):\n\`\`\`\n${args.payloadContent || '(no content)'}\n\`\`\``;
    case 'remoteSignJWT':
      return `component \`${args.componentId}\` signed JWT remotely${args.jwtVersion ? ` (version: ${args.jwtVersion})` : ''}:\n\`\`\`\n${args.payloadContent || '(no content)'}\n\`\`\``;
    case 'remoteSignETH':
      return `component \`${args.componentId}\` signed Ethereum data remotely${args.hashBeforeSign ? ' (pre-hashed)' : ''}:\n\`\`\`\n${args.dataContent || '(no content)'}\n\`\`\``;
    case 'remoteDeriveWallet':
      return `component \`${args.componentId}\` derived wallet from sub: \`${args.sub}\`${args.index !== undefined ? `, index: ${args.index}` : ''}`;

    // integrations
    case 'createWebHook':
      return `added integration ${result.id}: \n- type: ${args.type}\n${args.params.map(x => `- ${x.name}: ${x.value}`).join('\n')}`; // prettier-ignore
    case 'deleteWebHook':
      return `deleted integration ${args.id}`;

    // server
    case 'updateNodeInfo':
      return `updated basic server settings: \n${Object.keys(args).map(x => `- ${x}: ${args[x]}`).join('\n')}`; // prettier-ignore
    case 'upgradeNodeVersion':
      return `upgrade server to ${info.nextVersion}`;
    case 'restartServer':
      return 'server was restarted';
    case 'startServer':
      return 'server was started';
    case 'stopServer':
      return 'server was stopped';

    // certificates
    case 'addCertificate':
      return `added certificate #${args.id}, domain ${result.domain}`;
    case 'deleteCertificate':
      return `deleted certificate #${args.id}`;
    case 'updateCertificate':
      return `updated certificate #${args.id}`;
    case 'issueLetsEncryptCert':
      return `tried to issue lets encrypt certificate for domain **${args.domain}**, ticket: ${result.id}`;

    // router
    case 'addDomainAlias':
      return `added extra domain **${args.domainAlias}** to ${site}`; // prettier-ignore
    case 'deleteDomainAlias':
      return `removed extra domain **${args.domainAlias}** from ${site}`; // prettier-ignore
    case 'updateRoutingSite':
      return `updated site from ${site}`; // prettier-ignore
    case 'addRoutingRule':
      return `added routing rule **${args.rule?.from?.pathPrefix}** from ${site}`; // prettier-ignore
    case 'updateRoutingRule':
      return `updated routing rule **${args.rule?.from?.pathPrefix}** from ${site}`; // prettier-ignore
    case 'deleteRoutingRule':
      return `deleted routing rule from ${site}`; // prettier-ignore
    case 'clearCache':
      return args.pattern ? `cleared cache with pattern ${args.pattern}` : 'cleared all cache';
    case 'updateGateway': {
      const changes = [
        'Updated Gateway Settings:',
        args.cacheEnabled ? `* Global Cache: enabled, rate: ${args.cacheEnabled}` : '* Global Cache: disabled',
        args.requestLimit?.enabled
          ? `* Rate Limiting: enabled, rate: ${args.requestLimit.rate}`
          : '* Rate Limiting: disabled',
        args.blockPolicy?.enabled
          ? `* Request Blocking: enabled, blacklist: ${args.blockPolicy.blacklist.join(', ')}`
          : '* Request Blocking: disabled',
        args.proxyPolicy?.enabled
          ? `* Proxy Settings: enabled, real ip header: ${args.proxyPolicy.realIpHeader}, trusted proxies: ${args.proxyPolicy.trustedProxies.join(', ')}`
          : '* Proxy Settings: disabled',
        args.wafPolicy?.enabled
          ? `* WAF: enabled, mode: ${args.wafPolicy.mode}, inbound anomaly score threshold: ${args.wafPolicy.inboundAnomalyScoreThreshold}, outbound anomaly score threshold: ${args.wafPolicy.outboundAnomalyScoreThreshold}, log level: ${args.wafPolicy.logLevel}`
          : '* WAF: disabled',
      ];
      const message = changes.join('\n');
      return message;
    }
    case 'createTransferInvitation':
      return `created a transfer node invitation(${result.inviteId})`;

    // security-rule
    case 'addBlockletSecurityRule':
      return `Create Blocklet Security Rule (${result.id}): ${getSecurityRuleInfo(args.data)}`;
    case 'updateBlockletSecurityRule':
      return `Update Blocklet Security Rule (${result.id}): ${getSecurityRuleInfo(args.data)}`;
    case 'deleteBlockletSecurityRule':
      return `Delete Blocklet Security Rule (${args.id})`;
    // access-policy
    case 'addBlockletAccessPolicy':
      return `Create Blocklet Access Policy (${result.id}): ${getAccessPolicyInfo(args.data)}`;
    case 'updateBlockletAccessPolicy':
      return `Update Blocklet Access Policy (${result.id}): ${getAccessPolicyInfo(args.data)}`;
    case 'deleteBlockletAccessPolicy':
      return `Delete Blocklet Access Policy (${args.id})`;
    // response-header-policy
    case 'addBlockletResponseHeaderPolicy':
      return `Create Blocklet Response Header Policy (${result.id}): ${getResponseHeaderPolicyInfo(args.data)}`;
    case 'updateBlockletResponseHeaderPolicy':
      return `Update Blocklet Response Header Policy (${result.id}): ${getResponseHeaderPolicyInfo(args.data)}`;
    case 'deleteBlockletResponseHeaderPolicy':
      return `Delete Blocklet Response Header Policy (${args.id})`;

    // blocklet webhooks
    case 'createWebhookEndpoint':
      return `Create Blocklet Webhook(${result.id})`;
    case 'updateWebhookEndpoint':
      return `Update Blocklet Webhook(${result.id})`;
    case 'deleteWebhookEndpoint':
      return `Delete Blocklet Webhook(${result.id})`;
    case 'ensureBlockletRunning':
      return `${result.title}:\n* ${result.description}`;
    case 'retryWebhookAttempt':
      return `Retry Webhook Attempt(${args.attemptId})`;
    case 'regenerateWebhookEndpointSecret':
      return `Regenerate Webhook Secret(${args.id})`;

    case 'addUploadEndpoint':
      return `Create Upload Endpoint(${args.url})`;
    case 'deleteUploadEndpoint':
      return `Delete Upload Endpoint(${args.did})`;
    case 'connectToEndpoint':
      return `Connect to Endpoint(${result.url})`;
    case 'disconnectFromEndpoint':
      return `Disconnect from Endpoint(${result.endpointId})`;
    case 'publishToEndpoint':
      return `Publish to Endpoint(${result.endpointId})`;

    case 'createOAuthClient':
      return `Create ${args.teamDid} OAuth Client:(${result.clientId})`;
    case 'updateOAuthClient':
      return `Update ${args.teamDid} OAuth Client:(${result.clientId})`;
    case 'deleteOAuthClient':
      return `Delete ${args.teamDid} OAuth Client:(${args.clientId})`;

    case 'updateBlockletSettings': {
      const changes = [];
      if (!isNil(args.enableSessionHardening)) {
        changes.push(`* Session Hardening: ${args.enableSessionHardening}`);
      }
      if (!isNil(args.invite)) {
        changes.push(`* Invite: ${JSON.stringify(args.invite)}`);
      }
      if (!isNil(args.gateway)) {
        changes.push(`* Gateway: ${JSON.stringify(args.gateway)}`);
      }

      return `Update Blocklet Extras Settings:(${args.did} to ${changes.join(', ')})`;
    }

    // user follow
    case 'followUser':
    case 'unfollowUser':
      const followerUser = await node.getUser({ teamDid: args.teamDid, user: { did: args.followerDid } });
      return `[${followerUser.fullName}](${joinURL(prefix, '/team/members')}) ${action === 'followUser' ? 'followed' : 'unfollowed'} user ${user}`;

    // connect to aigne
    case 'connectToAigne':
      return `Connect to Aigne(${args.baseUrl})`;
    case 'disconnectToAigne':
      return `Disconnect to Aigne(${args.url})`;

    // org 相关
    case 'createOrg':
      return `${user} created an org(${args.name})`;
    case 'deleteOrg':
      return `${user} deleted the org(${args.id})`;
    case 'updateOrg':
      return `${user} updated the org(${args.org.name}): \n${Object.keys(omit(args.org, ['id']))
        .map((x) => `- ${x}: ${args.org[x]}`)
        .join('\n')}`;
    case 'removeOrgMember': {
      const [member, org, operator] = await Promise.all([
        node.getUser({ teamDid: args.teamDid, user: { did: args.userDid } }),
        node.getOrg({ teamDid: args.teamDid, id: args.orgId }, context),
        node.getUser({ teamDid: args.teamDid, user: { did: context.user.did } }),
      ]);
      return `[${operator.fullName}](${joinURL(prefix, '/team/members')}) removed a member([${member.fullName}](${joinURL(prefix, '/team/members')})) from the org(${org.name})`;
    }
    case 'inviteMembersToOrg': {
      const [operator, joinedOrg] = await Promise.all([
        node.getUser({ teamDid: args.teamDid, user: { did: context.user.did } }),
        node.getOrg({ teamDid: args.teamDid, id: args.orgId }, context),
      ]);
      if (args.inviteType === 'internal') {
        const dids = args.userDids || [];
        const { users } = await node.getUsers({ teamDid: args.teamDid, dids: dids.slice(0, 5) });
        const invitedMembers = users.length < dids.length ? [...users, '...'] : users;
        return `[${operator.fullName}](${joinURL(prefix, '/team/members')}) invited ${dids.length} ${dids.length > 1 ? 'members' : 'member'} to join the org(${joinedOrg.name}): \n${invitedMembers.map((x) => (x.fullName ? `- [${x.fullName}](${joinURL(prefix, '/team/members')})` : `- ${x}`)).join('\n')}`;
      }
      return `[${operator.fullName}](${joinURL(prefix, '/team/members')}) invited members to join the org(${joinedOrg.name})`;
    }
    case 'addOrgResource': {
      const org = await node.getOrg({ teamDid: args.teamDid, id: args.orgId }, context);
      const resourceIds = (args.resourceIds || []).slice(0, 5);
      const displayResourceIds = resourceIds.length < args.resourceIds.length ? [...resourceIds, '...'] : resourceIds;
      return `${user} added ${resourceIds.length} ${resourceIds.length > 1 ? 'resources' : 'resource'} to the org(${org.name}): \n${displayResourceIds.map((x) => `- ${x}`).join('\n')}`;
    }
    case 'migrateOrgResource': {
      const org = await node.getOrg({ teamDid: args.teamDid, id: args.to }, context);
      const resourceIds = (args.resourceIds || []).slice(0, 5);
      const displayResourceIds = resourceIds.length < args.resourceIds.length ? [...resourceIds, '...'] : resourceIds;
      return `${user} migrated ${resourceIds.length} ${resourceIds.length > 1 ? 'resources' : 'resource'} to the org(${org.name}): \n${displayResourceIds.map((x) => `- ${x}`).join('\n')}`;
    }

    default:
      return action;
  }
};

/**
 * @description 获取日志的种类
 * @param {string} action
 * @return {'blocklet' | 'team' | 'security' | 'integrations' | 'server' | 'certificates' | 'gateway' | ''}
 */
const getLogCategory = (action) => {
  switch (action) {
    // blocklets
    case 'installBlocklet':
    case 'installComponent':
    case 'startBlocklet':
    case 'restartBlocklet':
    case 'reloadBlocklet':
    case 'stopBlocklet':
    case 'resetBlocklet':
    case 'deleteBlocklet':
    case 'deleteComponent':
    case 'configBlocklet':
    case 'configVault':
    case 'upgradeBlocklet':
    case 'upgradeComponents':
    case 'configNavigations':
    case 'configTheme':
    case 'configAuthentication':
    case 'configDidConnect':
    case 'configNotification':
    case 'updateComponentTitle':
    case 'updateComponentMountPoint':
    case 'backupToSpaces':
    case 'joinFederatedLogin':
    case 'quitFederatedLogin':
    case 'disbandFederatedLogin':
    case 'auditFederatedLogin':
    case 'requestJoinFederated':
    case 'requestQuitFederated':
    case 'disbandFederated':
    case 'auditFederated':
    case 'syncMasterAuthorization':
    case 'syncFederatedConfig':
    case 'ensureBlockletRunning':
    case 'deleteOAuthClient':
    case 'createOAuthClient':
    case 'updateOAuthClient':
    case 'updateBlockletSettings':
    case 'connectToAigne':
    case 'disconnectToAigne':
      return 'blocklet';

    case 'addUploadEndpoint':
    case 'deleteUploadEndpoint':
    case 'connectToEndpoint':
    case 'disconnectFromEndpoint':
    case 'publishToEndpoint':
      return 'studio';

    // store，此处应该返回 server
    case 'addBlockletStore':
    case 'deleteBlockletStore':
    case 'selectBlockletStore':
      return 'server';

    // teams: members/passports
    case 'addUser':
    case 'updateUser':
    case 'switchProfile':
    case 'switchPassport':
    case 'login':
    case 'logout':
    case 'processPassportIssuance':
    case 'configPassportIssuance':
    case 'createPassportIssuance':
    case 'deletePassportIssuance':
    case 'revokeUserPassport':
    case 'enableUserPassport':
    case 'removeUserPassport':
    case 'updateUserApproval':
    case 'updateUserTags':
    case 'createMemberInvitation':
    case 'deleteInvitation':
    case 'createRole':
    case 'updateRole':
    case 'updatePermissionsForRole':
    case 'configTrustedPassports':
    case 'configTrustedFactories':
    case 'delegateTransferNFT':
    case 'createTransferInvitation':
    case 'connectAccount':
    case 'createTag':
    case 'updateTag':
    case 'deleteTag':
    case 'loginFederated':
    case 'loginByMaster':
    case 'loginFederatedMaster':
    case 'migrateFederatedAccount':
    case 'destroySelf':
    case 'updateUserExtra':
    case 'updateUserAddress':
    case 'updateUserInfo':
    case 'followUser':
    case 'unfollowUser':
    case 'createOrg':
    case 'updateOrg':
    case 'deleteOrg':
    case 'removeOrgMember':
    case 'inviteMembersToOrg':
    case 'addOrgResource':
    case 'migrateOrgResource':
      return 'team';

    // accessKeys
    case 'createAccessKey':
    case 'updateAccessKey':
    case 'deleteAccessKey':
    case 'addBlockletSecurityRule': // security-rule
    case 'updateBlockletSecurityRule':
    case 'deleteBlockletSecurityRule':
    case 'addBlockletAccessPolicy': // access-policy
    case 'updateBlockletAccessPolicy':
    case 'deleteBlockletAccessPolicy':
    case 'addBlockletResponseHeaderPolicy': // response-header-policy
    case 'updateBlockletResponseHeaderPolicy':
    case 'deleteBlockletResponseHeaderPolicy':
    case 'remoteSign': // remote signing
    case 'remoteSignJWT':
    case 'remoteSignETH':
    case 'remoteDeriveWallet':
      return 'security';

    // integrations
    case 'createWebHook':
    case 'deleteWebHook':
    case 'createWebhookEndpoint':
    case 'updateWebhookEndpoint':
    case 'deleteWebhookEndpoint':
    case 'retryWebhookAttempt':
    case 'regenerateWebhookEndpointSecret':
      return 'integrations';

    // server
    case 'updateNodeInfo':
    case 'upgradeNodeVersion':
    case 'startServer':
    case 'stopServer':
      return 'server';

    // certificates
    case 'addCertificate':
    case 'deleteCertificate':
    case 'updateCertificate':
    case 'issueLetsEncryptCert':
      return 'certificates';

    case 'clearCache':
    case 'updateGateway':
      return 'gateway';

    default:
      return '';
  }
};

const fixActor = (actor) => {
  if ([NODE_SERVICES.AUTH, 'blocklet'].includes(actor?.role)) {
    actor.role = '';
  }
};

/**
 * @extends BaseState<import('@abtnode/models').AuditLogState>
 */
class AuditLogState extends BaseState {
  constructor(...args) {
    super(...args);
    this.enableCountCache = `audit-log-count-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Create new audit log
   *
   * @param {string} action the api name
   * @param {object} args the api args
   * @param {object} result the api result
   * @param {object} context the log context
   * {
      protocol: 'http',
      user: {
        meta: 'profile',
        fullName: 'user',
        email: 'user@example.com',
        type: 'profile',
        did: 'z1jq5bGF64wnZiy29EbRyuQqUxmRHmSdt1Q',
        pk: 'zHTcKwgi9DK8US8QQY9K7wQ3qF79CtrWYn6BYAgTQUeVQ',
        passports: [ [Object] ],
        approved: true,
        locale: 'en',
        firstLoginAt: '2022-04-27T22:55:51.788Z',
        lastLoginAt: '2022-04-27T22:55:51.788Z',
        id: 'dvOIJJVUJHGxnWBU',
        createdAt: '2022-04-27T22:55:51.789Z',
        updatedAt: '2022-04-27T22:55:51.789Z',
        role: 'owner',
        passportId: 'z2iTzSDhwGQFtYXeya8kqCyXro1tRkwUuwN6K'
      },
      url: '/api/gql?locale=en',
      query: { locale: 'en' },
      hostname: '192.168.123.236',
      port: 0,
      ip: '127.0.0.1'
    }
   * @return {object} new doc
   */
  create({ action, args = {}, context = {}, result = {} }, node) {
    return new Promise(async (resolve) => {
      // Do not store secure configs in audit log
      if (Array.isArray(args.configs)) {
        args.configs.forEach((x) => {
          if (x.secure) {
            x.value = '******';
          }
        });
      }

      try {
        const { ip, ua, user = {} } = context;
        const [info, uaInfo] = await Promise.all([node.states.node.read(), parse(ua)]);

        fixActor(user);
        const content = (await getLogContent(action, args, context, result, info, node)).trim();
        const actor = pick(user.actual || user, ['did', 'fullName', 'role']);
        actor.source = '';
        const teamDid =
          user.blockletDid || args.teamDid || (typeof args?.did === 'string' ? args.did : get(args, 'did.0'));
        const userDid = user.did || args.userDid || get(args, 'user.did') || args.ownerDid;
        if (teamDid && userDid && teamDid !== userDid) {
          try {
            let fullUser = await node.getUser({
              teamDid,
              user: { did: userDid },
              options: {
                enableConnectedAccount: true,
              },
            });
            if (!fullUser && teamDid !== info.did) {
              fullUser = await node.getUser({
                teamDid: info.did,
                user: { did: userDid },
                options: {
                  enableConnectedAccount: true,
                },
              });
              actor.source = 'server';
            }

            actor.avatar = fullUser?.avatar || '';

            if (!actor.fullName) {
              actor.fullName = fullUser?.fullName || '';
            }
          } catch (err) {
            logger.error('get user info error', err);
          }
        } else {
          actor.avatar = '';
          // actor.did = teamDid || info.did;
        }

        const data = await this.insert({
          scope: getScope(args) || info.did, // server or blocklet did
          action,
          category: await getLogCategory(action),
          content: content.slice(0, 10 * 1000),
          actor,
          extra: args,
          env: pick(uaInfo, ['browser', 'os', 'device']),
          ip,
          ua,
          componentDid: context?.user?.componentDid || null,
        });

        logger.info('create', { action, userDid: actor.did, componentDid: context?.user?.componentDid || null });
        return resolve(data);
      } catch (err) {
        logger.error('create error', { error: err, action, args, context });
        return resolve(null);
      }
    });
  }

  findPaginated({ scope, category, actionOrContent, paging } = {}) {
    const conditions = {
      where: {},
    };
    if (scope) {
      conditions.where.scope = scope;
    }
    if (category) {
      conditions.where.category = category;
    }
    if (actionOrContent) {
      conditions.where[Op.or] = [
        { action: { [Op.like]: `%${actionOrContent}%` } },
        { content: { [Op.like]: `%${actionOrContent}%` } },
      ];
    }

    return super.paginate(conditions, { createdAt: -1 }, { pageSize: 20, ...paging });
  }

  /* 数据迁移使用到的方法  */
  async insertBlockletAuditLogs(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return { successIds: [], failedIds: [] };
    }

    // 清除计数缓存，确保后续 count() 查询准确
    await this.clearCountCache();

    // 记录所有待插入的 ID
    const allIds = data.map((x) => x.id);

    /**
     * bulkCreate 参数说明：
     *
     * 1. ignoreDuplicates: true
     *    - 生成 INSERT IGNORE (MySQL) 或 ON CONFLICT DO NOTHING (PostgreSQL)
     *    - 遇到唯一键冲突时跳过该条记录，继续插入其他记录
     *    - 核心参数：实现"部分失败不影响其他记录"
     *
     * 2. validate: false
     *    - 跳过 Sequelize 模型层的验证逻辑
     *    - 直接交给数据库处理约束检查
     *    - 提升批量插入性能（无需逐条验证）
     *
     * 3. returning: true
     *    - 插入后返回完整的记录数据（包含自动生成的字段）
     *    - 用于获取成功插入的记录 ID
     *    - PostgreSQL 原生支持，MySQL 通过额外查询实现
     */
    const result = await this.model.bulkCreate(data, {
      ignoreDuplicates: true,
      validate: false,
      returning: true,
    });

    const insertedIds = result.map((x) => x.id).filter(Boolean);

    // 全部插入成功，无需额外查询
    if (insertedIds.length === allIds.length) {
      return { successIds: allIds, failedIds: [] };
    }

    // 计算未成功插入的 ID
    const notInsertedIds = allIds.filter((id) => !insertedIds.includes(id));

    // 批量查询未插入的 ID，判断是否已存在（已存在的也算成功）
    const existingRecords = await this.find({
      where: { id: { [Op.in]: notInsertedIds } },
      attributes: ['id'],
    });

    const existingIds = existingRecords.map((x) => x.id);
    const failedIds = notInsertedIds.filter((id) => !existingIds.includes(id));

    // successIds = 本次插入成功的 + 已存在的（都算成功）
    const successIds = [...insertedIds, ...existingIds];

    if (failedIds.length > 0) {
      logger.error(`Found ${failedIds.length} truly failed records`, { failedIds });
    }

    return { successIds, failedIds };
  }

  removeBlockletAuditLogs(ids) {
    return this.remove({ where: { id: { [Op.in]: ids } } });
  }
}

module.exports = AuditLogState;
