const { test, expect, describe, mock, beforeAll, afterAll, it, spyOn } = require('bun:test');
const { tmpdir } = require('os');

const realFs = require('fs-extra');

mock.module('fs-extra', () => {
  return {
    ...realFs,
    existsSync: mock(),
    readdirSync: mock(),
    readJsonSync: mock(),
    statSync: mock(),
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const fs = require('fs');
const fsExtra = require('fs-extra');

const { join } = require('path');
const {
  getBackupList,
  removeBackup,
  getBackupDirs,
  getFileObject,
  getFolderObjects,
} = require('../../../../lib/blocklet/storage/utils/disk');

test('getBackupList', () => {
  const existFn = spyOn(fsExtra, 'existsSync').mockReturnValue(true);
  const readDirSync = spyOn(fsExtra, 'readdirSync').mockReturnValue(['did1', 'did2', 'did3']);
  const readJsonFn = spyOn(fsExtra, 'readJsonSync').mockImplementation((path) => ({
    appDid: path.split('/').slice(-2)[0],
  }));

  const res = getBackupList('/data');
  expect(res.length).toEqual(3);
  expect(res).toEqual([{ appDid: 'did1' }, { appDid: 'did2' }, { appDid: 'did3' }]);

  expect(existFn.mock.calls[0][0]).toBe('/data/_abtnode/backup'); // 检测 backup dir 是否存在
  expect(readDirSync).toBeCalledWith('/data/_abtnode/backup');
  expect(existFn.mock.calls[1][0]).toBe('/data/_abtnode/backup/did1/meta.json');
  expect(existFn.mock.calls[2][0]).toBe('/data/_abtnode/backup/did2/meta.json');
  expect(existFn.mock.calls[3][0]).toBe('/data/_abtnode/backup/did3/meta.json');
  expect(readJsonFn.mock.calls[0][0]).toBe('/data/_abtnode/backup/did1/meta.json');
  expect(readJsonFn.mock.calls[1][0]).toBe('/data/_abtnode/backup/did2/meta.json');
  expect(readJsonFn.mock.calls[2][0]).toBe('/data/_abtnode/backup/did3/meta.json');

  existFn.mockRestore();
  readDirSync.mockRestore();
  readJsonFn.mockRestore();
});

test('removeBackup', async () => {
  const existFn = spyOn(fsExtra, 'existsSync').mockReturnValue(true);
  const removeFn = spyOn(fsExtra, 'remove');
  expect(existFn).not.toHaveBeenCalled();
  expect(removeFn).not.toHaveBeenCalled();
  const res = await removeBackup('/data', 'did:abt:123');
  expect(res).toBe(true);
  expect(existFn).toBeCalledWith('/data/_abtnode/backup/did:abt:123');
  expect(removeFn).toBeCalledWith('/data/_abtnode/backup/did:abt:123');

  expect(existFn.mockReset()).not.toHaveBeenCalled();
  expect(removeFn.mockReset()).not.toHaveBeenCalled();

  existFn.mockReturnValue(false);
  const res2 = await removeBackup('/data', 'did:abt:123');
  expect(res2).toBe(false);
  expect(existFn).toBeCalledWith('/data/_abtnode/backup/did:abt:123');
  expect(removeFn).not.toHaveBeenCalled();

  expect(existFn.mockReset()).not.toHaveBeenCalled();
  expect(removeFn.mockReset()).not.toHaveBeenCalled();

  existFn.mockImplementation(() => {
    throw new Error('test');
  });
  const res3 = await removeBackup('/data', 'did:abt:123');
  expect(res3).toBe(false);

  existFn.mockRestore();
  removeFn.mockRestore();
});

test('getBackupDirs', () => {
  expect(getBackupDirs('/server', 'did:abt:123')).toEqual({
    baseBackupDir: '/server/data/_abtnode/backup/did:abt:123',
    backupDir: '/server/data/_abtnode/backup/did:abt:123/did:abt:123',
    restoreDir: '/server/tmp/restore-disk/did:abt:123',
  });
});

describe('getFileObject', () => {
  test('should return an object representing a file', () => {
    const absolutePath = '/path/to/file.txt';
    const prefix = '/path/to';
    const stats = {
      isFile: mock().mockReturnValue(true),
      size: 100,
      mtime: new Date(),
    };

    fsExtra.statSync.mockReturnValue(stats);

    const fileObject = getFileObject(absolutePath, prefix);

    expect(fileObject).toEqual({
      key: '/file.txt',
      name: 'file.txt',
      isDir: false,
      size: 100,
      lastModified: stats.mtime.getTime(),
      editable: true,
      absolutePath: '/path/to/file.txt',
    });
  });

  test('should throw an error if the path is not a file', () => {
    const absolutePath = '/path/to/folder';
    const prefix = '/path/to/';
    const stats = {
      isFile: mock().mockReturnValue(false),
    };

    fsExtra.statSync.mockReturnValue(stats);

    expect(() => {
      getFileObject(absolutePath, prefix);
    }).toThrowError(`Path ${absolutePath} is not a path to a file`);
  });
});

describe('getFolderObjects', () => {
  // 用于测试的临时目录
  const tempDir = join(tmpdir(), 'getFolderObjectsTest');

  beforeAll(() => {
    fs.mkdirSync(tempDir);
    // 在测试之前创建临时目录并添加一些文件
    fs.writeFileSync(join(tempDir, 'file1.txt'), 'content1');
    fs.writeFileSync(join(tempDir, 'file2.txt'), 'content2');
    fs.writeFileSync(join(tempDir, '.hiddenFile.txt'), 'hiddenContent', { flag: 'w' });
  });

  afterAll(() => {
    // 在测试结束后删除临时目录
    fs.rmdirSync(tempDir, { recursive: true });
  });

  it('should return an array of objects with correct properties', async () => {
    const objects = await getFolderObjects(tempDir, '/data');

    expect(objects).toHaveLength(3);
    expect(objects[0].key.startsWith('/data')).toBeTruthy();
    expect(objects[0]).toHaveProperty('name');
    expect(objects[0]).toHaveProperty('size');
    expect(objects[0]).toHaveProperty('lastModified');
    expect(objects[0]).toHaveProperty('absolutePath');
  });

  it('should ignore files and directories specified in ignore patterns', async () => {
    // 创建应该被忽略的文件和目录
    fs.mkdirSync(join(tempDir, 'node_modules'), { recursive: true });
    fs.writeFileSync(join(tempDir, 'node_modules', 'package.json'), '{}');
    fs.mkdirSync(join(tempDir, '.next'), { recursive: true });
    fs.writeFileSync(join(tempDir, '.next', 'cache.txt'), 'cache');
    fs.writeFileSync(join(tempDir, '.DS_Store'), 'ds_store_content');
    // 创建一个不应该被忽略的文件
    fs.writeFileSync(join(tempDir, 'normal.txt'), 'normal');

    const objects = await getFolderObjects(tempDir, '/data');

    // 应该只包含原来的 3 个文件 + 新添加的 normal.txt，不包含被忽略的文件
    expect(objects).toHaveLength(4);
    const fileNames = objects.map((obj) => obj.name);
    expect(fileNames).not.toContain('package.json');
    expect(fileNames).not.toContain('cache.txt');
    expect(fileNames).not.toContain('.DS_Store');
    expect(fileNames).toContain('normal.txt');
  });

  it('should handle nested directories and files correctly', async () => {
    // 创建嵌套目录结构
    const nestedDir = join(tempDir, 'nested', 'deep');
    fs.mkdirSync(nestedDir, { recursive: true });
    fs.writeFileSync(join(nestedDir, 'deep-file.txt'), 'deep content');
    fs.writeFileSync(join(tempDir, 'nested', 'shallow-file.txt'), 'shallow content');

    const objects = await getFolderObjects(tempDir, '/data');

    // 应该包含所有嵌套文件
    const fileNames = objects.map((obj) => obj.name);
    expect(fileNames).toContain('deep-file.txt');
    expect(fileNames).toContain('shallow-file.txt');

    // 验证路径正确
    const deepFile = objects.find((obj) => obj.name === 'deep-file.txt');
    expect(deepFile).toBeDefined();
    expect(deepFile.key).toContain('nested/deep/deep-file.txt');
  });
});
