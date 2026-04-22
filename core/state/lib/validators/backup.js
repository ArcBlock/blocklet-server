const { Joi } = require('@arcblock/validator');
const { isValid } = require('@arcblock/did');

const validateBackupStart = Joi.object({
  appPid: Joi.DID().required(),
  userDid: Joi.string()
    .custom((value, helper) => {
      if (isValid(value)) {
        return value;
      }

      // value 不一定是一个 did，可能是用户名或者 @blocklet/cli，此时都会 fallback 到 ABT_NODE_DID
      if (isValid(process.env.ABT_NODE_DID)) {
        return process.env.ABT_NODE_DID;
      }

      return helper.message('Expect "userDid" to be valid did');
    })
    .required(),
  strategy: Joi.number().valid(0, 1).optional().default(0),

  sourceUrl: Joi.string().required(),
  target: Joi.string().valid('Spaces', 'Local').optional().default('Spaces'),
  targetName: Joi.string().required(),

  updatedAt: Joi.string().optional().allow(null).default(null),
});

const validateBackupProgress = Joi.object({
  progress: Joi.number().required(),
  message: Joi.string().required(),
});

const validateBackupSuccess = Joi.object({
  targetUrl: Joi.string().required(),
  message: Joi.string().optional().allow('').default(''),
  metadata: Joi.object({
    count: Joi.number().required(),
    size: Joi.number().required(),
  })
    .optional()
    .allow({}),
});

const validateBackupFail = Joi.object({
  message: Joi.string().required(),
});

module.exports = {
  validateBackupStart,
  validateBackupProgress,
  validateBackupSuccess,
  validateBackupFail,
};
