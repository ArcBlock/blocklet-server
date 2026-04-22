const { test, beforeEach, expect, mock } = require('bun:test');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const util = require('../../lib/util/index');

const { wrapDefaultStoreUrl, checkEntryFileForStaticBlocklet } = util;

beforeEach(() => {
  mock.restore();
});

test('wrapDefaultStoreUrl', () => {
  const fn = wrapDefaultStoreUrl('https://a.com');
  const res = fn({ source: { name: 'a' } });
  expect(res).toBe('https://a.com');
});

test('checkEntryFileForStaticBlocklet', () => {
  const tmpDir = path.join(os.tmpdir(), 'checkEntryFileForStaticBlocklet');
  fs.removeSync(tmpDir);
  fs.mkdirSync(tmpDir, { recursive: true });

  expect(() => checkEntryFileForStaticBlocklet({ main: 'build' }, tmpDir)).toThrowError(
    `Can not find index.html or index.htm in ${tmpDir}/build`
  );

  fs.mkdirSync(path.join(tmpDir, 'build'), { recursive: true });

  fs.writeFileSync(path.join(tmpDir, 'build', 'index.html'), 'test');
  expect(() => checkEntryFileForStaticBlocklet({ main: 'build' }, tmpDir)).not.toThrowError();
  fs.removeSync(path.join(tmpDir, 'build', 'index.html'));

  fs.writeFileSync(path.join(tmpDir, 'build', 'index.htm'), 'test');
  expect(() => checkEntryFileForStaticBlocklet({ main: 'build' }, tmpDir)).not.toThrowError();

  fs.removeSync(tmpDir);
});
