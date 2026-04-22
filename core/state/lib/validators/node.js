/* eslint-disable newline-per-chained-call */
const {
  GATEWAY_RATE_LIMIT,
  GATEWAY_RATE_LIMIT_GLOBAL,
  GATEWAY_RATE_LIMIT_METHODS,
  GATEWAY_RATE_LIMIT_BURST_FACTOR,
} = require('@abtnode/constant');
const Joi = require('joi');
const isIp = require('is-ip');
const isUrl = require('is-url');
const isCidr = require('is-cidr');

const { getMultipleLangParams } = require('./util');

const nodeInfoSchema = Joi.object({
  name: Joi.string()
    .required()
    .messages({ zh: { 'string.empty': '名称不能为空' }, en: { 'string.empty': 'Name cannot be empty' } }),
  description: Joi.string()
    .required()
    .messages({ zh: { 'string.empty': '描述不能为空' }, en: { 'string.empty': 'Description cannot be empty' } }),
  registerUrl: Joi.string()
    .uri({ scheme: [/https?/] })
    .label('launcher url')
    .allow('')
    .optional()
    .messages({
      zh: { 'string.uriCustomScheme': '应用启动器必须是合法的 URL' },
      en: { 'string.uriCustomScheme': 'Blocklet Launcher must be a valid URL' },
    }),
  webWalletUrl: Joi.string()
    .uri({ scheme: [/https?/] })
    .label('web wallet url')
    .allow('')
    .optional()
    .messages({
      zh: { 'string.uriCustomScheme': 'Web Wallet 必须是合法的 URL' },
      en: { 'string.uriCustomScheme': 'Web Wallet must be a valid URL' },
    }),
  nftDomainUrl: Joi.string()
    .uri({ scheme: [/https?/] })
    .label('nft domain url')
    .allow('')
    .optional()
    .messages({
      zh: { 'string.uriCustomScheme': 'NFT Domain 必须是合法的 URL' },
      en: { 'string.uriCustomScheme': 'NFT Domain must be a valid URL' },
    }),
  autoUpgrade: Joi.boolean(),
  enableDocker: Joi.boolean().optional().default(false),
  enableDockerNetwork: Joi.boolean().optional().default(false),
  isDockerInstalled: Joi.boolean().optional().default(false),
  enableSessionHardening: Joi.boolean().optional().default(false),
  enableWelcomePage: Joi.boolean(),
  enableFileSystemIsolation: Joi.boolean(),
  diskAlertThreshold: Joi.number()
    .label('disk alarm threshold')
    .max(99)
    .min(1)
    .messages({
      zh: { 'number.min': '磁盘报警阈值不能低于 1%', 'number.max': '磁盘报警阈值不能高于 99%' },
      en: {
        'number.min': 'Disk usage alert threshold cannot fall below 1%',
        'number.max': 'Disk usage alert threshold cannot be higher than 99%',
      },
    }),
}).options({ stripUnknown: true });

const updateGatewaySchema = Joi.object({
  requestLimit: Joi.object({
    enabled: Joi.bool().required(),
    global: Joi.number()
      .min(GATEWAY_RATE_LIMIT_GLOBAL.min)
      .max(GATEWAY_RATE_LIMIT_GLOBAL.max)
      .when('requestLimit.enabled', { is: true, then: Joi.required() }),
    burstFactor: Joi.number()
      .min(GATEWAY_RATE_LIMIT_BURST_FACTOR.min)
      .max(GATEWAY_RATE_LIMIT_BURST_FACTOR.max)
      .default(2)
      .when('requestLimit.enabled', { is: true, then: Joi.required() }),
    burstDelay: Joi.number().min(0).max(60).default(0).when('requestLimit.enabled', { is: true, then: Joi.required() }),
    rate: Joi.number()
      .min(GATEWAY_RATE_LIMIT.min)
      .max(GATEWAY_RATE_LIMIT.max)
      .when('requestLimit.enabled', { is: true, then: Joi.required() }),
    methods: Joi.array()
      .items(Joi.string().valid(...GATEWAY_RATE_LIMIT_METHODS))
      .min(1)
      .default(GATEWAY_RATE_LIMIT_METHODS)
      .when('requestLimit.enabled', { is: true, then: Joi.required() }),
  }),
  cacheEnabled: Joi.bool().optional().default(true),
  blockPolicy: Joi.object({
    enabled: Joi.boolean().optional().default(false),
    blacklist: Joi.array()
      .items(
        Joi.string()
          .custom((value, helpers) => {
            if (!value) {
              return helpers.error('any.required');
            }

            // Check if value is a valid IP address
            if (isIp.v4(value) || isIp.v6(value)) {
              return value;
            }

            // Check if value is a valid CIDR range
            if (isCidr.v4(value) || isCidr.v6(value)) {
              return value;
            }

            // Check if value is a valid URL
            if (isUrl(value)) {
              return value;
            }

            return helpers.error('string.pattern.base');
          }, 'IP/CIDR/URL validation')
          .messages({
            'string.pattern.base': 'Blacklist item must be a valid IP address, CIDR range, or URL',
            'any.required': 'Blacklist item cannot be empty',
          })
      )
      .optional()
      .max(256)
      .default([]),
    autoBlocking: Joi.object({
      enabled: Joi.boolean().optional().default(false),
      windowSize: Joi.number().integer().min(1).default(1), // in seconds
      windowQuota: Joi.number().integer().min(2).default(5), // number of requests
      statusCodes: Joi.array().items(Joi.number().integer().min(100).max(599)).default([403, 429]).min(1), // status codes to check
      blockDuration: Joi.number().integer().min(60).default(3600), // in seconds
    }).default({
      enabled: false,
      windowSize: 1,
      windowQuota: 5,
      statusCodes: [403],
      blockDuration: 3600,
    }),
  }),
  proxyPolicy: Joi.object({
    enabled: Joi.boolean().optional().default(false),
    trustRecursive: Joi.boolean().optional().default(false),
    trustedProxies: Joi.array()
      .items(
        Joi.string()
          .custom((value, helpers) => {
            if (!value) {
              return helpers.error('any.required');
            }

            // Check if value is a valid IP address
            if (isIp.v4(value) || isIp.v6(value)) {
              return value;
            }

            // Check if value is a valid CIDR range
            if (isCidr.v4(value) || isCidr.v6(value)) {
              return value;
            }

            return helpers.error('string.pattern.base');
          }, 'IP/CIDR validation')
          .messages({
            'string.pattern.base': 'Trusted proxy must be a valid IP address or CIDR range',
            'any.required': 'Trusted proxy cannot be empty',
          })
      )
      .optional()
      .max(256)
      .default(['0.0.0.0/0']),
    realIpHeader: Joi.string().optional().default('X-Forwarded-For'),
  }),
  wafPolicy: Joi.object({
    enabled: Joi.boolean().optional().default(false),
    mode: Joi.string().allow('DetectionOnly', 'On').optional().default('DetectionOnly'),
    inboundAnomalyScoreThreshold: Joi.number().integer().min(1).max(100).optional().default(10),
    outboundAnomalyScoreThreshold: Joi.number().integer().min(1).max(100).optional().default(4),
    logLevel: Joi.number().integer().min(0).max(9).optional().default(0),
  }),
});

module.exports = {
  validateNodeInfo: (entity, context) => nodeInfoSchema.validateAsync(entity, getMultipleLangParams(context)),
  validateUpdateGateway: (entity, context) => updateGatewaySchema.validateAsync(entity, getMultipleLangParams(context)),
};
