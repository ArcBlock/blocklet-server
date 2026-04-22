const get = require('lodash/get');
const JOI = require('joi');
const { didExtension } = require('@blocklet/meta/lib/extension');

const Joi = JOI.extend(didExtension);

const getMultipleLangParams = (context) => ({
  errors: {
    language: get(context, 'query.locale', 'en'),
  },
});

const blockletController = Joi.object({
  nftId: Joi.DID().required(),
  nftOwner: Joi.DID().required(),
  chainHost: Joi.string().uri().required(),
  launcherUrl: Joi.string().uri().optional(),
  launcherSessionId: Joi.string().optional(),
  ownerDid: Joi.DID().optional(),
}).options({ stripUnknown: true });

const createValidator = (schema) => (entity) => schema.validateAsync(entity);

const sessionConfigSchema = Joi.object({
  cacheTtl: Joi.number()
    .min(5 * 60) // 5min
    .max(86400), // 1d
  ttl: Joi.number()
    .min(86400) // 1d
    .max(86400 * 30), // 30d
  email: Joi.object({
    enabled: Joi.boolean().default(false),
    requireVerified: Joi.boolean().default(false),
    requireUnique: Joi.boolean().default(false),
    trustOauthProviders: Joi.boolean().default(false),
    enableDomainBlackList: Joi.boolean().default(false),
    domainBlackList: Joi.array()
      .items(Joi.string().uri({ scheme: ['http', 'https'] }))
      .optional()
      .default([]),
    enableDomainWhiteList: Joi.boolean().default(false),
    domainWhiteList: Joi.array()
      .items(Joi.string().uri({ scheme: ['http', 'https'] }))
      .optional()
      .default([]),
    trustedIssuers: Joi.array()
      .items(
        Joi.object({
          id: Joi.DID().required(),
          name: Joi.string().required(),
          pk: Joi.string().optional(),
        })
      )
      .optional()
      .default([]),
  }),
  phone: Joi.object({
    enabled: Joi.boolean().default(false),
    requireVerified: Joi.boolean().default(false),
    requireUnique: Joi.boolean().default(false),
    enableRegionBlackList: Joi.boolean().default(false),
    regionBlackList: Joi.array().items(Joi.string()).optional().default([]),
    enableRegionWhiteList: Joi.boolean().default(false),
    regionWhiteList: Joi.array().items(Joi.string()).optional().default([]),
    trustedIssuers: Joi.array()
      .items(
        Joi.object({
          id: Joi.DID().required(),
          name: Joi.string().required(),
          pk: Joi.string().optional(),
        })
      )
      .optional()
      .default([]),
  }),
  enableBlacklist: Joi.boolean().default(false),
});

const passportDisplaySchema = Joi.object({
  type: Joi.string().trim().valid('svg', 'url', 'uri').required(),
  content: Joi.string().trim()
    .when('type', { is: 'uri', then: Joi.string().max(20480).dataUri().required() }) // 20kb
    .when('type', { is: 'svg', then: Joi.string().max(20480).required() }) // 20kb
    .when('type', { is: 'url', then: Joi.string().max(2048).uri({ scheme: ['http', 'https'] }).required() }), // prettier-ignore
});

module.exports = {
  createValidator,
  getMultipleLangParams,
  blockletController,
  sessionConfigSchema,
  passportDisplaySchema,
};
