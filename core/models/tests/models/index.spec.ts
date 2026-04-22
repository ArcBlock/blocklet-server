import { test, expect, describe } from 'bun:test';
import { Sequelize } from 'sequelize';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  createSequelize,
  destroySequelize,
  getServerModels,
  getServiceModels,
  getBlockletModels,
  getConnectModels,
  getCertificateManagerModels,
  setupModels,
} from '../../src';

describe('models', () => {
  test('createSequelize#memory', async () => {
    const sequelize = await createSequelize('sqlite::memory:', { logging: false });
    const models = getServerModels();
    expect(models.AccessKey).toBeTruthy();
    try {
      setupModels(models, sequelize);
      await sequelize.sync({ force: true });
    } catch (err) {
      expect(err).toBeFalsy();
    }
  });

  test('createSequelize#file', async () => {
    const dbPath = join(tmpdir(), Math.random().toString(), 'test.db');
    const sequelize = await createSequelize(dbPath, { logging: false });
    const models = getServerModels();
    expect(models.AccessKey).toBeTruthy();
    try {
      setupModels(models, sequelize);
      await sequelize.sync({ force: true });
    } catch (err) {
      expect(err).toBeFalsy();
    }

    destroySequelize(dbPath);
  });

  test('getServerModels', async () => {
    const sequelize = new Sequelize('sqlite::memory:', { logging: false });
    const models = getServerModels();
    expect(models.AccessKey).toBeTruthy();
    try {
      setupModels(models, sequelize);
      await sequelize.sync({ force: true });
    } catch (err) {
      expect(err).toBeFalsy();
    }
  });

  test('getServiceModels', async () => {
    const sequelize = new Sequelize('sqlite::memory:', { logging: false });
    const models = getServiceModels();
    expect(models.Message).toBeTruthy();
    try {
      setupModels(models, sequelize);
      await sequelize.sync({ force: true });
    } catch (err) {
      expect(err).toBeFalsy();
    }
  });

  test('getCertificateManagerModels', async () => {
    const sequelize = new Sequelize('sqlite::memory:', { logging: false });
    const models = getCertificateManagerModels();
    expect(models.Certificate).toBeTruthy();
    try {
      setupModels(models, sequelize);
      await sequelize.sync({ force: true });
    } catch (err) {
      expect(err).toBeFalsy();
    }
  });

  test('getBlockletModels', async () => {
    const sequelize = new Sequelize('sqlite::memory:', { logging: false });
    const models = getBlockletModels();
    expect(models.User).toBeTruthy();
    try {
      setupModels(models, sequelize);
      await sequelize.sync({ force: true });
    } catch (err) {
      expect(err).toBeFalsy();
    }
  });

  test('getConnectModels', async () => {
    const sequelize = new Sequelize('sqlite::memory:', { logging: false });
    const models = getConnectModels();
    expect(models.Connection).toBeTruthy();
    try {
      setupModels(models, sequelize);
      await sequelize.sync({ force: true });
    } catch (err) {
      expect(err).toBeFalsy();
    }
  });
});
