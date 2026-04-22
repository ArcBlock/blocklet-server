/* eslint-disable import/prefer-default-export */
import JOI, { Root } from 'joi';
import { didExtension } from '@blocklet/meta/lib/extension';

const Joi: Root & { [key: string]: Function } = JOI.extend(didExtension);

// {
//   "id": "evt_T2UiJ2VHUxVo3J6BuULkrp15",
//   "source": "componentDid",
//   "type": "customer.subscription.renewed",
//   "time": "2025-02-19T03:46:42.662Z",
//   "spec_version": "1.0",
//   "object_type": "Subscription",
//   "object_id": "sub_hmL7FQTmMbYVELkH6uVo6m9P",
//   "data": {
//     "type": "application/json",
//     "object": {
//       "id": "sub_hmL7FQTmMbYVELkH6uVo6m9P"
//     },
//     "previous_attributes": {}
//   }
// }

const eventSchema = Joi.object({
  id: Joi.string().required(),
  source: Joi.DID().required(),
  type: Joi.string().required(),
  time: Joi.date().iso().required(),
  spec_version: Joi.string().required(),
  object_type: Joi.string().optional().empty(''),
  object_id: Joi.string().optional().empty(''),
  data: Joi.object({
    type: Joi.string().optional().default('application/json'),
    object: Joi.any().optional(),
    previous_attributes: Joi.any().optional().empty(null),
  }).required(),
})
  .options({ stripUnknown: true, allowUnknown: true })
  .meta({ className: 'TEvent' });

const validateEvent = eventSchema.validateAsync.bind(eventSchema);

export { eventSchema, validateEvent };

export default {
  eventSchema,
  validateEvent,
};
