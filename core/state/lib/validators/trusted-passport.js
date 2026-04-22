/* eslint-disable newline-per-chained-call */
const JOI = require('joi');
const { didExtension } = require('@blocklet/meta/lib/extension');
const { getMultipleLangParams } = require('./util');

const Joi = JOI.extend(didExtension);

const trustedPassportsSchema = Joi.array()
  .items(
    Joi.object({
      issuerDid: Joi.DID().required(),
      remark: Joi.string().trim(),
      mappings: Joi.array().items(
        Joi.object({
          from: Joi.object({
            passport: Joi.string().required(),
          }),
          to: Joi.object({
            role: Joi.string().required(),
            ttl: Joi.number().integer().min(0).default(0),
          }),
        })
      ),
    })
  )
  .unique((a, b) => a.issuerDid === b.issuerDid)
  .options({ stripUnknown: true, noDefaults: false });

module.exports = {
  validateTrustedPassportIssuers: (entity, context) =>
    trustedPassportsSchema.validateAsync(entity, getMultipleLangParams(context)),
};
