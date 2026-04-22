import { test, expect, describe, spyOn } from 'bun:test';
import { Op, Order } from 'sequelize';
import { formatConditions, formatOrder, formatSelection } from '../src';

describe('Util.formatConditions', () => {
  test('converts simple equality conditions', () => {
    const input = { status: 'active' };
    const expected = { status: 'active' };
    expect(formatConditions(input).where).toEqual(expected);
  });

  test('converts $lt, $lte, $gt, $gte conditions', () => {
    const input = {
      age: { $lt: 40, $lte: 50, $gt: 20, $gte: 18 },
    };
    const expected = {
      age: {
        [Op.and]: [{ [Op.lt]: 40 }, { [Op.lte]: 50 }, { [Op.gt]: 20 }, { [Op.gte]: 18 }],
      },
    };
    expect(formatConditions(input).where).toEqual(expected);
  });

  test('converts $ne conditions', () => {
    const input = { status: { $ne: 'inactive' } };
    const expected = { status: { [Op.ne]: 'inactive' } };
    expect(formatConditions(input).where).toEqual(expected);
  });

  test('converts $in and $nin conditions', () => {
    const input = {
      country: { $in: ['USA', 'Canada'], $nin: ['UK'] },
    };
    const expected = {
      country: {
        [Op.and]: [{ [Op.in]: ['USA', 'Canada'] }, { [Op.notIn]: ['UK'] }],
      },
    };
    expect(formatConditions(input).where).toEqual(expected);
  });

  test('converts nested conditions', () => {
    const input = { age: { nested: 30 } };
    expect(formatConditions(input).where).toEqual(input);
  });

  test('converts $or conditions', () => {
    const input = {
      $or: [{ status: 'active', age: { $lt: 30 } }, { country: { $in: ['USA', 'Canada'] } }],
    };
    const expected = {
      [Op.or]: [{ status: 'active', age: { [Op.lt]: 30 } }, { country: { [Op.in]: ['USA', 'Canada'] } }],
    };
    expect(formatConditions(input).where).toEqual(expected);
  });

  test('converts $exists conditions', () => {
    const input = {
      name: { $exists: true },
      email: { $exists: false },
    };
    const expected = {
      name: { [Op.not]: null },
      email: { [Op.is]: null },
    };
    expect(formatConditions(input).where).toEqual(expected);
  });

  test('converts $regex conditions', () => {
    const input = {
      name: { $regex: 'John' },
    };
    const expected = {
      name: { [Op.like]: '%John%' },
    };
    expect(formatConditions(input).where).toEqual(expected);
  });

  test('leave things untouched', () => {
    const input = {
      where: {},
      includes: {},
    };
    expect(formatConditions(input)).toEqual(input);
  });
});

describe('formatOrder', () => {
  test('converts ascending order', () => {
    const input = { name: 1 };
    const expected: Order = [['name', 'ASC']];
    expect(formatOrder(input)).toEqual(expected);
  });

  test('converts descending order', () => {
    const input = { age: -1 };
    const expected: Order = [['age', 'DESC']];
    expect(formatOrder(input)).toEqual(expected);
  });

  test('converts multiple fields', () => {
    const input = { name: 1, age: -1 };
    const expected: Order = [
      ['name', 'ASC'],
      ['age', 'DESC'],
    ];
    expect(formatOrder(input)).toEqual(expected);
  });

  test('ignores invalid values and logs a warning', () => {
    const consoleSpy = spyOn(console, 'warn').mockImplementation(() => {});
    const input = { name: 1, age: 0 };
    const expected: Order = [['name', 'ASC']];
    expect(formatOrder(input)).toEqual(expected);
    expect(consoleSpy).toHaveBeenCalledWith('Unsupported sort value for field "age": 0. Only -1 and 1 are supported.');
    consoleSpy.mockRestore();
  });
});

describe('formatSelection', () => {
  test('converts include fields', () => {
    const input = {
      name: 1,
      age: 1,
    };
    const expected = ['name', 'age'];

    expect(formatSelection(input)).toEqual(expected);
  });

  test('ignores exclude fields', () => {
    const input = {
      name: 0,
      age: 0,
    };
    const expected: string[] = [];

    expect(formatSelection(input)).toEqual(expected);
  });

  test('ignores invalid values and logs a warning', () => {
    const consoleSpy = spyOn(console, 'warn').mockImplementation(() => {});

    const input = {
      name: 1,
      age: 2,
    };
    const expected: string[] = ['name'];
    expect(formatSelection(input)).toEqual(expected);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Unsupported projection value for field "age": 2. Only 0 and 1 are supported.'
    );

    consoleSpy.mockRestore();
  });
});
