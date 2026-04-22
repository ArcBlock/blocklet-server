const { test, describe, expect } = require('bun:test');
const stateFactory = require('../lib/factory');

describe('factory', () => {
  test('should initialize correctly', () => {
    const states = stateFactory(() => ({
      foo: 1,
      bar: 2,
    }));

    states.init();

    expect(states.foo).toEqual(1);
    expect(states.bar).toEqual(2);
  });

  test('should throw error if the state not exists', () => {
    const states = stateFactory(() => ({
      foo: 1,
      bar: 2,
    }));

    states.init();

    expect(states.foo).toEqual(1);
    expect(() => states.fooBar).toThrow(/may not be initialized/);
  });
});
