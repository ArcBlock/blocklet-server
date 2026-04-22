const { describe, test, expect, beforeAll, afterAll, mock } = require('bun:test');
const { Op } = require('sequelize');
const TrafficInsightState = require('../../lib/states/traffic-insight');
const { setupInMemoryModels } = require('../../tools/fixture');

describe('TrafficInsightState', () => {
  let state = null;
  let models = null;

  beforeAll(async () => {
    models = await setupInMemoryModels();
    state = new TrafficInsightState(models.TrafficInsight, {});
    state.paginate = mock();
  });

  afterAll(async () => {
    await state.reset();
  });

  test('should call paginate with correct parameters when did, startDate, and endDate are provided', () => {
    state.findPaginated({ did: 'testDid', startDate: '2022-01-01', endDate: '2022-12-31' });
    expect(state.paginate).toHaveBeenCalledWith(
      { where: { did: 'testDid', date: { [Op.gte]: '2022-01-01', [Op.lte]: '2022-12-31' } } },
      { date: -1 },
      { pageSize: 30 }
    );
  });

  test('should call paginate with correct parameters when only did is provided', () => {
    state.findPaginated({ did: 'testDid' });
    expect(state.paginate).toHaveBeenCalledWith({ where: { did: 'testDid' } }, { date: -1 }, { pageSize: 30 });
  });

  test('should call paginate with correct parameters when only startDate is provided', () => {
    state.findPaginated({ startDate: '2022-01-01' });
    expect(state.paginate).toHaveBeenCalledWith(
      { where: { date: { [Op.gte]: '2022-01-01' } } },
      { date: -1 },
      { pageSize: 30 }
    );
  });

  test('should call paginate with correct parameters when only endDate is provided', () => {
    state.findPaginated({ endDate: '2022-12-31' });
    expect(state.paginate).toHaveBeenCalledWith(
      { where: { date: { [Op.lte]: '2022-12-31' } } },
      { date: -1 },
      { pageSize: 30 }
    );
  });

  test('should call paginate with correct parameters when no parameters are provided', () => {
    state.findPaginated();
    expect(state.paginate).toHaveBeenCalledWith({ where: {} }, { date: -1 }, { pageSize: 30 });
  });
});
