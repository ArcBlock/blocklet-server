import { afterEach, test, expect } from 'bun:test';
import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';

import { encrypt } from '../../src/security';
import { parseEnvFile } from '../../src/util/parse-env-file';

const envFile = path.join(os.tmpdir(), 'env');

afterEach(() => {
  fs.removeSync(envFile);
});

test('common', () => {
  fs.writeFileSync(envFile, JSON.stringify({ foo: 'bar' }));
  expect(parseEnvFile(envFile)).toEqual({ foo: 'bar', preferences: {} });
});

test('has preferences', () => {
  fs.writeFileSync(envFile, JSON.stringify({ foo: 'bar', 'prefs.foo': 'bar' }));
  expect(parseEnvFile(envFile)).toEqual({ foo: 'bar', preferences: { foo: 'bar' } });
});

test('encrypt', () => {
  const env = { foo: 'bar' };
  const apiKey = `${Math.random()}`;
  const componentDid = 'xxxx';
  const str = encrypt(JSON.stringify(env), apiKey, componentDid);
  fs.writeFileSync(envFile, str);
  expect(parseEnvFile(envFile, { apiKey, componentDid })).toEqual({ foo: 'bar', preferences: {} });
});

test('decrypt with wrong api key', () => {
  const env = { foo: 'bar' };
  const apiKey = `${Math.random()}`;
  const componentDid = 'xxxx';
  const str = encrypt(JSON.stringify(env), apiKey, componentDid);
  fs.writeFileSync(envFile, str);
  expect(() => parseEnvFile(envFile, { apiKey: 'wrong', componentDid })).toThrow();
});
