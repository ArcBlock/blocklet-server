/* eslint-disable no-await-in-loop */
const fs = require('fs-extra');
const path = require('path');
const semver = require('semver');
const runScript = require('@abtnode/util/lib/run-script');
const getMigrationScripts = require('../util/get-migration-scripts');
const getSafeEnv = require('../util/get-safe-env');
const { name } = require('../../package.json');
const logger = require('@abtnode/logger')(`${name}:blocklet:migration`); // eslint-disable-line

async function runScripts({
  blocklet,
  appDir,
  env,
  oldVersion,
  dbDir,
  backupDir,
  scriptsDir,
  printInfo,
  printSuccess,
  printError,
  output,
  error,
  timeout,
}) {
  // 获取所有待执行的脚本
  let scripts = [];
  try {
    scripts = await getMigrationScripts(scriptsDir);
    printInfo('raw scripts', scripts);
  } catch (err) {
    printError(`Failed to list migration scripts due to: ${err.message}`);
    throw err;
  }

  const pendingScripts = scripts.filter((x) => semver.gt(x.version, oldVersion));

  if (!pendingScripts.length) {
    return true;
  }

  printInfo('pending scripts', pendingScripts);
  // 执行脚本前需要对数据库文件做一次备份
  try {
    await doBackup({ dbDir, backupDir, printInfo, printSuccess, printError });
  } catch (err) {
    printError(`Failed to backup state db due to ${err.message}, abort!`);
    // 备份失败时，需要移除备份目录
    fs.removeSync(backupDir);
    throw err;
  }

  // 按照顺序依次执行 migration 脚本
  for (let i = 0; i < pendingScripts.length; i++) {
    const { script: scriptPath } = pendingScripts[i];
    try {
      printInfo(`Migration script started: ${scriptPath}`);
      await runScript(`node ${path.join(scriptsDir, scriptPath)}`, [blocklet.env.processId, 'migration'].join(':'), {
        cwd: appDir,
        env: getSafeEnv(env),
        silent: false,
        output,
        error,
        timeout,
      });
      printInfo(`Migration script executed: ${scriptPath}`);
    } catch (migrationErr) {
      printError(`Failed to execute migration script: ${scriptPath}, error: ${migrationErr.message}`);

      try {
        await doRestore({ dbDir, backupDir, printInfo, printSuccess, printError });
        // 恢复备份成功时，需要移除备份目录
        fs.removeSync(backupDir);
      } catch (restoreErr) {
        // 如果恢复备份失败，则保留备份目录，恢复数据
        printError(`Failed to restore state db due to: ${restoreErr.message}`);
      }

      throw migrationErr;
    }
  }

  return true;
}

function doBackup({ dbDir, backupDir, printInfo, printSuccess }) {
  printInfo('Backing up before migration...');
  fs.emptyDirSync(backupDir);
  fs.copySync(dbDir, backupDir);
  printSuccess('Backup success');
}

function doRestore({ dbDir, backupDir, printInfo, printSuccess }) {
  printInfo('Restoring when migration failed...');
  fs.emptyDirSync(dbDir);
  fs.copySync(backupDir, dbDir);
  printSuccess('Restore succeed');
}

module.exports = async ({
  blocklet,
  appDir,
  env,
  oldVersion,
  newVersion,
  printInfo = logger.info,
  printSuccess = logger.info,
  printError = logger.error,
  output,
  error,
  timeout,
}) => {
  if (!oldVersion) {
    return;
  }

  const baseDir = env.BLOCKLET_DATA_DIR;

  const scriptsDir = path.join(appDir, 'migration');
  const dbDir = path.join(baseDir, 'db');
  const backupDir = path.join(baseDir, 'db-bak');

  fs.ensureDirSync(scriptsDir);
  fs.ensureDirSync(dbDir);
  fs.ensureDirSync(backupDir);

  await runScripts({
    blocklet,
    appDir,
    env,
    oldVersion,
    newVersion,
    dbDir,
    backupDir,
    scriptsDir,
    printError,
    printInfo,
    printSuccess,
    output,
    error,
    timeout,
  });

  fs.removeSync(backupDir);
};
