/* eslint-disable prefer-destructuring */
import { v4 } from 'uuid';
import { DataTypes, FindOptions, IncludeOptions, Op, Order, Sequelize } from 'sequelize';
import isEmpty from 'lodash.isempty';
import { isValid as isDid } from '@arcblock/did';

export function generateId(): string {
  return v4();
}

export function generateRandomString(
  length = 6,
  characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
): string {
  let randomString = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
}

export function formatConditions(conditions: Record<string, any>): IncludeOptions {
  if (conditions.where || conditions.include) {
    return conditions;
  }

  const where = {};
  for (const [field, value] of Object.entries(conditions)) {
    if (field === '$or' && Array.isArray(value)) {
      where[Op.or] = value.map((x) => formatConditions(x).where);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      const operators = [];
      for (const [operator, operand] of Object.entries(value)) {
        switch (operator) {
          case '$lt':
            operators.push({ [Op.lt]: operand });
            break;
          case '$lte':
            operators.push({ [Op.lte]: operand });
            break;
          case '$gt':
            operators.push({ [Op.gt]: operand });
            break;
          case '$gte':
            operators.push({ [Op.gte]: operand });
            break;
          case '$ne':
            operators.push({ [Op.ne]: operand });
            break;
          case '$in':
            operators.push({ [Op.in]: operand });
            break;
          case '$nin':
            operators.push({ [Op.notIn]: operand });
            break;
          case '$exists':
            operators.push(operand ? { [Op.not]: null } : { [Op.is]: null });
            break;
          case '$regex':
            operators.push({ [Op.like]: `%${operand}%` });
            break;
          default:
            operators.push({ [operator]: operand });
        }
      }

      if (operators.length === 1) {
        // eslint-disable-next-line prefer-destructuring
        where[field] = operators[0];
      } else if (operators.length > 1) {
        where[field] = { [Op.and]: operators };
      }
    } else {
      where[field] = value;
    }
  }

  return { where };
}

export function formatOrder(sort: Record<string, any>): Order {
  const order: Order = [];

  for (const [field, value] of Object.entries(sort)) {
    if (value === 1) {
      order.push([field, 'ASC']);
    } else if (value === -1) {
      order.push([field, 'DESC']);
    } else {
      console.warn(`Unsupported sort value for field "${field}": ${value}. Only -1 and 1 are supported.`);
    }
  }

  return order;
}

export function formatSelection(selection: Record<string, any>): string[] {
  const attributes: string[] = [];

  for (const [field, value] of Object.entries(selection)) {
    if (value === 1) {
      attributes.push(field);
    } else if (value !== 0) {
      console.warn(`Unsupported projection value for field "${field}": ${value}. Only 0 and 1 are supported.`);
    }
  }

  return attributes;
}

export function formatParams(params: FindOptions): FindOptions {
  if (isEmpty(params.attributes)) {
    delete params.attributes;
  }

  return params;
}

export function dbPathToDbName(dbPath: string) {
  const list = dbPath.split('/');
  let name = list.pop()?.replace(/[^a-zA-Z0-9_]/g, '_');
  const dir = list.pop();
  if (isDid(dir)) {
    name = `${name}_${dir}`;
  }
  if (!name) {
    return 'postgres';
  }
  return name;
}

export function dbPathToPostgresUrl(dbPath: string, connectUrl: string) {
  const dbName = dbPathToDbName(dbPath);
  const url = new URL(connectUrl);
  url.pathname = `/${dbName}`;
  return url.toString();
}

const createdPostgresDb = new Map<string, boolean>();

export async function createPostgresDatabase(dbPath: string, logging = false) {
  const connectUrl = process.env.ABT_NODE_POSTGRES_URL;

  if (
    !connectUrl ||
    (connectUrl.startsWith('postgres://') === false && connectUrl.startsWith('postgresql://') === false)
  ) {
    return;
  }

  if (createdPostgresDb.has(dbPath)) {
    return;
  }
  const dbName = dbPathToDbName(dbPath);

  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });
  // Create a temporary connection to create the database if it doesn't exist
  const tempSequelize = new Sequelize(connectUrl, {
    dialect: 'postgres',
    pool: { max: 1, min: 0, idle: 10000 },
    logging,
  });

  // Create database if it doesn't exist
  // 查看 db 是否存在
  const [rows] = await tempSequelize.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}';`);

  if (rows.length > 0) {
    createdPostgresDb.set(dbPath, true);
    return;
  }

  // 创建 db
  await tempSequelize.query(
    `CREATE DATABASE "${dbName}" WITH ENCODING = 'UTF8' LC_COLLATE = 'en_US.utf8' LC_CTYPE = 'en_US.utf8' TEMPLATE template0;`
  );

  createdPostgresDb.set(dbPath, true);

  await tempSequelize.close();
}

export const JSONOrJSONB = () => {
  if (process.env.ABT_NODE_POSTGRES_URL) {
    return DataTypes.JSONB;
  }
  return DataTypes.JSON;
};
