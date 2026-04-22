const JOI = require('joi');
const { didExtension } = require('@blocklet/meta/lib/extension');

/**
 * @type {import('joi')}
 */
const Joi = JOI.extend(didExtension);

// TODO: 这里目前仅包含必填的字段，后续需要增加其他字段
const passportSchema = Joi.object({
  id: Joi.string().required(),
  role: Joi.string().required(),
  name: Joi.string().required(),
})
  .unknown()
  .empty(null);

const connectedAccountSchema = Joi.object({
  provider: Joi.string().required(),
  did: Joi.DID().trim().required(),
  pk: Joi.string().optional(),
  id: Joi.string().optional(),
  firstLoginAt: Joi.string().optional(),
  lastLoginAt: Joi.string().optional(),
})
  .unknown()
  .empty(null);

const loginSchema = Joi.object({
  did: Joi.DID().trim().required(),
  pk: Joi.string().required(),
  fullName: Joi.string().empty(''),
  avatar: Joi.string().allow(null).empty(''),
  email: Joi.string().allow(null).empty(''),
  role: Joi.string().empty(''),
  locale: Joi.string().empty(''),
  extra: Joi.object(),
  remark: Joi.string().empty(''),
  lastLoginIp: Joi.string().empty(''),
  passport: passportSchema.optional(),
  sourceAppPid: Joi.DID().trim().empty(null),
  connectedAccount: Joi.alternatives()
    .try(connectedAccountSchema.required(), Joi.array().items(connectedAccountSchema).min(1).sparse(true))
    .required(),
}).unknown();

const profileSchema = Joi.object({
  did: Joi.DID().trim().required(),
  fullName: Joi.string().empty(''),
  avatar: Joi.string().empty(''),
  email: Joi.string().empty(''),
});

const disconnectAccountSchema = Joi.object({
  provider: Joi.string().required(),
  did: Joi.DID().trim().required(),
  pk: Joi.string().optional(),
});

exports.loginSchema = loginSchema;
exports.profileSchema = profileSchema;
exports.disconnectAccountSchema = disconnectAccountSchema;
