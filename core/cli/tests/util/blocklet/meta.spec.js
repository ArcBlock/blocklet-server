const { test, expect, mock, beforeAll } = require('bun:test');
const { fixComponents } = require('../../../lib/util/blocklet/meta');

beforeAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

test('fixComponents', () => {
  {
    const m = {};
    fixComponents(m);
    expect(m).toEqual({});
  }

  {
    const m = { children: [] };
    fixComponents(m);
    expect(m).toEqual({ components: [] });
  }

  {
    const m = { components: [] };
    fixComponents(m);
    expect(m).toEqual({ components: [] });
  }

  {
    const m = { components: [{ name: 'a' }] };
    fixComponents(m);
    expect(m).toEqual({ components: [{ name: 'a' }] });
  }

  {
    const m = { children: [{ name: 'a' }] };
    fixComponents(m);
    expect(m).toEqual({ components: [{ name: 'a' }] });
  }

  expect(() => fixComponents()).toThrow();
});
