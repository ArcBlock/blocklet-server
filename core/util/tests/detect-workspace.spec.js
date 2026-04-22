const { test, expect, describe } = require('bun:test');
const path = require('path');
const detectWorkspace = require('../lib/detect-workspace');

const workspaceRoot = path.resolve(__dirname, '../../../');
const mockFindUp = (actual) => ({ sync: (expected) => (expected === actual ? path.join(workspaceRoot, actual) : '') });

describe('DetectWorkspace', () => {
  test('should detect current repo as workspace', () => {
    const result = detectWorkspace(__dirname);
    expect(result.type).toEqual('bun');
    expect(result.dir).toEqual(workspaceRoot);
  });

  test('should detect bun workspace as expected', () => {
    const result = detectWorkspace(__dirname, mockFindUp('bun.lock'));
    expect(result.type).toEqual('bun');
    expect(result.dir).toEqual(workspaceRoot);
  });

  test('should detect yarn workspace as expected', () => {
    const result = detectWorkspace(__dirname, mockFindUp('yarn.lock'));
    expect(result.type).toEqual('yarn');
    expect(result.dir).toEqual(workspaceRoot);
  });

  test('should detect pnpm workspace as expected', () => {
    const result = detectWorkspace(__dirname, mockFindUp('pnpm-workspace.yaml'));
    expect(result.type).toEqual('pnpm');
    expect(result.dir).toEqual(workspaceRoot);
  });

  test('should detect rush workspace as expected', () => {
    const result = detectWorkspace(__dirname, mockFindUp('rush.json'));
    expect(result.type).toEqual('rush');
    expect(result.dir).toEqual(workspaceRoot);
  });

  test('should detect lerna workspace as expected', () => {
    const result = detectWorkspace(__dirname, mockFindUp('lerna.json'));
    expect(result.type).toEqual('lerna');
    expect(result.dir).toEqual(workspaceRoot);
  });

  test('should detect npm workspace as package.json', () => {
    const result = detectWorkspace(__dirname, mockFindUp('package-lock.json'));
    expect(result.type).toEqual('npm');
    expect(result.dir).toEqual(workspaceRoot);
  });
});
