const { Op } = require('sequelize');
const { orderBy } = require('lodash');
const { PASSPORT_STATUS } = require('@abtnode/constant');
const BaseState = require('./base');

/**
 * @extends BaseState<import('@abtnode/models').PassportState>
 */
class Passport extends BaseState {
  constructor(model, config, models) {
    super(model, config);

    this.models = models;
  }

  async filterCount(where = {}) {
    const condition = {
      where: {
        ...where,
        parentDid: {
          [Op.is]: null,
        },
      },
    };

    const result = await this.count(condition);
    return result;
  }

  async passports(where = {}, sort = {}, paging = {}) {
    const condition = {
      where: {
        ...where,
        parentDid: {
          [Op.is]: null,
        },
      },
      include: [
        {
          model: this.models.User,
          as: 'user',
          attributes: ['did', 'fullName', 'email', 'avatar'],
          required: true,
        },
        {
          model: this.models.Passport,
          as: 'children',
          required: false,
          limit: 1,
          order: [['issuanceDate', 'DESC']],
        },
      ],
      order: [['issuanceDate', 'DESC']],
    };

    const result = await this.paginate(condition, sort, paging);

    result.list = orderBy(
      result.list.map((item) => {
        if (item.children && item.children[0]) {
          const { children, ...rest } = item;
          return {
            ...rest,
            ...children[0],
          };
        }
        return item;
      }),
      'issuanceDate',
      'desc'
    );

    return result;
  }

  async relatedPassports(passportId, sort = {}, paging = {}) {
    const condition = {
      where: {
        [Op.or]: [{ id: passportId }, { parentDid: passportId }],
      },
      include: [
        {
          model: this.models.User,
          as: 'user',
          attributes: ['did', 'fullName', 'email', 'avatar'],
          required: true,
        },
      ],
    };

    const result = await this.paginate(condition, sort, paging);

    return result;
  }

  async findExpiredList() {
    const now = new Date().toISOString();

    const result = await this.find({
      where: {
        status: PASSPORT_STATUS.VALID,
        expirationDate: { [Op.ne]: null, [Op.lte]: now },
      },
    });

    return result;
  }

  async futureList() {
    const now = new Date().toISOString();

    const result = await this.find({
      where: {
        status: 'valid',
        expirationDate: {
          [Op.ne]: null,
          [Op.gt]: now,
        },
      },
    });

    return result;
  }

  async updatePassportStatus(id, status) {
    await this.update({ id }, { $set: { status } });
  }
}

module.exports = Passport;
