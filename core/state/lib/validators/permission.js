/* eslint-disable newline-per-chained-call */
const JOI = require('joi');
const { getMultipleLangParams } = require('./util');

const nameSchema = JOI.string()
  .trim()
  .max(64)
  .custom((name) => {
    const arr = name.split('_');
    const formatTip = 'The format of permission name should be "{action}_{resource}", e.g. query_data';
    if (arr.length > 2) {
      throw new Error(`Too much "_". ${formatTip}`);
    }

    if (arr.length < 2) {
      throw new Error(formatTip);
    }

    return name;
  });
const descriptionSchema = JOI.string().trim().max(600);

const createPermissionSchema = JOI.object({
  name: nameSchema.required(),
  description: descriptionSchema.required(),
});

const updatePermissionSchema = JOI.object({
  name: nameSchema.required(),
  description: descriptionSchema,
});

module.exports = {
  validateCreatePermission: (entity, context) =>
    createPermissionSchema.validateAsync(entity, getMultipleLangParams(context)),
  validateUpdatePermission: (entity, context) =>
    updatePermissionSchema.validateAsync(entity, getMultipleLangParams(context)),
};
