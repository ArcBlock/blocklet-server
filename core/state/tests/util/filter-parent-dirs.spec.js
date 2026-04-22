const { test, expect, describe } = require('bun:test');
const filterParentDirs = require('../../lib/util/docker/filter-parent-dirs');

describe('filterParentDirs', () => {
  test('should filter out subdirectories when a parent directory exists', () => {
    const targetDirs = ['/foo/0xxxxx/a', '/foo/0xxxxx/a', '/foo/b', '/foo/0xxxxx/a/cccc', '/foo/0xxxxx/a/b/c/e'];
    const baseDir = '/foo';
    const result = filterParentDirs(targetDirs, baseDir);
    expect(result.includes('/foo/0xxxxx/a')).toBe(true);
    expect(result.includes('/foo/b')).toBe(true);
    expect(result.includes('/foo/0xxxxx/a/b/c/e')).toBe(false);
    expect(result.includes('/foo/0xxxxx/a/cccc')).toBe(false);
    expect(result.length).toBe(2);
  });

  test('should filter dir same as base dir', () => {
    const targetDirs = ['/foo/0xxxxx/a'];
    const baseDir = '/foo/0xxxxx/a';
    const result = filterParentDirs(targetDirs, baseDir);
    expect(result.includes('/foo/0xxxxx/a')).toBe(true);
    expect(result.length).toBe(1);
  });

  test('should return all directories when there is no nesting', () => {
    const targetDirs = ['/foo/0xxxxx/a', '/foo/b', '/foo/c'];
    const baseDir = '/foo';
    const result = filterParentDirs(targetDirs, baseDir);
    expect(result.includes('/foo/0xxxxx/a')).toBe(true);
    expect(result.includes('/foo/b')).toBe(true);
    expect(result.includes('/foo/c')).toBe(true);
    expect(result.length).toBe(3);
  });

  test('should exclude directories that do not start with the base directory', () => {
    const targetDirs = ['/foo/0xxxxx/a', '/foo/0xxxxx/a', '/cat/b'];
    const baseDir = '/foo';
    const result = filterParentDirs(targetDirs, baseDir);
    expect(result.includes('/foo/0xxxxx/a')).toBe(true);
    expect(result.length).toBe(1);
  });

  test('should only keep the top-level directory in multiple nested levels', () => {
    const targetDirs = ['/foo', '/foo/0xxxxx/a', '/foo/0xxxxx/a/b', '/foo/0xxxxx/a/b/c'];
    const baseDir = '/foo';
    const result = filterParentDirs(targetDirs, baseDir);
    // Since /foo is the parent of all, it should be the only directory returned
    expect(result.includes('/foo')).toBe(true);
    expect(result.length).toBe(1);
  });
});
