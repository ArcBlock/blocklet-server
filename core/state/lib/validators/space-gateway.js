const { Joi } = require('@arcblock/validator');

const validateAddSpaceGateway = Joi.object({
  // 表示 space did
  did: Joi.DID(),
  url: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required(),
  name: Joi.string().required(),
  protected: Joi.boolean().optional().allow(null),
  endpoint: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .optional()
    .allow(''),
});

const validateUpdateSpaceGateway = Joi.object({
  did: Joi.DID(),
  url: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required(),
  name: Joi.string().optional().allow(''),
  protected: Joi.boolean().optional().allow(null),
  endpoint: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .optional()
    .allow(''),
});

module.exports = {
  validateAddSpaceGateway,
  validateUpdateSpaceGateway,
};
