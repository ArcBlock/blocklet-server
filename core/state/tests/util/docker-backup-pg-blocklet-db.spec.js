const { test, expect, describe, beforeAll, afterAll, beforeEach, spyOn } = require('bun:test');
const fs = require('fs/promises');
const path = require('path');
const { execSync } = require('child_process');
const { dbPathToDbName } = require('@abtnode/models');

const {
  dockerBackupPgBlockletDb,
  dockerRestorePgBlockletDb,
} = require('../../lib/util/docker/docker-backup-pg-blocklet-db');
const { ensureDockerPostgres } = require('../../lib/util/docker/ensure-docker-postgres');
const { checkDockerInstalled } = require('../../lib/util/docker/check-docker-installed');

const TEST_DB_ID = 'zNKqWfzKZyW2rFqUCcnTZfW2obrTtaGK989t';
const RANDOM_DB_ID = Math.random().toString(36).substring(2, 8);
const DATA_DIR = `/tmp/.blocklet-server_${RANDOM_DB_ID}`;
const DB_PATH = `${DATA_DIR}/data/${TEST_DB_ID}/blocklet.db`;
const TEST_DB_NAME = dbPathToDbName(DB_PATH);

// 验证数据为空
const checkDbExists = (dbName) => {
  const result = execSync(
    `docker exec abtnode-postgres psql -U postgres -d postgres -tA -q -c "SELECT 1 FROM pg_database WHERE datname = '${dbName}';"`,
    { encoding: 'utf8' }
  ).trim();

  return result === '1';
};

// 这个测试需要有 docker 环境, 会真实创建 pg 并且使用 pg_dump 备份还原
describe('E2E: PostgreSQL Docker Backup/Restore', () => {
  const baseEnv = process.env.NODE_ENV;
  beforeAll(async () => {
    // 如果 NODE_ENV 是 test 会跳过 docker 检查
    process.env.NODE_ENV = 'e2e';
    process.env.IS_E2E = '1';
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.mkdir(path.join(DATA_DIR, 'core'), { recursive: true });
    await fs.writeFile(path.join(DATA_DIR, 'core', 'sqlite-to-postgres.lock'), 'aa');

    if (!(await checkDockerInstalled())) {
      console.warn('[docker-backup-pg-blocklet-db.spec.js] docker is not installed, skip test');
      return;
    }

    const url = await ensureDockerPostgres(DATA_DIR);
    process.env.ABT_NODE_POSTGRES_URL = url;
    try {
      execSync(
        `docker exec abtnode-postgres psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS \\"${TEST_DB_NAME}\\";"`
      );
    } catch (_) {
      //
    }
    // 创建测试数据库
    execSync(`docker exec abtnode-postgres psql -U postgres -d postgres -c "CREATE DATABASE \\"${TEST_DB_NAME}\\";"`);

    execSync(
      `docker exec abtnode-postgres psql -U postgres -d ${TEST_DB_NAME} -c "CREATE TABLE test_table(id SERIAL PRIMARY KEY, name TEXT);"`
    );
    execSync(
      `docker exec abtnode-postgres psql -U postgres -d ${TEST_DB_NAME} -c "INSERT INTO test_table(name) VALUES('Alice'), ('Bob');"`
    );
  });

  afterAll(async () => {
    process.env.NODE_ENV = baseEnv;
    if (!(await checkDockerInstalled())) {
      console.warn('[docker-backup-pg-blocklet-db.spec.js] docker is not installed, skip test');
      return;
    }
    execSync(
      `docker exec abtnode-postgres psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS \\"${TEST_DB_NAME}\\";"`
    );
  });

  beforeEach(() => {
    spyOn(console, 'warn').mockReturnValue();
  });

  test('backup and restore database', async () => {
    if (!(await checkDockerInstalled())) {
      console.warn('[docker-backup-pg-blocklet-db.spec.js] docker is not installed, skip test');
      return;
    }

    // 备份
    const backData = await dockerBackupPgBlockletDb(DB_PATH);
    expect(backData.backupPath?.length).toBeGreaterThan(0);
    const stat = await fs.stat(backData.backupPath);
    expect(stat.size).toBeGreaterThan(100); // 至少有些数据

    // 验证表里的数据
    const output0 = execSync(
      `docker exec abtnode-postgres psql -U postgres -d ${TEST_DB_NAME} -tA -q -c "SELECT * FROM test_table;"`,
      { encoding: 'utf-8' }
    );
    expect(output0.trim()).toBe('1|Alice\n2|Bob');

    // 删除数据库
    execSync(
      `docker exec abtnode-postgres psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS \\"${TEST_DB_NAME}\\";"`
    );

    expect(checkDbExists(TEST_DB_NAME)).toBe(false);

    // 还原
    const restoreData = await dockerRestorePgBlockletDb(DB_PATH);
    expect(restoreData.backupPath).toBe(backData.backupPath);
    expect(restoreData.dbName).toBe(TEST_DB_NAME);

    // 验证表已创建
    const output = execSync(
      `docker exec abtnode-postgres psql -U postgres -d ${TEST_DB_NAME} -tA -q -c "SELECT COUNT(*) FROM test_table;"`,
      { encoding: 'utf-8' }
    );

    expect(parseInt(output.trim(), 10)).toBe(2); // Alice + Bob

    // 验证表里的数据
    const output2 = execSync(
      `docker exec abtnode-postgres psql -U postgres -d ${TEST_DB_NAME} -tA -q -c "SELECT * FROM test_table;"`,
      { encoding: 'utf-8' }
    );
    expect(output2.trim()).toBe('1|Alice\n2|Bob');

    // 连续还原
    const agaginRestoreData = await dockerRestorePgBlockletDb(DB_PATH);
    expect(agaginRestoreData.backupPath).toBe(backData.backupPath);
    expect(agaginRestoreData.dbName).toBe(TEST_DB_NAME);

    // 验证表已创建
    const againOutput = execSync(
      `docker exec abtnode-postgres psql -U postgres -d ${TEST_DB_NAME} -tA -q -c "SELECT COUNT(*) FROM test_table;"`,
      { encoding: 'utf-8' }
    );

    expect(parseInt(againOutput.trim(), 10)).toBe(2); // Alice + Bob

    // 验证表里的数据
    const againOutput2 = execSync(
      `docker exec abtnode-postgres psql -U postgres -d ${TEST_DB_NAME} -tA -q -c "SELECT * FROM test_table;"`,
      { encoding: 'utf-8' }
    );
    expect(againOutput2.trim()).toBe('1|Alice\n2|Bob');

    await fs.unlink(backData.backupPath);
  }, 120_000);

  test('should skip backup when database does not exist', async () => {
    if (!(await checkDockerInstalled())) {
      console.warn('[docker-backup-pg-blocklet-db.spec.js] docker is not installed, skip test');
      return;
    }

    // 先删除数据库
    execSync(
      `docker exec abtnode-postgres psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS \\"${TEST_DB_NAME}\\";"`
    );

    // 执行备份
    const result = await dockerBackupPgBlockletDb(DB_PATH);

    // 应该跳过，没有生成备份文件
    expect(result.backupPath ?? '').toBe('');
    expect(result.dbName ?? '').toBe('');
    await expect(fs.access(result.backupPath)).rejects.toBeTruthy();

    // 恢复数据库（用于后续测试）
    execSync(`docker exec abtnode-postgres psql -U postgres -d postgres -c "CREATE DATABASE \\"${TEST_DB_NAME}\\";"`);
    execSync(
      `docker exec abtnode-postgres psql -U postgres -d ${TEST_DB_NAME} -c "CREATE TABLE test_table(id SERIAL PRIMARY KEY, name TEXT);"`
    );
    execSync(
      `docker exec abtnode-postgres psql -U postgres -d ${TEST_DB_NAME} -c "INSERT INTO test_table(name) VALUES('Alice'), ('Bob');"`
    );
  }, 120_000);

  test('should skip restore when backup file is missing', async () => {
    if (!(await checkDockerInstalled())) {
      console.warn('[docker-backup-pg-blocklet-db.spec.js] docker is not installed, skip test');
      return;
    }

    const result = await dockerBackupPgBlockletDb(DB_PATH);

    const { backupPath } = result;

    if (backupPath) {
      await fs.unlink(backupPath);
    }

    execSync(
      `docker exec abtnode-postgres psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS \\"${TEST_DB_NAME}\\";"`
    );

    // 执行还原，应跳过（不会创建数据库）
    const restoreResult = await dockerRestorePgBlockletDb(DB_PATH);
    expect(restoreResult.dbName ?? '').toBe('');

    // 验证数据库确实未被创建
    const exists = execSync(
      `docker exec abtnode-postgres psql -U postgres -d postgres -tA -q -c "SELECT 1 FROM pg_database WHERE datname = '${TEST_DB_NAME}';"`,
      { encoding: 'utf8' }
    ).trim();
    expect(exists).not.toBe('1');
  }, 120_000);
});
