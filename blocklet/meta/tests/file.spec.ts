import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { select, update, read } from '../src/index';

describe('MetaFile.select', () => {
  const dir = path.join(os.tmpdir(), Date.now().toString());

  const file = path.join(dir, 'blocklet.yml');

  const fileAlt = path.join(dir, 'blocklet.yaml');

  beforeAll(() => {
    fs.mkdirpSync(dir);
  });
  test('should throw error when none meta file exist', () => {
    expect(() => select(dir)).toThrowError(/not found/);
  });
  test('should return blocklet.yml first', () => {
    fs.writeFileSync(file, '');
    expect(select(dir)).toEqual(file);
    fs.removeSync(file);
  });
  test('should return blocklet.yml first', () => {
    fs.writeFileSync(fileAlt, '');
    expect(select(dir)).toEqual(fileAlt);
  });
  afterAll(() => {
    fs.removeSync(dir);
  });
});
describe('MetaFile.read', () => {
  const dir = path.join(os.tmpdir(), Date.now().toString());

  const file = path.join(dir, 'blocklet.yml');

  beforeAll(() => {
    fs.mkdirpSync(dir);
  });
  test('should get right content in blocklet.yml', () => {
    fs.writeFileSync(
      file,
      `name: test-blocklet
title: Test Blocklet`
    );
    expect(read(file)).toEqual({
      name: 'test-blocklet',
      title: 'Test Blocklet',
    });
    fs.removeSync(file);
  });
  afterAll(() => {
    fs.removeSync(dir);
  });
});
describe('MetaFile.update', () => {
  const dir = path.join(os.tmpdir(), Date.now().toString());

  const file = path.join(dir, 'blocklet.yml');

  beforeAll(() => {
    fs.mkdirpSync(dir);
  });
  test('should update blocklet meta file', () => {
    update(file, {
      path: '123',
      folder: '123',
      htmlAst: '123',
      stats: '123',
      capabilities: '123',
    } as any);
    const r1 = fs.readFileSync(file).toString();

    expect(r1).not.toEqual('specVersion: 1.0.0\n');
    update(file, {
      path: '123',
      folder: '123',
      htmlAst: '123',
      stats: '123',
    } as any);
    const r2 = fs.readFileSync(file).toString();

    expect(r2).toEqual('specVersion: 1.0.0\n');
  });
  afterAll(() => {
    fs.removeSync(dir);
  });
});
