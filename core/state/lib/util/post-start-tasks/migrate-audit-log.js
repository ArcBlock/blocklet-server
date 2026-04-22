/**
 * 这个文件是为了将 audit log 数据从 server 的表迁移至各自的 services 表中.
 * 迁移流程：
 *  1. 读取存在的 blocklet
 *  2. 基于 blocklet 在 server 的 audit log 表中查询自己数据
 *  3. 将数据插入到 blocklet 的 audit log 表中
 *  4. 将迁移记录写入 .audit-log-migration.lock 文件中（JSON 格式，gzip 压缩）
 *  5. 删除 server 的 audit log 表中的数据 只删除迁移成功的数据
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const uniq = require('lodash/uniq');

const logger = require('@abtnode/logger')('migrate-audit-log');

const PAGE_SIZE = 100;
const INSERT_BATCH_SIZE = 100;
const MIGRATION_CONCURRENCY = 5;

function getMigrationRecordFile(dataDir) {
  const folderPath = dataDir || process.env.ABT_NODE_DATA_DIR;
  if (!folderPath) {
    return null;
  }
  return path.join(folderPath, 'core', 'audit-log-migration.lock');
}

/**
 * 创建迁移上下文，包含所有需要访问文件路径的方法
 * @param {string} migrationRecordFile - 迁移记录文件的完整路径
 * @returns {object} 包含 writeMigrationRecord, readMigrationRecord, auditLogIsMigrated 方法的对象
 */
function createMigrationContext(migrationRecordFile) {
  function writeMigrationRecord(data) {
    try {
      const jsonString = JSON.stringify(data);
      const compressed = zlib.gzipSync(jsonString);
      fs.writeFileSync(migrationRecordFile, compressed);
    } catch (error) {
      logger.error('Failed to write migration record:', error);
      throw error;
    }
  }

  function readMigrationRecord() {
    if (!fs.existsSync(migrationRecordFile)) {
      return null;
    }
    const compressed = fs.readFileSync(migrationRecordFile);
    const decompressed = zlib.gunzipSync(compressed);
    const result = JSON.parse(decompressed.toString('utf8'));
    return result;
  }

  function auditLogIsMigrated() {
    const migrationRecord = readMigrationRecord();
    if (!migrationRecord) {
      return false;
    }
    const { summary = {} } = migrationRecord || {};
    const { total = 0, success = 0, skipped = 0, failed = 0 } = summary;
    if (failed > 0) {
      return false;
    }
    if (total === 0) {
      return true;
    }

    return total === success + skipped;
  }

  return {
    writeMigrationRecord,
    readMigrationRecord,
    auditLogIsMigrated,
  };
}

async function getAllBlocklets(states) {
  const result = await states.blocklet.find({ where: {}, attributes: ['appDid'] });
  return result.map((x) => x.appDid);
}

async function getBlockletAuditLogs(states, appDid, page = 1, pageSize = PAGE_SIZE) {
  const blocklet = await states.blocklet.getBlocklet(appDid);
  if (!blocklet) {
    return {
      list: [],
      paging: {
        total: 0,
        pageSize,
        pageCount: 0,
        page,
      },
    };
  }

  const params = {
    scope: uniq(
      [
        blocklet.appDid,
        blocklet.appPid,
        blocklet.structV1Did,
        ...(blocklet.migratedFrom || []).map((x) => x.appDid),
      ].filter(Boolean)
    ),
    paging: { page, pageSize },
  };

  return states.auditLog.findPaginated.call(states.auditLog, params);
}

async function insertBlockletAuditLogs(blockletState, data) {
  if (!data || data.length === 0) {
    return { successIds: [], failedIds: [] };
  }

  // 如果数据量小于等于批次大小，直接一次性插入
  if (data.length <= INSERT_BATCH_SIZE) {
    const result = await blockletState.insertBlockletAuditLogs(data);
    return result;
  }

  // 数据量大于批次大小，需要分批插入
  const totalSuccessIds = [];
  const totalFailedIds = [];

  for (let i = 0; i < data.length; i += INSERT_BATCH_SIZE) {
    const batch = data.slice(i, i + INSERT_BATCH_SIZE);
    const batchNum = Math.floor(i / INSERT_BATCH_SIZE) + 1;

    // eslint-disable-next-line no-await-in-loop
    const result = await blockletState.insertBlockletAuditLogs(batch);

    totalSuccessIds.push(...result.successIds);
    totalFailedIds.push(...result.failedIds);

    logger.info(
      `Insert batch ${batchNum}: total: ${batch.length}, success: ${result.successIds.length}, failed: ${result.failedIds.length}`
    );
  }

  return { successIds: totalSuccessIds, failedIds: totalFailedIds };
}

async function removeBlockletAuditLogs(states, ids = []) {
  if (!ids || ids.length === 0) return 0;

  // 如果 ID 数量小于等于批次大小，直接一次性删除
  if (ids.length <= INSERT_BATCH_SIZE) {
    const removed = await states.auditLog.removeBlockletAuditLogs(ids);
    return removed;
  }

  // 数据量大于批次大小，需要分批删除
  let totalRemoved = 0;

  for (let i = 0; i < ids.length; i += INSERT_BATCH_SIZE) {
    const batch = ids.slice(i, i + INSERT_BATCH_SIZE);
    const batchNum = Math.floor(i / INSERT_BATCH_SIZE) + 1;

    // eslint-disable-next-line no-await-in-loop
    const removed = await states.auditLog.removeBlockletAuditLogs(batch);
    totalRemoved += removed;

    logger.info(`Remove batch ${batchNum}: removed ${removed} audit logs`);
  }

  return totalRemoved;
}

async function migrateBlocklet(states, appDid, nodeDid, blockletState) {
  const startTime = Date.now();

  if (appDid === nodeDid) {
    return { status: 'skipped', auditLogsTotal: 0, successMigrated: 0, skipped: 0, duration: '0.00s' };
  }

  let page = 1;
  let totalFound = 0;
  let totalMigrated = 0;
  let hasNextPage = true;

  while (hasNextPage) {
    // eslint-disable-next-line no-await-in-loop
    const result = await getBlockletAuditLogs(states, appDid, page);
    const { list: auditLogs, paging } = result;

    logger.info(`Found ${auditLogs.length}/${paging.total} audit logs for blocklet ${appDid}, page: ${page}`);

    if (!auditLogs || auditLogs.length === 0) {
      hasNextPage = false;
      break;
    }

    totalFound += auditLogs.length;

    // eslint-disable-next-line no-await-in-loop
    const insertResult = await insertBlockletAuditLogs(blockletState, auditLogs);
    const { successIds } = insertResult;

    // eslint-disable-next-line no-await-in-loop
    const removeRows = await removeBlockletAuditLogs(states, successIds);

    totalMigrated += successIds.length;

    // 根据删除结果决定下一页查询策略
    const allDeleted = removeRows === successIds.length;
    if (allDeleted) {
      // 删除成功，继续查询第一页（因为数据已被删除，第一页会有新数据）
      page = 1;
    } else {
      // 删除失败，查询下一页（避免重复处理）
      page++;
      logger.warn(
        `Delete incomplete for blocklet ${appDid}: migrated ${successIds.length}, deleted ${removeRows} - move to page ${page}`
      );
    }

    hasNextPage = paging && paging.page < paging.pageCount;
  }

  const durationMs = Date.now() - startTime;
  const duration = `${(durationMs / 1000).toFixed(2)}s`;
  const skipped = totalFound - totalMigrated;

  if (totalFound > 0) {
    logger.info(`Blocklet ${appDid} migration completed: ${totalMigrated}/${totalFound} migrated in ${duration}`);
  }

  return totalFound === 0
    ? { status: 'skipped', auditLogsTotal: 0, successMigrated: 0, skipped: 0, duration }
    : { status: 'success', auditLogsTotal: totalFound, successMigrated: totalMigrated, skipped, duration };
}

async function runWithConcurrency(tasks, concurrency = MIGRATION_CONCURRENCY) {
  const results = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    // eslint-disable-next-line no-await-in-loop
    const batchResults = await Promise.allSettled(batch.map((task) => task()));
    results.push(...batchResults);
  }
  return results;
}

async function migrateAuditLog(dataDir, states, nodeDid, getBlockletStates) {
  const totalStartTime = Date.now();

  try {
    const migrationRecordFile = getMigrationRecordFile(dataDir);
    if (!migrationRecordFile) {
      logger.info('The file path does not exist, skipping...');
      return;
    }
    const ctx = createMigrationContext(migrationRecordFile);

    const isMigrated = ctx.auditLogIsMigrated();
    if (isMigrated) {
      logger.info('Audit log migration has already been completed, skipping...');
      return;
    }

    const blocklets = await getAllBlocklets(states);
    const record = { summary: { total: blocklets.length, success: 0, skipped: 0, failed: 0, totalDuration: '0.00s' } };

    logger.info(`Starting migration for ${blocklets.length} blocklets with concurrency of ${MIGRATION_CONCURRENCY}`);

    const tasks = blocklets.map((appDid) => async () => {
      // eslint-disable-next-line no-useless-catch
      try {
        const blockletState = await getBlockletStates(appDid);
        const result = await migrateBlocklet(states, appDid, nodeDid, blockletState);
        return { appDid, ...result };
      } catch (error) {
        logger.error(`Failed to migrate audit log for blocklet ${appDid}`, error);
        throw error;
      }
    });

    const results = await runWithConcurrency(tasks, MIGRATION_CONCURRENCY);

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { appDid, status, duration, ...data } = result.value;
        if (status === 'skipped') {
          record.summary.skipped++;
        } else {
          record.summary.success++;
        }
        record[appDid] = { ...data, duration, migratedAt: new Date().toISOString() };
      } else {
        const { appDid, error } = result.reason;
        record.summary.failed++;
        record[appDid] = {
          auditLogsTotal: 0,
          successMigrated: 0,
          skipped: 0,
          duration: '0.00s',
          migratedAt: new Date().toISOString(),
        };
        logger.error(`Failed to migrate audit log for blocklet ${appDid}`, error);
      }
    });

    const totalDurationMs = Date.now() - totalStartTime;
    const totalDuration = `${(totalDurationMs / 1000).toFixed(2)}s`;
    record.summary.totalDuration = totalDuration;
    record.summary.updatedAt = new Date().toISOString();

    ctx.writeMigrationRecord(record);
    logger.info(`Audit log migration completed, total time: ${totalDuration}`);
  } catch (error) {
    logger.error('Failed to migrate audit log', error);
  }
}

module.exports = {
  migrateAuditLog,
};
