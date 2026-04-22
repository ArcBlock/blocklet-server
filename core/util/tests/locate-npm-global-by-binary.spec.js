/* eslint-disable import/order */
/* eslint-disable no-unused-vars */
const { describe, expect, mock, beforeEach, it, spyOn, afterAll } = require('bun:test');

const realFs = require('fs');

let mockFiles = Object.create(null);
const __setMockFiles = (newMockFiles) => {
  mockFiles = (newMockFiles || []).reduce((acc, cur) => {
    acc[cur] = cur;
    return acc;
  }, {});
};

realFs.realpathSync = (filePath) => filePath;

realFs.existsSync = (filePath) => !!mockFiles[filePath];

realFs.__setMockFiles = __setMockFiles;

mock.module('fs', () => {
  return realFs;
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const shelljs = require('shelljs');
const locate = require('../lib/locate-npm-global-by-binary');

describe('locate_npm_global_package', () => {
  const MOCK_FILE_INFO = [
    '/arcblock/path/node_modules/',
    '/arcblock/path/node_modules/arcblock',
    '/arcblock/path/node_modules/arcblock/bin.js',
    '/arcblock/path/node_modules/@abtnode',
    '/arcblock/path/node_modules/@abtnode/cli/bin.js',
    '/arcblock/path/node_modules/@abtnode/cli/package.json',
    '/arcblock/path/node_modules/test1/node_modules/abtnode',
    '/arcblock/path/node_modules/test1/node_modules/abtnode/bin.js',
    '/arcblock/path/node_modules/test1/node_modules/abtnode/package.json',
    '/arcblock/path/node_modules/test1/package.json',
  ];

  beforeEach(() => {
    mock.clearAllMocks();
    // eslint-disable-next-line global-require, no-underscore-dangle
    require('fs').__setMockFiles(MOCK_FILE_INFO);
  });

  it('should throw error if moduleId is empty', () => {
    expect(() => locate()).toThrow(/is required/);
    expect(() => locate(null)).toThrow(/is required/);
    expect(() => locate('')).toThrow(/is required/);
  });

  it('should return empty string if the module does not exists', () => {
    expect(locate(Date.now().toString())).toEqual('');

    const mockedShelljs = spyOn(shelljs, 'which').mockImplementation(() => ({
      stdout: '',
    }));
    expect(locate(Date.now().toString())).toEqual('');
    expect(mockedShelljs.mock.calls.length).toEqual(1);
  });

  it('should return empty string if there is no package.json in the dir', () => {
    const mockedShelljs = spyOn(shelljs, 'which').mockImplementation(() => ({
      stdout: '/arcblock/path/node_modules/arcblock/bin.js',
    }));

    expect(locate('arcblock')).toEqual('');
    expect(mockedShelljs.mock.calls.length).toEqual(1);
  });

  it('should return package dir if the package.json exists', () => {
    const mockedShelljs = spyOn(shelljs, 'which').mockImplementation(() => ({
      stdout: '/arcblock/path/node_modules/@abtnode/cli/bin.js',
    }));

    expect(locate('abtnode')).toEqual('/arcblock/path/node_modules/@abtnode/cli');
    expect(mockedShelljs.mock.calls.length).toEqual(1);
  });

  it('should return package dir if the package.json exists', () => {
    const mockedShelljs = spyOn(shelljs, 'which').mockImplementation(() => ({
      stdout: '/arcblock/path/node_modules/test1/node_modules/abtnode/bin.js',
    }));

    expect(locate('abtnode')).toEqual('/arcblock/path/node_modules/test1/node_modules/abtnode');
    expect(mockedShelljs.mock.calls.length).toEqual(1);
  });
});
