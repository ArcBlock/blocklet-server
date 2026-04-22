/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
/* eslint-disable no-continue */
import { QueryInterface, QueryTypes } from 'sequelize';
import { getServerModels } from '../../models';
import { createTableIfNotExists, dropTableIfExists, safeAddIndex } from '../../migrate';
import { generateId } from '../../util';

const models = getServerModels();

/**
 * 检查错误是否是"列不存在"的错误
 * 兼容 SQLite 和 PostgreSQL 的错误消息格式
 */
const isColumnNotFoundError = (error: any, columnName: string): boolean => {
  const message = error?.message || '';
  const lowerMessage = message.toLowerCase();
  const lowerColumn = columnName.toLowerCase();

  // SQLite: "SQLITE_ERROR: no such column: children"
  // PostgreSQL: "column \"children\" does not exist" 或 "ERROR: column \"children\" does not exist"
  return (
    lowerMessage.includes(`no such column: ${lowerColumn}`) ||
    (lowerMessage.includes('does not exist') && lowerMessage.includes(lowerColumn))
  );
};

export const up = async ({ context }: { context: QueryInterface }) => {
  // 1. 创建 blocklet_children 表
  await createTableIfNotExists(context, 'blocklet_children', models.BlockletChild.GENESIS_ATTRIBUTES);

  // 2. 添加索引
  await safeAddIndex(context, 'blocklet_children', ['parentBlockletId']);
  await safeAddIndex(context, 'blocklet_children', ['parentBlockletDid']);
  await safeAddIndex(context, 'blocklet_children', ['childDid']);

  // 3. 查询所有 blocklets，然后在代码中过滤有 children 的记录
  // 这样做更可靠，因为不同数据库对 JSON 字段的处理方式不同
  // 如果 children 列不存在，查询会抛出错误，我们捕获并跳过迁移
  let allBlocklets: any[] = [];
  try {
    [allBlocklets] = await context.sequelize!.query('SELECT id, meta, children FROM blocklets');
  } catch (e) {
    // 如果 children 列不存在，说明表已经迁移过或不需要迁移，直接跳过
    if (isColumnNotFoundError(e, 'children')) {
      console.log('No children column in blocklets table, skipping migration');
      return;
    }
    throw e;
  }

  // 过滤出真正有 children 数据的 blocklets
  const blocklets = (allBlocklets as any[]).filter((blocklet) => {
    if (!blocklet.children) return false;

    // 尝试解析 children
    let children: any;
    try {
      children = typeof blocklet.children === 'string' ? JSON.parse(blocklet.children) : blocklet.children;
    } catch {
      return false;
    }

    // 检查是否是数组且不为空
    return Array.isArray(children) && children.length > 0;
  });

  let migratedCount = 0;
  let skippedCount = 0;

  for (const blocklet of blocklets as any[]) {
    try {
      // 解析 children 和 meta
      let children: any;
      try {
        children = typeof blocklet.children === 'string' ? JSON.parse(blocklet.children) : blocklet.children;
      } catch (e) {
        console.warn(`[Migration] Failed to parse children for blocklet ${blocklet.id}:`, e);
        continue;
      }

      let meta: any;
      try {
        meta = typeof blocklet.meta === 'string' ? JSON.parse(blocklet.meta) : blocklet.meta || {};
      } catch (e) {
        console.warn(`[Migration] Failed to parse meta for blocklet ${blocklet.id}:`, e);
        continue;
      }

      const parentBlockletDid = meta?.did;

      if (!parentBlockletDid) {
        console.warn(`[Migration] Blocklet ${blocklet.id} has no meta.did, skipping`);
        continue;
      }

      if (!Array.isArray(children) || children.length === 0) {
        // 空数组或非数组，跳过
        continue;
      }

      // 为每个 child 创建记录
      for (const child of children) {
        const childMeta = child?.meta || {};
        const childDid = childMeta?.did;

        if (!childDid) {
          console.warn(`[Migration] Child in blocklet ${blocklet.id} has no meta.did, skipping child:`, child);
          skippedCount++;
          continue;
        }

        // Validate required meta fields
        if (!childMeta.name && !childMeta.bundleName) {
          console.warn(
            `[Migration] Child ${childDid} in blocklet ${blocklet.id} missing meta.name and meta.bundleName, skipping child`
          );
          skippedCount++;
          continue;
        }

        if (!childMeta.version) {
          console.warn(`[Migration] Child ${childDid} in blocklet ${blocklet.id} missing meta.version, skipping child`);
          skippedCount++;
          continue;
        }

        try {
          // 检查该 child 是否已经存在（防止重复迁移）
          const [existing] = await context.sequelize!.query(
            `
            SELECT id FROM blocklet_children 
            WHERE "parentBlockletId" = :parentBlockletId AND "childDid" = :childDid
            LIMIT 1
          `,
            {
              replacements: { parentBlockletId: blocklet.id, childDid },
              type: QueryTypes.SELECT,
            }
          );

          if (existing && (existing as any).id) {
            // 数据已存在，跳过
            console.log(`[Migration] Child ${childDid} already exists for blocklet ${blocklet.id}, skipping`);
            continue;
          }

          // 手动序列化 JSON 字段，然后使用原始 SQL 插入
          // 这样可以避免 Sequelize bulkInsert 的 JSON 处理问题
          const insertData = {
            id: generateId(),
            parentBlockletId: blocklet.id,
            parentBlockletDid,
            childDid,
            mountPoint: child.mountPoint || null,
            meta: JSON.stringify(child.meta || {}),
            bundleSource: JSON.stringify(child.bundleSource || {}),
            source: child.source || 0,
            deployedFrom: child.deployedFrom || '',
            mode: child.mode || 'production',
            status: child.status || 0,
            ports: JSON.stringify(child.ports || {}),
            installedAt: child.installedAt || null,
            startedAt: child.startedAt || null,
            stoppedAt: child.stoppedAt || null,
            pausedAt: child.pausedAt || null,
            operator: child.operator || null,
            inProgressStart: child.inProgressStart || null,
            greenStatus: child.greenStatus || null,
            greenPorts: child.greenPorts ? JSON.stringify(child.greenPorts) : null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          const dialect = context.sequelize.getDialect();
          if (dialect === 'postgres') {
            // PostgreSQL: 使用 JSONB 类型转换
            await context.sequelize!.query(
              `
              INSERT INTO blocklet_children (
                id, "parentBlockletId", "parentBlockletDid", "childDid", "mountPoint",
                meta, "bundleSource", source, "deployedFrom", mode, status,
                ports, "installedAt", "startedAt",
                "stoppedAt", "pausedAt", operator, "inProgressStart", "greenStatus",
                "greenPorts", "createdAt", "updatedAt"
              ) VALUES (
                :id, :parentBlockletId, :parentBlockletDid, :childDid, :mountPoint,
                :meta::jsonb, :bundleSource::jsonb, :source, :deployedFrom, :mode, :status,
                :ports::jsonb, :installedAt, :startedAt,
                :stoppedAt, :pausedAt, :operator, :inProgressStart, :greenStatus,
                :greenPorts::jsonb, :createdAt, :updatedAt
              )
              ON CONFLICT DO NOTHING
            `,
              {
                replacements: insertData,
                type: QueryTypes.INSERT,
              }
            );
          } else {
            // SQLite: 直接插入 JSON 字符串（SQLite 也支持带引号的列名）
            await context.sequelize!.query(
              `
              INSERT OR IGNORE INTO blocklet_children (
                id, "parentBlockletId", "parentBlockletDid", "childDid", "mountPoint",
                meta, "bundleSource", source, "deployedFrom", mode, status,
                ports, "installedAt", "startedAt",
                "stoppedAt", "pausedAt", operator, "inProgressStart", "greenStatus",
                "greenPorts", "createdAt", "updatedAt"
              ) VALUES (
                :id, :parentBlockletId, :parentBlockletDid, :childDid, :mountPoint,
                :meta, :bundleSource, :source, :deployedFrom, :mode, :status,
                :ports, :installedAt, :startedAt,
                :stoppedAt, :pausedAt, :operator, :inProgressStart, :greenStatus,
                :greenPorts, :createdAt, :updatedAt
              )
            `,
              {
                replacements: insertData,
                type: QueryTypes.INSERT,
              }
            );
          }
          migratedCount++;
        } catch (e) {
          // 如果是唯一约束错误，说明数据已存在，跳过
          if (
            (e as any).name === 'SequelizeUniqueConstraintError' ||
            (e as any).message?.includes('UNIQUE constraint')
          ) {
            console.log(
              `[Migration] Child ${childDid} already exists for blocklet ${blocklet.id} (unique constraint), skipping`
            );
            continue;
          }
          console.error(`[Migration] Failed to insert child ${childDid} for blocklet ${blocklet.id}:`, e);
        }
      }
    } catch (e) {
      console.error(`[Migration] Error processing blocklet ${blocklet.id}:`, e);
      skippedCount++;
    }
  }

  if (skippedCount > 0) {
    console.log(`[Migration] Migration completed: ${migratedCount} children migrated, ${skippedCount} skipped`);
  }

  // 两步迁移法，第一步迁移数据到 blocklet_children 表，运行稳定后再删除旧 children 数据
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await dropTableIfExists(context, 'blocklet_children');
};
