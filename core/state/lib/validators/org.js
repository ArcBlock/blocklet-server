const { Joi } = require('@arcblock/validator');

const createOrgInputSchema = Joi.object({
  name: Joi.string().required().trim().min(1).max(64),
  description: Joi.string().optional().allow('').trim().min(1).max(255),
  ownerDid: Joi.DID().optional().allow('').allow(null),
  avatar: Joi.string().optional().allow('').trim().min(1).max(255),
});

/**
 * 只允许更新 name 和 description
 */
const updateOrgInputSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required().trim().min(1).max(20),
  description: Joi.string().optional().allow('').trim().min(1).max(255),
  avatar: Joi.string().optional().allow('').trim().min(1).max(255),
});

exports.createOrgInputSchema = createOrgInputSchema;
exports.updateOrgInputSchema = updateOrgInputSchema;
