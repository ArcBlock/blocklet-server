/* eslint-disable prefer-destructuring */

import { QueryInterface } from 'sequelize';

export const up = async ({ context }: { context: QueryInterface }) => {
  const sequelize = context.sequelize;
  const dialect = sequelize.getDialect();

  if (dialect === 'postgres') {
    // PostgreSQL: JSONB → text → int, update via FROM-clause
    await sequelize.query(`
      UPDATE "users" AS u
      SET "emailVerified" = true
      FROM "connected_accounts" AS ca
      WHERE ca."userDid"    = u."did"
        AND (ca."userInfo" -> 'emailVerified')::boolean = true
        AND ca."userInfo" ->> 'email'            = u."email"
        AND u."emailVerified"                    = false;
    `);
  } else {
    // SQLite: json_extract(), correlated subquery
    await sequelize.query(`
      UPDATE users
      SET emailVerified = 1
      WHERE did IN (
        SELECT ca."userDid"
        FROM connected_accounts AS ca
        WHERE json_extract(ca.userInfo, '$.emailVerified') = 1
          AND json_extract(ca.userInfo, '$.email')          = users.email
      )
      AND users."emailVerified" = 0;
    `);
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const down = async ({ context }: { context: QueryInterface }) => {};
