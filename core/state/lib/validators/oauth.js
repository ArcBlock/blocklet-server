const Joi = require('joi');
const { OAUTH_SCOPES } = require('@abtnode/constant');

const validGrants = ['authorization_code', 'refresh_token'];
const validScopes = Object.keys(OAUTH_SCOPES);

const oauthClientSchema = Joi.object({
  clientName: Joi.string().max(128).required(),
  clientUri: Joi.string().uri().max(512).allow('', null),
  logoUri: Joi.string().uri().max(512).allow('', null),
  redirectUris: Joi.array().items(Joi.string().uri()).min(1).required(),
  tokenEndpointAuthMethod: Joi.string(),
  grantTypes: Joi.array()
    .items(Joi.string().valid(...validGrants))
    .default(['authorization_code', 'refresh_token']),
  responseTypes: Joi.array().items(Joi.string()).default(['code']),
  scope: Joi.alternatives()
    .try(
      Joi.string()
        .allow('')
        .custom((value, helpers) => {
          if (!value) return value;
          const scopes = value.split(' ').filter(Boolean);
          const invalid = scopes.filter((s) => !validScopes.includes(s));
          if (invalid.length) return helpers.error('any.invalid');
          return value;
        }),
      Joi.array()
        .items(Joi.string().valid(...validScopes))
        .allow('')
    )
    .default(''),
  contacts: Joi.array().items(Joi.string().email()).default([]),
  tosUri: Joi.string().uri().max(512).allow('', null),
  policyUri: Joi.string().uri().max(512).allow('', null),
  jwksUri: Joi.string().uri().max(512).allow('', null),
  jwks: Joi.string().allow('', null),
  softwareId: Joi.string().max(255).allow('', null),
  softwareVersion: Joi.string().max(255).allow('', null),
  clientId: Joi.string().max(64).required(),
  clientSecret: Joi.string().max(255).allow('', null),
  clientIdIssuedAt: Joi.number()
    .integer()
    .default(() => Date.now()),
  clientSecretExpiresAt: Joi.number().integer().allow(null),
  createdBy: Joi.string().max(40).required(),
});

module.exports = {
  oauthClientSchema,
};
