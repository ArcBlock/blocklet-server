const { describe, expect, it } = require('bun:test');
const { convertToMoniker } = require('../lib/transfer-to-moniker');

describe('transfer-to-moniker', () => {
  it('should return the default moniker if title is not provided', () => {
    expect(convertToMoniker()).toBe('application');
  });

  it('should return the moniker if title is provided', () => {
    expect(convertToMoniker('Hello World')).toBe('hello-world');
  });

  it.each([
    ['abcd', 'abcd'],
    ['123456', '123456'],
    ['_', '_'],
  ])('should keep the characters "%s"', (_, title) => {
    expect(convertToMoniker(title, '')).toBe(title);
  });

  it.each([
    [' ', 'ab cd', 'ab-cd'],
    ['!', 'ab!cd', 'ab-cd'],
    ['.', 'ab.cd', 'ab-cd'],
    ['ABCD', 'ABCD', 'abcd'],
    ['~', 'ab~cd', 'ab-cd'],
    ['-', 'ab-cd', 'ab-cd'],
    ['@#$%^&*()', 'ab@#$%^&*()cd', 'ab-cd'],
    ['中文', '你好', 'ni-hao'],
    ['标点', '你 好，世界', 'ni-hao-shi-jie'],
  ])('should format "%s" from "%s" to "%s"', (_, title, expected) => {
    expect(convertToMoniker(title)).toBe(expected);
  });
});
