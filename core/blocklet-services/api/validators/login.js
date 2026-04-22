const { Joi } = require('@arcblock/validator');
const { LOGIN_PROVIDER } = require('@blocklet/constant');

const loginWalletSchema = Joi.object({
  provider: LOGIN_PROVIDER.WALLET,
  did: Joi.DID().trim().required(),
  pk: Joi.string().required(),
  email: Joi.string().optional().allow(null).empty('').default(''),
  avatar: Joi.string().optional().allow('').default(''),
  fullName: Joi.string().required(),
  inviter: Joi.DID().trim().empty(null),
}).empty(null);

const loginOAuthSchema = Joi.object({
  provider: Joi.string().allow(LOGIN_PROVIDER.AUTH0),
  id: Joi.string().required(),
  email: Joi.string().required(),
  avatar: Joi.string().optional().allow('').default(''),
  fullName: Joi.string().required(),
  inviter: Joi.DID().trim().empty(null),
}).empty(null);

const loginUserWalletSchema = Joi.object({
  userDid: Joi.DID().trim().required(),
  userPk: Joi.string().required(),
  signature: Joi.string().required(),
  walletOS: Joi.string().required(),
  challenge: Joi.string().required(),
  visitorId: Joi.string().optional(),
  passportId: Joi.string().optional(),
  sourceAppPid: Joi.DID().trim().empty(null),
  locale: Joi.string().optional(),
  componentId: Joi.string().required(),
  inviter: Joi.DID().trim().empty(null),
}).empty(null);

const checkUserSchema = Joi.object({
  users: Joi.array()
    .items(
      Joi.object({
        did: Joi.DID().trim().required(),
        pk: Joi.string().required(),
      })
    )
    .max(10),
  sourceAppPid: Joi.DID().trim().empty(null),
});

exports.loginWalletSchema = loginWalletSchema;
exports.loginUserWalletSchema = loginUserWalletSchema;
exports.loginOAuthSchema = loginOAuthSchema;
exports.checkUserSchema = checkUserSchema;
