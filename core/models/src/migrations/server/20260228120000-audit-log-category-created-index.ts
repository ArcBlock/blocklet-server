import { QueryInterface } from 'sequelize';
import { safeAddIndex } from '../../migrate';

export async function up({ context }: { context: QueryInterface }) {
  await safeAddIndex(context, 'audit_logs', ['scope', 'category', 'createdAt']);
}

export async function down({ context }: { context: QueryInterface }) {
  await context.removeIndex('audit_logs', ['scope', 'category', 'createdAt']);
}
