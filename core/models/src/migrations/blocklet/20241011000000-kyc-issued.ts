/* eslint-disable prefer-destructuring */
import { DataTypes, QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  await addColumnIfNotExists(context, 'verify_codes', 'issued', { type: DataTypes.BOOLEAN, defaultValue: false });
  await addColumnIfNotExists(context, 'verify_codes', 'issuedAt', { type: DataTypes.DATE });

  const sequelize = context.sequelize;
  const dialect = sequelize.getDialect();

  if (dialect === 'postgres') {
    // PostgreSQL needs double-quotes around CamelCase columns
    await sequelize.query(`
      UPDATE "verify_codes"
      SET
        "issued"   = true,
        "issuedAt" = "updatedAt"
      WHERE
        "subject" IN (
          SELECT DISTINCT "email"
          FROM "users"
          WHERE "emailVerified" = true
        )
        AND "scope"  = 'email'
        AND "issued" = false;
    `);
  } else {
    // SQLite (JSON1 not involved here)
    await sequelize.query(`
      UPDATE verify_codes
      SET
        issued   = 1,
        issuedAt = updatedAt
      WHERE
        subject IN (
          SELECT DISTINCT email
          FROM users
          WHERE emailVerified = 1
        )
        AND scope  = 'email'
        AND issued = 0;
    `);
  }
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'verify_codes', 'issued');
  await removeColumnIfExists(context, 'verify_codes', 'issuedAt');
};
