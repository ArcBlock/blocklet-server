/* eslint-disable newline-per-chained-call */
const JOI = require('joi');
const { didExtension } = require('@blocklet/meta/lib/extension');
const { getMultipleLangParams } = require('./util');

const Joi = JOI.extend(didExtension);

const trustedFactoriesSchema = Joi.array()
  .items(
    Joi.object({
      issuerDid: Joi.DID().optional().allow('').default(''),
      holderDid: Joi.DID().optional().allow('').default(''),
      factoryAddress: Joi.DID().required(),
      remark: Joi.string().trim().required(),
      passport: Joi.object({
        role: Joi.string().required(),
        ttlPolicy: Joi.string().valid('never', 'mint', 'exchange').required(),
        ttl: Joi.number().integer().min(0).default(0),
      }).required(),
    })
  )
  .unique((a, b) => a.factoryAddress === b.factoryAddress)
  .options({ stripUnknown: true, noDefaults: false });

module.exports = {
  validateTrustedFactories: (entity, context) =>
    trustedFactoriesSchema.validateAsync(entity, getMultipleLangParams(context)),
};
