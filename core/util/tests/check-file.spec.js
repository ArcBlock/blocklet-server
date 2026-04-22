const { test, expect, describe } = require('bun:test');
const { checkMatch, fileFilter } = require('../lib/check-file');

test('checkMatch', () => {
  expect(checkMatch('hooks/pre-start.js', 'hooks/*')).toBe(true);
  expect(checkMatch('hooks/dir/pre-start.js', 'hooks/*')).toBe(true);
  expect(checkMatch('hooks/dir/pre-start.js', 'hooks/**')).toBe(true);
  expect(checkMatch('migration/a.js', 'migration/*.js')).toBe(true);

  expect(checkMatch('hooks/pre-start.js', 'hooks')).toBe(false); // must include *
});

describe('deployManager', () => {
  describe('fileFilter', () => {
    test('should be a function', () => {
      expect(typeof fileFilter).toBe('function');
    });
    test('should filter by diffList', () => {
      const srcList = ['a.js', 'b.js', 'c.js'];
      const diffList = ['b.js', 'c.js', 'd.js'];
      const staticList = ['a.js', 'b.js'];
      expect(srcList.filter((f) => fileFilter(f, { diffList }))).toEqual(['b.js', 'c.js']);
      expect(
        srcList.filter((f) =>
          fileFilter(f, {
            diffList,
            bundleType: 'static',
            staticList,
          })
        )
      ).toEqual(['b.js', 'c.js']);
    });
    test('should filter by staticList', () => {
      const srcList = ['a.js', 'b.js', 'c.js'];
      const staticList = ['b.js'];
      expect(
        srcList.filter((f) =>
          fileFilter(f, {
            bundleType: 'static',
            staticList,
          })
        )
      ).toEqual(['b.js']);
      expect(
        srcList.filter((f) =>
          fileFilter(f, {
            diffList: null,
            bundleType: 'static',
            staticList,
          })
        )
      ).toEqual(['b.js']);
    });
    test('should pass all', () => {
      const srcList = ['a.js', 'b.js', 'c.js'];
      const staticList = ['b.js'];
      expect(srcList.filter((f) => fileFilter(f))).toEqual(srcList);
      expect(
        srcList.filter((f) =>
          fileFilter(f, {
            diffList: null,
          })
        )
      ).toEqual(srcList);
      expect(
        srcList.filter((f) =>
          fileFilter(f, {
            staticList,
          })
        )
      ).toEqual(srcList);
    });
    test('should pass "." and ""', () => {
      const srcList = ['.', '', 'a.js', 'b.js', 'c.js'];
      const diffList = ['a.js'];
      expect(srcList.filter((f) => fileFilter(f, { diffList }))).toEqual(['.', '', 'a.js']);
    });
    test('should pass parent and child', () => {
      const srcList = ['a', 'a/b', 'a/c', 'a/b/c', 'a/b/c/d.js'];
      const staticList = ['a/b'];
      expect(
        srcList.filter((f) =>
          fileFilter(f, {
            bundleType: 'static',
            staticList,
          })
        )
      ).toEqual(['a', 'a/b', 'a/b/c', 'a/b/c/d.js']);
    });
  });
});
