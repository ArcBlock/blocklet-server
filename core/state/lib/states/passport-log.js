const Joi = require('joi');
const { Op } = require('sequelize');
const BaseState = require('./base');

const PassportLogActionSchema = Joi.string()
  .valid('issue', 'revoke', 'approve', 'recover', 'login', 'expired', 'used')
  .required()
  .description('The type of action performed on the passport');

const PassportLogStateSchema = Joi.object({
  passportId: Joi.string().required(),
  action: PassportLogActionSchema.required(),
  operatorIp: Joi.string().allow('').optional(),
  operatorUa: Joi.string().allow('').optional(),
  operatorDid: Joi.string().allow('').optional(),
  metadata: Joi.object().optional(),
});

/**
 * @extends BaseState<import('@abtnode/models').PassportLogState>
 */
class PassportLog extends BaseState {
  constructor(model, config, models) {
    super(model, config);

    this.models = models;
  }

  async create(data) {
    try {
      const input = await PassportLogStateSchema.validateAsync(data, { stripUnknown: true });

      await this.insert(input);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async relatedLogs(where = {}, sort = {}, paging = {}) {
    let condition = where;

    if (where.passportId) {
      const passport = await this.models.Passport.findOne({
        where: { id: where.passportId },
        attributes: ['id', 'parentDid'],
      });

      const passportIds = [];
      if (passport) {
        passportIds.push(passport.id);

        if (passport.parentDid) {
          const list = await this.models.Passport.findAll({
            where: { [Op.or]: [{ id: passport.parentDid }, { parentDid: passport.parentDid }] },
          });

          passportIds.push(...list.map((x) => x.id));
        }

        condition = {
          passportId: passportIds,
        };
      }
    }

    const result = await this.paginate(condition, sort, paging);
    return result;
  }
}

module.exports = PassportLog;
