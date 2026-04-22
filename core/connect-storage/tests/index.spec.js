const { test, describe, expect, beforeAll, afterAll } = require('bun:test');
const DynamicStorage = require('..');

describe('DynamicStorage', () => {
  let storage;

  beforeAll((done) => {
    storage = new DynamicStorage({
      dbPath: '/core/connect-storage:memory:',
      onload: () => done(),
    });
  });

  afterAll(async () => {
    await storage.clear();
  });

  test('should work as expected: v1', async () => {
    expect(() => new DynamicStorage()).toThrow(/requires dbPath/);

    let doc = await storage.create('abcd');
    expect(doc.status).toBe('created');

    doc = await storage.update('abcd', { status: 'connected', did: '1' });
    expect(doc.status).toBe('connected');

    doc = await storage.update('abcd', { otherKey: 'value' });
    expect(doc.status).toBe('connected');
    expect(doc.otherKey).toBe('value');

    expect(storage.update('not-exist', { status: 'connected' })).rejects.toThrow(/Connect session does not exist/);

    doc = await storage.read('abcd');
    expect(doc.status).toBe('connected');
    expect(doc.otherKey).toBe('value');

    doc = await storage.exist('abcd', '1');
    expect(doc).toBeTruthy();

    doc = await storage.delete('abcd');
    expect(doc).toBe(1);

    doc = await storage.exist('abcd', '1');
    expect(doc).toBeFalsy();
  });

  test('should work as expected: v2', async () => {
    storage = new DynamicStorage({
      dbPath: '/core/connect-storage:memory:',
      v2: true,
    });

    let doc = await storage.create('abcd', { status: 'created' });
    expect(doc.status).toBe('created');

    doc = await storage.update('abcd', { status: 'connected', did: '1' });
    expect(doc.status).toBe('connected');

    doc = await storage.update('abcd', { otherKey: 'value' });
    expect(doc.status).toBe('connected');
    expect(doc.otherKey).toBe('value');

    expect(storage.update('not-exist', { status: 'connected' })).rejects.toThrow(/Connect session does not exist/);

    doc = await storage.read('abcd');
    expect(doc.status).toBe('connected');
    expect(doc.otherKey).toBe('value');

    doc = await storage.delete('abcd');
    expect(doc).toBe(1);
  });
});
