const { Op } = require('sequelize');
const BaseState = require('./base');

/**
 * @extends BaseState<import('@abtnode/models').RuntimeInsightState>
 */
class RuntimeInsight extends BaseState {
  findPaginated({ did = '', startDate = '', endDate = '', paging = { pageSize: 360 } } = {}) {
    const where = {};
    if (did) {
      where.did = did;
    }
    if (startDate) {
      where.date = { [Op.gte]: startDate };
    }
    if (endDate) {
      where.date = where.date || {};
      where.date[Op.lte] = endDate;
    }

    return this.paginate({ where }, { date: -1 }, paging);
  }
}

module.exports = RuntimeInsight;
