/* eslint-disable newline-per-chained-call */
const Joi = require('joi');
const { DOMAIN_FOR_DEFAULT_SITE, ROUTING_RULE_TYPES, ROUTER_CACHE_GROUPS } = require('@abtnode/constant');
const { urlPathFriendly } = require('@blocklet/meta/lib/url-path-friendly');
const { getMultipleLangParams } = require('./util');

const WILDCARD_DOMAIN_REGEX = /^\*.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/;

const DOMAIN_SCHEMA = Joi.string().domain({ minDomainSegments: 1, tlds: false }).lowercase();

const domainMessages = {
  en: {
    'alternatives.match': 'Invalid domain name, please enter a valid domain name, e.g. my-domain, my-domain.com',
  },
  zh: {
    'alternatives.match': '无效的域名, 请输入正确的域名，比如 my-domain, my-domain.com',
  },
};

const getPrefixSchema = (field) =>
  Joi.string()
    .trim()
    .max(150)
    .messages({
      zh: { 'string.empty': `${field} 不能为空`, 'string.max': `${field} 的最大长度是 150` },
      en: { 'string.empty': `${field} cannot be empty`, 'string.max': `The maximum length of ${field} is 150` },
    })
    .custom((value) => urlPathFriendly(value));

const ruleSchema = {
  isProtected: Joi.boolean(),

  from: Joi.object({
    pathPrefix: getPrefixSchema('from.pathPrefix').required(),
    groupPathPrefix: Joi.string().trim().min(1).max(150), // path prefix of interface of root blocklet
    header: Joi.any(), // TODO: header does not take effect
  }),

  to: {
    type: Joi.string()
      .label('type')
      .valid(
        ROUTING_RULE_TYPES.DAEMON,
        ROUTING_RULE_TYPES.SERVICE,
        ROUTING_RULE_TYPES.BLOCKLET,
        ROUTING_RULE_TYPES.REDIRECT,
        ROUTING_RULE_TYPES.GENERAL_PROXY,
        ROUTING_RULE_TYPES.DIRECT_RESPONSE,
        ROUTING_RULE_TYPES.GENERAL_REWRITE,
        ROUTING_RULE_TYPES.COMPONENT,
        ROUTING_RULE_TYPES.NONE
      )
      .required(),
    did: Joi.string()
      .label('did')
      .when('type', {
        is: Joi.string().valid(ROUTING_RULE_TYPES.BLOCKLET, ROUTING_RULE_TYPES.COMPONENT),
        then: Joi.required(),
      }), // root blocklet did
    port: Joi.number().label('port').port().when('type', { is: ROUTING_RULE_TYPES.BLOCKLET, then: Joi.required() }),
    url: Joi.string()
      .label('url')
      .when('type', {
        is: Joi.string().valid(ROUTING_RULE_TYPES.REDIRECT, ROUTING_RULE_TYPES.GENERAL_REWRITE),
        then: Joi.required(),
      }),
    redirectCode: Joi.alternatives()
      .try(301, 302, 307, 308)
      .label('redirect code')
      .when('type', { is: ROUTING_RULE_TYPES.REDIRECT, then: Joi.required() }),
    interfaceName: Joi.string() // root interface
      .label('interface name')
      .when('type', { is: ROUTING_RULE_TYPES.BLOCKLET, then: Joi.required() }),
    response: Joi.object({
      status: Joi.number().required(),
      contentType: Joi.string(),
      body: Joi.string().max(4096).required(),
    })
      .label('response')
      .when('type', {
        is: ROUTING_RULE_TYPES.DIRECT_RESPONSE,
        then: Joi.required(),
      }),
    componentId: Joi.string().label('component id'), // component global id
    // FUTURE: blocklets can register routing rules for provider cache
    cacheGroup: Joi.string()
      .label('cache group')
      .valid(...Object.keys(ROUTER_CACHE_GROUPS))
      .allow('')
      .default(''),
    targetPrefix: getPrefixSchema('to.targetPrefix'), // path prefix of interface of target blocklet
    pageGroup: Joi.string().allow('').default(''),
  },

  // List of services that manipulate the request before the upstream blocklet
  services: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required().trim(),
        version: Joi.string().required().trim(),
        config: Joi.string().optional().default('{}'),
      }).unknown(true)
    )
    .optional()
    .default([]),
};

const corsSchema = Joi.array()
  .items(DOMAIN_SCHEMA, Joi.string().valid(DOMAIN_FOR_DEFAULT_SITE, '__none__'), Joi.string().ip())
  .min(1)
  .optional();

const ruleJoiSchema = Joi.object(ruleSchema);

const addDomainAlias = Joi.alternatives()
  .try(
    DOMAIN_SCHEMA,
    Joi.string().regex(WILDCARD_DOMAIN_REGEX) // 这种其实是一种特殊的 tld
  )
  .messages(domainMessages)
  .required();

const domainAliases = Joi.array().items(
  Joi.object({
    value: addDomainAlias,
    isProtected: Joi.boolean(),
    certificateId: Joi.string().optional(),
    type: Joi.string().optional(),
    nftDid: Joi.string().optional(),
    chainHost: Joi.string().optional(),
    metadata: Joi.object().optional(),
  })
);

const updateAliases = domainAliases.required();

const addSiteSchema = Joi.object({
  domain: Joi.alternatives()
    .try(
      DOMAIN_SCHEMA,
      Joi.string().valid('', DOMAIN_FOR_DEFAULT_SITE),
      Joi.string().regex(WILDCARD_DOMAIN_REGEX) // 这种其实是一种特殊的 tld
    )
    .required()
    .messages(domainMessages),
  domainAliases,
  isProtected: Joi.boolean(),
  rules: Joi.array().items(ruleJoiSchema),
  corsAllowedOrigins: corsSchema,
});

const updateSite = Joi.object({
  id: Joi.string().required(),
  corsAllowedOrigins: corsSchema,
  domain: Joi.alternatives()
    .try(
      DOMAIN_SCHEMA,
      Joi.string().regex(WILDCARD_DOMAIN_REGEX) // 这种其实是一种特殊的 tld
    )
    .optional()
    .messages(domainMessages),
}).unknown();

const addRuleSchema = Joi.object({
  id: Joi.string().required(),
  rule: ruleJoiSchema,
});

const editRuleSchema = Joi.object({
  id: Joi.string().required(),
  rule: Joi.object({
    id: Joi.string().required(),
    ...ruleSchema,
  }),
});

const validateAddSite = (entity, context) => addSiteSchema.validateAsync(entity, getMultipleLangParams(context));
const validateAddDomainAlias = (entity, context) =>
  addDomainAlias.validateAsync(entity, getMultipleLangParams(context));
const validateUpdateSite = (entity, context) => updateSite.validateAsync(entity, getMultipleLangParams(context));
const validateAddRule = (entity, context) => addRuleSchema.validateAsync(entity, getMultipleLangParams(context));
const validateEditRule = (entity, context) => editRuleSchema.validateAsync(entity, getMultipleLangParams(context));

const validateUpdateDomainAliases = (entity, context) =>
  updateAliases.validateAsync(entity, getMultipleLangParams(context));

module.exports = {
  validateAddRule,
  validateAddSite,
  validateEditRule,
  validateAddDomainAlias,
  validateUpdateSite,
  validateUpdateDomainAliases,
};
