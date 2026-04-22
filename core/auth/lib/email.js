/* eslint-disable import/prefer-default-export */
const Joi = require('joi');
const omit = require('lodash/omit');

const emailConfigSchema = Joi.object({
  from: Joi.string().email().required(),
  host: Joi.string().hostname().required(),
  port: Joi.number().port().required(),
  user: Joi.string().required(),
  password: Joi.string().required(),
  secure: Joi.boolean().optional().default(false),
  companyName: Joi.string().allow('').optional(),
  companyLink: Joi.string()
    .uri({
      scheme: ['http', 'https'],
    })
    .allow('')
    .optional(),
  companyAddress: Joi.string().allow('').optional(),
  supportEmail: Joi.string().email().allow('').optional(),
})
  .empty(null)
  .meta({ className: 'TEmailConfig' });

const getEmailServiceProvider = (blocklet) => {
  const config = blocklet.settings?.notification?.email || {};
  if (config.enabled) {
    const { error } = emailConfigSchema.validate(omit(config, 'enabled'));
    if (!error) {
      return 'service';
    }
  }

  const { launcherSessionId, launcherUrl, consumedAt } = blocklet.controller || {};
  return launcherSessionId && launcherUrl && consumedAt ? 'launcher' : '';
};

const getEmailSignatureConfig = (blocklet) => {
  const config = blocklet.settings?.notification?.email || {};
  return {
    companyName: config.companyName || '',
    companyLink: config.companyLink || '',
    companyAddress: config.companyAddress || '',
    supportEmail: config.supportEmail || '',
  };
};

module.exports = {
  emailConfigSchema,
  getEmailServiceProvider,
  getEmailSignatureConfig,
};
