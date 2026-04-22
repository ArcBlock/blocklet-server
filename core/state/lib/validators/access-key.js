const JOI = require('joi');
const { didExtension } = require('@blocklet/meta/lib/extension');

const Joi = JOI.extend(didExtension);

const REMARK_MAX_LENGTH = 200;

const accessKeySchema = Joi.object({
  accessKeyId: Joi.string().required().min(1).max(40).messages({
    'string.empty': 'Access Key ID cannot be empty',
    'string.min': 'Access Key ID length must be at least 1 characters long',
    'string.max': 'Access Key ID length must be less than or equal to 40 characters long',
  }),

  accessKeyPublic: Joi.string().required().max(256).messages({
    'string.empty': 'Access Key Public cannot be empty',
    'string.max': 'Access Key Public length must be less than or equal to 256 characters long',
  }),

  passport: Joi.string().required().max(40).messages({
    'string.empty': 'Passport cannot be empty',
    'string.max': 'Passport length must be less than or equal to 40 characters long',
  }),

  remark: Joi.string()
    .allow('')
    .max(REMARK_MAX_LENGTH)
    .messages({
      'string.max': `Remark length must be less than or equal to ${REMARK_MAX_LENGTH} characters long`,
    }),

  createdBy: Joi.string().trim().required(),

  updatedBy: Joi.string().trim().required(),

  authType: Joi.string().valid('simple', 'signature').default('signature').messages({
    'any.only': 'Auth Type must be either simple or signature',
  }),

  componentDid: Joi.DID().trim().allow(null, '').messages({
    'did.invalid': 'Component DID must be a valid DID',
  }),

  resourceType: Joi.string().max(40).allow(null, '').messages({
    'string.max': 'Resource Type length must be less than or equal to 40 characters long',
  }),

  resourceId: Joi.string().max(80).allow(null, '').messages({
    'string.max': 'Resource ID length must be less than or equal to 80 characters long',
  }),

  expireAt: Joi.date().allow(null, '').greater('now').messages({
    'date.greater': 'Expire date must be in the future',
  }),

  createdVia: Joi.string().valid('sdk', 'web', 'connect').default('web').messages({
    'any.only': 'Created Via must be one of: sdk, web, connect',
  }),

  createdAt: Joi.date(),
  updatedAt: Joi.date(),
  lastUsedAt: Joi.date(),
}).options({ stripUnknown: true });

module.exports = {
  accessKeySchema,
};
