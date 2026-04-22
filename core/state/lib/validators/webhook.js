const Joi = require('joi');
const { listSenders } = require('../webhook/sender');

const senders = listSenders();

const itemSchema = Joi.object({
  name: Joi.string().required(),
  value: Joi.string(),
});

const validateWebhook = Joi.object({
  type: Joi.string()
    .valid(...senders.map((x) => x.type))
    .required(),
  params: Joi.array().items(itemSchema),
  createdAt: Joi.number().required(),
});

module.exports = {
  validateWebhook: (input, { existUrls = [] } = {}) => {
    const { value, error } = validateWebhook.validate(input);
    if (error) {
      throw new Error(error.details.map((x) => x.message).join(', '));
    }

    const sender = senders.find((x) => x.type === value.type);
    for (const param of value.params) {
      const spec = sender.params.find((x) => x.name === param.name);
      if (!spec) {
        throw new Error(`Unknown param ${param.name} for ${value.type} integration`);
      }
      if (spec.schema && typeof spec.schema.validate === 'function') {
        const { error: err } = spec.schema.validate(param.value);
        if (err) {
          throw new Error(err.details.map((x) => x.message).join(', '));
        }
        if (existUrls.includes(param.value)) {
          throw new Error(`Webhook URL ${param.value} already exists`);
        }
      }
    }

    return value;
  },
};
