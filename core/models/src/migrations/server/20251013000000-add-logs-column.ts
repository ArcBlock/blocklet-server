import { QueryInterface, DataTypes } from 'sequelize';
import { removeColumnIfExists, safeApplyColumnChanges } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  await safeApplyColumnChanges(context, {
    audit_logs: [{ name: 'componentDid', field: { type: DataTypes.STRING(80) } }],
  });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'audit_logs', 'componentDid');
};
