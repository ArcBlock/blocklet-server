import { test, expect, describe } from 'bun:test';
import { join } from 'path';
import { tmpdir } from 'os';
import { doSchemaMigration, createSequelize, destroySequelize } from '../src';

describe('Migrate', () => {
  test('should doSchemaMigration throw with invalid module', () => {
    expect(doSchemaMigration('server:memory:', 'abcd')).rejects.toThrow(/Not supported group/);
  });

  test('should doSchemaMigration work with server', async () => {
    await doSchemaMigration('server:memory:', 'server');
  });

  test('should doSchemaMigration work with service', async () => {
    await doSchemaMigration('service:memory:', 'service');
  });

  test('should doSchemaMigration work with blocklet', async () => {
    await doSchemaMigration('blocklet:memory:', 'blocklet');
  });

  test('should doSchemaMigration work with certificate-manager', async () => {
    await doSchemaMigration('module:memory:', 'certificate-manager');
  });

  test('should doSchemaMigration use smaller connection pool (max: 1)', async () => {
    const dbPath = join(tmpdir(), `migrate-test-${Date.now()}.db`);
    try {
      // Now run migration which should also use max: 1
      await doSchemaMigration(dbPath, 'blocklet');

      // Verify the instance still exists and has correct pool config
      const sequelizeAfter = createSequelize(dbPath, { logging: false });
      expect(sequelizeAfter.config.pool?.max).toBe(1);
      expect(sequelizeAfter.config.pool?.idle).toBeLessThan(3500);
    } finally {
      await destroySequelize(dbPath);
    }
  });

  test('should doSchemaMigration work with file-based database', async () => {
    const dbPath = join(tmpdir(), `migrate-file-test-${Date.now()}.db`);
    try {
      await doSchemaMigration(dbPath, 'blocklet');
      // Verify migration completed successfully by checking if we can create sequelize instance
      const sequelize = createSequelize(dbPath, { logging: false });
      expect(sequelize).toBeTruthy();
    } finally {
      await destroySequelize(dbPath);
    }
  });
});
