const JOI = require('joi');
const { didExtension } = require('@blocklet/meta/lib/extension');

const Joi = JOI.extend(didExtension);

const securityRuleSchema = Joi.object({
  pathPattern: Joi.string().optional(),
  componentDid: Joi.string().optional().allow('', null),
  priority: Joi.number().optional(),
  responseHeaderPolicyId: Joi.string().optional().allow('', null),
  accessPolicyId: Joi.string().optional().allow('', null),
  enabled: Joi.boolean().optional(),
  remark: Joi.string().optional().allow(''),
}).unknown(true);

const accessPolicySchema = Joi.object({
  name: Joi.string().max(32).required(),
  description: Joi.string().max(256).optional().allow(''),
  roles: Joi.array().items(Joi.string()).optional().allow(null),
  reverse: Joi.boolean().optional(),
  isProtected: Joi.boolean().optional(),
}).unknown(true);

const corsSchema = Joi.any();
const securityHeaderSchema = Joi.any();
const responseHeaderPolicySchema = Joi.object({
  name: Joi.string().max(32).required(),
  description: Joi.string().max(256).optional().allow(''),
  cors: corsSchema.optional().allow(null),
  securityHeader: securityHeaderSchema.optional().allow(null),
  customHeader: Joi.any().optional().allow(null),
  removeHeader: Joi.any().optional().allow(null),
  isProtected: Joi.boolean().optional(),
}).unknown(true);

module.exports = {
  securityRuleSchema,
  accessPolicySchema,
  responseHeaderPolicySchema,
};
