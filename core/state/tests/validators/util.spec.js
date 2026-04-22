const { test, expect, describe } = require('bun:test');
const util = require('../../lib/validators/util');

describe('validators.util', () => {
  test('should return default en language params', () => {
    expect(util.getMultipleLangParams()).toEqual({ errors: { language: 'en' } });
    expect(util.getMultipleLangParams({})).toEqual({ errors: { language: 'en' } });
  });

  test('should return specified language params', () => {
    expect(util.getMultipleLangParams({ query: { locale: 'zh' } })).toEqual({ errors: { language: 'zh' } });
  });
});
