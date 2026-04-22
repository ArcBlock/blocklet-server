/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
/* eslint-disable prefer-destructuring */

const { dbPathToPostgresUrl } = require('@abtnode/models');
const { QueryTypes, Sequelize } = require('sequelize');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const ignoreErrorTableNames = new Set(['runtime_insights', 'notification_receivers', 'notifications']);
const needCleanDataTableNames = new Set(['sessions']);
const notCheckPrimaryKeyTableNames = new Set(['tagging']);

const needBreakErrors = [];

/**
 * Generate a unique ID for blocklet_children records
 */
function generateChildId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 因为删除了表字段，所以需要单独处理，不然 migrate 有旧的 children 数据会失败
 * @param {object} params - Parameters
 * @param {Sequelize} params.pgDb - PostgreSQL database connection
 * @param {string} params.blockletId - Parent blocklet ID
 * @param {string} params.parentBlockletDid - Parent blocklet DID
 * @param {Array} params.children - Children array to migrate
 */
async function migrateBlockletChildrenToTable({ pgDb, blockletId, parentBlockletDid, children }) {
  if (!Array.isArray(children) || children.length === 0) {
    return;
  }

  for (const child of children) {
    const childMeta = child?.meta || {};
    const childDid = childMeta?.did;

    if (!childDid) {
      console.warn(`   ⚠️ Child in blocklet ${blockletId} has no meta.did, skipping`);
      continue;
    }

    try {
      // Check if child already exists
      const [existing] = await pgDb.query(
        'SELECT id FROM blocklet_children WHERE "parentBlockletId" = $1 AND "childDid" = $2 LIMIT 1',
        { bind: [blockletId, childDid], type: QueryTypes.SELECT }
      );

      if (existing) {
        console.log(`   ℹ️ Child ${childDid} already exists for blocklet ${blockletId}, skipping`);
        continue;
      }

      // Insert child record
      const insertSQL = `
        INSERT INTO blocklet_children (
          id, "parentBlockletId", "parentBlockletDid", "childDid", "mountPoint",
          meta, "bundleSource", source, "deployedFrom", mode, status,
          ports, environments, "installedAt", "startedAt",
          "stoppedAt", "pausedAt", operator, "inProgressStart", "greenStatus",
          "greenPorts", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6::jsonb, $7::jsonb, $8, $9, $10, $11,
          $12::jsonb, $13::jsonb, $14, $15,
          $16, $17, $18, $19, $20,
          $21::jsonb, $22, $23
        )
        ON CONFLICT DO NOTHING
      `;

      const now = new Date();
      const bindValues = [
        generateChildId(), // id
        blockletId, // parentBlockletId
        parentBlockletDid, // parentBlockletDid
        childDid, // childDid
        child.mountPoint || null, // mountPoint
        JSON.stringify(child.meta || {}), // meta
        JSON.stringify(child.bundleSource || {}), // bundleSource
        child.source || 0, // source
        child.deployedFrom || '', // deployedFrom
        child.mode || 'production', // mode
        child.status || 0, // status
        JSON.stringify(child.ports || {}), // ports
        JSON.stringify(child.environments || []), // environments
        child.installedAt || null, // installedAt
        child.startedAt || null, // startedAt
        child.stoppedAt || null, // stoppedAt
        child.pausedAt || null, // pausedAt
        child.operator || null, // operator
        child.inProgressStart || null, // inProgressStart
        child.greenStatus || null, // greenStatus
        child.greenPorts ? JSON.stringify(child.greenPorts) : null, // greenPorts
        now, // createdAt
        now, // updatedAt
      ];

      await pgDb.query(insertSQL, { bind: bindValues });
      console.log(`   ✅ Migrated child ${childDid} to blocklet_children table`);
    } catch (err) {
      // Ignore unique constraint errors
      if (err.name === 'SequelizeUniqueConstraintError' || err.message?.includes('UNIQUE constraint')) {
        console.log(`   ℹ️ Child ${childDid} already exists (unique constraint), skipping`);
        continue;
      }
      console.error(`   ❌ Failed to migrate child ${childDid}:`, err.message);
    }
  }
}

function sortTableNames(tableNames, sort) {
  return [...tableNames].sort((a, b) => {
    const indexA = sort.indexOf(a);
    const indexB = sort.indexOf(b);

    const scoreA = indexA === -1 ? Infinity : indexA;
    const scoreB = indexB === -1 ? Infinity : indexB;

    return scoreA - scoreB;
  });
}

async function migrateAllTablesNoModels(dbPath) {
  // Initialize SQLite connection
  const connectUrl = process.env.ABT_NODE_POSTGRES_URL;
  const sqliteDb = new Sequelize({ dialect: 'sqlite', storage: dbPath, logging: false });
  const postgresUrl = dbPathToPostgresUrl(dbPath, connectUrl);
  const pgDb = new Sequelize(postgresUrl, {
    dialect: 'postgres',
    pool: { max: 10, min: 0, idle: 10000 },
    logging: false,
  });

  if (pgDb.getDialect() !== 'postgres') {
    throw new Error(`PG_CONNECTION_STRING is not a valid Postgres connection string: ${pgDb.getDialect()}`);
  }

  const sqliteQI = sqliteDb.getQueryInterface();
  const pgQI = pgDb.getQueryInterface();

  let tableNames = await sqliteQI.showAllTables();
  tableNames = tableNames
    .map((t) => (typeof t === 'string' ? t : t.tableName || t.name))
    .filter((name) => !/^(sqlite|sequelize)/.test(name.toLowerCase()) && name !== 'runtime_insights');

  // 把 tableNames 排序, 把被依赖的表放前面
  // blocklet_children 需要在 blocklets 之前处理，因为 blocklets 的 children 字段需要迁移到 blocklet_children 表
  tableNames = sortTableNames(tableNames, ['users', 'notification_receivers', 'blocklet_children', 'blocklets']);

  for (const tableName of tableNames) {
    console.log(`\n➡️ Starting migration for table: ${dbPath} ${tableName}`);

    const colInfos = await sqliteDb.query(`PRAGMA TABLE_INFO("${tableName}")`, { type: QueryTypes.SELECT });
    const sqliteSchema = {};
    for (const col of colInfos) {
      sqliteSchema[col.name] = {
        type: col.type,
        allowNull: col.notnull === 0,
        defaultValue: col.dflt_value,
        primaryKey: col.pk === 1,
      };
    }

    let allCols = Object.keys(sqliteSchema);
    // 删除 server.db 的 blocklets 表中的 controller 列, 属于历史遗留数据
    if (dbPath.includes('server.db') && tableName === 'blocklets') {
      allCols = allCols.filter((c) => c !== 'controller');
    }

    // 删除 blocklets 表中的 children 列, 因为 children 已经拆分到 blocklet_children 表
    // children 数据会在迁移过程中单独处理
    const hasChildrenColumn = tableName === 'blocklets' && sqliteSchema.children;
    if (hasChildrenColumn) {
      allCols = allCols.filter((c) => c !== 'children');
      console.log('   ℹ️ Detected children column in blocklets table, will migrate to blocklet_children table');
    }
    let pkCols = allCols.filter((c) => sqliteSchema[c].primaryKey);
    if (!pkCols.length) {
      pkCols = [allCols[0]];
      console.warn(`   ⚠️ Table ${tableName} has no primary key; using "${pkCols[0]}"`);
    }
    const nonPkCols = allCols.filter((c) => !pkCols.includes(c));

    // Describe PG table to detect JSON/auto-inc
    const pgSchema = await pgQI.describeTable(tableName);

    const varcharLimits = {};
    for (const [col, def] of Object.entries(pgSchema)) {
      const m = def.type.match(/character varying\((\d+)\)/i);
      if (m) {
        varcharLimits[col] = parseInt(m[1], 10);
      }
    }

    // find JSON/JSONB
    const jsonCols = Object.entries(pgSchema)
      .filter(([, def]) => def.type && ['JSON', 'JSONB'].includes(def.type.toUpperCase()))
      .map(([col, def]) => ({ name: col, type: def.type.toUpperCase() }));

    // find DATE/TIMESTAMP columns (need to validate and fix invalid dates)
    const dateCols = Object.entries(pgSchema)
      .filter(([, def]) => {
        const type = def.type?.toUpperCase() || '';
        return type.includes('DATE') || type.includes('TIMESTAMP') || type === 'DATE' || type.startsWith('TIMESTAMP');
      })
      .map(([col]) => col);

    // find auto-increment columns (nextval default)
    const autoIncCols = Object.entries(pgSchema)
      .filter(([, def]) => typeof def.defaultValue === 'string' && def.defaultValue.startsWith('nextval('))
      .map(([col]) => col);

    // Build the column list we actually INSERT
    const insertCols = allCols.filter((c) => !autoIncCols.includes(c));

    const insertColsList = insertCols.map((c) => `"${c}"`).join(', ');

    const placeholders = insertCols
      .map((c, i) => {
        const jc = jsonCols.find((j) => j.name === c);
        return jc ? `$${i + 1}::${jc.type.toLowerCase()}` : `$${i + 1}`;
      })
      .join(', ');

    // if all PKs are auto-inc, we do a plain insert
    const userPkCols = pkCols.filter((c) => !autoIncCols.includes(c));
    const useUpsert = userPkCols.length > 0;

    let upsertSQL = '';
    if (useUpsert) {
      const conflictKeys = userPkCols.map((c) => `"${c}"`).join(',');
      const updateSet = nonPkCols
        .map((c) => {
          const jc = jsonCols.find((j) => j.name === c);
          return jc ? `"${c}" = EXCLUDED."${c}"::${jc.type.toLowerCase()}` : `"${c}" = EXCLUDED."${c}"`;
        })
        .join(',');
      if (notCheckPrimaryKeyTableNames.has(tableName)) {
        console.log('   ❌ Not check primary key for, can not upsert only insert:', tableName);
        // 只做普通插入
        upsertSQL = `
            INSERT INTO "${tableName}" (${insertColsList})
            VALUES (${placeholders});
          `;
      } else {
        // 正常的 upsert 逻辑
        upsertSQL = `
        INSERT INTO "${tableName}" (${insertColsList})
        VALUES (${placeholders})
        ON CONFLICT (${conflictKeys})
        DO UPDATE SET ${updateSet};
      `;
      }
    } else {
      upsertSQL = `
        INSERT INTO "${tableName}" (${insertColsList})
        VALUES (${placeholders});
      `;
    }
    // Batch‐migrate rows
    const batchSize = 1000;
    let offset = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const rows = await sqliteDb.query(`SELECT * FROM "${tableName}" LIMIT ${batchSize} OFFSET ${offset}`, {
        type: QueryTypes.SELECT,
      });
      if (!rows.length) break;

      console.log(`   Migrating rows ${offset + 1}-${offset + rows.length}`);

      for (const row of rows) {
        // Handle children migration for blocklets table
        if (hasChildrenColumn && row.children) {
          try {
            let children = row.children;
            if (typeof children === 'string') {
              try {
                children = JSON.parse(children);
              } catch {
                children = null;
              }
            } else if (Buffer.isBuffer(children)) {
              try {
                children = JSON.parse(children.toString('utf8'));
              } catch {
                children = null;
              }
            }

            if (Array.isArray(children) && children.length > 0) {
              // Get parent blocklet DID from meta
              let meta = row.meta;
              if (typeof meta === 'string') {
                try {
                  meta = JSON.parse(meta);
                } catch {
                  meta = {};
                }
              } else if (Buffer.isBuffer(meta)) {
                try {
                  meta = JSON.parse(meta.toString('utf8'));
                } catch {
                  meta = {};
                }
              }

              const parentBlockletDid = meta?.did;
              if (parentBlockletDid) {
                console.log(`   🔄 Migrating ${children.length} children for blocklet ${row.id}`);
                await migrateBlockletChildrenToTable({
                  pgDb,
                  blockletId: row.id,
                  parentBlockletDid,
                  children,
                });
              } else {
                console.warn(`   ⚠️ Blocklet ${row.id} has no meta.did, skipping children migration`);
              }
            }
          } catch (err) {
            console.error(`   ❌ Failed to migrate children for blocklet ${row.id}:`, err.message);
          }
        }

        // Fix invalid date values for all DATE/TIMESTAMP columns
        for (const dateCol of dateCols) {
          if (row[dateCol] != null) {
            const dateVal = row[dateCol];
            // Check if it's an invalid date (NaN, "Invalid date" string, or invalid Date object)
            let isValid = false;
            if (dateVal instanceof Date) {
              isValid = !Number.isNaN(dateVal.getTime());
            } else if (typeof dateVal === 'string') {
              // Check for "Invalid date" string or empty string
              if (dateVal === 'Invalid date' || dateVal === '' || dateVal === 'null') {
                isValid = false;
              } else {
                const parsed = new Date(dateVal);
                isValid = !Number.isNaN(parsed.getTime());
              }
            } else if (typeof dateVal === 'number') {
              // Check if it's a valid timestamp
              const parsed = new Date(dateVal);
              isValid = !Number.isNaN(parsed.getTime());
            } else {
              // null or undefined are valid (will be handled by allowNull)
              isValid = true;
            }

            if (!isValid) {
              console.warn(`   ⚠️ ${tableName}: Invalid date in column "${dateCol}", fixing to current time`);
              console.log(`      Old value: ${dateVal} (type: ${typeof dateVal})`);
              row[dateCol] = new Date();
            }
          }
        }

        // 修复不合格的旧数据
        if (tableName === 'notifications' && row.feedType === 'gallery') {
          row.feedType = '';
        }

        // 对所有需插入的列, 操过长度的做截断
        for (const col of insertCols) {
          const val = row[col];
          const limit = varcharLimits[col];
          if (typeof val === 'string' && limit && val.length > limit) {
            console.warn(`⚠️ Truncate "${col}" from length ${val.length} → ${limit}`);
            console.log('   ❌ Old value:', val);
            // 暂时不截断, 这样插入会失败, 后续会忽略这条数据的插入
            // row[col] = val.slice(0, limit);
          }
        }

        for (const jc of jsonCols) {
          const raw = row[jc.name];
          let parsed = null;
          if (raw == null) {
            parsed = null;
          } else if (typeof raw === 'string') {
            try {
              parsed = JSON.parse(raw);
            } catch {
              //
            }
          } else if (Buffer.isBuffer(raw)) {
            try {
              parsed = JSON.parse(raw.toString('utf8'));
            } catch {
              //
            }
          } else if (typeof raw === 'object') {
            parsed = raw;
          }
          row[jc.name] = parsed != null ? JSON.stringify(parsed) : null;
        }

        // build bind values for ONLY the non-autoInc cols
        const bindVals = insertCols.map((c) => row[c]);

        if (needCleanDataTableNames.has(tableName)) {
          for (let i = 0; i < bindVals.length; i++) {
            const colName = insertCols[i];
            const isJsonCol = jsonCols.some((j) => j.name === colName);
            const val = bindVals[i];

            if (isJsonCol && typeof val === 'string' && val.includes('\\u0000')) {
              try {
                const parsed = JSON.parse(val);
                const cleaned = JSON.stringify(parsed, (key, value) => {
                  if (typeof value === 'string') {
                    // eslint-disable-next-line no-control-regex
                    return value.replace(/\u0000/g, '');
                  }
                  return value;
                });
                bindVals[i] = cleaned;
              } catch (e) {
                console.warn(`⚠️ JSON parse error during clean on column "${colName}" [index ${i}]:`, e);
                // 不抛错，继续迁移
              }
            }
          }
        }

        try {
          await pgDb.query(upsertSQL, { bind: bindVals });
        } catch (err) {
          if (err.name === 'SequelizeUniqueConstraintError') {
            const uniqField = err.errors[0].path;
            console.warn(`   ⚠️ ${tableName}: unique conflict on ${uniqField}, fallback to UPDATE`);
            const updateCols = nonPkCols.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
            const updateBind = nonPkCols.map((c) => row[c]).concat([row[uniqField]]);
            const updateSQL = `
              UPDATE "${tableName}"
              SET ${updateCols}
              WHERE "${uniqField}" = $${updateBind.length};
            `;
            await pgDb.query(updateSQL, { bind: updateBind });
            continue;
          }
          const varcharErr = err.message.match(/value too long for type character varying\((\d+)\)/i);
          if (varcharErr) {
            const badCols = [];
            for (const col of allCols) {
              const def = pgSchema[col];
              const lenMatch = def.type.match(/varying\((\d+)\)/i);
              const val = row[col];
              if (lenMatch && typeof val === 'string') {
                const limit = parseInt(lenMatch[1], 10);
                if (val.length > limit) badCols.push({ column: col, length: val.length, limit });
              }
            }
            console.error(`   ❌ ${tableName}: string too long for VARCHAR columns:`, badCols);
            continue;
          }
          // Handle invalid timestamp/date errors - should have been fixed above, but log if still occurs
          const timestampErr = err.message.match(/invalid input syntax for type timestamp/i);
          if (timestampErr) {
            console.error(`   ❌ ${tableName}: Invalid timestamp error (should have been fixed):`, err.message);
            console.log('      Row data:', JSON.stringify(row, null, 2));
            // Try to fix and retry once
            let fixed = false;
            for (const dateCol of dateCols) {
              if (row[dateCol] != null) {
                const dateVal = row[dateCol];
                if (
                  dateVal === 'Invalid date' ||
                  dateVal === '' ||
                  (typeof dateVal === 'string' && dateVal.toLowerCase() === 'null')
                ) {
                  row[dateCol] = new Date();
                  fixed = true;
                } else {
                  const parsed = new Date(dateVal);
                  if (Number.isNaN(parsed.getTime())) {
                    row[dateCol] = new Date();
                    fixed = true;
                  }
                }
              }
            }
            if (fixed) {
              console.log('   🔧 Fixed invalid dates, retrying insert...');
              const retryBindVals = insertCols.map((c) => row[c]);
              try {
                await pgDb.query(upsertSQL, { bind: retryBindVals });
                continue;
              } catch (retryErr) {
                console.error('   ❌ Retry failed:', retryErr.message);
              }
            }
            // If still failing, skip this row
            console.warn('   ⚠️ Skipping row due to timestamp error');
            continue;
          }
          console.error(`   ❌ Upsert failed for ${tableName} : ${err.message}, SQL:${upsertSQL} value: ${bindVals}`);
          if (ignoreErrorTableNames.has(tableName)) {
            console.log(`   ❌ Ignore error for ${tableName}`);
            continue;
          }
          if (err.message.includes('enum_webhook_attempts_status')) {
            console.log('   ❌ Ignore error for enum_webhook_attempts_status');
            continue;
          }
          if (err.message.includes('connected_accounts_userDid_fkey')) {
            const violationFilePath = dbPath.replace('.db', '.connected_accounts_violation.json');
            console.log(
              '   ❌ Ignore error for connected_accounts_userDid_fkey',
              err.message,
              'save to:',
              violationFilePath,
              'count: '
            );
            try {
              await fsp.appendFile(
                violationFilePath,
                // eslint-disable-next-line prefer-template
                JSON.stringify({ table: tableName, row, error: 'connected_accounts_userDid_fkey' }) + '\n',
                'utf8'
              );
            } catch (writeErr) {
              console.warn('   ⚠️ Failed to write violation record:', writeErr);
            }
            continue;
          }
          if (err.message.includes('user_sessions_userDid_fkey')) {
            const violationFilePath = dbPath.replace('.db', '.user_sessions_userDid_fkey.json');
            console.log(
              '   ❌ Ignore error for user_sessions_userDid_fkey',
              err.message,
              'save to:',
              violationFilePath,
              'count: '
            );
            try {
              await fsp.appendFile(
                violationFilePath,
                // eslint-disable-next-line prefer-template
                JSON.stringify({ table: tableName, row, error: 'user_sessions_userDid_fkey' }) + '\n',
                'utf8'
              );
            } catch (writeErr) {
              console.warn('   ⚠️ Failed to write violation record:', writeErr);
            }
            continue;
          }

          if (needBreakErrors.length < 2000) {
            console.error('   ❌ Error:', err.message);
            needBreakErrors.push(err.message);
          } else {
            throw err;
          }
        }
      }

      offset += rows.length;
    }

    console.log(`   ✅ Finished migrating table ${tableName}`);
  }

  await sqliteDb.close();
  await pgDb.close();
}

async function validateTableRowCounts(dbPath) {
  // Initialize SQLite connection
  const sqliteDb = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false,
  });

  // Build Postgres URL from env var and sqlite path
  const postgresUrl = dbPathToPostgresUrl(dbPath, process.env.ABT_NODE_POSTGRES_URL);
  const pgDb = new Sequelize(postgresUrl, {
    dialect: 'postgres',
    pool: { max: 10, min: 0, idle: 10000 },
    logging: false,
  });

  if (pgDb.getDialect() !== 'postgres') {
    throw new Error(`PG_CONNECTION_STRING is not a valid Postgres connection string: ${pgDb.getDialect()}`);
  }

  const sqliteQI = sqliteDb.getQueryInterface();

  // 1. List all table names
  let tableNames = await sqliteQI.showAllTables();
  tableNames = tableNames
    .map((t) => (typeof t === 'string' ? t : t.tableName || t.name))
    .filter((name) => !/^(sqlite_|SequelizeMeta$)/i.test(name) && name !== 'runtime_insights');

  const results = [];

  // 2. For each table, compare counts
  for (const tableName of tableNames) {
    // count in SQLite
    const [{ cnt: sqliteCount }] = await sqliteDb.query(`SELECT COUNT(*) AS cnt FROM "${tableName}"`, {
      type: QueryTypes.SELECT,
    });

    // count in Postgres
    const [{ count: pgCountStr }] = await pgDb.query(`SELECT COUNT(*) AS count FROM "${tableName}"`, {
      type: QueryTypes.SELECT,
    });
    const pgCount = parseInt(pgCountStr, 10);

    const match = sqliteCount === pgCount;
    results.push({ table: tableName, sqliteCount, pgCount, match });

    console.log(`${match ? '✅' : '❌'} Table "${tableName}": SQLite=${sqliteCount}, Postgres=${pgCount}`);
  }

  // Close connections
  await sqliteDb.close();
  await pgDb.close();

  return results;
}

async function findBlockletDbFiles(dataDir) {
  const results = [];
  const coreDir = path.join(dataDir, 'data');

  async function traverse(dir) {
    let entries;
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch (err) {
      console.error(`Failed to read directory ${dir}:`, err);
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip any paths containing "_abtnode"
      if (fullPath.includes('_abtnode')) continue;

      if (entry.isDirectory()) {
        await traverse(fullPath);
      } else if (entry.isFile() && entry.name === 'blocklet.db') {
        results.push(fullPath);
      }
    }
  }

  await traverse(coreDir);
  return results;
}

function hasMigratedToPostgres(dataDir) {
  const lockPath = path.join(dataDir, 'core', 'sqlite-to-postgres.lock');
  const hasLock = fs.existsSync(lockPath);
  return hasLock;
}

function savePostgresLock(dataDir) {
  const lockPath = path.join(dataDir, 'core', 'sqlite-to-postgres.lock');
  fs.writeFileSync(lockPath, new Date().toISOString());
}

function removePostgresLock(dataDir) {
  const lockPath = path.join(dataDir, 'core', 'sqlite-to-postgres.lock');
  if (fs.existsSync(lockPath)) {
    fs.unlinkSync(lockPath);
  }
}

async function migrationSqliteToPostgres(dataDir, dbPaths) {
  const postgresUrl = process.env.ABT_NODE_POSTGRES_URL;

  if (!postgresUrl) {
    return;
  }

  console.log('Start Migration Sqlite data to Postgres...');

  if (dbPaths.blocklets.length === 0) {
    const blockletDbFiles = await findBlockletDbFiles(dataDir);
    dbPaths.blocklets.push(...blockletDbFiles);
  }

  const allPaths = [];

  for (const dbPath of Object.values(dbPaths)) {
    if (Array.isArray(dbPath)) {
      allPaths.push(...dbPath);
      continue;
    }
    allPaths.push(dbPath);
  }

  const filterPaths = Array.from(new Set(allPaths));

  for (const dbPath of filterPaths) {
    await migrateAllTablesNoModels(dbPath);
  }

  for (const dbPath of allPaths) {
    await validateTableRowCounts(dbPath);
  }

  if (needBreakErrors.length > 0) {
    console.error('   ❌ Has some errors, please check the violation files');
    console.error(needBreakErrors.join('\n'));
    throw new Error('Has some errors, please check the error log');
  }

  savePostgresLock(dataDir);
}

module.exports = {
  migrationSqliteToPostgres,
  hasMigratedToPostgres,
  removePostgresLock,
};
