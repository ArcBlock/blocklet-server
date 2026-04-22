const { EventEmitter } = require('events');
const {
  WHO_CAN_ACCESS,
  NODE_SERVICES,
  WHO_CAN_ACCESS_PREFIX_ROLES,
  SECURITY_RULE_DEFAULT_ID,
  ACCESS_POLICY_PUBLIC,
  ACCESS_POLICY_INVITED_ONLY,
  ACCESS_POLICY_OWNER_ONLY,
  ACCESS_POLICY_ADMIN_ONLY,
  RESPONSE_HEADER_POLICY_SIMPLE_CORS_AND_SECURITY_HEADER,
} = require('@abtnode/constant');
const { BLOCKLET_CONFIGURABLE_KEY } = require('@blocklet/constant');
const { findServiceFromMeta } = require('@blocklet/meta/lib/util');
const pMap = require('p-map');
const { joinURL } = require('ufo');

const {
  addBlockletSecurityRule,
  deleteBlockletSecurityRule,
  getBlockletSecurityRule,
  getBlockletSecurityRules,
  updateBlockletSecurityRule,
  initializeDefaultData: initializeDefaultDataSecurityRule,
} = require('./security-rule');

const {
  addBlockletAccessPolicy,
  deleteBlockletAccessPolicy,
  getBlockletAccessPolicies,
  getBlockletAccessPolicy,
  updateBlockletAccessPolicy,
  initializeDefaultData: initializeDefaultDataAccessPolicy,
} = require('./access-policy');
const {
  addBlockletResponseHeaderPolicy,
  deleteBlockletResponseHeaderPolicy,
  getBlockletResponseHeaderPolicies,
  getBlockletResponseHeaderPolicy,
  updateBlockletResponseHeaderPolicy,
  initializeDefaultData: initializeDefaultDataResponseHeaderPolicy,
} = require('./response-header-policy');

const getWhoCanAccess = (blocklet) => {
  if (!blocklet) {
    return null;
  }
  // 1. 获取 blocklet 在启动阶段的配置
  if (blocklet?.settings?.whoCanAccess) {
    return blocklet.settings.whoCanAccess;
  }

  // 2. 获取 blocklet 在 blocklet.yml 中声明的配置
  const service = findServiceFromMeta(blocklet.meta, NODE_SERVICES.AUTH);
  if (service?.config?.whoCanAccess) {
    return service.config.whoCanAccess;
  }
  return null;
};

/**
 * 判断指定组件的访问权限，如果组件未设置，直接 fallback 到 default 就行（返回 Null 就会跳过）
 * @param {object} component 需要判断权限的组件实例
 * @returns {string|null}
 */
const getComponentWhoCanAccess = (blocklet, component) => {
  // 1. 获取组件自定义的访问权限配置
  const access = (component.configs || []).find((x) => x.key === BLOCKLET_CONFIGURABLE_KEY.COMPONENT_ACCESS_WHO);
  if (access) {
    return access.value;
  }
  // 2. 获取组件所属 blocklet 的访问权限配置，如果组件自身没有定义过访问权限，并且所属 blocklet 有配置统一的访问权限，则应该 fallback 到 default 配置
  const blockletAccess = getWhoCanAccess(blocklet);
  if (blockletAccess) {
    return null;
  }
  // 3. 获取当前 component 在 blocklet.yml 中声明的配置
  const service = findServiceFromMeta(component, NODE_SERVICES.AUTH);
  if (service?.config?.whoCanAccess) {
    return service.config.whoCanAccess;
  }
  return null;
};

const getRolesFromAuthConfig = (whoCanAccess) => {
  if (!whoCanAccess.startsWith(WHO_CAN_ACCESS_PREFIX_ROLES)) {
    return [];
  }

  return whoCanAccess.substring(WHO_CAN_ACCESS_PREFIX_ROLES.length).split(',');
};

/**
 * 将旧的访问权限配置转换为新的 access policy 方案
 * @param {string} whoCanAccess 旧的访问权限配置
 * @returns {string | object}
 */
const convertWhoCanAccess2AccessPolicy = (whoCanAccess) => {
  if (whoCanAccess === WHO_CAN_ACCESS.ALL) {
    return ACCESS_POLICY_PUBLIC;
  }
  if (whoCanAccess === WHO_CAN_ACCESS.INVITED) {
    return ACCESS_POLICY_INVITED_ONLY;
  }
  if (whoCanAccess === WHO_CAN_ACCESS.OWNER) {
    return ACCESS_POLICY_OWNER_ONLY;
  }
  if (whoCanAccess === WHO_CAN_ACCESS.ADMIN) {
    return ACCESS_POLICY_ADMIN_ONLY;
  }
  if (whoCanAccess?.startsWith(WHO_CAN_ACCESS_PREFIX_ROLES)) {
    const roles = getRolesFromAuthConfig(whoCanAccess);
    return {
      roles,
      reverse: false,
    };
  }

  return null;
};

class SecurityAPI extends EventEmitter {
  constructor({ teamManager, blockletManager }) {
    super();

    this.teamManager = teamManager;
    this.blockletManager = blockletManager;
  }

  // security rule
  getBlockletSecurityRule(...args) {
    return getBlockletSecurityRule({ teamManager: this.teamManager }, ...args);
  }

  getBlockletSecurityRules(...args) {
    return getBlockletSecurityRules({ teamManager: this.teamManager }, ...args);
  }

  addBlockletSecurityRule(...args) {
    return addBlockletSecurityRule.bind(this)({ teamManager: this.teamManager }, ...args);
  }

  updateBlockletSecurityRule(...args) {
    return updateBlockletSecurityRule.bind(this)({ teamManager: this.teamManager }, ...args);
  }

  deleteBlockletSecurityRule(...args) {
    return deleteBlockletSecurityRule.bind(this)({ teamManager: this.teamManager }, ...args);
  }

  // response header policy
  getBlockletResponseHeaderPolicy(...args) {
    return getBlockletResponseHeaderPolicy({ teamManager: this.teamManager }, ...args);
  }

  getBlockletResponseHeaderPolicies(...args) {
    return getBlockletResponseHeaderPolicies({ teamManager: this.teamManager }, ...args);
  }

  addBlockletResponseHeaderPolicy(...args) {
    return addBlockletResponseHeaderPolicy.bind(this)({ teamManager: this.teamManager }, ...args);
  }

  updateBlockletResponseHeaderPolicy(...args) {
    return updateBlockletResponseHeaderPolicy.bind(this)({ teamManager: this.teamManager }, ...args);
  }

  deleteBlockletResponseHeaderPolicy(...args) {
    return deleteBlockletResponseHeaderPolicy.bind(this)({ teamManager: this.teamManager }, ...args);
  }

  // access policy
  getBlockletAccessPolicy(...args) {
    return getBlockletAccessPolicy({ teamManager: this.teamManager }, ...args);
  }

  getBlockletAccessPolicies(...args) {
    return getBlockletAccessPolicies({ teamManager: this.teamManager }, ...args);
  }

  addBlockletAccessPolicy(...args) {
    return addBlockletAccessPolicy.bind(this)({ teamManager: this.teamManager }, ...args);
  }

  updateBlockletAccessPolicy(...args) {
    return updateBlockletAccessPolicy.bind(this)({ teamManager: this.teamManager }, ...args);
  }

  deleteBlockletAccessPolicy(...args) {
    return deleteBlockletAccessPolicy.bind(this)({ teamManager: this.teamManager }, ...args);
  }

  // initialize default data
  async initializeDefaultData(...args) {
    const { did } = args?.[0] || {};
    if (did) {
      const upsertOrSkipSecurityRule = async (data) => {
        if (data.value === null) return;

        const generateAccessPolicyId = `migrate-${data.id}`;
        const isDefaultRule = data.id === SECURITY_RULE_DEFAULT_ID;

        const { securityRules } = await getBlockletSecurityRules({ teamManager: this.teamManager }, { did });
        const exist = securityRules.find((x) => x.id === data.id);
        if (exist && !isDefaultRule) return;

        const priority = isDefaultRule
          ? -1
          : securityRules.filter((x) => x.id !== SECURITY_RULE_DEFAULT_ID)?.length || 0;
        let accessPolicyId = null;
        if ([ACCESS_POLICY_PUBLIC, ACCESS_POLICY_INVITED_ONLY, ACCESS_POLICY_OWNER_ONLY].includes(data.value)) {
          accessPolicyId = data.value;
        } else {
          const roles = data?.value?.roles || [];
          if (roles.length === 0) return;
          const addResult = await addBlockletAccessPolicy.bind(this)(
            { teamManager: this.teamManager },
            {
              did,
              data: {
                id: generateAccessPolicyId,
                name: roles.join(','),
                description: `Migrate from legacy whoCanAccess: ${data.rawValue}`,
                roles,
                reverse: false,
                isProtected: false,
              },
            }
          );
          accessPolicyId = addResult.id;
        }

        if (isDefaultRule && exist) {
          await updateBlockletSecurityRule.bind(this)(
            { teamManager: this.teamManager },
            {
              did,
              data: {
                id: data.id,
                pathPattern: '*',
                priority,
                accessPolicyId,
                componentDid: data.componentDid,
              },
            }
          );
        } else {
          await addBlockletSecurityRule.bind(this)(
            { teamManager: this.teamManager },
            {
              did,
              data: {
                id: data.id,
                pathPattern: '*',
                priority,
                accessPolicyId,
                responseHeaderPolicyId: RESPONSE_HEADER_POLICY_SIMPLE_CORS_AND_SECURITY_HEADER,
                componentDid: data.componentDid,
              },
            }
          );
        }
      };

      // NOTICE: 需要初始化 blocklet 的数据库，才能执行后续的操作
      await this.teamManager.initDatabase(did);
      const blocklet = await this.blockletManager.getBlocklet(did);
      const ruleItem = {
        id: undefined,
        componentDid: null,
        value: null,
        rawValue: null,
      };
      ruleItem.id = SECURITY_RULE_DEFAULT_ID;
      ruleItem.componentDid = null;
      ruleItem.rawValue = getWhoCanAccess(blocklet) || WHO_CAN_ACCESS.ALL;
      ruleItem.value = convertWhoCanAccess2AccessPolicy(ruleItem.rawValue);
      // 迁移原有的 app 的访问权限配置
      await upsertOrSkipSecurityRule(ruleItem);

      // 迁移原有的 component 的访问权限配置
      await pMap(
        blocklet?.children || [],
        async (component) => {
          ruleItem.componentDid = component?.meta?.did;
          if (!ruleItem.componentDid) return;
          const mountpoint = joinURL('/', component?.mountPoint || '');
          if (mountpoint === '/') {
            // HACK: 这里需要特殊处理一下，将原来挂载到 / 下的组件指定的规则更新到默认规则下，而不是创建一个新的 /* 规则
            ruleItem.id = SECURITY_RULE_DEFAULT_ID;
          } else {
            ruleItem.id = `component-${ruleItem.componentDid}`;
          }
          ruleItem.rawValue = getComponentWhoCanAccess(blocklet, component);
          ruleItem.value = convertWhoCanAccess2AccessPolicy(ruleItem.rawValue);
          await upsertOrSkipSecurityRule(ruleItem);
        },
        {
          concurrency: 1,
        }
      );
    }
    await initializeDefaultDataResponseHeaderPolicy({ teamManager: this.teamManager }, ...args);
    await initializeDefaultDataAccessPolicy({ teamManager: this.teamManager }, ...args);
    await initializeDefaultDataSecurityRule({ teamManager: this.teamManager }, ...args);
  }
}

module.exports = SecurityAPI;
