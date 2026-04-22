/* eslint-disable newline-per-chained-call */
const Joi = require('joi');
const { getMultipleLangParams } = require('./util');

const roleNameSchema = Joi.string()
  .trim()
  .max(64)
  .custom((value) => {
    if (value.startsWith('blocklet')) {
      throw new Error('role name cannot start with "blocklet"');
    }

    if (/[^a-zA-z0-9]/.test(value)) {
      throw new Error('role name can include only numbers or letters');
    }

    return value;
  });

const roleAcquireSchema = Joi.object({
  pay: Joi.string().optional().allow(''),
  exchange: Joi.string().optional().allow(''),
  invite: Joi.boolean().optional(),
  transfer: Joi.boolean().optional(),
  request: Joi.boolean().optional(),
}).default({
  pay: '',
  exchange: '',
  invite: true,
  transfer: false,
  request: false,
});

const titleSchema = Joi.string().trim().max(25);
const descriptionSchema = Joi.string().trim().max(600);

const createRoleSchema = Joi.object({
  name: roleNameSchema.required(),
  title: titleSchema.required(),
  description: descriptionSchema.required(),
  extra: Joi.object({
    acquire: roleAcquireSchema,
    payment: Joi.any().optional(),
    display: Joi.string().valid('builtin', 'custom').optional(),
    types: Joi.array().items(Joi.string().min(4).max(128)).max(4).optional(),
  }).optional(),
});

const updateRoleSchema = Joi.object({
  name: roleNameSchema.required(),
  title: titleSchema,
  description: descriptionSchema,
  extra: Joi.object({
    acquire: roleAcquireSchema,
    payment: Joi.any().optional(),
    display: Joi.string().valid('builtin', 'custom').optional(),
    types: Joi.array().items(Joi.string().min(4).max(128)).max(4).optional(),
  }).optional(),
});

module.exports = {
  validateCreateRole: (entity, context) => createRoleSchema.validateAsync(entity, getMultipleLangParams(context)),
  validateUpdateRole: (entity, context) => updateRoleSchema.validateAsync(entity, getMultipleLangParams(context)),
};
