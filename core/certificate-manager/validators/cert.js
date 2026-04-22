const Joi = require('joi');

const nameSchema = Joi.string().trim().max(64);
const publicSchema = Joi.bool().default(false);

const addSchema = Joi.object({
  name: nameSchema,
  certificate: Joi.string().required(),
  privateKey: Joi.string().required(),
  public: publicSchema,
});

const updateSchema = Joi.object({
  name: nameSchema.required(),
  certificate: Joi.string(),
  privateKey: Joi.string(),
  public: publicSchema,
}).custom((value, helpers) => {
  // certificate and privateKey must be provided together or both omitted
  const hasCert = !!value.certificate;
  const hasKey = !!value.privateKey;
  if (hasCert !== hasKey) {
    return helpers.error('any.invalid', { message: 'Certificate and privateKey must be provided together' });
  }
  return value;
});

const upsertByDomainSchema = Joi.object({
  name: nameSchema,
  domain: Joi.string().lowercase().required(),
  certificate: Joi.string().required(),
  privateKey: Joi.string().required(),
  public: publicSchema,
  isProtected: Joi.boolean(),
});

module.exports = {
  validateAdd: (entity) => addSchema.validateAsync(entity),
  validateUpdate: (entity) => updateSchema.validateAsync(entity),
  validateUpsertByDomain: (entity) => upsertByDomainSchema.validateAsync(entity),
};
