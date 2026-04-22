import { QueryInterface } from 'sequelize';
import { getBlockletModels } from '../../models';
import { createTableIfNotExists, dropTableIfExists, safeAddIndex } from '../../migrate';

const models = getBlockletModels();

export const up = async ({ context }: { context: QueryInterface }) => {
  await createTableIfNotExists(context, 'audit_logs', models.AuditLog.GENESIS_ATTRIBUTES);

  await safeAddIndex(context, 'audit_logs', ['scope', 'category']);
  await safeAddIndex(context, 'audit_logs', ['scope', 'actor']);
  await safeAddIndex(context, 'audit_logs', ['category']);
  await safeAddIndex(context, 'audit_logs', ['scope', 'createdAt']);
  await safeAddIndex(context, 'audit_logs', ['createdAt']);

  await safeAddIndex(context, 'audit_logs', ['action']);
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await context.removeIndex('audit_logs', ['scope', 'category']);
  await context.removeIndex('audit_logs', ['scope', 'actor']);
  await context.removeIndex('audit_logs', ['category']);
  await context.removeIndex('audit_logs', ['scope', 'createdAt']);
  await context.removeIndex('audit_logs', ['createdAt']);
  await context.removeIndex('audit_logs', ['action']);

  await dropTableIfExists(context, 'audit_logs');
};
