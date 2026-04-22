import { describe, test, expect } from 'bun:test';
import { validateName, validateNewDid } from '../src/name';

describe('validateName', () => {
  test('should pass as expected', () => {
    expect(validateName('some-package')).toBe(undefined);
    expect(validateName('some-package-')).toBe(undefined);
    expect(validateName('-some-package')).toBe(undefined);
    expect(validateName('example.com')).toBe(undefined);
    expect(validateName('example.com.')).toBe(undefined);
    expect(validateName('under_score')).toBe(undefined);
    expect(validateName('123start-with-number')).toBe(undefined);
    expect(validateName('@npm/thingy')).toBe(undefined);
    expect(validateName('@jane/foo.js')).toBe(undefined);
    expect(validateName('@jane/-foo.js')).toBe(undefined);
    expect(validateName('@jane-/foo.js')).toBe(undefined);
    expect(validateName('1')).toBe(undefined);
    expect(validateName('123')).toBe(undefined);
    expect(validateName('a')).toBe(undefined);
    expect(validateName('abc')).toBe(undefined);
  });
  test('should throw error as expected', () => {
    expect(() => validateName('excited!')).toThrow();
    expect(() => validateName(' leading-spaces')).toThrow();
    expect(() => validateName('trailing-spaces ')).toThrow();
    expect(() => validateName('spaces spaces')).toThrow();
    expect(() => validateName('不可以是包含中日韩')).toThrow();
    expect(() => validateName('@can-not-start-with-at')).toThrow();
    expect(() => validateName('.can-not-start-with-dot')).toThrow();
    expect(() => validateName('_can-not-start-with-underscore')).toThrow();
    expect(() => validateName('can-not/contain-slash')).toThrow();
    expect(() => validateName('canNotContainCapitalLetters')).toThrow();
    expect(() => validateName('semicolon;')).toThrow();
    expect(() => validateName('comma,')).toThrow();
    expect(() => validateName('only-url-friendly-%')).toThrow();
    expect(() => validateName('only-url-friendly-&')).toThrow();
    expect(() => validateName(''.padStart(33, 'x'))).toThrow();
  });
  test('should pass when name is new blocklet-did', () => {
    expect(validateName('z2qaG5TkdGGmxmEpkyDq1Lxjct1yJfXfzdTc9')).toBe(undefined);
  });
  test('should work with validateNewDid', () => {
    expect(validateNewDid('z2qaG5TkdGGmxmEpkyDq1Lxjct1yJfXfzdTc9')).toBe(undefined);
    expect(() => validateNewDid('zNKqRZMZpX49Ct2byuFJKX2H4siZARnfQLiy')).toThrow();
  });
  test('validateName: checkDid', () => {
    const appDid = 'zNKkSGvZRTXi2eDb7Yp1VayfSE7WTi8R2M3u';
    const blockletDid = 'z2qaBcC4t7g6W51ZgN3ZGPqgN3N26Nt7AyqB7';

    expect(() => validateName(appDid, { checkDid: false })).not.toThrow();
    expect(() => validateName(appDid, { checkDid: true })).toThrow();

    expect(() => validateName(blockletDid, { checkDid: false })).not.toThrow();
    expect(() => validateName(blockletDid, { checkDid: true })).not.toThrow();
  });
});
