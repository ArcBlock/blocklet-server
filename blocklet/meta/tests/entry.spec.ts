import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { describe, test, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import { BLOCKLET_BUNDLE_FOLDER } from '../src/constants';
import { validateBlockletEntry } from '../src/entry';

beforeEach(() => {
  mock.restore();
});

describe('validateBlockletEntry', () => {
  const dir = path.join(__dirname, 'test_blocklet');

  beforeEach(() => {
    fs.mkdirSync(dir);
  });

  afterEach(() => {
    fs.removeSync(dir);
  });

  test('should be a function', () => {
    expect(typeof validateBlockletEntry).toBe('function');
  });

  test('should pass if group id dapp and blocklet.js exists', () => {
    const onError: any = mock(() => {});

    const meta = { name: 'abc', bundleName: 'abc', group: 'dapp', main: 'blocklet.js' };

    fs.writeFileSync(path.join(dir, 'blocklet.js'), '');
    validateBlockletEntry(dir, meta as any);
    fs.removeSync(path.join(dir, 'blocklet.js'));
    fs.mkdirSync(path.join(dir, BLOCKLET_BUNDLE_FOLDER), { recursive: true });
    fs.writeFileSync(path.join(dir, BLOCKLET_BUNDLE_FOLDER, 'blocklet.js'), 'console.log("xxx");');
    validateBlockletEntry(dir, meta as any);
    fs.removeSync(path.join(dir, BLOCKLET_BUNDLE_FOLDER));
    try {
      validateBlockletEntry(dir, meta as any);
    } catch (err) {
      onError(err);
    }
    expect(onError.mock.calls.length).toBe(1);
    expect(onError.mock.calls[0][0].message).toMatch(
      'abc may be corrupted or not properly bundled: missing blocklet.js'
    );
  });

  test('should pass if group is static and main dir exists', () => {
    const onError: any = mock(() => {});

    const mainDir = 'www';

    const meta = { group: 'static', main: mainDir, bundleName: 'abc' };

    fs.mkdirSync(path.join(dir, mainDir));
    validateBlockletEntry(dir, meta as any);
    fs.removeSync(path.join(dir, mainDir));
    try {
      validateBlockletEntry(dir, meta as any);
    } catch (err) {
      onError(err);
    }
    expect(onError.mock.calls.length).toBe(1);
    expect(onError.mock.calls[0][0].message).toMatch(
      'abc may be corrupted or not properly configured: missing main folder'
    );
  });

  test('should pass if group is gateway and main dir does not exists', () => {
    const mainDir = 'www';

    const meta = { group: 'gateway', main: mainDir };

    validateBlockletEntry(dir, meta as any);

    const meta2 = { group: 'gateway' };

    validateBlockletEntry(dir, meta2 as any);
  });

  test('should NOT throw error if group is not dapp nor static', () => {
    const onError: any = mock(() => {});

    const group = 'xxxxx';

    const meta = { group };

    try {
      validateBlockletEntry(dir, meta as any);
    } catch (err) {
      onError(err);
    }
    expect(onError.mock.calls.length).toBe(0);
  });

  test('should NOT throw error if group is dapp but there is no main and engine', () => {
    const meta = { group: 'dapp' };

    const onError: any = mock(() => {});

    try {
      validateBlockletEntry(dir, meta as any);
    } catch (err) {
      onError(err);
    }

    expect(onError.mock.calls.length).toBe(0);
  });

  test('should NOT throw error if group is dapp but there is no main and engine is an empty array', () => {
    const meta = { group: 'dapp', engine: [] as any };

    const onError: any = mock(() => {});

    try {
      validateBlockletEntry(dir, meta as any);
    } catch (err) {
      onError(err);
    }

    expect(onError.mock.calls.length).toBe(0);
  });

  test('should throw error if group is dapp and engine is not empty but there is no interpreter in engine', () => {
    const meta = { group: 'dapp', main: 'blocklet.js', engine: { script: 'test' } };

    const onError: any = mock(() => {});

    try {
      validateBlockletEntry(dir, meta as any);
    } catch (err) {
      onError(err);
    }

    expect(onError.mock.calls.length).toBe(1);
    expect(onError.mock.calls[0][0].message).toEqual(expect.stringMatching(/missing engine\.interpreter/));
  });

  test('should throw error if engine is an array but there is no interpreter attr', () => {
    const meta: any = { group: 'dapp', main: 'blocklet.js', engine: [{ platform: 'darwin' }] };

    const onError: any = mock(() => {});

    try {
      validateBlockletEntry(dir, meta as any);
    } catch (err) {
      onError(err);
    }

    expect(onError.mock.calls.length).toBe(1);
    expect(onError.mock.calls[0][0].message).toEqual(expect.stringMatching(/missing engine\.interpreter/));
  });

  test('should throw error if engine is an array but there is no platform attr', () => {
    const meta: any = { group: 'dapp', main: 'blocklet.js', engine: [{ interpreter: 'node' }] };

    const onError: any = mock(() => {});

    try {
      validateBlockletEntry(dir, meta as any);
    } catch (err) {
      onError(err);
    }

    expect(onError.mock.calls.length).toBe(1);
    expect(onError.mock.calls[0][0].message).toEqual(expect.stringMatching(/missing engine\.platform/));
  });

  test('should throw error if engine is an array but there is no platform attr', () => {
    const mockedPlatform = spyOn(os, 'platform').mockImplementation(() => 'linux');

    const meta: any = { group: 'dapp', main: 'blocklet.js', engine: [{ interpreter: 'node', platform: 'darwin' }] };

    const onError: any = mock(() => {});

    try {
      validateBlockletEntry(dir, meta);
    } catch (err) {
      onError(err);
    }

    expect(mockedPlatform.mock.calls.length).toBe(1);
    expect(onError.mock.calls.length).toBe(1);
    expect(onError.mock.calls[0][0].message).toEqual(expect.stringMatching(/no engine run on linux/));
  });
});
