const { describe, beforeAll, test, expect, afterAll, mock } = require('bun:test');
const path = require('path');
const hasha = require('hasha');
const fs = require('fs-extra');
const hashFiles = require('../lib/hash-files');

const nonEmptyfolder = path.join(__dirname, 'hash_files_folder');
const emptyFolder = path.join(__dirname, 'hash_files_folder_empty');
const rootFileName = 'hash_files_file';
const rootFile = path.join(__dirname, rootFileName);
const file1 = 'f1';
const file2 = 'f2';
const file3 = 'f3';
const contentA = 'a';
const contentEmpty = '';

describe('hashFiles', () => {
  beforeAll(() => {
    fs.removeSync(nonEmptyfolder);
    fs.removeSync(emptyFolder);
    fs.removeSync(rootFile);
    fs.mkdirSync(nonEmptyfolder);
    fs.writeFileSync(path.join(nonEmptyfolder, file1), contentA);
    fs.writeFileSync(path.join(nonEmptyfolder, file2), contentA);
    fs.writeFileSync(path.join(nonEmptyfolder, file3), contentEmpty);
    fs.mkdirSync(emptyFolder);
    fs.writeFileSync(rootFile, contentA);
  });

  afterAll(() => {
    fs.removeSync(nonEmptyfolder);
    fs.removeSync(emptyFolder);
    fs.removeSync(rootFile);
  });

  test('should be a function', () => {
    expect(typeof hashFiles).toBe('function');
  });

  test('should return correct hash if input dir is a non-empty folder', async () => {
    const { files } = await hashFiles(nonEmptyfolder);
    expect(Object.keys(files).sort()).toEqual([file1, file2, file3]);
    expect(files).toEqual({
      [file1]: hasha(contentA, { algorithm: 'sha1' }),
      [file2]: hasha(contentA, { algorithm: 'sha1' }),
      [file3]: hasha(contentEmpty, { algorithm: 'sha1' }),
    });
  });

  test('should return [] if input dir is an empty folder', async () => {
    const { files } = await hashFiles(emptyFolder);
    expect(Object.keys(files)).toEqual([]);
  });

  test('should return correct hash if input dir is a file', async () => {
    const { files } = await hashFiles(rootFile);
    expect(files).toEqual({
      [rootFileName]: hasha(contentA, { algorithm: 'sha1' }),
    });
  });

  test('should throw error if input dir not exist', async () => {
    const onError = mock(() => {});
    try {
      await hashFiles(path.join(__dirname, 'no-exist'));
    } catch (error) {
      onError(error);
    }
    expect(onError.mock.calls.length).toBe(1);
  });

  test('should return correct hash by filter', async () => {
    const { files } = await hashFiles(nonEmptyfolder, {
      filter: (f) => {
        expect(f.indexOf(nonEmptyfolder)).toEqual(0);
        return path.relative(nonEmptyfolder, f) !== file3;
      },
    });
    expect(files).toEqual({
      [file1]: hasha(contentA, { algorithm: 'sha1' }),
      [file2]: hasha(contentA, { algorithm: 'sha1' }),
    });
    expect(files[file3]).toEqual(undefined);
  });
});
