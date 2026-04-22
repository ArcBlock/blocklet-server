/* eslint-disable no-console */
const { test, expect, describe } = require('bun:test');
const isSatisfied = require('../../lib/util/requirement');

describe('BlockletRequiments', () => {
  test('should return true when all satisfied', () => {
    expect(isSatisfied({ abtnode: '>=1.1.0', os: '*', cpu: '*' })).toEqual(true);
    expect(isSatisfied({ abtnode: '>=1.1.0', os: process.platform, cpu: '*' })).toEqual(true);
    expect(isSatisfied({ abtnode: '>=1.1.0', os: [process.platform], cpu: '*' })).toEqual(true);
    expect(isSatisfied({ abtnode: '>=1.1.0', os: '*', cpu: process.arch })).toEqual(true);
    expect(isSatisfied({ abtnode: '>=1.1.0', os: '*', cpu: [process.arch] })).toEqual(true);
    expect(isSatisfied({ abtnode: '>=1.1.0' })).toEqual(true);
    expect(isSatisfied({ cpu: process.arch })).toEqual(true);
    expect(isSatisfied({ os: process.platform })).toEqual(true);
    expect(isSatisfied({})).toEqual(true);
  });

  test('should return false when some not satisfied', () => {
    expect(isSatisfied({ abtnode: '>=100.1.0', os: '*', cpu: '*' }, false)).toEqual(false);
    expect(isSatisfied({ abtnode: '<=1.1.0', os: '*', cpu: '*' }, false)).toEqual(false);
    expect(isSatisfied({ abtnode: '>=1.1.0', os: 'xxx', cpu: '*' }, false)).toEqual(false);
    expect(isSatisfied({ abtnode: '>=1.1.0', os: ['xxx'], cpu: '*' }, false)).toEqual(false);
    expect(isSatisfied({ abtnode: '>=1.1.0', os: '*', cpu: 'xxx' }, false)).toEqual(false);
    expect(isSatisfied({ abtnode: '>=1.1.0', os: '*', cpu: ['xxx'] }, false)).toEqual(false);
  });

  test('should throw when some not satisfied', () => {
    expect(() => isSatisfied({ abtnode: '>=100.1.0', os: '*', cpu: '*' })).toThrow(/server version/);
    expect(() => isSatisfied({ abtnode: '<=1.1.0', os: '*', cpu: '*' })).toThrow(/server version/);
    expect(() => isSatisfied({ abtnode: '>=1.1.0', os: 'xxx', cpu: '*' })).toThrow(/platform/);
    expect(() => isSatisfied({ abtnode: '>=1.1.0', os: ['xxx'], cpu: '*' })).toThrow(/platform/);
    expect(() => isSatisfied({ abtnode: '>=1.1.0', os: '*', cpu: 'xxx' })).toThrow(/architecture/);
    expect(() => isSatisfied({ abtnode: '>=1.1.0', os: '*', cpu: ['xxx'] })).toThrow(/architecture/);
  });

  test('should return as expected when abtnode version is an prerelease version', () => {
    isSatisfied._setActualServerVersion('1.2.0-prerelease.1');
    expect(isSatisfied({ abtnode: '>=1.1.0', os: '*', cpu: '*' })).toEqual(true);
    expect(isSatisfied({ abtnode: '>=1.2.0', os: '*', cpu: '*' })).toEqual(true);
    expect(isSatisfied({ abtnode: '>=1.2.1', os: '*', cpu: '*' }, false)).toEqual(false);
  });

  test('should return true if requirements param is empty', () => {
    expect(isSatisfied()).toEqual(true);
    expect(isSatisfied(undefined)).toEqual(true);
    expect(isSatisfied(null)).toEqual(true);
    expect(isSatisfied(false)).toEqual(true);
    expect(isSatisfied(0)).toEqual(true);
  });

  test('should return true if requirements param is not object', () => {
    expect(isSatisfied(1)).toEqual(true);
    expect(isSatisfied(true)).toEqual(true);
    expect(isSatisfied('abc')).toEqual(true);
  });

  test('should parse requirements.server and backward compatible with requirements.abtnode', () => {
    expect(() => isSatisfied({ abtnode: '>=100.1.0' })).toThrow(/server version/);
    expect(isSatisfied({ abtnode: '>=0.0.1' })).toEqual(true);

    expect(() => isSatisfied({ server: '>=100.1.0' })).toThrow(/server version/);
    expect(isSatisfied({ server: '>=0.0.1' })).toEqual(true);

    // should ignore abtnode if server exists
    expect(() => isSatisfied({ server: '>=100.1.0', abtnode: '>=0.0.1' })).toThrow(/server version/);
    expect(isSatisfied({ server: '>=0.0.1', abtnode: '>=100.1.0' })).toEqual(true);
  });

  test('should nodejs version check work as expected', () => {
    expect(isSatisfied({ nodejs: '*' })).toEqual(true);
    expect(isSatisfied({ nodejs: '<100.0.0' })).toEqual(true);
    expect(isSatisfied._actualNodejsVersion).toMatch(/v\d+\.\d+\.\d+/);
    expect(() => isSatisfied({ nodejs: '>=100.0.0' })).toThrow(/Nodejs version/);
  });
});
