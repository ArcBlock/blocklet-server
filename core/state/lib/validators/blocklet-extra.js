const JOI = require('joi');
const { didExtension } = require('@blocklet/meta/lib/extension');
const { blockletController, createValidator } = require('./util');

const Joi = JOI.extend(didExtension);

const addMeta = Joi.object({
  did: Joi.ref('meta.did'),
  meta: Joi.object({
    did: Joi.DID().required(),
    name: Joi.string().required(),
  }).required(),
  controller: blockletController.optional(),
}).required();

module.exports = {
  validateAddMeta: createValidator(addMeta),
};
