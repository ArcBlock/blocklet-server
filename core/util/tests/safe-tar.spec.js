const { afterEach, beforeEach, describe, expect, test } = require('bun:test');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const tar = require('tar');

const { safeTarExtract, validateTarEntry } = require('../lib/safe-tar');

describe('safe-tar', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'safe-tar-'));
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  test('should extract a normal archive', async () => {
    const sourceDir = path.join(tmpDir, 'source');
    const archive = path.join(tmpDir, 'package.tar.gz');
    const destDir = path.join(tmpDir, 'dest');

    await fs.ensureDir(path.join(sourceDir, 'package'));
    await fs.writeFile(path.join(sourceDir, 'package', 'index.html'), '<html></html>');
    await tar.c({ gzip: true, file: archive, cwd: sourceDir }, ['package']);

    await safeTarExtract({ file: archive, cwd: destDir, strip: 1 });

    expect(await fs.readFile(path.join(destDir, 'index.html'), 'utf8')).toBe('<html></html>');
  });

  test('should reject path traversal entries', () => {
    expect(() => validateTarEntry({ entryPath: '../escape.txt', entry: { type: 'File' }, cwd: tmpDir })).toThrow(
      /Unsafe tar entry path/
    );
    expect(() =>
      validateTarEntry({ entryPath: 'package/../../escape.txt', entry: { type: 'File' }, cwd: tmpDir })
    ).toThrow(/Unsafe tar entry path/);
  });

  test('should reject absolute entries', () => {
    expect(() => validateTarEntry({ entryPath: '/tmp/escape.txt', entry: { type: 'File' }, cwd: tmpDir })).toThrow(
      /Unsafe tar entry path/
    );
    expect(() => validateTarEntry({ entryPath: 'C:\\temp\\escape.txt', entry: { type: 'File' }, cwd: tmpDir })).toThrow(
      /Unsafe tar entry path/
    );
  });

  test('should reject link entries', () => {
    expect(() => validateTarEntry({ entryPath: 'package/link', entry: { type: 'SymbolicLink' }, cwd: tmpDir })).toThrow(
      /Unsafe tar entry type/
    );
    expect(() => validateTarEntry({ entryPath: 'package/link', entry: { type: 'Link' }, cwd: tmpDir })).toThrow(
      /Unsafe tar entry type/
    );
  });

  test('should reject entries under an existing symlink parent', async () => {
    const externalDir = path.join(tmpDir, 'external');
    const destDir = path.join(tmpDir, 'dest');
    await fs.ensureDir(externalDir);
    await fs.ensureDir(destDir);
    await fs.symlink(externalDir, path.join(destDir, 'link'));

    expect(() => validateTarEntry({ entryPath: 'link/file.txt', entry: { type: 'File' }, cwd: destDir })).toThrow(
      /Unsafe tar entry parent/
    );
  });
});
